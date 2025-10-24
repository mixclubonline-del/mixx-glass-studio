/**
 * Mixx Club Studio - Audio Buffer Pool
 * Memory pooling for low-latency audio processing
 * Reduces garbage collection pressure by reusing buffer allocations
 */

export interface PooledAudioBuffer {
  data: Float32Array;
  inUse: boolean;
  createdAt: number;
  lastUsedAt: number;
}

/**
 * AudioBufferPool - Memory pooling for audio buffers
 * Prevents garbage collection during real-time audio processing
 * Maintains pre-allocated Float32Array buffers for immediate reuse
 */
export class AudioBufferPool {
  private static instance: AudioBufferPool;
  private buffersBySize: Map<number, PooledAudioBuffer[]> = new Map();
  private maxPoolSize: number = 32; // Max buffers per size
  private stats = {
    allocations: 0,
    reuses: 0,
    poolHits: 0,
    poolMisses: 0,
    peakPoolSize: 0
  };

  private constructor() {
    this.initializeCommonBufferSizes();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AudioBufferPool {
    if (!AudioBufferPool.instance) {
      AudioBufferPool.instance = new AudioBufferPool();
    }
    return AudioBufferPool.instance;
  }

  /**
   * Initialize common buffer sizes used in audio processing
   */
  private initializeCommonBufferSizes(): void {
    // Pre-allocate buffers for common audio frame sizes
    const commonSizes = [
      128,   // ASIO standard
      256,   // Common buffer size
      512,   // Medium buffer
      1024,  // Standard FFT size
      2048,  // Common for analysis
      4096,  // Professional FFT
      8192   // Large analysis buffer
    ];

    for (const size of commonSizes) {
      this.buffersBySize.set(size, []);
      // Pre-warm pool with 4 buffers each
      for (let i = 0; i < 4; i++) {
        this.buffersBySize.get(size)!.push({
          data: new Float32Array(size),
          inUse: false,
          createdAt: Date.now(),
          lastUsedAt: Date.now()
        });
      }
    }
  }

  /**
   * Get a buffer from pool or allocate new one
   */
  acquireBuffer(size: number): Float32Array {
    let pool = this.buffersBySize.get(size);

    // Create pool if doesn't exist
    if (!pool) {
      pool = [];
      this.buffersBySize.set(size, pool);
    }

    // Try to get unused buffer
    const availableBuffer = pool.find(b => !b.inUse);

    if (availableBuffer) {
      availableBuffer.inUse = true;
      availableBuffer.lastUsedAt = Date.now();
      availableBuffer.data.fill(0); // Clear data
      this.stats.poolHits++;
      this.stats.reuses++;
      return availableBuffer.data;
    }

    // Pool miss - allocate new buffer
    this.stats.poolMisses++;

    if (pool.length < this.maxPoolSize) {
      const newBuffer: PooledAudioBuffer = {
        data: new Float32Array(size),
        inUse: true,
        createdAt: Date.now(),
        lastUsedAt: Date.now()
      };
      pool.push(newBuffer);
      this.stats.allocations++;
      this.stats.peakPoolSize = Math.max(this.stats.peakPoolSize, pool.length);
      return newBuffer.data;
    }

    // Pool at capacity - allocate temporary buffer
    return new Float32Array(size);
  }

  /**
   * Release buffer back to pool
   */
  releaseBuffer(buffer: Float32Array): void {
    const size = buffer.length;
    const pool = this.buffersBySize.get(size);

    if (pool) {
      const pooledBuffer = pool.find(b => b.data === buffer);
      if (pooledBuffer) {
        pooledBuffer.inUse = false;
        pooledBuffer.lastUsedAt = Date.now();
      }
    }
  }

  /**
   * Get current pool statistics
   */
  getStats() {
    const totalBuffers = Array.from(this.buffersBySize.values()).reduce(
      (sum, pool) => sum + pool.length,
      0
    );

    const inUseBuffers = Array.from(this.buffersBySize.values()).reduce(
      (sum, pool) => sum + pool.filter(b => b.inUse).length,
      0
    );

    return {
      totalBuffers,
      inUseBuffers,
      availableBuffers: totalBuffers - inUseBuffers,
      ...this.stats,
      hitRate: this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses),
      poolUtilization: inUseBuffers / totalBuffers
    };
  }

  /**
   * Clear unused buffers from pools (GC housekeeping)
   */
  clearUnusedBuffers(maxAgeMsec: number = 5000): void {
    const now = Date.now();

    for (const pool of this.buffersBySize.values()) {
      // Keep only used buffers and recent unused ones
      const toKeep = pool.filter(b => {
        if (b.inUse) return true;
        return now - b.lastUsedAt < maxAgeMsec;
      });

      // Replace array with filtered version
      pool.length = 0;
      pool.push(...toKeep);
    }
  }

  /**
   * Reset all pools
   */
  reset(): void {
    this.buffersBySize.clear();
    this.stats = {
      allocations: 0,
      reuses: 0,
      poolHits: 0,
      poolMisses: 0,
      peakPoolSize: 0
    };
    this.initializeCommonBufferSizes();
  }
}

// Export singleton instance
export const audioBufferPool = AudioBufferPool.getInstance();
