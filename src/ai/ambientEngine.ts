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
    
    // Update energy
    this.state.energy = packet.energy;
    
    // Determine mood from energy and frequencies
    if (packet.energy > 0.8) {
      this.state.mood = 'intense';
      this.state.lightingMode = 'burst';
      this.state.primaryColor = '#FF4D8D'; // pink
      this.state.secondaryColor = '#FF67C7';
    } else if (packet.energy > 0.6) {
      this.state.mood = 'energetic';
      this.state.lightingMode = 'pulse';
      this.state.primaryColor = '#FF67C7';
      this.state.secondaryColor = '#A57CFF'; // violet
    } else if (packet.energy > 0.4) {
      this.state.mood = 'focused';
      this.state.lightingMode = 'ripple';
      this.state.primaryColor = '#A57CFF'; // violet
      this.state.secondaryColor = '#56C8FF'; // blue
    } else if (packet.energy > 0.2) {
      this.state.mood = 'creative';
      this.state.lightingMode = 'breathe';
      this.state.primaryColor = '#56C8FF'; // blue
      this.state.secondaryColor = '#EAF2FF';
    } else {
      this.state.mood = 'calm';
      this.state.lightingMode = 'breathe';
      this.state.primaryColor = '#EAF2FF';
      this.state.secondaryColor = '#56C8FF'; // blue
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

    this.notifySubscribers();
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
   */
  private startAmbientLoop() {
    const loop = () => {
      // Simulate natural energy fluctuation
      const time = Date.now() / 1000;
      const baseEnergy = Math.sin(time * 0.1) * 0.2 + 0.5; // Slow wave 0.3-0.7
      const noise = Math.random() * 0.1; // Small random variation
      
      this.processMoodPacket({
        mood: this.state.mood,
        energy: Math.max(0, Math.min(1, baseEnergy + noise)),
        dominantFrequencies: [],
        timestamp: Date.now()
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
