/**
 * WEBGPU BENCHMARK UTILITIES
 * 
 * Provides benchmarking tools to measure WebGPU vs CPU performance.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 2 WebGPU Integration
 */

import * as tf from '@tensorflow/tfjs';
import { getBackendStatus, isWebGPUActive } from './WebGPUBackend';

export interface BenchmarkResult {
  backend: string;
  operation: string;
  duration: number;
  throughput: number; // operations per second
  memoryUsed: number;
  timestamp: number;
}

/**
 * Benchmark a TensorFlow.js operation
 */
export async function benchmarkOperation(
  operation: () => Promise<void> | void,
  operationName: string,
  iterations: number = 10
): Promise<BenchmarkResult> {
  const backend = tf.getBackend();
  const backendStatus = getBackendStatus();
  
  // Warmup
  for (let i = 0; i < 3; i++) {
    await operation();
  }
  
  // Clear memory
  tf.engine().startScope();
  
  const startTime = performance.now();
  const memoryBefore = tf.memory();
  
  // Run iterations
  for (let i = 0; i < iterations; i++) {
    await operation();
  }
  
  const endTime = performance.now();
  const memoryAfter = tf.memory();
  
  tf.engine().endScope();
  
  const duration = endTime - startTime;
  const avgDuration = duration / iterations;
  const throughput = 1000 / avgDuration; // ops per second
  const memoryUsed = memoryAfter.numBytes - memoryBefore.numBytes;
  
  return {
    backend,
    operation: operationName,
    duration: avgDuration,
    throughput,
    memoryUsed,
    timestamp: Date.now(),
  };
}

/**
 * Compare WebGPU vs CPU performance
 */
export async function compareBackends(
  operation: () => Promise<void> | void,
  operationName: string,
  iterations: number = 10
): Promise<{
  webgpu?: BenchmarkResult;
  cpu?: BenchmarkResult;
  speedup?: number;
}> {
  const results: {
    webgpu?: BenchmarkResult;
    cpu?: BenchmarkResult;
    speedup?: number;
  } = {};
  
  // Test WebGPU if available
  if (isWebGPUActive()) {
    results.webgpu = await benchmarkOperation(operation, `${operationName} (WebGPU)`, iterations);
  }
  
  // Switch to CPU and test
  const originalBackend = tf.getBackend();
  try {
    await tf.setBackend('cpu');
    await tf.ready();
    results.cpu = await benchmarkOperation(operation, `${operationName} (CPU)`, iterations);
  } finally {
    // Restore original backend
    if (originalBackend !== 'cpu') {
      await tf.setBackend(originalBackend);
      await tf.ready();
    }
  }
  
  // Calculate speedup
  if (results.webgpu && results.cpu) {
    results.speedup = results.cpu.duration / results.webgpu.duration;
  }
  
  return results;
}

/**
 * Log benchmark results
 */
export function logBenchmarkResult(result: BenchmarkResult): void {
  // Benchmark results available via return value
  // Logging removed - use return value for feedback
}

/**
 * Log comparison results
 */
export function logComparisonResults(comparison: {
  webgpu?: BenchmarkResult;
  cpu?: BenchmarkResult;
  speedup?: number;
}): void {
  if (comparison.webgpu) {
    logBenchmarkResult(comparison.webgpu);
  }
  if (comparison.cpu) {
    logBenchmarkResult(comparison.cpu);
  }
  // Speedup available via return value
}

