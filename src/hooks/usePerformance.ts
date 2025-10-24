/**
 * Mixx Club Studio - usePerformance Hook
 * React hook for accessing performance optimization features
 * Integrates with PerformanceOptimizer singleton
 */

import { useEffect, useState, useCallback } from 'react';
import { performanceOptimizer } from '../utils/PerformanceOptimizer';
import type { PerformanceMetrics } from '../utils/PerformanceOptimizer';

interface UsePerformanceReturn {
  metrics: PerformanceMetrics;
  fftSize: number;
  shouldUpdate: boolean;
  acquireBuffer: (size: number) => Float32Array;
  releaseBuffer: (buffer: Float32Array) => void;
  analyzeInWorker: (buffer: Float32Array) => Promise<any>;
  getReport: () => string;
}

/**
 * usePerformance - Hook for accessing performance optimization
 * 
 * Usage:
 * ```tsx
 * const { metrics, fftSize, shouldUpdate, analyzeInWorker } = usePerformance();
 * ```
 */
export function usePerformance(): UsePerformanceReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => 
    performanceOptimizer.getMetrics()
  );

  // Update metrics every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceOptimizer.getMetrics());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const fftSize = performanceOptimizer.getOptimalFFTSize();
  const shouldUpdate = performanceOptimizer.shouldUpdatePrimeBrain();

  const acquireBuffer = useCallback(
    (size: number) => performanceOptimizer.acquireAudioBuffer(size),
    []
  );

  const releaseBuffer = useCallback(
    (buffer: Float32Array) => performanceOptimizer.releaseAudioBuffer(buffer),
    []
  );

  const analyzeInWorker = useCallback(
    (buffer: Float32Array) => performanceOptimizer.analyzeInWorker(buffer),
    []
  );

  const getReport = useCallback(
    () => performanceOptimizer.getPerformanceReport(),
    []
  );

  return {
    metrics,
    fftSize,
    shouldUpdate,
    acquireBuffer,
    releaseBuffer,
    analyzeInWorker,
    getReport
  };
}

export default usePerformance;
