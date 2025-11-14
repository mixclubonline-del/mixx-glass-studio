/**
 * Harmony Model
 * 
 * Layer 6.4 of Flow Pulse → ALS Thermal Sync Engine.
 * Harmony = harmonic boost from tonal intensity.
 */

/**
 * Compute harmony from harmonic boost.
 * 
 * @param harmonicBoost - Harmonic boost value (0-100)
 * @returns Harmony score (0-100)
 */
export function computeHarmony(harmonicBoost: number): number {
  return Math.min(100, Math.max(0, Math.round(harmonicBoost)));
}

/**
 * Compute harmony with key consideration.
 * 
 * @param harmonicBoost - Harmonic boost value (0-100)
 * @param key - Musical key (e.g., "C", "F#")
 * @returns Harmony score (0-100) with key-based adjustment
 */
export function computeHarmonyWithKey(
  harmonicBoost: number,
  key: string | null
): number {
  let baseHarmony = computeHarmony(harmonicBoost);
  
  // Boost harmony if key is detected (indicates tonal clarity)
  if (key && key !== 'C') {
    baseHarmony = Math.min(100, baseHarmony + 5);
  }
  
  return baseHarmony;
}

/**
 * Compute harmony with frequency weighting.
 * 
 * @param harmonicBoost - Harmonic boost value (0-100)
 * @param dominantFreq - Dominant frequency in Hz
 * @returns Harmony score (0-100) with frequency weighting
 */
export function computeHarmonyWithFrequency(
  harmonicBoost: number,
  dominantFreq: number
): number {
  let baseHarmony = computeHarmony(harmonicBoost);
  
  // Boost harmony if dominant frequency is in vocal range (200-2000 Hz)
  if (dominantFreq >= 200 && dominantFreq <= 2000) {
    baseHarmony = Math.min(100, baseHarmony + 10);
  }
  
  return baseHarmony;
}

