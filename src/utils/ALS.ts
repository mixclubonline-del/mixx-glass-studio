export type TrackColorKey = "cyan" | "magenta" | "blue" | "green" | "purple";

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
};

const temperatureFromLevel = (intensity: number): ALSTemperature => {
  if (intensity >= 0.75) return "hot";
  if (intensity >= 0.5) return "warm";
  if (intensity >= 0.25) return "cool";
  return "cold";
};

export const deriveTrackALSFeedback = ({
  level = 0,
  transient = false,
  volume = 0.75,
  color,
}: DeriveFeedbackParams): TrackALSFeedback => {
  const intensity = clamp01(level * 1.4);
  const pulse = transient ? 0.85 : intensity * 0.6;
  const flow = clamp01(volume);

  const { base, glow } = TRACK_COLOR_SWATCH[color];

  return {
    color: base,
    glowColor: glow,
    temperature: temperatureFromLevel(intensity),
    intensity,
    pulse,
    flow,
  };
};

export const hexToRgba = (hex: string, alpha = 1): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
};

export interface BusALSColors {
  base: string;
  glow: string;
  halo: string;
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

