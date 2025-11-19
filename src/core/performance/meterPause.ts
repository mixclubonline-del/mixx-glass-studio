/**
 * QUANTUM METER PAUSE - Conditional Meter Reading
 * 
 * Allows pausing meter reading when audio isn't playing to save CPU.
 * 
 * Flow Doctrine: Only process when needed
 * Reductionist Engineering: Pause when idle
 * 
 * @author Prime (Mixx Club)
 */

class MeterPauseManager {
  private isPaused = false;
  private pauseCallbacks = new Set<() => void>();
  private resumeCallbacks = new Set<() => void>();

  /**
   * Pause all meter reading (when audio stops)
   */
  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseCallbacks.forEach((cb) => cb());
  }

  /**
   * Resume all meter reading (when audio starts)
   */
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.resumeCallbacks.forEach((cb) => cb());
  }

  /**
   * Check if meters are paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Register callback for pause events
   */
  onPause(callback: () => void): () => void {
    this.pauseCallbacks.add(callback);
    return () => {
      this.pauseCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for resume events
   */
  onResume(callback: () => void): () => void {
    this.resumeCallbacks.add(callback);
    return () => {
      this.resumeCallbacks.delete(callback);
    };
  }
}

// Singleton instance
export const meterPauseManager = new MeterPauseManager();

