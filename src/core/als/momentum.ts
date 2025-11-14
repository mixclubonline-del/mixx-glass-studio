/**
 * Momentum Model
 * 
 * Layer 6.2 of Flow Pulse → ALS Thermal Sync Engine.
 * Momentum = rhythm intensity.
 * 
 * Combines BPM and transient count to measure rhythmic energy.
 */

/**
 * Compute momentum from BPM and transient count.
 * 
 * @param bpm - Beats per minute (or null if not detected)
 * @param transientCount - Number of transients detected
 * @returns Momentum score (0-100)
 */
export function computeMomentum(
  bpm: number | null,
  transientCount: number
): number {
  // Normalize transient count (assume ~10 transients per second for high-energy track)
  const t = transientCount / 10;
  
  // Use BPM if available, otherwise default to 120
  const effectiveBPM = bpm || 120;
  
  // Weighted combination: BPM (40%) + Transients (60%)
  const score = (effectiveBPM * 0.4) + (t * 2);
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute momentum with energy profile consideration.
 * 
 * @param bpm - Beats per minute
 * @param transientCount - Number of transients
 * @param avgEnergy - Average energy level (0-1)
 * @returns Momentum score (0-100)
 */
export function computeMomentumWithEnergy(
  bpm: number | null,
  transientCount: number,
  avgEnergy: number
): number {
  const baseMomentum = computeMomentum(bpm, transientCount);
  
  // Boost momentum if energy is high
  const energyBoost = avgEnergy * 20;
  
  return Math.min(100, Math.max(0, Math.round(baseMomentum + energyBoost)));
}

