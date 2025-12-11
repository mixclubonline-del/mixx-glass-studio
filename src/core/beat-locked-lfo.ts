/**
 * Beat-Locked LFO (Low-Frequency Oscillator)
 * 
 * Provides tempo-synchronized modulation patterns for audio processing.
 * All patterns are locked to the master clock/BPM system.
 * 
 * Flow Doctrine: Musical timing - all modulation syncs to the groove.
 */

/**
 * Get beat phase from the master clock system.
 * Falls back to time-based estimation if clock not available.
 */
function getBeatPhase(): number {
  // Try to get beat phase from window global (set by App.tsx clock system)
  if (typeof window !== 'undefined' && (window as any).__mixx_getBeatPhase) {
    return (window as any).__mixx_getBeatPhase();
  }
  
  // Fallback: Estimate from BPM if available
  const bpm = (typeof window !== 'undefined' && (window as any).__mixx_bpm) || 120;
  const beatDuration = 60 / bpm; // Duration of one beat in seconds
  const currentTime = (typeof window !== 'undefined' && (window as any).__mixx_currentTime) || 0;
  const isPlaying = (typeof window !== 'undefined' && (window as any).__mixx_isPlaying) || false;
  
  if (!isPlaying) return 0;
  
  // Calculate phase within current beat (0 to 1)
  return (currentTime % beatDuration) / beatDuration;
}

/**
 * Breathing pattern - smooth sine wave modulation locked to beat.
 * Creates a "breathing" effect that syncs to tempo.
 * 
 * @param phase - The current position in the beat (0 to 1)
 * @param amount - The depth of the modulation (0-1)
 * @returns A modulation factor around 1.0
 */
export const breathingPattern = (phase: number, amount: number): number => {
  // Use actual beat phase if provided, otherwise get from clock
  const actualPhase = phase !== undefined && phase !== null ? phase : getBeatPhase();
  
  // Sine wave: 0 at phase 0, peaks at 0.25 and 0.75, 0 at 0.5 and 1.0
  // This creates one full cycle per beat
  const modulation = Math.sin(actualPhase * Math.PI * 2);
  
  return 1.0 + modulation * amount;
};

/**
 * Warmth modulation - cosine wave with different phase offset.
 * Creates a "warming" effect that complements breathing pattern.
 * 
 * @param phase - The current position in the beat (0 to 1)
 * @param amount - The depth of the modulation (0-1)
 * @returns A modulation factor around 1.0
 */
export const warmthModulation = (phase: number, amount: number): number => {
  // Use actual beat phase if provided, otherwise get from clock
  const actualPhase = phase !== undefined && phase !== null ? phase : getBeatPhase();
  
  // Cosine wave: peaks at phase 0 and 1.0, 0 at 0.5
  // Offset by 90 degrees from breathing pattern
  const modulation = Math.cos(actualPhase * Math.PI * 2);
  
  return 1.0 + modulation * amount;
};

/**
 * Pulse pattern - sharp attack at beat start, decay over beat.
 * Creates a "pulsing" effect that emphasizes beat boundaries.
 * 
 * @param phase - The current position in the beat (0 to 1)
 * @param amount - The depth of the modulation (0-1)
 * @returns A modulation factor around 1.0
 */
export const pulsePattern = (phase: number, amount: number): number => {
  const actualPhase = phase !== undefined && phase !== null ? phase : getBeatPhase();
  
  // Exponential decay from beat start
  const decay = Math.exp(-actualPhase * 4); // Fast decay
  return 1.0 + decay * amount;
};

/**
 * Swing pattern - creates a swing/shuffle feel.
 * Emphasizes off-beats for groove.
 * 
 * @param phase - The current position in the beat (0 to 1)
 * @param amount - The depth of the modulation (0-1)
 * @returns A modulation factor around 1.0
 */
export const swingPattern = (phase: number, amount: number): number => {
  const actualPhase = phase !== undefined && phase !== null ? phase : getBeatPhase();
  
  // Emphasize off-beats (0.5 phase)
  const swing = Math.sin(actualPhase * Math.PI * 4) * 0.5 + 0.5;
  return 1.0 + (swing - 0.5) * amount;
};