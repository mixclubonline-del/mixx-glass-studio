/**
 * QUANTUM SATURATION CACHE - Precomputed WaveShaper Curves
 * 
 * Caches saturation curves to avoid recomputation.
 * Saturation curves are expensive to compute but frequently reused.
 * 
 * Flow Doctrine: Cache expensive computations
 * Reductionist Engineering: Compute once, reuse many times
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

interface CachedCurve {
  curve: Float32Array;
  amount: number;
  lastUsed: number;
}

class SaturationCache {
  private cache = new Map<number, CachedCurve>();
  private maxCacheSize = 50;
  private maxAge = 300000; // 5 minutes
  private cleanupInterval = 60000; // 1 minute

  constructor() {
    // Periodic cleanup
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Get or create saturation curve
   */
  getCurve(amount: number, samples: number = 1024): Float32Array {
    // Round amount to nearest 0.01 for cache efficiency
    const roundedAmount = Math.round(amount * 100) / 100;
    const cacheKey = roundedAmount * 10000 + samples;

    let cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.lastUsed < this.maxAge) {
      cached.lastUsed = Date.now();
      return cached.curve;
    }

    // Create new curve
    const curve = this.computeCurve(roundedAmount, samples);
    
    // Cache it
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }
    
    this.cache.set(cacheKey, {
      curve,
      amount: roundedAmount,
      lastUsed: Date.now(),
    });

    return curve;
  }

  private computeCurve(amount: number, samples: number): Float32Array {
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const y = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      curve[i] = y;
    }

    return curve;
  }

  private evictOldest(): void {
    let oldestKey: number | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.lastUsed < oldestTime) {
        oldestTime = value.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.lastUsed > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const saturationCache = new SaturationCache();





