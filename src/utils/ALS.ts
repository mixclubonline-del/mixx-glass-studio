export type TrackColorKey = "cyan" | "magenta" | "blue" | "green" | "purple" | "crimson";

export type ALSTemperature = "cold" | "cool" | "warm" | "hot";

export interface TrackALSFeedback {
  color: string;
  glowColor: string;
  temperature: ALSTemperature;
  intensity: number;
  pulse: number;
  flow: number;
}

interface DeriveFeedbackParams {
  level?: number;
  transient?: boolean;
  volume?: number;
  color: TrackColorKey;
  lowBandEnergy?: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const sanitized = hex.replace("#", "");
  const bigint = Number.parseInt(
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized,
    16
  );
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixHexColors = (source: string, target: string, amount: number) => {
  const a = hexToRgb(source);
  const b = hexToRgb(target);
  const ratio = clamp01(amount);
  const mix = (channelA: number, channelB: number) =>
    channelA + (channelB - channelA) * ratio;
  return rgbToHex(mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b));
};

export const TRACK_COLOR_SWATCH: Record<
  TrackColorKey,
  { base: string; glow: string }
> = {
  cyan: { base: "#06b6d4", glow: "#22d3ee" },
  magenta: { base: "#d946ef", glow: "#f472b6" },
  blue: { base: "#3b82f6", glow: "#93c5fd" },
  green: { base: "#22c55e", glow: "#86efac" },
  purple: { base: "#8b5cf6", glow: "#c4b5fd" },
  crimson: { base: "#f43f5e", glow: "#fb7185" },
};

export interface PulsePalette {
  base: string;
  glow: string;
  halo: string;
  accent: string;
  pulseStrength: number;
}

export interface RoutingALSFeedback {
  intensity: number;
  pulse: number;
  color: string;
  glowColor: string;
  temperature: ALSTemperature;
}

/**
 * Generate ALS feedback for routing activity.
 * Higher intensity for active sidechain connections and track sends.
 */
export function deriveRoutingALSFeedback(
  isSidechainSource: boolean,
  receivingSends: number,
  activeConnections: number
): RoutingALSFeedback {
  // Calculate intensity based on routing activity
  const sidechainIntensity = isSidechainSource ? 0.6 : 0;
  const sendIntensity = Math.min(0.4, receivingSends * 0.15);
  const connectionIntensity = Math.min(0.3, activeConnections * 0.1);
  
  const intensity = clamp01(sidechainIntensity + sendIntensity + connectionIntensity);
  const pulse = intensity > 0.3 ? 0.7 + intensity * 0.3 : intensity * 0.5;
  const temperature = temperatureFromLevel(intensity);
  
  // Color based on routing type
  const color = isSidechainSource ? '#67e8f9' : '#a78bfa'; // Cyan for sidechain, purple for sends
  const glowColor = isSidechainSource ? '#22d3ee' : '#c4b5fd';
  
  return {
    intensity,
    pulse,
    color,
    glowColor,
    temperature,
  };
}

const temperatureFromLevel = (intensity: number): ALSTemperature => {
  if (intensity >= 0.75) return "hot";
  if (intensity >= 0.5) return "warm";
  if (intensity >= 0.25) return "cool";
  return "cold";
};

export const deriveTrackALSFeedback = (
  {
    level = 0,
    transient = false,
    volume = 0.75,
    color,
    lowBandEnergy = 0,
  }: DeriveFeedbackParams,
  globalLowPriority?: number
): TrackALSFeedback => {
  const subPriority = Math.max(lowBandEnergy, globalLowPriority ?? 0);
  const intensity = clamp01(level + subPriority * 0.6);
  const weightedIntensity = clamp01(intensity * 1.45);
  const pulse = transient || subPriority > 0.18 ? 0.95 : weightedIntensity * 0.6;
  const flow = clamp01(volume + subPriority * 0.25);

  const { base, glow } = TRACK_COLOR_SWATCH[color];

  return {
    color: base,
    glowColor: glow,
    temperature: temperatureFromLevel(weightedIntensity),
    intensity: weightedIntensity,
    pulse,
    flow,
  };
};

export const hexToRgba = (hex: string, alpha = 1): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
};

export const derivePulsePalette = (
  color: TrackColorKey,
  intensity: number,
  pulse: number
): PulsePalette => {
  const swatch = TRACK_COLOR_SWATCH[color];
  const energy = clamp01(intensity);
  const pulseStrength = clamp01(pulse);
  const halo = mixHexColors(swatch.glow, "#ffffff", 0.28 + energy * 0.32);
  const accent = mixHexColors(swatch.glow, swatch.base, 0.4 + pulseStrength * 0.25);

  return {
    base: swatch.base,
    glow: swatch.glow,
    halo,
    accent,
    pulseStrength,
  };
};

export interface BusALSColors {
  base: string;
  glow: string;
  halo: string;
}

export interface ALSActionPulse {
  accent: string;
  glow: string;
  halo: string;
  strength: number;
  decayMs: number;
}

export const deriveBusALSColors = (
  base: string,
  glow: string,
  intensity: number
): BusALSColors => {
  const energy = clamp01(intensity);
  const baseTint = mixHexColors(base, "#ffffff", 0.12 + energy * 0.3);
  const glowTint = mixHexColors(glow, "#ffffff", 0.25 + energy * 0.45);
  const halo = mixHexColors(glow, "#f5d0fe", 0.35 + energy * 0.4);
  return {
    base: baseTint,
    glow: glowTint,
    halo,
  };
};

/**
 * Fast helper for transient ALS pulses after mixer actions.
 * what: Generates an ALSActionPulse from a base palette and intensity.
 * why: Keeps feedback responsive without introducing numeric UI clutter.
 * how: Blend base/glow and clamp energy into decay values. (Flow / Reduction)
 */
export const deriveActionPulse = (
  palette: PulsePalette,
  energy: number,
  decayMs = 420
): ALSActionPulse => {
  const strength = clamp01((palette.pulseStrength + energy) * 0.65);
  return {
    accent: palette.accent,
    glow: mixHexColors(palette.glow, "#ffffff", 0.25 + strength * 0.3),
    halo: mixHexColors(palette.halo, palette.glow, 0.2 + strength * 0.45),
    strength,
    decayMs,
  };
};

