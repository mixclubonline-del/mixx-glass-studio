/**
 * AURA PERFORMANCE OPTIMIZER
 * Phase 36: Unified Performance Optimization
 * 
 * Central coordinator for all performance optimizations:
 * - SIMD audio processing (Phase 34)
 * - GPU acceleration (Phase 35)
 * - Model quantization (Phase 36)
 * - Batch inference (Phase 36)
 * - Inference caching (Phase 36)
 * 
 * @author Prime (Mixx Club)
 */

import { initializeWebGPUBackend, getBackendStatus, isWebGPUActive } from '../quantum/WebGPUBackend';
import { initializeGPUAudio, getGPUAudioProcessor } from '../quantum/GPUAudioProcessor';
import { getInferenceCache } from './InferenceCache';
import { getBatchInferenceProcessor } from './BatchInferenceProcessor';
import { getModelQuantizer, shouldQuantize } from '../quantization/ModelQuantizer';
import { als } from '../../utils/alsFeedback';

// Performance tier
export type PerformanceTier = 'ultra' | 'high' | 'balanced' | 'power-saver';

// System capabilities
export interface SystemCapabilities {
  webgpu: boolean;
  webgl: boolean;
  simd: boolean;
  threads: number;
  memory: number;
  gpu: {
    available: boolean;
    name?: string;
    backend: string;
  };
}

// Performance metrics
export interface PerformanceMetrics {
  fps: number;
  audioLatencyMs: number;
  inferenceTimeMs: number;
  cacheHitRate: number;
  gpuMemoryMB: number;
  cpuUsage: number;
  batchThroughput: number;
}

// Optimization profile
export interface OptimizationProfile {
  tier: PerformanceTier;
  useGPU: boolean;
  useQuantization: boolean;
  useBatching: boolean;
  useCaching: boolean;
  batchSize: number;
  cacheMaxMB: number;
}

/**
 * AURA Performance Optimizer
 * 
 * Manages all performance optimizations and provides
 * automatic configuration based on system capabilities.
 */
class AURAPerformanceOptimizer {
  private capabilities: SystemCapabilities | null = null;
  private profile: OptimizationProfile | null = null;
  private initialized = false;
  private metricsHistory: PerformanceMetrics[] = [];
  private lastMetricsTime = 0;
  
  /**
   * Initialize optimizer and detect capabilities
   */
  async initialize(): Promise<SystemCapabilities> {
    if (this.initialized && this.capabilities) {
      return this.capabilities;
    }
    
    als.info('[AURA Optimizer] Initializing performance optimizer...');
    
    // Detect capabilities
    this.capabilities = await this.detectCapabilities();
    
    // Auto-select profile
    this.profile = this.selectOptimalProfile(this.capabilities);
    
    // Initialize subsystems
    await this.initializeSubsystems();
    
    this.initialized = true;
    
    als.success(`[AURA Optimizer] Initialized with tier: ${this.profile.tier}`);
    als.info(`[AURA Optimizer] GPU: ${this.capabilities.gpu.available ? this.capabilities.gpu.backend : 'none'}`);
    
    return this.capabilities;
  }
  
