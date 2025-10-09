/**
 * Temperature Gradient Utilities
 * Ice-to-fire gradient calculations for tactile controls
 */

// Temperature color stops based on value (0-1 range)
export const TEMPERATURE_STOPS = {
  ICE_DEEP: 'hsl(191 100% 40%)',      // -∞ to -40dB
  ICE_COLD: 'hsl(191 100% 50%)',      // -40dB to -18dB
  ICE_WARM: 'hsl(191 80% 60%)',       // -18dB to -6dB
  PRIME_PURPLE: 'hsl(275 100% 65%)',  // -6dB to 0dB (optimal)
  NEON_PINK: 'hsl(314 100% 65%)',     // 0dB to +6dB (caution)
  FIRE_RED: 'hsl(0 100% 60%)'         // +6dB to +12dB (danger)
};

// Convert dB to 0-1 range
export function dbToNormalized(db: number): number {
  const minDb = -60;
  const maxDb = 12;
  return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
}

// Convert 0-1 range to dB
export function normalizedToDb(normalized: number): number {
  const minDb = -60;
  const maxDb = 12;
  return minDb + (normalized * (maxDb - minDb));
}

// Get temperature color based on value (0-1)
export function getTemperatureColor(value: number): string {
  if (value < 0.25) {
    // Ice zone: deep → cold
    const t = value / 0.25;
    return interpolateHSL(TEMPERATURE_STOPS.ICE_DEEP, TEMPERATURE_STOPS.ICE_COLD, t);
  } else if (value < 0.5) {
    // Warming zone: cold → warm
    const t = (value - 0.25) / 0.25;
    return interpolateHSL(TEMPERATURE_STOPS.ICE_COLD, TEMPERATURE_STOPS.ICE_WARM, t);
  } else if (value < 0.75) {
    // Hot zone: warm → prime purple
    const t = (value - 0.5) / 0.25;
    return interpolateHSL(TEMPERATURE_STOPS.ICE_WARM, TEMPERATURE_STOPS.PRIME_PURPLE, t);
  } else if (value < 0.9) {
    // Caution zone: purple → pink
    const t = (value - 0.75) / 0.15;
    return interpolateHSL(TEMPERATURE_STOPS.PRIME_PURPLE, TEMPERATURE_STOPS.NEON_PINK, t);
  } else {
    // Danger zone: pink → fire
    const t = (value - 0.9) / 0.1;
    return interpolateHSL(TEMPERATURE_STOPS.NEON_PINK, TEMPERATURE_STOPS.FIRE_RED, t);
  }
}

// Get glow intensity based on value (0-1)
export function getGlowIntensity(value: number): number {
  // Glow increases from 0.3 to 1.0 as value increases
  return 0.3 + (value * 0.7);
}

// Get glow blur radius based on value
export function getGlowBlur(value: number): number {
  return 15 + (value * 25); // 15px to 40px
}

// Create CSS gradient string for fader/knob
export function createTemperatureGradient(value: number, direction: 'to top' | 'conic' = 'to top'): string {
  if (direction === 'conic') {
    // For rotary knobs
    const angle = value * 270; // 270° range
    return `conic-gradient(from ${-135 + angle}deg, ${getTemperatureColor(0)} 0deg, ${getTemperatureColor(value)} ${angle}deg, transparent ${angle}deg)`;
  } else {
    // For faders
    return `linear-gradient(${direction}, 
      ${TEMPERATURE_STOPS.ICE_DEEP} 0%,
      ${TEMPERATURE_STOPS.ICE_COLD} 25%,
      ${TEMPERATURE_STOPS.ICE_WARM} 45%,
      ${TEMPERATURE_STOPS.PRIME_PURPLE} 65%,
      ${TEMPERATURE_STOPS.NEON_PINK} 85%,
      ${TEMPERATURE_STOPS.FIRE_RED} 100%)`;
  }
}

// Interpolate between two HSL colors
function interpolateHSL(color1: string, color2: string, t: number): string {
  const hsl1 = parseHSL(color1);
  const hsl2 = parseHSL(color2);
  
  const h = hsl1.h + (hsl2.h - hsl1.h) * t;
  const s = hsl1.s + (hsl2.s - hsl1.s) * t;
  const l = hsl1.l + (hsl2.l - hsl1.l) * t;
  
  return `hsl(${h} ${s}% ${l}%)`;
}

// Parse HSL string to components
function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const match = hsl.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (!match) return { h: 0, s: 0, l: 0 };
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3])
  };
}
