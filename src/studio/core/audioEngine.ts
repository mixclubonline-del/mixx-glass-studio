/**
 * Studio DAW Engine
 * Enhanced audio playback engine with transport synchronization and waveform visualization
 * 
 * Features:
 * - Multi-track playback with precise scheduling
 * - Transport synchronization (play, pause, stop, loop)
 * - Real-time playback position tracking
 * - Waveform progress visualization support
 * - Comprehensive logging for debugging
 * - Future-ready for AI-assisted mixing and plugin automation
 */

import { AudioEngine } from '@/audio/AudioEngine';

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  currentTime: number;
  duration: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
}

export interface TransportPosition {
  seconds: number;
  bars: number;
  beats: number;
  ticks: number;
  samples: number;
}

export type PlaybackEventType = 'play' | 'pause' | 'stop' | 'seek' | 'loop' | 'timeUpdate';

export interface PlaybackEvent {
  type: PlaybackEventType;
  timestamp: number;
  position: TransportPosition;
  state: PlaybackState;
}

export type PlaybackEventListener = (event: PlaybackEvent) => void;

/**
 * StudioEngine - Main DAW playback engine
 * Wraps AudioEngine with enhanced state management and event system
 */
export class StudioEngine {
  private audioEngine: AudioEngine;
  private eventListeners: Map<PlaybackEventType, Set<PlaybackEventListener>>;
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000 / 60; // 60 FPS for smooth waveform updates
  
  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.eventListeners = new Map();
    
