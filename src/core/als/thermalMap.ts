/**
 * Thermal Mapping
 * 
 * Layer 6.1 of Flow Pulse → ALS Thermal Sync Engine.
 * Maps Pulse % to thermal states.
 * 
 * Pulse drives heat. Heat shapes behavior.
 */

export type ThermalState = 'cold' | 'warming' | 'warm' | 'hot' | 'blazing';

/**
 * Map pulse percentage to thermal state.
 * 
 * @param pulse - Pulse percentage (0-100)
 * @returns Thermal state string
 */
export function thermalState(pulse: number): ThermalState {
  if (pulse < 12) return 'cold';
  if (pulse < 28) return 'warming';
  if (pulse < 48) return 'warm';
  if (pulse < 72) return 'hot';
  return 'blazing';
}

/**
 * Get thermal color for a given state.
 * 
 * @param state - Thermal state
 * @returns Hex color code
 */
export function thermalColor(state: ThermalState): string {
  switch (state) {
    case 'cold':
      return '#60a5fa'; // Blue
    case 'warming':
      return '#c084fc'; // Purple
    case 'warm':
      return '#f472b6'; // Pink
    case 'hot':
      return '#fbbf24'; // Amber
    case 'blazing':
      return '#ef4444'; // Red
    default:
      return '#60a5fa';
  }
}

/**
 * Get thermal intensity (0-1) for a given state.
 * 
 * @param state - Thermal state
 * @returns Intensity value (0-1)
 */
export function thermalIntensity(state: ThermalState): number {
  switch (state) {
    case 'cold':
      return 0.2;
    case 'warming':
      return 0.4;
    case 'warm':
      return 0.6;
    case 'hot':
      return 0.8;
    case 'blazing':
      return 1.0;
    default:
      return 0.2;
  }
}

