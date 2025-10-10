/**
 * Prime Brain Stem (PBS)
 * Central AI router that merges telemetry from knobs, sliders, and scene changes
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

class PrimeBrainStem {
  private controlHistory: ControlEvent[] = [];
  private audioBuffer: AudioMetrics[] = [];
  private isActive = true;

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
      artistProfile: artistDNA.getProfile()
    };
  }
}

// Singleton instance
export const primeBrain = new PrimeBrainStem();
