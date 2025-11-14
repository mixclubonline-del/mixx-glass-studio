/**
 * ALS Pulse-Reactive Dock Glow
 * 
 * Syncs Flow Dock visual intensity with ALS pulse and temperature.
 * Creates breathing, reactive glow that responds to Flow's energy.
 */

declare global {
  interface Window {
    __als?: {
      pulse?: number;
      temperature?: string;
      flow?: number;
    };
  }
}

export interface ALSGlowState {
  pulse: number; // 0-1
  temperature: string;
  glowIntensity: number; // 0-1
  glowColor: string;
}

/**
 * Get thermal color based on ALS temperature
 */
export function getThermalColor(temperature: string = "cold"): string {
  switch (temperature) {
    case "cold":
      return "rgba(120, 160, 255, 0.15)"; // Cool blue
    case "warming":
      return "rgba(150, 180, 255, 0.25)"; // Light blue
    case "warm":
      return "rgba(255, 180, 120, 0.35)"; // Warm orange
    case "hot":
      return "rgba(255, 120, 90, 0.45)"; // Hot red-orange
    case "blazing":
      return "rgba(255, 70, 70, 0.6)"; // Blazing red
    default:
      return "rgba(160, 120, 255, 0.2)"; // Default purple
  }
}

/**
 * Compute glow intensity from pulse and temperature
 */
export function computeGlowIntensity(pulse: number, temperature: string): number {
  const baseIntensity = pulse * 0.6; // Base pulse contribution
  
  // Temperature multiplier
  const tempMultiplier: Record<string, number> = {
    cold: 0.3,
    warming: 0.5,
    warm: 0.7,
    hot: 0.9,
    blazing: 1.0,
  };
  
  const multiplier = tempMultiplier[temperature] || 0.5;
  
  return Math.min(1, baseIntensity + (multiplier * 0.4));
}

/**
 * Get current ALS glow state
 */
export function getALSGlowState(): ALSGlowState {
  const als = window.__als || {};
  const pulse = (als.pulse || 0) / 100; // Normalize to 0-1
  const temperature = als.temperature || "cold";
  
  return {
    pulse,
    temperature,
    glowIntensity: computeGlowIntensity(pulse, temperature),
    glowColor: getThermalColor(temperature),
  };
}