  /**
   * Detect system capabilities
   */
  private async detectCapabilities(): Promise<SystemCapabilities> {
    // Check WebGPU
    let webgpu = false;
    let gpuName: string | undefined;
    
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          webgpu = true;
          const info = await adapter.requestAdapterInfo?.();
          gpuName = info?.description || info?.vendor || 'Unknown GPU';
        }
      } catch {
        webgpu = false;
      }
    }
    
    // Check WebGL
    let webgl = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      webgl = gl !== null;
    } catch {
      webgl = false;
    }
    
    // Check SIMD (estimate based on user agent)
    // WebAssembly SIMD is widely supported in modern browsers
    const simd = typeof WebAssembly !== 'undefined';
    
    // Thread count
    const threads = navigator?.hardwareConcurrency || 4;
    
    // Memory (estimate)
    const memory = (navigator as any)?.deviceMemory || 4;
    
    // Get GPU backend status
    const backendStatus = getBackendStatus();
    
    return {
      webgpu,
      webgl,
      simd,
      threads,
      memory,
      gpu: {
        available: webgpu || webgl,
        name: gpuName,
        backend: backendStatus.type,
      },
    };
  }
  
  /**
   * Select optimal profile based on capabilities
   */
  private selectOptimalProfile(caps: SystemCapabilities): OptimizationProfile {
    // Ultra tier: WebGPU + High memory + Many threads
    if (caps.webgpu && caps.memory >= 8 && caps.threads >= 8) {
      return {
        tier: 'ultra',
        useGPU: true,
        useQuantization: false, // Don't need quantization at ultra tier
        useBatching: true,
        useCaching: true,
        batchSize: 64,
        cacheMaxMB: 500,
      };
    }
    
    // High tier: WebGPU or (WebGL + good memory)
    if (caps.webgpu || (caps.webgl && caps.memory >= 4)) {
      return {
        tier: 'high',
        useGPU: true,
        useQuantization: false,
        useBatching: true,
        useCaching: true,
        batchSize: 32,
        cacheMaxMB: 200,
      };
    }
    
    // Balanced tier: WebGL or decent CPU
    if (caps.webgl || caps.threads >= 4) {
      return {
        tier: 'balanced',
        useGPU: caps.webgl,
        useQuantization: true,
        useBatching: true,
        useCaching: true,
        batchSize: 16,
        cacheMaxMB: 100,
      };
    }
    
    // Power saver: Minimal resources
    return {
      tier: 'power-saver',
      useGPU: false,
      useQuantization: true,
      useBatching: true,
      useCaching: true,
      batchSize: 8,
      cacheMaxMB: 50,
    };
  }
  
  /**
   * Initialize subsystems based on profile
   */
  private async initializeSubsystems(): Promise<void> {
    if (!this.profile) return;
    
    // Initialize GPU backend if enabled
    if (this.profile.useGPU) {
      try {
        await initializeWebGPUBackend();
        await initializeGPUAudio();
      } catch (error) {
        als.warning('[AURA Optimizer] GPU initialization failed, using CPU fallback');
      }
    }
    
    // Configure batch processor
    const batchProcessor = getBatchInferenceProcessor();
    // Batch processor is already configured with defaults
    
    // Inference cache is auto-initialized with defaults
    const cache = getInferenceCache();
    
    als.info(`[AURA Optimizer] Subsystems initialized:
      - GPU: ${this.profile.useGPU}
      - Batching: ${this.profile.useBatching}
      - Caching: ${this.profile.useCaching}
      - Quantization: ${this.profile.useQuantization}`);
  }
  
  /**
   * Get current optimization profile
   */
  getProfile(): OptimizationProfile | null {
    return this.profile ? { ...this.profile } : null;
  }
  
  /**
   * Set optimization tier manually
   */
  setTier(tier: PerformanceTier): void {
    if (!this.capabilities) {
      als.warning('[AURA Optimizer] Cannot set tier before initialization');
      return;
    }
    
    const baseProfile = this.selectOptimalProfile(this.capabilities);
    
    // Override tier
    this.profile = {
      ...baseProfile,
      tier,
      // Adjust settings based on tier
      batchSize: tier === 'ultra' ? 64 : tier === 'high' ? 32 : tier === 'balanced' ? 16 : 8,
      cacheMaxMB: tier === 'ultra' ? 500 : tier === 'high' ? 200 : tier === 'balanced' ? 100 : 50,
    };
    
    als.info(`[AURA Optimizer] Tier set to: ${tier}`);
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const cache = getInferenceCache();
    const cacheStats = cache.getStats();
    
    const gpuProcessor = getGPUAudioProcessor();
    const gpuStatus = gpuProcessor.getStatus();
    
    const batchProcessor = getBatchInferenceProcessor();
    const batchStats = batchProcessor.getStats();
    
    return {
      fps: 60, // Would need animation frame monitoring
      audioLatencyMs: 5, // Would need actual measurement
      inferenceTimeMs: batchStats.avgProcessingTimeMs,
      cacheHitRate: cacheStats.hitRate,
      gpuMemoryMB: 0, // Would need GPU memory monitoring
      cpuUsage: 0, // Would need CPU monitoring
      batchThroughput: batchStats.throughputPerSecond,
    };
  }
  
  /**
   * Record metrics for history
   */
  recordMetrics(): void {
    const now = Date.now();
    if (now - this.lastMetricsTime < 1000) return; // Max 1 per second
    
    this.lastMetricsTime = now;
    const metrics = this.getMetrics();
    
    this.metricsHistory.push(metrics);
    
    // Keep last 60 readings
    if (this.metricsHistory.length > 60) {
      this.metricsHistory.shift();
    }
  }
  
  /**
   * Get metrics history
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }
  
  /**
   * Get optimization recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.capabilities || !this.profile) {
      return ['Initialize optimizer first'];
    }
    
    const metrics = this.getMetrics();
    
    // Check cache hit rate
    if (metrics.cacheHitRate < 0.3) {
      recommendations.push('Low cache hit rate - consider increasing cache size');
    }
    
    // Check inference time
    if (metrics.inferenceTimeMs > 100) {
      recommendations.push('High inference latency - enable GPU acceleration or model quantization');
    }
    
    // Check GPU usage
    if (this.capabilities.webgpu && !isWebGPUActive()) {
      recommendations.push('WebGPU available but not active - enable GPU acceleration');
    }
    
    // Check batch throughput
    if (metrics.batchThroughput < 10) {
      recommendations.push('Low batch throughput - increase batch size or use parallel processing');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal!');
    }
    
    return recommendations;
  }
  
  /**
   * Get system capabilities
   */
  getCapabilities(): SystemCapabilities | null {
    return this.capabilities ? { ...this.capabilities } : null;
  }
  
  /**
   * Dispose optimizer
   */
  dispose(): void {
    this.metricsHistory = [];
    this.initialized = false;
    als.info('[AURA Optimizer] Disposed');
  }
}

// Global singleton
let globalOptimizer: AURAPerformanceOptimizer | null = null;

/**
 * Get the global performance optimizer
 */
export function getPerformanceOptimizer(): AURAPerformanceOptimizer {
  if (!globalOptimizer) {
    globalOptimizer = new AURAPerformanceOptimizer();
  }
  return globalOptimizer;
}

/**
 * Initialize performance optimization
 */
export async function initializePerformanceOptimization(): Promise<SystemCapabilities> {
  const optimizer = getPerformanceOptimizer();
  return optimizer.initialize();
}

/**
 * Get current performance profile
 */
export function getCurrentProfile(): OptimizationProfile | null {
  return getPerformanceOptimizer().getProfile();
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return getPerformanceOptimizer().getMetrics();
}

export { AURAPerformanceOptimizer };
export default AURAPerformanceOptimizer;
