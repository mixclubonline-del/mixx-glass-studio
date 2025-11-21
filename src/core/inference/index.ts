/**
 * Edge Inference - Public API
 * 
 * Exports for edge inference optimizations.
 */

export {
  getInferenceCache,
  type CachedInference,
  type CacheStats,
} from './InferenceCache';

export {
  extractOptimizedFFT,
  extractSpectralFeatures,
  extractAllFeatures,
  type ExtractedFeatures,
} from './FeatureExtractor';

export {
  createBatchProcessor,
  type BatchItem,
  type BatchConfig,
} from './BatchProcessor';

