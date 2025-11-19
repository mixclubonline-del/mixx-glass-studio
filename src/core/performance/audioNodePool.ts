/**
 * QUANTUM AUDIO NODE POOL - Reusable Audio Node Management
 * 
 * Pools and reuses audio nodes to reduce allocation overhead.
 * Particularly useful for frequently created/destroyed nodes like analysers.
 * 
 * Flow Doctrine: Efficient resource management
 * Reductionist Engineering: Reuse instead of recreate
 * 
 * @author Prime (Mixx Club)
 */

interface PooledNode<T extends AudioNode> {
  node: T;
  inUse: boolean;
  lastUsed: number;
}

class AudioNodePool<T extends AudioNode> {
  private pool: PooledNode<T>[] = [];
  private factory: (context: BaseAudioContext) => T;
  private maxSize: number;
  private cleanupInterval: number;
  private maxIdleTime: number;

  constructor(
    factory: (context: BaseAudioContext) => T,
    options: {
      maxSize?: number;
      cleanupInterval?: number;
      maxIdleTime?: number;
    } = {}
  ) {
    this.factory = factory;
    this.maxSize = options.maxSize ?? 10;
    this.cleanupInterval = options.cleanupInterval ?? 30000; // 30s
    this.maxIdleTime = options.maxIdleTime ?? 60000; // 60s

    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Acquire a node from the pool (or create new if pool is empty)
   */
  acquire(context: BaseAudioContext): T {
    // Find available node in pool
    for (const pooled of this.pool) {
      if (!pooled.inUse) {
        pooled.inUse = true;
        pooled.lastUsed = Date.now();
        return pooled.node;
      }
    }

    // Create new node if pool has space
    if (this.pool.length < this.maxSize) {
      const node = this.factory(context);
      this.pool.push({
        node,
        inUse: true,
        lastUsed: Date.now(),
      });
      return node;
    }

    // Pool is full, create temporary node
    console.warn('[NODE POOL] Pool full, creating temporary node');
    return this.factory(context);
  }

  /**
   * Release a node back to the pool
   */
  release(node: T): void {
    const pooled = this.pool.find((p) => p.node === node);
    if (pooled) {
      pooled.inUse = false;
      pooled.lastUsed = Date.now();
    }
  }

  /**
   * Clean up idle nodes
   */
  private cleanup(): void {
    const now = Date.now();
    this.pool = this.pool.filter((pooled) => {
      if (!pooled.inUse && now - pooled.lastUsed > this.maxIdleTime) {
        // Dispose of idle node
        try {
          if (pooled.node.disconnect) {
            pooled.node.disconnect();
          }
        } catch (err) {
          // Ignore disconnect errors
        }
        return false; // Remove from pool
      }
      return true; // Keep in pool
    });
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    for (const pooled of this.pool) {
      try {
        if (pooled.node.disconnect) {
          pooled.node.disconnect();
        }
      } catch (err) {
        // Ignore disconnect errors
      }
    }
    this.pool = [];
  }
}

/**
 * Analyser node pool (most commonly pooled node type)
 */
export const analyserPool = new AudioNodePool<AnalyserNode>(
  (context) => {
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    return analyser;
  },
  {
    maxSize: 20, // More analysers needed for multi-track setups
    maxIdleTime: 30000, // 30s idle time
  }
);

/**
 * Gain node pool
 */
export const gainNodePool = new AudioNodePool<GainNode>(
  (context) => context.createGain(),
  {
    maxSize: 50, // Many gain nodes in complex routing
    maxIdleTime: 60000,
  }
);

