/**
 * QUANTUM SHARED CLOCK - Single Source of Truth for Time
 * 
 * Provides a shared clock for beat-locked modulation and timing.
 * Avoids expensive Date.now() calls by maintaining a single clock.
 * 
 * Flow Doctrine: Single source of truth
 * Reductionist Engineering: One clock, many consumers
 * 
 * @author Prime (Mixx Club)
 */

class SharedClock {
  private startTime = performance.now();
  private lastUpdate = 0;
  private currentTime = 0;
  private bpm = 120;
  private frameId: number | null = null;
  private isRunning = false;
  private listeners = new Set<(time: number, beatPhase: number) => void>();

  /**
   * Start the clock
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastUpdate = this.startTime;
    this.tick();
  }

  /**
   * Stop the clock
   */
  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
  }

  /**
   * Get current time in seconds
   */
  getTime(): number {
    if (!this.isRunning) {
      return (performance.now() - this.startTime) / 1000;
    }
    return this.currentTime;
  }

  /**
   * Get current beat phase (0-1)
   */
  getBeatPhase(): number {
    const beatDuration = 60 / this.bpm; // seconds per beat
    const time = this.getTime();
    return (time % beatDuration) / beatDuration;
  }

  /**
   * Subscribe to clock updates
   */
  subscribe(listener: (time: number, beatPhase: number) => void): () => void {
    this.listeners.add(listener);
    if (!this.isRunning && this.listeners.size > 0) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    this.currentTime = (now - this.startTime) / 1000;
    const beatPhase = this.getBeatPhase();

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(this.currentTime, beatPhase);
      } catch (err) {
        console.warn('[SHARED CLOCK] Listener error:', err);
      }
    }

    this.lastUpdate = now;
    this.frameId = requestAnimationFrame(this.tick);
  };
}

// Singleton instance
export const sharedClock = new SharedClock();

// Auto-start when first listener subscribes
if (typeof window !== 'undefined') {
  // Start clock on page load (lazy)
  sharedClock.start();
}

