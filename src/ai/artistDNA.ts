/**
 * Artist DNA System
 * Remembers each user's color palette and emotional bias
 */

import { telemetry } from '@/lib/telemetry';

export interface ArtistProfile {
  userId: string;
  colorPalette: string[];
  emotionalBias: {
    calm: number;
    focused: number;
    energetic: number;
    intense: number;
    creative: number;
  };
  controlPreferences: Map<string, number>; // control ID -> preferred value
  scenePreferences: Map<string, number>; // scene ID -> usage count
  lastActive: number;
}

class ArtistDNASystem {
  private profile: ArtistProfile;
  private storageKey = 'mixx_artist_dna';

  constructor() {
    this.profile = this.loadProfile() || this.createDefaultProfile();
    
    telemetry.log({
      source: 'DNA',
      category: 'system',
      action: 'Artist DNA initialized',
      data: { userId: this.profile.userId }
    });
  }

  /**
   * Create default profile
   */
  private createDefaultProfile(): ArtistProfile {
    return {
      userId: `artist_${Date.now()}`,
      colorPalette: ['#A57CFF', '#56C8FF', '#FF67C7', '#FF4D8D', '#EAF2FF'],
      emotionalBias: {
        calm: 0.2,
        focused: 0.2,
        energetic: 0.2,
        intense: 0.2,
        creative: 0.2
      },
      controlPreferences: new Map(),
      scenePreferences: new Map(),
      lastActive: Date.now()
    };
  }

  /**
   * Record control preference
   */
  recordControlPreference(type: string, controlId: string, value: number) {
    const key = `${type}_${controlId}`;
    const existing = this.profile.controlPreferences.get(key) || 0;
    
    // Exponential moving average
    const alpha = 0.3;
    const newValue = alpha * value + (1 - alpha) * existing;
    
    this.profile.controlPreferences.set(key, newValue);
    this.saveProfile();
  }

  /**
   * Record scene preference
   */
  recordScenePreference(sceneId: string) {
    const count = this.profile.scenePreferences.get(sceneId) || 0;
    this.profile.scenePreferences.set(sceneId, count + 1);
    this.saveProfile();

    telemetry.log({
      source: 'DNA',
      category: 'preference',
      action: `Scene preference: ${sceneId}`,
      data: { count: count + 1 }
    });
  }

  /**
   * Update emotional bias based on mood time
   */
  updateEmotionalBias(mood: keyof ArtistProfile['emotionalBias'], duration: number) {
    const total = Object.values(this.profile.emotionalBias).reduce((sum, v) => sum + v, 0);
    const weight = duration / 1000; // seconds to weight
    
    // Increase this mood's bias
    this.profile.emotionalBias[mood] += weight;
    
    // Normalize to sum to 1
    const newTotal = Object.values(this.profile.emotionalBias).reduce((sum, v) => sum + v, 0);
    Object.keys(this.profile.emotionalBias).forEach(key => {
      this.profile.emotionalBias[key as keyof ArtistProfile['emotionalBias']] /= newTotal;
    });

    this.saveProfile();
  }

  /**
   * Add color to palette
   */
  addColorToProfile(color: string) {
    if (!this.profile.colorPalette.includes(color)) {
      this.profile.colorPalette.push(color);
      
      // Keep only last 10 colors
      if (this.profile.colorPalette.length > 10) {
        this.profile.colorPalette.shift();
      }
      
      this.saveProfile();
      
      telemetry.log({
        source: 'DNA',
        category: 'palette',
        action: 'Color added',
        data: { color }
      });
    }
  }

  /**
   * Get recommended color based on current mood
   */
  getRecommendedColor(mood: keyof ArtistProfile['emotionalBias']): string {
    // Return color from palette that matches mood
    const moodColors = {
      calm: ['#EAF2FF', '#56C8FF'],
      focused: ['#56C8FF', '#A57CFF'],
      energetic: ['#A57CFF', '#FF67C7'],
      intense: ['#FF4D8D', '#FF67C7'],
      creative: ['#A57CFF', '#FF67C7']
    };

    const colors = moodColors[mood] || moodColors.focused;
    return colors[0];
  }

  /**
   * Get profile
   */
  getProfile(): ArtistProfile {
    return { ...this.profile };
  }

  /**
   * Save profile to localStorage
   */
  private saveProfile() {
    this.profile.lastActive = Date.now();
    
    const serialized = {
      ...this.profile,
      controlPreferences: Array.from(this.profile.controlPreferences.entries()),
      scenePreferences: Array.from(this.profile.scenePreferences.entries())
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(serialized));
  }

  /**
   * Load profile from localStorage
   */
  private loadProfile(): ArtistProfile | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        controlPreferences: new Map(parsed.controlPreferences),
        scenePreferences: new Map(parsed.scenePreferences)
      };
    } catch (e) {
      console.error('Failed to load Artist DNA profile:', e);
      return null;
    }
  }
}

// Singleton instance
export const artistDNA = new ArtistDNASystem();
