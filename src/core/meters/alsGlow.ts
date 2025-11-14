/**
 * Flow Meter Stack - ALS Visual Glow Logic (STEP 5)
 * Maps meter readings to thermal colors and pulse states.
 */

/**
 * Thermal color states based on energy level.
 */
export type ThermalState = 'cold' | 'warming' | 'warm' | 'hot' | 'blazing';

/**
 * Get thermal state from peak dB level.
 * @param peakDB - Peak level in dB
 * @returns Thermal state
 */
export function getThermalStateFromPeak(peakDB: number): ThermalState {
  if (peakDB < -24) return 'cold';
  if (peakDB < -12) return 'warming';
  if (peakDB < -3) return 'warm';
  if (peakDB < 0) return 'hot';
  return 'blazing';
}

/**
 * Get thermal color CSS variable from state.
 * @param state - Thermal state
 * @returns CSS variable name
 */
export function getThermalColorVar(state: ThermalState): string {
  switch (state) {
    case 'cold':
      return 'var(--als-cold, #60a5fa)'; // Blue
    case 'warming':
      return 'var(--als-warming, #34d399)'; // Green
    case 'warm':
      return 'var(--als-warm, #fbbf24)'; // Yellow
    case 'hot':
      return 'var(--als-hot, #f97316)'; // Orange
    case 'blazing':
      return 'var(--als-blazing, #ef4444)'; // Red
    default:
      return 'var(--als-warming, #34d399)';
  }
}

/**
 * Compute pulse value from transients.
 * @param transients - Array of transient detection results (0-1)
 * @returns Pulse value (0-1)
 */
export function computePulseFromTransients(transients: number[]): number {
  if (transients.length === 0) return 0;
  
  // Count active transients (above threshold)
  const threshold = 0.5;
  const activeCount = transients.filter(t => t > threshold).length;
  
  // Normalize to 0-1
  return Math.min(1, activeCount / transients.length);
}

/**
 * ALS glow configuration.
 */
export interface ALSGlowConfig {
  color: string;
  intensity: number; // 0-1
  pulse: number;      // 0-1
  state: ThermalState;
}

/**
 * Compute ALS glow configuration from meter reading.
 * @param reading - Meter reading
 * @param transients - Optional transient array for pulse
 * @returns ALS glow configuration
 */
export function computeALSGlow(
  reading: { peak: number; rms: number; heat: number },
  transients?: number[]
): ALSGlowConfig {
  const state = getThermalStateFromPeak(reading.peak);
  const color = getThermalColorVar(state);
  const intensity = reading.heat;
  const pulse = transients ? computePulseFromTransients(transients) : 0;

  return {
    color,
    intensity,
    pulse,
    state,
  };
}