    console.log('🎵 StudioEngine initialized');
    console.log('  - Multi-track playback: ready');
    console.log('  - Transport sync: enabled');
    console.log('  - Waveform tracking: active');
  }
  
  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    const currentTime = this.audioEngine.getCurrentTime();
    return {
      isPlaying: this.isPlaying(),
      isPaused: !this.isPlaying() && currentTime > 0,
      isStopped: !this.isPlaying() && currentTime === 0,
      currentTime,
      duration: this.audioEngine.getDuration(),
      loopEnabled: this.audioEngine.loopEnabled,
      loopStart: this.audioEngine.loopStart,
      loopEnd: this.audioEngine.loopEnd,
    };
  }
  
  /**
   * Get detailed transport position
   */
  getPosition(): TransportPosition {
    const currentTime = this.audioEngine.getCurrentTime();
    const barPosition = this.audioEngine.getBarPosition();
    
    return {
      seconds: currentTime,
      bars: barPosition.bar,
      beats: barPosition.beat,
      ticks: barPosition.tick,
      samples: Math.floor(currentTime * 48000), // Assuming 48kHz sample rate
    };
  }
  
  /**
   * Start playback
   */
  play(fromTime?: number): void {
    const startTime = fromTime ?? this.audioEngine.getCurrentTime();
    
    console.log(`▶️  PLAY: Starting playback at ${startTime.toFixed(3)}s`);
    console.log(`  - Track count: ${this.audioEngine.getTracks().length}`);
    console.log(`  - Loop: ${this.audioEngine.loopEnabled ? 'enabled' : 'disabled'}`);
    
    this.audioEngine.play(startTime);
    this.startAnimationLoop();
    
    this.emitEvent({
      type: 'play',
      timestamp: Date.now(),
      position: this.getPosition(),
      state: this.getState(),
    });
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    const currentTime = this.audioEngine.getCurrentTime();
    
    console.log(`⏸️  PAUSE: Pausing playback at ${currentTime.toFixed(3)}s`);
    
    this.audioEngine.pause();
    this.stopAnimationLoop();
    
    this.emitEvent({
      type: 'pause',
      timestamp: Date.now(),
      position: this.getPosition(),
      state: this.getState(),
    });
  }
  
  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    console.log('⏹️  STOP: Stopping playback and resetting position');
    
    this.audioEngine.stop();
    this.stopAnimationLoop();
    
    this.emitEvent({
      type: 'stop',
      timestamp: Date.now(),
      position: this.getPosition(),
      state: this.getState(),
    });
  }
  
  /**
   * Seek to specific time
   */
  seek(time: number): void {
    console.log(`⏩ SEEK: Jumping to ${time.toFixed(3)}s`);
    
    this.audioEngine.seek(time);
    
    this.emitEvent({
      type: 'seek',
      timestamp: Date.now(),
      position: this.getPosition(),
      state: this.getState(),
    });
  }
  
  /**
   * Toggle loop mode
   */
  toggleLoop(): void {
    this.audioEngine.loopEnabled = !this.audioEngine.loopEnabled;
    
    console.log(`🔁 LOOP: ${this.audioEngine.loopEnabled ? 'Enabled' : 'Disabled'}`);
    if (this.audioEngine.loopEnabled) {
      console.log(`  - Start: ${this.audioEngine.loopStart.toFixed(3)}s`);
      console.log(`  - End: ${this.audioEngine.loopEnd.toFixed(3)}s`);
    }
    
    this.emitEvent({
      type: 'loop',
      timestamp: Date.now(),
      position: this.getPosition(),
      state: this.getState(),
    });
  }
  
  /**
   * Set loop range
   */
  setLoopRange(start: number, end: number): void {
    this.audioEngine.loopStart = start;
    this.audioEngine.loopEnd = end;
    
    console.log(`🔁 LOOP RANGE: ${start.toFixed(3)}s - ${end.toFixed(3)}s`);
    
    this.emitEvent({
      type: 'loop',
      timestamp: Date.now(),
      position: this.getPosition(),
      state: this.getState(),
    });
  }
  
  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.audioEngine.getCurrentTime() > 0 && 
           this.audioEngine['isPlaying'] === true;
  }
  
  /**
   * Get current time in seconds
   */
  getCurrentTime(): number {
    return this.audioEngine.getCurrentTime();
  }
  
  /**
   * Get total duration
   */
  getDuration(): number {
    return this.audioEngine.getDuration();
  }
  
  /**
   * Get BPM
   */
  getBPM(): number {
    return this.audioEngine.bpm;
  }
  
  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    console.log(`🎼 BPM: Changed to ${bpm}`);
    this.audioEngine.bpm = bpm;
  }
  
  /**
   * Get underlying audio engine for direct access
   */
  getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }
  
  /**
   * Add event listener for playback events
   */
  addEventListener(type: PlaybackEventType, listener: PlaybackEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(type: PlaybackEventType, listener: PlaybackEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  
  /**
   * Emit playback event to all listeners
   */
  private emitEvent(event: PlaybackEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in playback event listener (${event.type}):`, error);
        }
      });
    }
  }
  
  /**
   * Start animation loop for smooth playback position updates
   * Uses requestAnimationFrame for 60fps waveform synchronization
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }
    
    this.lastUpdateTime = performance.now();
    
    const updateLoop = (timestamp: number) => {
      // Throttle updates to target FPS
      const elapsed = timestamp - this.lastUpdateTime;
      
      if (elapsed >= this.updateInterval) {
        this.lastUpdateTime = timestamp;
        
        // Emit time update event for UI synchronization
        this.emitEvent({
          type: 'timeUpdate',
          timestamp: Date.now(),
          position: this.getPosition(),
          state: this.getState(),
        });
      }
      
      // Continue loop if still playing
      if (this.isPlaying()) {
        this.animationFrameId = requestAnimationFrame(updateLoop);
      } else {
        this.animationFrameId = null;
      }
    };
    
    this.animationFrameId = requestAnimationFrame(updateLoop);
  }
  
  /**
   * Stop animation loop
   */
  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    console.log('🔌 StudioEngine disposed');
    this.stopAnimationLoop();
    this.eventListeners.clear();
  }
}

/**
 * Create a new StudioEngine instance
 */
export function createStudioEngine(audioEngine: AudioEngine): StudioEngine {
  return new StudioEngine(audioEngine);
}
