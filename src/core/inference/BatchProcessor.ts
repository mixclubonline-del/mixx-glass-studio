/**
 * BATCH PROCESSOR
 * 
 * Batches multiple inference requests for efficient processing.
 * Reduces overhead and improves throughput.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 4 Edge Inference
 */

export interface BatchItem<T> {
  id: string;
  input: unknown;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  processor: (inputs: unknown[]) => Promise<unknown[]>;
}

class BatchProcessor<T> {
  private queue: BatchItem<T>[] = [];
  private processing = false;
  private config: BatchConfig;
  
  constructor(config: BatchConfig) {
    this.config = config;
  }
  
  /**
   * Add item to batch queue
   */
  async add(input: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item: BatchItem<T> = {
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        input,
        resolve,
        reject,
        timestamp: Date.now(),
      };
      
      this.queue.push(item);
      
      // Trigger processing if batch is full or wait time exceeded
      this.checkAndProcess();
    });
  }
  
  /**
   * Check if batch should be processed
   */
  private checkAndProcess(): void {
    if (this.processing) return;
    
    const shouldProcess =
      this.queue.length >= this.config.maxBatchSize ||
      (this.queue.length > 0 &&
       Date.now() - this.queue[0].timestamp >= this.config.maxWaitTime);
    
    if (shouldProcess) {
      this.processBatch();
    } else if (this.queue.length > 0) {
      // Schedule check for max wait time
      setTimeout(() => this.checkAndProcess(), this.config.maxWaitTime);
    }
  }
  
  /**
   * Process current batch
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    // Extract batch items
    const batch = this.queue.splice(0, this.config.maxBatchSize);
    const inputs = batch.map(item => item.input);
    
    try {
      // Process batch
      const results = await this.config.processor(inputs);
      
      // Resolve all promises
      batch.forEach((item, index) => {
        if (index < results.length) {
          item.resolve(results[index] as T);
        } else {
          item.reject(new Error('Batch processing returned insufficient results'));
        }
      });
    } catch (error) {
      // Reject all promises on error
      batch.forEach(item => {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      });
    } finally {
      this.processing = false;
      
      // Process remaining items if any
      if (this.queue.length > 0) {
        this.checkAndProcess();
      }
    }
  }
  
  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }
  
  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Batch processor cleared'));
    });
    this.queue = [];
  }
}

/**
 * Create a batch processor
 */
export function createBatchProcessor<T>(config: BatchConfig): BatchProcessor<T> {
  return new BatchProcessor<T>(config);
}

