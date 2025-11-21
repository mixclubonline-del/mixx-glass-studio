/**
 * INFERENCE CACHE
 * 
 * Caches AI inference results to avoid redundant computation.
 * Provides fast lookups for similar audio features.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 4 Edge Inference
 */

export interface CachedInference {
  key: string;
  result: unknown;
  timestamp: number;
  hitCount: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

class InferenceCache {
  private cache: Map<string, CachedInference> = new Map();
  private maxSize: number = 100; // Maximum cache entries
  private ttl: number = 300000; // 5 minutes TTL
  private stats = {
    hits: 0,
    misses: 0,
  };
  
  /**
   * Generate cache key from features
   */
  private generateKey(features: number[]): string {
    // Create a hash-like key from feature array
    // Use first N features and hash them
    const keyFeatures = features.slice(0, 32); // Use first 32 features
    const sum = keyFeatures.reduce((acc, val) => acc + val, 0);
    const product = keyFeatures.reduce((acc, val) => acc * (val + 1), 1);
    return `${sum.toFixed(2)}-${product.toFixed(2)}-${keyFeatures.length}`;
  }
  
  /**
   * Check if features are similar enough to use cached result
   */
  private isSimilar(features1: number[], features2: number[]): boolean {
    if (features1.length !== features2.length) return false;
    
    // Calculate Euclidean distance
    let distance = 0;
    for (let i = 0; i < Math.min(features1.length, features2.length); i++) {
      const diff = features1[i] - features2[i];
      distance += diff * diff;
    }
    
    const threshold = 0.1; // Similarity threshold
    return Math.sqrt(distance) < threshold;
  }
  
  /**
   * Get cached result if available
   */
  get<T>(features: number[]): T | null {
    const key = this.generateKey(features);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL
    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Check similarity
    // For now, exact key match is sufficient
    // Could enhance with similarity checking
    
    cached.hitCount++;
    this.stats.hits++;
    return cached.result as T;
  }
  
  /**
   * Store inference result
   */
  set<T>(features: number[], result: T): void {
    const key = this.generateKey(features);
    
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      key,
      result,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }
  
  /**
   * Evict oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    let oldestEntry = Infinity;
    let newestEntry = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate,
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
      newestEntry,
    };
  }
  
  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }
}

// Global singleton instance
let globalCache: InferenceCache | null = null;

/**
 * Get the global Inference Cache instance
 */
export function getInferenceCache(): InferenceCache {
  if (!globalCache) {
    globalCache = new InferenceCache();
  }
  return globalCache;
}

