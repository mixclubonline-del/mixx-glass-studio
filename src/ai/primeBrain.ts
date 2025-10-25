/**
 * Prime Brain Stem (PBS)
 * Central AI router that merges telemetry from knobs, sliders, and scene changes
 * Now also serves as the Master Clock for timing synchronization
 */

import { telemetry } from '@/lib/telemetry';
import { ambientEngine, type MoodPacket } from './ambientEngine';
import { predictionEngine } from './predictionEngine';
import { artistDNA } from './artistDNA';

export interface ControlEvent {
  type: 'knob' | 'slider' | 'button' | 'fader';
  controlId: string;
  value: number;
  previousValue?: number;
  timestamp: number;
}

export interface SceneChange {
  sceneId: string;
  sceneName: string;
  timestamp: number;
}

export interface AudioMetrics {
  rms: number;
  peak: number;
  frequencies: Float32Array;
  tempo: number;
}

export type ClockListener = (time: number, deltaTime: number) => void;

class PrimeBrainStem {
  private controlHistory: ControlEvent[] = [];
  private audioBuffer: AudioMetrics[] = [];
  private isActive = true;

  // Master Clock functionality
  private isRunning = false;
  private currentTime = 0;
  private currentTimeSamples = 0;
  private sampleRate = 48000;
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private playbackRate = 1.0;
  private loopEnabled = false;
  private loopStart = 0;
  private loopEnd = 0;
  private listeners: Set<ClockListener> = new Set();

  constructor() {
    telemetry.log({
      source: 'PBS',
      category: 'system',
      action: 'Prime Brain initialized'
    });
  }

  /**
   * Process control input (knob turn, slider move, etc.)
   */
  processControlEvent(event: ControlEvent) {
    this.controlHistory.push(event);
    
    // Keep only last 100 events
    if (this.controlHistory.length > 100) {
      this.controlHistory.shift();
    }

    telemetry.log({
      source: 'PBS',
      category: 'control',
      action: `${event.type} ${event.controlId}`,
      data: { value: event.value.toFixed(2) }
    });

    // Analyze control patterns and update Artist DNA
    this.analyzeControlPattern(event);
    
    // Calculate energy from control activity
    const energy = this.calculateEnergyFromControls();
    
    // Send mood packet to Ambient Engine
    const moodPacket: MoodPacket = {
      mood: 'focused', // Will be determined by MAE
      energy,
      dominantFrequencies: [],
      timestamp: Date.now()
    };
    
    ambientEngine.processMoodPacket(moodPacket);
    
    // Feed to prediction engine
    predictionEngine.processControlInput(event);
  }

  /**
   * Process audio metrics from the engine
   */
  processAudioMetrics(metrics: AudioMetrics) {
    this.audioBuffer.push(metrics);
    
    // Keep only last 10 samples
    if (this.audioBuffer.length > 10) {
      this.audioBuffer.shift();
    }

    // Calculate average energy
    const avgRMS = this.audioBuffer.reduce((sum, m) => sum + m.rms, 0) / this.audioBuffer.length;
    const avgPeak = this.audioBuffer.reduce((sum, m) => sum + m.peak, 0) / this.audioBuffer.length;
    
    const energy = Math.min(1, (avgRMS + avgPeak) / 2);

    // Send to Ambient Engine
    const moodPacket: MoodPacket = {
      mood: 'focused',
      energy,
      dominantFrequencies: Array.from(metrics.frequencies.slice(0, 10)),
      timestamp: Date.now()
    };
    
    ambientEngine.processMoodPacket(moodPacket);
    
    // Feed to prediction engine
    predictionEngine.processAudioData(metrics);
  }

  /**
   * Process scene/view changes
   */
  processSceneChange(scene: SceneChange) {
    telemetry.log({
      source: 'PBS',
      category: 'scene',
      action: `Scene changed to ${scene.sceneName}`,
      data: { sceneId: scene.sceneId }
    });

    // Update Artist DNA with scene preference
    artistDNA.recordScenePreference(scene.sceneId);
  }

  /**
   * Analyze control patterns for Artist DNA
   */
  private analyzeControlPattern(event: ControlEvent) {
    // Look at recent history to detect user behavior
    const recentControls = this.controlHistory.slice(-5);
    
    // Detect rapid adjustments (tweaking)
    const timeDiffs = recentControls.slice(1).map((e, i) => 
      e.timestamp - recentControls[i].timestamp
    );
    
    const avgTimeDiff = timeDiffs.reduce((sum, t) => sum + t, 0) / timeDiffs.length;
    
    if (avgTimeDiff < 200) {
      telemetry.log({
        source: 'PBS',
        category: 'pattern',
        action: 'Rapid adjustment detected',
        data: { avgInterval: avgTimeDiff.toFixed(0) + 'ms' }
      });
    }

    // Feed to Artist DNA
    artistDNA.recordControlPreference(event.type, event.controlId, event.value);
  }

