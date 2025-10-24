/**
 * Master Clock - Single source of truth for all timing in the application
 * Provides high-precision timing and synchronization for playback, UI, and audio
 */

type ClockListener = (time: number, deltaTime: number) => void;

export class MasterClock {
  private static instance: MasterClock | null = null;
  
  private isRunning = false;
  private currentTime = 0;
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private listeners: Set<ClockListener> = new Set();
  private audioContext: AudioContext | null = null;
  
  // Playback settings
  private playbackRate = 1.0;
  private loopEnabled = false;
  private loopStart = 0;
  private loopEnd = 0;

  private constructor() {}

  static getInstance(): MasterClock {
    if (!MasterClock.instance) {
      MasterClock.instance = new MasterClock();
    }
    return MasterClock.instance;
  }

  setAudioContext(ctx: AudioContext) {
    this.audioContext = ctx;
  }

  start(fromTime?: number) {
    if (this.isRunning) return;
    
    if (fromTime !== undefined) {
      this.currentTime = fromTime;
    }
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.tick(this.lastFrameTime);
  }

  pause() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  stop() {
    this.pause();
    this.currentTime = 0;
  }

  seek(time: number) {
    this.currentTime = Math.max(0, time);
    this.notifyListeners(0);
  }

  setLoop(enabled: boolean, start: number = 0, end: number = 0) {
    this.loopEnabled = enabled;
    this.loopStart = start;
    this.loopEnd = end;
  }

  private tick = (timestamp: number) => {
    if (!this.isRunning) return;

    const deltaMs = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    const deltaSec = (deltaMs / 1000) * this.playbackRate;

    // Update current time
    this.currentTime += deltaSec;

    // Handle looping
    if (this.loopEnabled && this.loopEnd > this.loopStart) {
      if (this.currentTime >= this.loopEnd) {
        this.currentTime = this.loopStart + (this.currentTime - this.loopEnd);
      }
    }

    // Notify all listeners
    this.notifyListeners(deltaSec);

    // Schedule next frame
    this.rafId = requestAnimationFrame(this.tick);
  };

  private notifyListeners(deltaTime: number) {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTime, deltaTime);
      } catch (error) {
        console.error('Clock listener error:', error);
      }
    });
  }

  subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  dispose() {
    this.pause();
    this.listeners.clear();
    MasterClock.instance = null;
  }
}

export const masterClock = MasterClock.getInstance();
