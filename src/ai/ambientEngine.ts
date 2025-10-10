/**
 * Mixx Ambient Engine (MAE)
 * Mood-reactive lighting that breathes, pulses, or bursts based on energy level
 */

import { telemetry } from '@/lib/telemetry';

export type MoodState = 'calm' | 'focused' | 'energetic' | 'intense' | 'creative';
export type LightingMode = 'breathe' | 'pulse' | 'burst' | 'ripple' | 'static';

export interface AmbientState {
  mood: MoodState;
  energy: number; // 0-1
  lightingMode: LightingMode;
  primaryColor: string;
  secondaryColor: string;
  intensity: number; // 0-1
}

export interface MoodPacket {
  mood: MoodState;
  energy: number;
  dominantFrequencies: number[];
  timestamp: number;
}

class MixxAmbientEngine {
  private state: AmbientState = {
    mood: 'calm',
    energy: 0.3,
    lightingMode: 'breathe',
    primaryColor: '#A57CFF', // violet
    secondaryColor: '#56C8FF', // blue
    intensity: 0.5
  };

  private subscribers: Array<(state: AmbientState) => void> = [];
  private animationFrame: number | null = null;
  private lastUpdateTime: number = 0;
  private updateThrottle: number = 200; // Update every 200ms instead of every frame
  private moodHysteresis: number = 0.05; // Prevent bouncing at thresholds

  constructor() {
    this.startAmbientLoop();
  }

  /**
   * Subscribe to ambient state changes
   */
  subscribe(callback: (state: AmbientState) => void): () => void {
    this.subscribers.push(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Process audio data and update mood
   */
  processMoodPacket(packet: MoodPacket) {
    const oldMood = this.state.mood;
    const oldEnergy = this.state.energy;
    
    // Update energy
    this.state.energy = packet.energy;
    
    // Determine mood from energy with hysteresis to prevent threshold bouncing
    const energy = packet.energy;
    const hysteresis = this.moodHysteresis;
    
    // Use different thresholds when crossing up vs down to prevent oscillation
    if (this.state.mood === 'intense' && energy < 0.8 - hysteresis) {
      this.state.mood = 'energetic';
    } else if (this.state.mood !== 'intense' && energy > 0.8 + hysteresis) {
      this.state.mood = 'intense';
    } else if (this.state.mood === 'energetic' && energy < 0.6 - hysteresis) {
      this.state.mood = 'focused';
    } else if (this.state.mood !== 'energetic' && this.state.mood !== 'intense' && energy > 0.6 + hysteresis) {
      this.state.mood = 'energetic';
    } else if (this.state.mood === 'focused' && energy < 0.4 - hysteresis) {
      this.state.mood = 'creative';
    } else if (this.state.mood !== 'focused' && this.state.mood !== 'energetic' && this.state.mood !== 'intense' && energy > 0.4 + hysteresis) {
      this.state.mood = 'focused';
    } else if (this.state.mood === 'creative' && energy < 0.2 - hysteresis) {
      this.state.mood = 'calm';
    } else if (this.state.mood === 'calm' && energy > 0.2 + hysteresis) {
      this.state.mood = 'creative';
    }
    
    // Set lighting based on mood
    switch (this.state.mood) {
      case 'intense':
        this.state.lightingMode = 'burst';
        this.state.primaryColor = '#FF4D8D';
        this.state.secondaryColor = '#FF67C7';
        break;
      case 'energetic':
        this.state.lightingMode = 'pulse';
        this.state.primaryColor = '#FF67C7';
        this.state.secondaryColor = '#A57CFF';
        break;
      case 'focused':
        this.state.lightingMode = 'ripple';
        this.state.primaryColor = '#A57CFF';
        this.state.secondaryColor = '#56C8FF';
        break;
      case 'creative':
        this.state.lightingMode = 'breathe';
        this.state.primaryColor = '#56C8FF';
        this.state.secondaryColor = '#EAF2FF';
        break;
      case 'calm':
        this.state.lightingMode = 'breathe';
        this.state.primaryColor = '#EAF2FF';
        this.state.secondaryColor = '#56C8FF';
        break;
    }

    // Log mood changes
    if (oldMood !== this.state.mood) {
      telemetry.log({
        source: 'MAE',
        category: 'mood',
        action: `Mood shift: ${oldMood} → ${this.state.mood}`,
        data: { energy: packet.energy.toFixed(2) }
      });
    }

    // Only notify subscribers if there's a meaningful change
    if (oldMood !== this.state.mood || Math.abs(oldEnergy - this.state.energy) > 0.05) {
      this.notifySubscribers();
    }
  }

  /**
   * Get current ambient state
   */
  getState(): AmbientState {
    return { ...this.state };
  }

  /**
   * Generate lighting directive for UI
   */
  getLightingDirective() {
    return {
      mode: this.state.lightingMode,
      colors: [this.state.primaryColor, this.state.secondaryColor],
      intensity: this.state.intensity,
      speed: this.state.energy * 2 + 0.5 // 0.5 - 2.5s
    };
  }

  /**
   * Ambient loop - simulates continuous mood evolution
   * Throttled to reduce performance impact
   */
  private startAmbientLoop() {
    const loop = () => {
      const now = Date.now();
      
      // Throttle updates to prevent excessive re-renders
      if (now - this.lastUpdateTime < this.updateThrottle) {
        this.animationFrame = requestAnimationFrame(loop);
        return;
      }
      
      this.lastUpdateTime = now;
      
      // Simulate natural energy fluctuation with smoother, less noisy variation
      const time = now / 1000;
      const baseEnergy = Math.sin(time * 0.05) * 0.25 + 0.5; // Very slow wave 0.25-0.75
      const noise = Math.random() * 0.02; // Minimal random variation
      
      this.processMoodPacket({
        mood: this.state.mood,
        energy: Math.max(0, Math.min(1, baseEnergy + noise)),
        dominantFrequencies: [],
        timestamp: now
      });

      this.animationFrame = requestAnimationFrame(loop);
    };

    loop();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.subscribers = [];
  }
}

// Singleton instance
export const ambientEngine = new MixxAmbientEngine();