  /**
   * Calculate energy level from control activity
   */
  private calculateEnergyFromControls(): number {
    if (this.controlHistory.length < 2) return 0.3;
    
    // Look at last 10 events in last 5 seconds
    const now = Date.now();
    const recentEvents = this.controlHistory.filter(e => now - e.timestamp < 5000).slice(-10);
    
    if (recentEvents.length === 0) return 0.3;
    
    // More activity = higher energy
    const activityScore = Math.min(1, recentEvents.length / 10);
    
    // Larger value changes = higher energy
    const valueChanges = recentEvents
      .filter(e => e.previousValue !== undefined)
      .map(e => Math.abs(e.value - e.previousValue!));
    
    const avgChange = valueChanges.length > 0
      ? valueChanges.reduce((sum, v) => sum + v, 0) / valueChanges.length
      : 0;
    
    const changeScore = Math.min(1, avgChange * 2);
    
    // Combine scores
    return (activityScore * 0.6 + changeScore * 0.4);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      active: this.isActive,
      controlHistory: this.controlHistory.length,
      audioBuffer: this.audioBuffer.length,
      ambientState: ambientEngine.getState(),
      predictions: predictionEngine.getUpcomingEvents(),
      artistProfile: artistDNA.getProfile(),
      timing: {
        isRunning: this.isRunning,
        currentTime: this.currentTime,
        loopEnabled: this.loopEnabled
      }
    };
  }

  // ============= MASTER CLOCK FUNCTIONALITY =============

  /**
   * Start playback from a specific time
   */
  start(fromTime?: number) {
    if (fromTime !== undefined) {
      this.currentTime = fromTime;
      this.currentTimeSamples = Math.round(fromTime * this.sampleRate);
    }
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    telemetry.log({
      source: 'PBS',
      category: 'transport',
      action: 'Play started',
      data: { time: this.currentTime.toFixed(2) }
    });

    this.tick();
  }

  /**
   * Pause playback
   */
  pause() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    telemetry.log({
      source: 'PBS',
      category: 'transport',
      action: 'Paused',
      data: { time: this.currentTime.toFixed(2) }
    });
  }

  /**
   * Stop playback and reset to zero
   */
  stop() {
    this.pause();
    this.currentTime = 0;

    telemetry.log({
      source: 'PBS',
      category: 'transport',
      action: 'Stopped'
    });

    // Notify listeners of reset
    this.listeners.forEach(listener => listener(0, 0));
  }

  /**
   * Seek to a specific time
   */
  seek(time: number) {
    this.currentTime = time;
    this.currentTimeSamples = Math.round(time * this.sampleRate);

    telemetry.log({
      source: 'PBS',
      category: 'transport',
      action: 'Seek',
      data: { time: time.toFixed(2) }
    });

    // Notify listeners immediately
    this.listeners.forEach(listener => listener(time, 0));
  }

  /**
   * Set loop range
   */
  setLoop(enabled: boolean, start: number = 0, end: number = 0) {
    this.loopEnabled = enabled;
    this.loopStart = start;
    this.loopEnd = end;

    telemetry.log({
      source: 'PBS',
      category: 'transport',
      action: enabled ? 'Loop enabled' : 'Loop disabled',
      data: { start: start.toFixed(2), end: end.toFixed(2) }
    });
  }

  /**
   * Subscribe to time updates
   */
  subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Check if clock is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Main tick loop - runs at 60fps
   */
  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Update time with playback rate (sample-accurate)
    const deltaSamples = Math.round(deltaTime * this.sampleRate * this.playbackRate);
    this.currentTimeSamples += deltaSamples;
    this.currentTime = this.currentTimeSamples / this.sampleRate;

    // Handle looping
    if (this.loopEnabled && this.loopEnd > this.loopStart) {
      if (this.currentTime >= this.loopEnd) {
        this.currentTime = this.loopStart;
        this.currentTimeSamples = Math.round(this.loopStart * this.sampleRate);
        
        telemetry.log({
          source: 'PBS',
          category: 'transport',
          action: 'Loop restart',
          data: { time: this.currentTime.toFixed(2) }
        });
      }
    }

    // Process audio metrics if available (this happens automatically during playback)
    if (this.audioBuffer.length > 0) {
      const latestMetrics = this.audioBuffer[this.audioBuffer.length - 1];
      // Audio metrics already processed in processAudioMetrics, just log context
      const avgEnergy = this.audioBuffer.reduce((sum, m) => sum + m.rms, 0) / this.audioBuffer.length;
      
      // Could use this for intelligent playback adjustments in the future
      if (avgEnergy > 0.8 && Math.random() > 0.99) {
        telemetry.log({
          source: 'PBS',
          category: 'audio',
          action: 'High energy detected',
          data: { energy: avgEnergy.toFixed(2) }
        });
      }
    }

    // Notify all subscribers with current time and delta
    this.listeners.forEach(listener => listener(this.currentTime, deltaTime));

    // Schedule next frame
    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Dispose and cleanup
   */
  dispose() {
    this.pause();
    this.listeners.clear();
    this.controlHistory = [];
    this.audioBuffer = [];
  }
}

// Singleton instance
export const primeBrain = new PrimeBrainStem();
