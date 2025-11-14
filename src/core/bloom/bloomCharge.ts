/**
 * Dynamic Bloom Charge
 * 
 * Part D of Full Flow Physiology Expansion Pack.
 * Bloom opens with different moods based on Flow state.
 * 
 * Bloom becomes *alive* - how it opens depends on the internal physiology of Flow.
 */

import type { ThermalState } from '../als/thermalMap';

/**
 * Compute Bloom charge from Flow % and temperature.
 * 
 * Bloom charge determines:
 * - Animation amplitude
 * - Glow intensity
 * - Opening behavior
 * 
 * @param flow - Flow % (0-100)
 * @param temp - Thermal state
 * @returns Bloom charge (0-1)
 */
export function bloomChargeFromFlow(
  flow: number,
  temp: ThermalState | string
): number {
  const base = flow / 100;
  
  const tempBoost: Record<string, number> = {
    cold: 0.1,
    warming: 0.2,
    warm: 0.3,
    hot: 0.45,
    blazing: 0.6,
  };
  
  const boost = tempBoost[temp] || 0.1;
  
  return Math.min(1, Math.max(0, base + boost));
}

/**
 * Get Bloom scale from charge.
 * 
 * @param charge - Bloom charge (0-1)
 * @returns Scale multiplier (0.85-1.1)
 */
export function getBloomScale(charge: number): number {
  return 0.85 + (charge * 0.25);
}

/**
 * Get Bloom glow intensity from charge.
 * 
 * @param charge - Bloom charge (0-1)
 * @returns Glow radius in pixels (0-60)
 */
export function getBloomGlow(charge: number): number {
  return charge * 60;
}

/**
 * Get Bloom animation duration from charge.
 * 
 * @param charge - Bloom charge (0-1)
 * @returns Animation duration in seconds (0.3-0.8)
 */
export function getBloomDuration(charge: number): number {
  // Higher charge = faster, more energetic animation
  return 0.8 - (charge * 0.5);
}

/**
 * Get Bloom color from charge and temperature.
 * 
 * @param charge - Bloom charge (0-1)
 * @param temp - Thermal state
 * @returns Color string
 */
export function getBloomColor(
  charge: number,
  temp: ThermalState | string
): string {
  const baseColors: Record<string, string> = {
    cold: 'rgba(120, 160, 255, 0.75)',
    warming: 'rgba(150, 180, 255, 0.8)',
    warm: 'rgba(255, 180, 120, 0.85)',
    hot: 'rgba(255, 120, 90, 0.9)',
    blazing: 'rgba(255, 70, 70, 0.95)',
  };
  
  const baseColor = baseColors[temp] || baseColors.cold;
  
  // Increase opacity with charge
  const opacity = 0.75 + (charge * 0.2);
  
  // Extract RGB and apply new opacity
  const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = match[1];
    const g = match[2];
    const b = match[3];
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return baseColor;
}

