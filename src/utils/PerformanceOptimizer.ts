/**
 * Mixx Club Studio - Performance Optimizer
 * Manages real-time optimization for low-latency audio processing
 * Coordinates buffer pooling, worker threads, and Prime Brain throttling
 */

import { audioBufferPool } from './AudioBufferPool';

export interface PerformanceMetrics {
  cpuUsage: number; // 0-100%
  memoryUsage: number; // 0-100%
  audioLatency: number; // ms
  renderFPS: number; // frames per second
  analysisWorkerLoad: number; // 0-100%
  lastMeasurementTime: number;
  history: PerformanceMetrics[];
}

export interface OptimizationConfig {
  targetFPS: number; // Default 60
  maxLatencyMs: number; // Default 3
  enableWorkerThreads: boolean; // Default true
  enableBufferPooling: boolean; // Default true
  throttlePrimeBrainMs: number; // Default 33 (30fps)
  analysisQuality: 'low' | 'medium' | 'high'; // Affects FFT size
}

/**
 * PerformanceOptimizer - Manages real-time performance for DAW
 * 
 * Key features:
 * - Adaptive FFT sizing based on CPU load
 * - Buffer pooling to prevent GC pauses
 * - Worker thread delegation for heavy analysis
 * - Prime Brain update throttling
 * - Real-time performance monitoring
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private performanceObserver: PerformanceObserver | null = null;
  private analysisWorker: Worker | null = null;
  private lastFrameTime: number = performance.now();
  private lastPrimeBrainUpdate: number = 0;
  private frameCount: number = 0;
  private frameRateHistory: number[] = [];
  private isOptimizing: boolean = false;

  private constructor() {
    this.config = {
      targetFPS: 60,
      maxLatencyMs: 3,
      enableWorkerThreads: true,
      enableBufferPooling: true,
      throttlePrimeBrainMs: 33, // 30fps
      analysisQuality: 'high'
    };

    this.metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      audioLatency: 0,
      renderFPS: 60,
      analysisWorkerLoad: 0,
      lastMeasurementTime: Date.now(),
      history: []
    };

    this.initialize();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    // Start frame rate monitoring
    this.monitorFrameRate();

    // Monitor memory usage every 2 seconds
    setInterval(() => this.measureMemoryUsage(), 2000);

    // Setup performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > this.config.maxLatencyMs) {
              console.warn(`⚠️ Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
              this.adjustForHighLoad();
            }
          }
        });
        this.performanceObserver.observe({ entryTypes: ['longtask', 'measure'] });
      } catch (e) {
        console.log('PerformanceObserver not fully supported');
      }
    }

    console.log('🚀 Performance Optimizer initialized');
  }

  /**
   * Configure optimization settings
   */
  configure(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Performance config updated:', this.config);
  }

  /**
   * Monitor frame rate performance
   */
  private monitorFrameRate(): void {
    const measure = () => {
      const now = performance.now();
      const deltaMs = now - this.lastFrameTime;
      const fps = 1000 / deltaMs;

      this.frameRateHistory.push(fps);
      if (this.frameRateHistory.length > 60) {
        this.frameRateHistory.shift();
      }

      // Calculate average FPS
      const avgFps = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length;
      this.metrics.renderFPS = Math.round(avgFps);

      // Detect frame drops
      if (fps < this.config.targetFPS * 0.85) {
        this.adjustForHighLoad();
      }

      this.lastFrameTime = now;
      this.frameCount++;

      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  }

  /**
   * Measure memory usage
   */
  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      const usage = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
      this.metrics.memoryUsage = Math.round(usage * 100);

      // Alert if memory usage is high
      if (usage > 0.85) {
        console.warn('⚠️ High memory usage detected');
        this.optimizeMemory();
      }
    }
  }

  /**
   * Adjust analysis quality based on CPU load
   */
  private adjustForHighLoad(): void {
    if (this.isOptimizing) return;

    this.isOptimizing = true;
    console.log('📊 High load detected, optimizing...');

    // Reduce analysis quality
    if (this.config.analysisQuality === 'high') {
      this.config.analysisQuality = 'medium';
      console.log('🔽 Reduced analysis quality to MEDIUM');
    } else if (this.config.analysisQuality === 'medium') {
      this.config.analysisQuality = 'low';
      console.log('🔽 Reduced analysis quality to LOW');
    }

    // Increase Prime Brain throttle
    this.config.throttlePrimeBrainMs = Math.min(this.config.throttlePrimeBrainMs * 1.5, 100);
    console.log(`⏱️ Increased Prime Brain throttle to ${this.config.throttlePrimeBrainMs.toFixed(0)}ms`);

    // Clear old buffer pool entries
    if (this.config.enableBufferPooling) {
      audioBufferPool.clearUnusedBuffers(2000);
    }

    // Re-enable after 3 seconds
    setTimeout(() => {
      this.isOptimizing = false;
      console.log('✅ Optimization cooldown complete');
    }, 3000);
  }

  /**
   * Optimize memory usage
   */
  private optimizeMemory(): void {
    console.log('🧹 Optimizing memory...');

    // Clear buffer pools
    if (this.config.enableBufferPooling) {
      audioBufferPool.clearUnusedBuffers(1000);
    }

    // Force garbage collection if available (DevTools only)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('🗑️ Garbage collection triggered');
    }
  }

  /**
   * Check if Prime Brain should update (throttle mechanism)
   */
  shouldUpdatePrimeBrain(): boolean {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastPrimeBrainUpdate;

    if (timeSinceLastUpdate >= this.config.throttlePrimeBrainMs) {
      this.lastPrimeBrainUpdate = now;
      return true;
    }

    return false;
  }

  /**
   * Get FFT size based on current quality setting
   */
  getOptimalFFTSize(): number {
    switch (this.config.analysisQuality) {
      case 'low':
        return 1024; // Lower resolution, faster
      case 'medium':
        return 2048;
      case 'high':
        return 4096; // High resolution, slower
      default:
        return 2048;
    }
  }

  /**
   * Acquire audio buffer with pooling
   */
  acquireAudioBuffer(size: number): Float32Array {
    if (this.config.enableBufferPooling) {
      return audioBufferPool.acquireBuffer(size);
    }
    return new Float32Array(size);
  }

  /**
   * Release audio buffer back to pool
   */
  releaseAudioBuffer(buffer: Float32Array): void {
    if (this.config.enableBufferPooling) {
      audioBufferPool.releaseBuffer(buffer);
    }
  }

  /**
   * Delegate analysis to worker thread
   */
  async analyzeInWorker(audioBuffer: Float32Array): Promise<any> {
    if (!this.config.enableWorkerThreads || !this.analysisWorker) {
      // Fallback to main thread
      return this.analyzeOnMainThread(audioBuffer);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker analysis timeout'));
      }, 5000);

      const handler = (event: MessageEvent) => {
        if (event.data.type === 'result') {
          clearTimeout(timeout);
          if (this.analysisWorker) {
            this.analysisWorker.removeEventListener('message', handler);
          }
          resolve(event.data.result);
        }
      };

      if (this.analysisWorker) {
        this.analysisWorker.addEventListener('message', handler);
        this.analysisWorker.postMessage({
          type: 'analyze',
          data: {
            audioBuffer,
            fftSize: this.getOptimalFFTSize(),
            sampleRate: 48000,
            analysisType: 'spectrum'
          }
        });
      }
    });
  }

  /**
   * Fallback analysis on main thread
   */
  private analyzeOnMainThread(audioBuffer: Float32Array): Promise<any> {
    return new Promise((resolve) => {
      // Simple RMS calculation as fallback
      const rms = Math.sqrt(
        audioBuffer.reduce((sum, val) => sum + val * val, 0) / audioBuffer.length
      );

      resolve({
        rms: 20 * Math.log10(rms + 1e-9),
        type: 'dynamics'
      });
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const poolStats = audioBufferPool.getStats();
    const report = `
📊 PERFORMANCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CPU Usage:         ${this.metrics.cpuUsage}%
Memory Usage:      ${this.metrics.memoryUsage}%
Render FPS:        ${this.metrics.renderFPS}
Analysis Quality:  ${this.config.analysisQuality.toUpperCase()}
Prime Brain Throttle: ${this.config.throttlePrimeBrainMs.toFixed(0)}ms
Audio Latency:     ${this.metrics.audioLatency.toFixed(2)}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Buffer Pool Stats:
  Total Buffers:   ${poolStats.totalBuffers}
  In Use:          ${poolStats.inUseBuffers}
  Available:       ${poolStats.availableBuffers}
  Hit Rate:        ${(poolStats.hitRate * 100).toFixed(1)}%
  Utilization:     ${(poolStats.poolUtilization * 100).toFixed(1)}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    return report;
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.frameRateHistory = [];
    this.lastPrimeBrainUpdate = 0;
    this.metrics.history = [];
    audioBufferPool.reset();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.analysisWorker) {
      this.analysisWorker.terminate();
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
