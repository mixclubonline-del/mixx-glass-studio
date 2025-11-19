/**
 * QUANTUM PERFORMANCE MONITOR - Real-time Performance Tracking
 * 
 * Monitors and reports performance metrics:
 * - Frame rate (RAF timing)
 * - Audio processing latency
 * - Memory usage
 * - Component render times
 * 
 * Flow Doctrine: Visibility into system health
 * Reductionist Engineering: Minimal overhead monitoring
 * 
 * @author Prime (Mixx Club)
 */

interface PerformanceMetrics {
  frameRate: number;
  averageFrameTime: number;
  audioLatency: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
  meterReadingsPerSecond: number;
  parameterUpdatesPerSecond: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
}

class PerformanceMonitor {
  private frameTimes: number[] = [];
  private maxFrameSamples = 60; // Track last 60 frames
  private snapshots: PerformanceSnapshot[] = [];
  private maxSnapshots = 100;
  private lastFrameTime = performance.now();
  private meterReadingCount = 0;
  private parameterUpdateCount = 0;
  private lastSecond = Math.floor(performance.now() / 1000);

  private frameRateCallback?: (fps: number) => void;
  private metricsCallback?: (metrics: PerformanceMetrics) => void;
  private monitoringFrameId: number | null = null;
  private isMonitoring = false;

  constructor() {
    // Don't start monitoring automatically - only when callbacks are set
    // This prevents unnecessary CPU usage when not needed
  }

  private startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    
    const measureFrame = () => {
      // Only continue if we have callbacks or are in dev mode
      if (!this.frameRateCallback && !this.metricsCallback && process.env.NODE_ENV !== 'development') {
        this.stopMonitoring();
        return;
      }

      const now = performance.now();
      const frameTime = now - this.lastFrameTime;
      this.lastFrameTime = now;

      // Track frame times
      this.frameTimes.push(frameTime);
      if (this.frameTimes.length > this.maxFrameSamples) {
        this.frameTimes.shift();
      }

      // Calculate metrics
      const metrics = this.calculateMetrics();

      // Call callbacks
      if (this.frameRateCallback) {
        this.frameRateCallback(metrics.frameRate);
      }
      if (this.metricsCallback) {
        this.metricsCallback(metrics);
      }

      // Take snapshot periodically
      const currentSecond = Math.floor(now / 1000);
      if (currentSecond !== this.lastSecond) {
        this.takeSnapshot(metrics);
        this.lastSecond = currentSecond;
        this.meterReadingCount = 0;
        this.parameterUpdateCount = 0;
      }

      this.monitoringFrameId = requestAnimationFrame(measureFrame);
    };

    this.monitoringFrameId = requestAnimationFrame(measureFrame);
  }

  private stopMonitoring() {
    if (this.monitoringFrameId !== null) {
      cancelAnimationFrame(this.monitoringFrameId);
      this.monitoringFrameId = null;
    }
    this.isMonitoring = false;
  }

  private calculateMetrics(): PerformanceMetrics {
    // Calculate average frame time
    const avgFrameTime =
      this.frameTimes.length > 0
        ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
        : 16.67; // Default 60fps

    const frameRate = 1000 / avgFrameTime;

    // Get memory usage if available
    let memoryUsage: PerformanceMetrics['memoryUsage'];
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      memoryUsage = {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
      };
    }

    return {
      frameRate,
      averageFrameTime: avgFrameTime,
      audioLatency: 0, // TODO: Measure actual audio latency
      memoryUsage,
      meterReadingsPerSecond: this.meterReadingCount,
      parameterUpdatesPerSecond: this.parameterUpdateCount,
    };
  }

  private takeSnapshot(metrics: PerformanceMetrics) {
    this.snapshots.push({
      timestamp: performance.now(),
      metrics,
    });

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Record a meter reading (for metrics)
   */
  recordMeterReading() {
    this.meterReadingCount++;
  }

  /**
   * Record a parameter update (for metrics)
   */
  recordParameterUpdate() {
    this.parameterUpdateCount++;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return this.calculateMetrics();
  }

  /**
   * Get performance snapshots
   */
  getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Set callback for frame rate updates
   */
  onFrameRate(callback: (fps: number) => void) {
    this.frameRateCallback = callback;
    if (callback && !this.isMonitoring) {
      this.startMonitoring();
    } else if (!callback && !this.metricsCallback && process.env.NODE_ENV !== 'development') {
      this.stopMonitoring();
    }
  }

  /**
   * Set callback for metrics updates
   */
  onMetrics(callback: (metrics: PerformanceMetrics) => void) {
    this.metricsCallback = callback;
    if (callback && !this.isMonitoring) {
      this.startMonitoring();
    } else if (!callback && !this.frameRateCallback && process.env.NODE_ENV !== 'development') {
      this.stopMonitoring();
    }
  }

  /**
   * Get performance report (for debugging)
   */
  getReport(): string {
    const metrics = this.calculateMetrics();
    return `
QUANTUM PERFORMANCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frame Rate: ${metrics.frameRate.toFixed(1)} fps
Avg Frame Time: ${metrics.averageFrameTime.toFixed(2)}ms
Meter Readings/sec: ${metrics.meterReadingsPerSecond}
Parameter Updates/sec: ${metrics.parameterUpdatesPerSecond}
${metrics.memoryUsage ? `Memory: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)}MB / ${(metrics.memoryUsage.total / 1024 / 1024).toFixed(1)}MB` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
}

// Singleton instance (lazy initialization - only monitors when callbacks are set)
export const performanceMonitor = new PerformanceMonitor();

// Expose to window for debugging (dev only)
// In dev mode, start monitoring so we can inspect it
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__mixxPerformanceMonitor = performanceMonitor;
  // Only start monitoring in dev if explicitly requested via getReport()
  // This prevents unnecessary CPU usage
}

