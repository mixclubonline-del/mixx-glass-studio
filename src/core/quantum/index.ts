/**
 * Quantum Scheduler - Public API
 * 
 * Exports for integrating quantum scheduler throughout the system.
 */

export {
  getQuantumScheduler,
  registerQuantumTask,
  scheduleAudioTask,
  scheduleAITask,
  scheduleUITask,
  type QuantumTask,
  type TaskPriority,
  type QuantumSchedulerStats,
  type QuantumSchedulerTrace,
} from './QuantumScheduler';

export {
  useQuantumScheduler,
  type UseQuantumSchedulerReturn,
} from './useQuantumScheduler';

export {
  getWebGPUBackendManager,
  initializeWebGPUBackend,
  getBackendStatus,
  isWebGPUActive,
  type BackendType,
  type BackendStatus,
} from './WebGPUBackend';

export {
  benchmarkOperation,
  compareBackends,
  logBenchmarkResult,
  logComparisonResults,
  type BenchmarkResult,
} from './WebGPUBenchmark';


// Phase 35: GPU Audio Processing
export {
  getGPUAudioProcessor,
  initializeGPUAudio,
  gpuFFT,
  gpuSpectralAnalysis,
  type GPUAudioStatus,
  type SpectralAnalysis,
} from './GPUAudioProcessor';
