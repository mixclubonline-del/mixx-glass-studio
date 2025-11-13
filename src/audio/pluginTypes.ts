export type PluginId =
  | "velvet-curve"
  | "harmonic-lattice"
  | "mixx-fx"
  | "time-warp"
  | "mixx-tune"
  | "mixx-verb"
  | "mixx-delay"
  | "mixx-drive"
  | "mixx-glue"
  | "mixx-limiter"
  | "mixx-clip"
  | "mixx-aura"
  | "prime-eq"
  | "mixx-polish"
  | "mixx-morph"
  | "prime-brain-stem"
  | "mixx-balance"
  | "mixx-ceiling"
  | "prime-master-eq"
  | "mixx-dither"
  | "mixx-soul"
  | "mixx-motion"
  | "prime-lens"
  | "mixx-brainwave"
  | "mixx-spirit"
  | "mixx-analyzer-pro"
  | "prime-router"
  | "mixx-port"
  | "telemetry-collector"
  | "prime-bot-console"
  | string;

export type PluginTier =
  | "pillar"
  | "core"
  | "neural"
  | "master"
  | "system"
  | "signature";

export type LightingMotion =
  | "float"
  | "breathe"
  | "pulse"
  | "burst"
  | "shimmer"
  | "sweep"
  | "drift"
  | "expand"
  | "flare"
  | "bars"
  | "glow"
  | "heartbeat"
  | "mirror";

export interface PluginLightingProfile {
  hueStart: number;
  hueEnd: number;
  motion: LightingMotion;
}

import type { TrackColorKey } from "../utils/ALS";

export interface PluginCatalogEntry {
  id: PluginId;
  name: string;
  description: string;
  tier: PluginTier;
  tierLabel: string;
  parameters: string[];
  moodResponse: string;
  lightingProfile: PluginLightingProfile;
  canBeSidechainTarget?: boolean;
  curated?: boolean;
  legacy?: boolean;
}

export interface PluginInventoryItem extends PluginCatalogEntry {
  colorKey: TrackColorKey;
  base: string;
  glow: string;
  isFavorite: boolean;
  isCurated: boolean;
}

