/**
 * Thermal Color Filters
 * 
 * Part A of Full Flow Physiology Expansion Pack.
 * Global tint based on ALS temperature.
 * 
 * Flow changes the room's temperature in real time.
 */

export type ThermalState = 'cold' | 'warming' | 'warm' | 'hot' | 'blazing';

/**
 * Thermal color map for global tinting.
 * 
 * Each temperature state has a corresponding color that tints the UI.
 */
export const thermalColors: Record<ThermalState, string> = {
  cold: 'rgba(120, 160, 255, 0.25)',
  warming: 'rgba(150, 180, 255, 0.33)',
  warm: 'rgba(255, 180, 120, 0.35)',
  hot: 'rgba(255, 120, 90, 0.45)',
  blazing: 'rgba(255, 70, 70, 0.55)',
};

/**
 * Get thermal color for a given state.
 * 
 * @param state - Thermal state
 * @returns Color string (rgba)
 */
export function getThermalColor(state: ThermalState | string): string {
  return thermalColors[state as ThermalState] || thermalColors.cold;
}

/**
 * Apply thermal color to root element.
 * 
 * @param state - Thermal state
 */
export function applyThermalColorToRoot(state: ThermalState | string): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const color = getThermalColor(state);
  const root = document.documentElement;
  
  // Set CSS custom property for global use
  root.style.setProperty('--als-thermal-glow', color);
  
  // Apply to root glass container if it exists
  const glassContainer = root.querySelector('.flow-thermal-glow') as HTMLElement;
  if (glassContainer) {
    glassContainer.style.backgroundColor = color;
  }
}

/**
 * Get thermal color with intensity adjustment.
 * 
 * @param state - Thermal state
 * @param intensity - Intensity multiplier (0-1)
 * @returns Color string with adjusted opacity
 */
export function getThermalColorWithIntensity(
  state: ThermalState | string,
  intensity: number
): string {
  const baseColor = getThermalColor(state);
  
  // Extract rgba values
  const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return baseColor;
  }
  
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const baseOpacity = match[4] ? parseFloat(match[4]) : 1.0;
  const adjustedOpacity = baseOpacity * Math.max(0, Math.min(1, intensity));
  
  return `rgba(${r}, ${g}, ${b}, ${adjustedOpacity})`;
}

