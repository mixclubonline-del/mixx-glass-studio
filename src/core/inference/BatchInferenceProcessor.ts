/**
 * BATCH INFERENCE PROCESSOR
 * Phase 36: AI Inference Optimization
 * 
 * High-throughput batch processing for AI inference.
 * Processes multiple audio segments in parallel for maximum GPU utilization.
 * Integrates with inference cache for optimal performance.
 * 
 * @author Prime (Mixx Club)
 */

import * as tf from '@tensorflow/tfjs';
import { getInferenceCache } from './InferenceCache';
import { extractOptimizedFFT } from './FeatureExtractor';
import { als } from '../../utils/alsFeedback';

// Batch processing configuration
export interface BatchConfig {
  maxBatchSize: number;      // Maximum items per batch
  parallelBatches: number;   // Number of concurrent batches
  timeoutMs: number;         // Maximum wait time for batch fill
  useCache: boolean;         // Use inference cache
}

// Batch processing result
export interface BatchResult<T> {
  results: T[];
  timing: {
    totalMs: number;
    avgPerItemMs: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

// Pending inference item
interface PendingItem<T> {
  id: string;
  features: number[];
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * Batch Inference Processor
 * 
 * Accumulates inference requests and processes them in batches
 * for better GPU utilization and throughput.
 */
export class BatchInferenceProcessor<T = unknown> {
  private config: BatchConfig;
  private queue: PendingItem<T>[] = [];
  private processing = false;
  private model: tf.LayersModel | null = null;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Statistics
  private totalProcessed = 0;
  private totalCacheHits = 0;
  private totalTimeMs = 0;
  
  constructor(config?: Partial<BatchConfig>) {
    this.config = {
      maxBatchSize: 32,
      parallelBatches: 2,
      timeoutMs: 50,
      useCache: true,
      ...config,
    };
  }
  
  /**
   * Set the inference model
   */
  setModel(model: tf.LayersModel): void {
    this.model = model;
    als.info('[BatchInference] Model set');
  }
  
  /**
   * Queue inference request
   */
  async infer(features: number[]): Promise<T> {
    // Check cache first
    if (this.config.useCache) {
      const cache = getInferenceCache();
      const cached = cache.get<T>(features);
      if (cached !== null) {
        this.totalCacheHits++;
        return cached;
      }
    }
    
    // Queue for batch processing
    return new Promise<T>((resolve, reject) => {
      const item: PendingItem<T> = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        features,
        resolve,
        reject,
        timestamp: Date.now(),
      };
      
      this.queue.push(item);
      this.scheduleBatch();
    });
  }
  
  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    // If batch is full, process immediately
    if (this.queue.length >= this.config.maxBatchSize) {
      this.processNextBatch();
      return;
    }
    
    // Otherwise, set a timer to process partial batch
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.batchTimer = null;
        if (this.queue.length > 0) {
          this.processNextBatch();
        }
      }, this.config.timeoutMs);
    }
  }
  
  /**
   * Process next batch
   */
  private async processNextBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    try {
      // Get batch from queue
      const batch = this.queue.splice(0, this.config.maxBatchSize);
      const startTime = performance.now();
      
      // Run batch inference
      const results = await this.runBatchInference(batch);
      
      const elapsed = performance.now() - startTime;
      this.totalTimeMs += elapsed;
      this.totalProcessed += batch.length;
      
      // Resolve promises and cache results
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const result = results[i];
        
        // Cache result
        if (this.config.useCache) {
          const cache = getInferenceCache();
          cache.set(item.features, result);
        }
        
        item.resolve(result);
      }
      
    } catch (error) {
      als.error('[BatchInference] Batch processing failed', error);
      
      // Reject all items in batch
      for (const item of this.queue.splice(0, this.config.maxBatchSize)) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      this.processing = false;
      
      // Process next batch if queue not empty
      if (this.queue.length > 0) {
        this.processNextBatch();
      }
    }
  }
  
  /**
   * Run batch inference on model
   */
  private async runBatchInference(batch: PendingItem<T>[]): Promise<T[]> {
    if (!this.model) {
      throw new Error('No model set for inference');
    }
    
    // Create batch tensor
    const batchData = batch.map(item => item.features);
    const batchTensor = tf.tensor2d(batchData);
    
    try {
      // Run prediction
      const predictions = this.model.predict(batchTensor) as tf.Tensor;
      const outputData = await predictions.array() as number[][];
      
      predictions.dispose();
      batchTensor.dispose();
      
      // Convert to result type
      return outputData as unknown as T[];
      
    } finally {
      batchTensor.dispose();
    }
  }
  
  /**
   * Process audio buffers in batch
   */
  async processAudioBatch(
    audioBuffers: AudioBuffer[],
    inferFn: (features: Float32Array) => Promise<T>
  ): Promise<BatchResult<T>> {
    const startTime = performance.now();
    const cache = this.config.useCache ? getInferenceCache() : null;
    
    let cacheHits = 0;
    let cacheMisses = 0;
    
    // Extract features from all buffers
    const featureArrays: Float32Array[] = [];
    const cachedResults: (T | null)[] = [];
    
    for (const buffer of audioBuffers) {
      const features = extractOptimizedFFT(buffer, 512);
      featureArrays.push(features);
      
      // Check cache
      if (cache) {
        const cached = cache.get<T>(Array.from(features));
        if (cached !== null) {
          cachedResults.push(cached);
          cacheHits++;
        } else {
          cachedResults.push(null);
          cacheMisses++;
        }
      } else {
        cachedResults.push(null);
        cacheMisses++;
      }
    }
    
    // Process uncached items in parallel
    const results: T[] = [];
    const uncachedIndices: number[] = [];
    
    for (let i = 0; i < cachedResults.length; i++) {
      if (cachedResults[i] !== null) {
        results[i] = cachedResults[i]!;
      } else {
        uncachedIndices.push(i);
      }
    }
    
    // Batch process uncached items
    if (uncachedIndices.length > 0) {
      const chunks = this.chunkArray(uncachedIndices, this.config.maxBatchSize);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(idx => inferFn(featureArrays[idx]));
        const chunkResults = await Promise.all(chunkPromises);
        
        for (let j = 0; j < chunk.length; j++) {
          const idx = chunk[j];
          results[idx] = chunkResults[j];
          
          // Cache result
          if (cache) {
            cache.set(Array.from(featureArrays[idx]), chunkResults[j]);
          }
        }
      }
    }
    
    const totalMs = performance.now() - startTime;
    
    return {
      results,
      timing: {
        totalMs,
        avgPerItemMs: totalMs / audioBuffers.length,
        cacheHits,
        cacheMisses,
      },
    };
  }
  
  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<U>(array: U[], size: number): U[][] {
    const chunks: U[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Get processing statistics
   */
  getStats(): {
    queueLength: number;
    totalProcessed: number;
    totalCacheHits: number;
    avgProcessingTimeMs: number;
    throughputPerSecond: number;
  } {
    const avgTime = this.totalProcessed > 0 ? this.totalTimeMs / this.totalProcessed : 0;
    const throughput = avgTime > 0 ? 1000 / avgTime : 0;
    
    return {
      queueLength: this.queue.length,
      totalProcessed: this.totalProcessed,
      totalCacheHits: this.totalCacheHits,
      avgProcessingTimeMs: avgTime,
      throughputPerSecond: throughput,
    };
  }
  
  /**
   * Clear queue and reset
   */
  clear(): void {
    // Reject pending items
    for (const item of this.queue) {
      item.reject(new Error('Queue cleared'));
    }
    
    this.queue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.clear();
    this.model = null;
  }
}

// Global processor instance
let globalProcessor: BatchInferenceProcessor | null = null;

/**
 * Get global batch inference processor
 */
export function getBatchInferenceProcessor(): BatchInferenceProcessor {
  if (!globalProcessor) {
    globalProcessor = new BatchInferenceProcessor();
  }
  return globalProcessor;
}

/**
 * Process batch of audio with caching
 */
export async function batchProcessAudio<T>(
  audioBuffers: AudioBuffer[],
  inferFn: (features: Float32Array) => Promise<T>
): Promise<BatchResult<T>> {
  const processor = new BatchInferenceProcessor<T>();
  return processor.processAudioBatch(audioBuffers, inferFn);
}

export default BatchInferenceProcessor;
