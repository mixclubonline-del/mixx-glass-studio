/**
 * QUANTUM PARAMETER DEBOUNCER - Throttled Audio Parameter Updates
 * 
 * Debounces/throttles audio parameter updates to prevent excessive
 * setTargetAtTime calls that can cause audio glitches.
 * 
 * Flow Doctrine: Smooth parameter transitions
 * Reductionist Engineering: Batch parameter updates
 * 
 * @author Prime (Mixx Club)
 */

interface PendingUpdate {
  param: AudioParam;
  value: number;
  timestamp: number;
}

class ParameterDebouncer {
  private pendingUpdates = new Map<AudioParam, PendingUpdate>();
  private frameId: number | null = null;
  private isRunning = false;
  private batchInterval: number = 16; // ~60fps (16ms)

  /**
   * Schedule a parameter update (debounced)
   */
  scheduleUpdate(
    param: AudioParam,
    value: number,
    audioContext: BaseAudioContext,
    rampTime: number = 0.05
  ): void {
    this.pendingUpdates.set(param, {
      param,
      value,
      timestamp: audioContext.currentTime,
    });

    this.start(audioContext, rampTime);
  }

  private start(audioContext: BaseAudioContext, rampTime: number) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick(audioContext, rampTime);
  }

  private tick = (audioContext: BaseAudioContext, rampTime: number) => {
    if (this.pendingUpdates.size === 0) {
      this.stop();
      return;
    }

    const now = audioContext.currentTime;

    // Apply all pending updates in a single batch
    const updateCount = this.pendingUpdates.size;
    for (const update of this.pendingUpdates.values()) {
      try {
        update.param.setTargetAtTime(update.value, now, rampTime);
      } catch (err) {
        console.warn('[PARAM DEBOUNCER] Failed to update parameter:', err);
      }
    }

    // Record for performance monitoring
    if (typeof window !== 'undefined' && (window as any).__mixxPerformanceMonitor) {
      for (let i = 0; i < updateCount; i++) {
        (window as any).__mixxPerformanceMonitor.recordParameterUpdate();
      }
    }

    // Clear updates after processing
    this.pendingUpdates.clear();

    // Always stop after processing - if new updates arrive, scheduleUpdate will restart
    // This prevents continuous setTimeout loops when idle
    this.stop();
    
    // Check if new updates arrived during processing (race condition protection)
    // If so, restart processing
    if (this.pendingUpdates.size > 0) {
      this.start(audioContext, rampTime);
    }
  };

  private stop() {
    if (this.frameId !== null) {
      clearTimeout(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }

  /**
   * Flush all pending updates immediately
   */
  flush(audioContext: BaseAudioContext, rampTime: number = 0.05) {
    const now = audioContext.currentTime;
    for (const update of this.pendingUpdates.values()) {
      try {
        update.param.setTargetAtTime(update.value, now, rampTime);
      } catch (err) {
        console.warn('[PARAM DEBOUNCER] Failed to flush parameter:', err);
      }
    }
    this.pendingUpdates.clear();
    this.stop();
  }
}

// Singleton instance
export const parameterDebouncer = new ParameterDebouncer();

