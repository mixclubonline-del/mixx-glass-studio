/**
 * Pressure Model
 * 
 * Layer 6.3 of Flow Pulse → ALS Thermal Sync Engine.
 * Pressure = psychoacoustic tension.
 * 
 * Measures dynamic density and intensity.
 */

/**
 * Compute pressure from energy profile.
 * 
 * @param energy - Energy profile array (from computeEnergyProfile)
 * @returns Pressure score (0-100)
 */
export function computePressure(energy: number[]): number {
  if (energy.length === 0) {
    return 0;
  }
  
  // Average energy level
  const avg = energy.reduce((a, b) => a + b, 0) / energy.length;
  
  // Scale to 0-100 range (energy is typically 0-0.5, so multiply by 180 for good range)
  const scaled = Math.min(100, Math.round(avg * 180));
  
  return scaled;
}

/**
 * Compute pressure with peak consideration.
 * 
 * @param energy - Energy profile array
 * @returns Pressure score (0-100) with peak emphasis
 */
export function computePressureWithPeaks(energy: number[]): number {
  if (energy.length === 0) {
    return 0;
  }
  
  const avg = energy.reduce((a, b) => a + b, 0) / energy.length;
  const max = Math.max(...energy);
  
  // Weighted combination: average (70%) + peak (30%)
  const combined = (avg * 0.7) + (max * 0.3);
  
  const scaled = Math.min(100, Math.round(combined * 180));
  
  return scaled;
}

/**
 * Compute pressure with variance consideration (measures dynamic range).
 * 
 * @param energy - Energy profile array
 * @returns Pressure score (0-100) with variance emphasis
 */
export function computePressureWithVariance(energy: number[]): number {
  if (energy.length === 0) {
    return 0;
  }
  
  const avg = energy.reduce((a, b) => a + b, 0) / energy.length;
  
  // Compute variance
  let variance = 0;
  for (let i = 0; i < energy.length; i++) {
    variance += Math.pow(energy[i] - avg, 2);
  }
  variance = variance / energy.length;
  
  // High variance = more dynamic = higher pressure
  const varianceBoost = Math.min(30, variance * 100);
  
  const basePressure = computePressure(energy);
  
  return Math.min(100, Math.max(0, basePressure + varianceBoost));
}

