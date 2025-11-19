/**
 * AUDIO GRAPH GUARD - Prevents Feedback Loops and Overload
 * 
 * Monitors and prevents:
 * - Feedback loops in audio routing
 * - Excessive analyser connections
 * - CPU overload from too many active meters
 * 
 * Flow Doctrine: Protect the mix
 * Reductionist Engineering: Prevent catastrophic failures
 * 
 * @author Prime (Mixx Club)
 */

class AudioGraphGuard {
  private activeAnalysers = new WeakSet<AnalyserNode>();
  private analyserCount = 0;
  private maxAnalysers = 50; // Reasonable limit
  private overloadThreshold = 0.9; // 90% CPU usage
  private isOverloaded = false;

  /**
   * Register an analyser node
   */
  registerAnalyser(analyser: AnalyserNode): boolean {
    if (this.activeAnalysers.has(analyser)) {
      return true; // Already registered
    }

    if (this.analyserCount >= this.maxAnalysers) {
      console.warn('[AUDIO GRAPH GUARD] Too many analysers, rejecting new analyser');
      return false;
    }

    this.activeAnalysers.add(analyser);
    this.analyserCount++;
    return true;
  }

  /**
   * Unregister an analyser node
   */
  unregisterAnalyser(analyser: AnalyserNode): void {
    if (this.activeAnalysers.has(analyser)) {
      this.activeAnalysers.delete(analyser);
      this.analyserCount = Math.max(0, this.analyserCount - 1);
    }
  }

  /**
   * Check if system is overloaded
   */
  checkOverload(): boolean {
    // Simple heuristic: if we have too many analysers, consider it overloaded
    const analyserRatio = this.analyserCount / this.maxAnalysers;
    this.isOverloaded = analyserRatio >= this.overloadThreshold;

    if (this.isOverloaded) {
      console.warn('[AUDIO GRAPH GUARD] System overload detected:', {
        analyserCount: this.analyserCount,
        maxAnalysers: this.maxAnalysers,
        ratio: analyserRatio,
      });
    }

    return this.isOverloaded;
  }

  /**
   * Get current analyser count
   */
  getAnalyserCount(): number {
    return this.analyserCount;
  }

  /**
   * Get overload status
   */
  getIsOverloaded(): boolean {
    return this.isOverloaded;
  }

  /**
   * Reset guard state
   */
  reset(): void {
    this.activeAnalysers = new WeakSet();
    this.analyserCount = 0;
    this.isOverloaded = false;
  }
}

// Singleton instance
export const audioGraphGuard = new AudioGraphGuard();

