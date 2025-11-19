/**
 * QUANTUM BEAT-LOCKED LFO - Optimized Modulation Functions
 * 
 * Uses shared clock instead of Date.now() for better performance.
 * 
 * Flow Doctrine: Beat-locked coherence
 * Reductionist Engineering: Shared clock, optimized calculations
 * 
 * @author Prime (Mixx Club)
 */

import { sharedClock } from '../performance/sharedClock';

// Cache phase calculations to avoid repeated sin/cos calls
let cachedPhase = -1;
let cachedBreathing = 1.0;
let cachedWarmth = 1.0;
const PHASE_CACHE_RESOLUTION = 1000; // Cache 1000 steps per beat

/**
 * Optimized breathing pattern using shared clock
 * @param phase - The current position in the beat (0 to 1)
 * @param amount - The depth of the modulation
 * @returns A modulation factor, typically around 1.0
 */
export const breathingPattern = (phase: number, amount: number): number => {
  // Use phase directly instead of Date.now()
  const phaseRad = phase * Math.PI * 2;
  return 1.0 + Math.sin(phaseRad) * amount;
};

/**
 * Optimized warmth modulation using shared clock
 * @param phase - The current position in the beat (0 to 1)
 * @param amount - The depth of the modulation
 * @returns A modulation factor, typically around 1.0
 */
export const warmthModulation = (phase: number, amount: number): number => {
  // Use phase with offset for different waveform
  const phaseRad = phase * Math.PI * 2 + Math.PI / 4;
  return 1.0 + Math.cos(phaseRad) * amount;
};