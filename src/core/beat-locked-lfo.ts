/**
 * Beat-Locked LFO - Movement Doctrine
 * Provides musical timing alignment for modulation
 */

export interface BeatLockedLFOConfig {
  rate: number;      // Rate in Hz or bars
  depth: number;     // Modulation depth 0-1
  waveform: 'sine' | 'triangle' | 'square' | 'saw';
  sync: boolean;     // Beat-sync enabled
}

/**
 * Breathing pattern for sub-harmonic modulation
 * Creates natural, musical movement in the low end
 */
export function breathingPattern(beatPhase: number, rate: number = 0.25): number {
  // Slow breathing at musical intervals (every 4 beats by default)
  const breath = Math.sin(beatPhase * Math.PI * 2 * rate);
  // Apply smooth curve for natural feel
  return (breath + 1) * 0.5; // 0 to 1 range
}

/**
 * Warmth modulation for harmonic enhancement
 * Adds subtle movement to harmonics for organic feel
 */
export function warmthModulation(beatPhase: number, depth: number = 0.2): number {
  // Gentle triangle wave for smooth harmonic modulation
  const phase = (beatPhase * 2) % 1;
  const triangle = phase < 0.5 ? phase * 2 : 2 - (phase * 2);
  return 1 + (triangle - 0.5) * depth;
}

/**
 * Create beat-locked LFO
 */
export function createBeatLockedLFO(config: BeatLockedLFOConfig) {
  return {
    getValue(beatPhase: number): number {
      const phase = config.sync ? beatPhase * config.rate : Date.now() * 0.001 * config.rate;
      
      switch (config.waveform) {
        case 'sine':
          return Math.sin(phase * Math.PI * 2) * config.depth;
        case 'triangle': {
          const p = (phase % 1);
          return (p < 0.5 ? p * 2 : 2 - (p * 2)) * config.depth;
        }
        case 'square':
          return ((phase % 1) < 0.5 ? 1 : -1) * config.depth;
        case 'saw':
          return ((phase % 1) * 2 - 1) * config.depth;
        default:
          return 0;
      }
    }
  };
}
