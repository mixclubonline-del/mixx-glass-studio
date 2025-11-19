/**
 * Performance Metrics Utility
 * Phase 1: CSS Modernization - Before/After Measurement
 * 
 * Tracks key performance metrics for CSS optimization validation:
 * - FPS during animations/scrolling
 * - Time to Interactive (TTI)
 * - Cumulative Layout Shift (CLS)
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 */

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number | null;
  tti: number | null;
  cls: number | null;
  fcp: number | null;
  lcp: number | null;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  paintTiming?: {
    firstPaint: number;
    firstContentfulPaint: number;
  };
}

export interface PerformanceMetrics {
  baseline: PerformanceSnapshot | null;
  current: PerformanceSnapshot | null;
  improvement: {
    fps?: number;
    tti?: number;
    cls?: number;
    fcp?: number;
    lcp?: number;
  } | null;
}

class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsInterval: number | null = null;
  private observer: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {
    baseline: null,
    current: null,
    improvement: null,
  };

  /**
   * Start FPS monitoring
   */
  startFPSMonitoring(): void {
    if (this.fpsInterval) return;

    this.fpsHistory = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    const measureFPS = () => {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.frameCount++;

      if (delta >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / delta);
        this.fpsHistory.push(fps);
        
        // Keep only last 60 measurements (1 minute at 1s intervals)
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }

        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Stop FPS monitoring
   */
  stopFPSMonitoring(): void {
    if (this.fpsInterval) {
      cancelAnimationFrame(this.fpsInterval);
      this.fpsInterval = null;
    }
  }

  /**
   * Get current average FPS
   */
  getAverageFPS(): number | null {
    if (this.fpsHistory.length === 0) return null;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  /**
   * Get current FPS (last measurement)
   */
  getCurrentFPS(): number | null {
    return this.fpsHistory.length > 0 ? this.fpsHistory[this.fpsHistory.length - 1] : null;
  }

  /**
   * Measure Web Vitals and paint timing
   */
  async measureWebVitals(): Promise<Partial<PerformanceSnapshot>> {
    const snapshot: Partial<PerformanceSnapshot> = {
      timestamp: performance.now(),
      fps: this.getAverageFPS(),
    };

    // Get paint timing
    try {
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      snapshot.paintTiming = {
        firstPaint: paintEntries.find((e) => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
      };
      snapshot.fcp = snapshot.paintTiming.firstContentfulPaint;
    } catch (e) {
      console.warn('Paint timing not available:', e);
    }

    // Get LCP
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as LargestContentfulPaint[];
      if (lcpEntries.length > 0) {
        snapshot.lcp = lcpEntries[lcpEntries.length - 1].renderTime || lcpEntries[lcpEntries.length - 1].loadTime;
      }
    } catch (e) {
      console.warn('LCP not available:', e);
    }

    // Get memory (if available)
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      snapshot.memory = {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      };
    }

    // Measure CLS
    try {
      snapshot.cls = await this.measureCLS();
    } catch (e) {
      console.warn('CLS measurement failed:', e);
    }

    // Measure TTI (simplified - time to first interactive)
    try {
      snapshot.tti = await this.measureTTI();
    } catch (e) {
      console.warn('TTI measurement failed:', e);
    }

    return snapshot;
  }

  /**
   * Measure Cumulative Layout Shift (CLS)
   */
  private async measureCLS(): Promise<number> {
    return new Promise((resolve) => {
      let clsValue = 0;
      let clsEntries: LayoutShift[] = [];

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as LayoutShift;
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
              clsEntries.push(layoutShift);
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Wait a bit for layout shifts to settle
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      } catch (e) {
        resolve(0);
      }
    });
  }

  /**
   * Measure Time to Interactive (TTI) - simplified
   */
  private async measureTTI(): Promise<number> {
    return new Promise((resolve) => {
      // Simplified TTI: time until DOMContentLoaded + 3s
      if (document.readyState === 'complete') {
        const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        resolve(domContentLoaded + 3000);
      } else {
        window.addEventListener('load', () => {
          const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
          resolve(domContentLoaded + 3000);
        });
      }
    });
  }

  /**
   * Take a performance snapshot
   */
  async takeSnapshot(): Promise<PerformanceSnapshot> {
    const webVitals = await this.measureWebVitals();
    return {
      timestamp: performance.now(),
      fps: this.getAverageFPS(),
      tti: webVitals.tti || null,
      cls: webVitals.cls || null,
      fcp: webVitals.fcp || null,
      lcp: webVitals.lcp || null,
      memory: webVitals.memory,
      paintTiming: webVitals.paintTiming,
    };
  }

  /**
   * Set baseline measurement (before optimization)
   */
  async setBaseline(): Promise<void> {
    this.metrics.baseline = await this.takeSnapshot();
    console.log('📊 Baseline performance metrics:', this.metrics.baseline);
  }

  /**
   * Take current measurement (after optimization)
   */
  async takeCurrent(): Promise<void> {
    this.metrics.current = await this.takeSnapshot();
    this.calculateImprovement();
    console.log('📊 Current performance metrics:', this.metrics.current);
    console.log('📈 Performance improvement:', this.metrics.improvement);
  }

  /**
   * Calculate improvement percentage
   */
  private calculateImprovement(): void {
    if (!this.metrics.baseline || !this.metrics.current) {
      this.metrics.improvement = null;
      return;
    }

    const improvement: any = {};

    if (this.metrics.baseline.fps && this.metrics.current.fps) {
      improvement.fps = ((this.metrics.current.fps - this.metrics.baseline.fps) / this.metrics.baseline.fps) * 100;
    }

    if (this.metrics.baseline.tti && this.metrics.current.tti) {
      improvement.tti = ((this.metrics.baseline.tti - this.metrics.current.tti) / this.metrics.baseline.tti) * 100;
    }

    if (this.metrics.baseline.cls !== null && this.metrics.current.cls !== null) {
      improvement.cls = ((this.metrics.baseline.cls - this.metrics.current.cls) / (this.metrics.baseline.cls || 0.001)) * 100;
    }

    if (this.metrics.baseline.fcp && this.metrics.current.fcp) {
      improvement.fcp = ((this.metrics.baseline.fcp - this.metrics.current.fcp) / this.metrics.baseline.fcp) * 100;
    }

    if (this.metrics.baseline.lcp && this.metrics.current.lcp) {
      improvement.lcp = ((this.metrics.baseline.lcp - this.metrics.current.lcp) / this.metrics.baseline.lcp) * 100;
    }

    this.metrics.improvement = improvement;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      baseline: null,
      current: null,
      improvement: null,
    };
    this.fpsHistory = [];
    this.stopFPSMonitoring();
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}

/**
 * Initialize performance monitoring
 * Call this early in the app lifecycle
 */
export function initPerformanceMonitoring(): PerformanceMonitor {
  const monitor = getPerformanceMonitor();
  monitor.startFPSMonitoring();
  
  // Auto-measure after page load
  if (document.readyState === 'complete') {
    setTimeout(() => monitor.takeSnapshot(), 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => monitor.takeSnapshot(), 2000);
    });
  }

  return monitor;
}

/**
 * Quick helper to log performance comparison
 */
export async function logPerformanceComparison(): Promise<void> {
  const monitor = getPerformanceMonitor();
  const metrics = monitor.getMetrics();

  if (!metrics.baseline || !metrics.current) {
    console.warn('⚠️ No baseline or current metrics available. Call setBaseline() and takeCurrent() first.');
    return;
  }

  console.group('📊 Performance Comparison');
  console.log('Baseline:', metrics.baseline);
  console.log('Current:', metrics.current);
  console.log('Improvement:', metrics.improvement);
  console.groupEnd();
}

