/**
 * Performance Monitor - Track rendering performance and optimize
 */

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 60; // Keep last 60 samples

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const samples = this.metrics.get(name)!;
    samples.push(value);
    
    // Keep only recent samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getAverage(name: string): number {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) return 0;
    
    const sum = samples.reduce((a, b) => a + b, 0);
    return sum / samples.length;
  }

  getMax(name: string): number {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) return 0;
    return Math.max(...samples);
  }

  clear(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  getAllMetrics(): Record<string, { avg: number; max: number }> {
    const result: Record<string, { avg: number; max: number }> = {};
    
    this.metrics.forEach((_, name) => {
      result[name] = {
        avg: this.getAverage(name),
        max: this.getMax(name)
      };
    });
    
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Utility to measure async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await operation();
  } finally {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
  }
}

// Utility to measure sync operations
export function measureSync<T>(
  name: string,
  operation: () => T
): T {
  const start = performance.now();
  try {
    return operation();
  } finally {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
  }
}
