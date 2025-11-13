
// audio/plugins.ts
import React from "react";
import { IAudioEngine } from "../types/audio-graph";
import VelvetCurveVisualizer from "../components/VelvetCurveVisualizer";
import { getVelvetCurveEngine } from "./VelvetCurveEngine";
import HarmonicLatticeVisualizer from "../components/HarmonicLatticeVisualizer";
import { getHarmonicLattice } from "./HarmonicLattice";
import MixxFXVisualizer from "../components/MixxFXVisualizer";
import { getMixxFXEngine } from "./MixxFXEngine";
import TimeWarpVisualizer from "../components/TimeWarpVisualizer";
import { getTimeWarpEngine } from "./TimeWarpEngine";
import MixxTuneVisualizer from "../components/plugins/MixxTuneVisualizer";
import { getMixxTuneEngine } from "./MixxTuneEngine";
import MixxVerbVisualizer from "../components/plugins/MixxVerbVisualizer";
import { getMixxVerbEngine } from "./MixxVerbEngine";
import MixxDelayVisualizer from "../components/plugins/MixxDelayVisualizer";
import { getMixxDelayEngine } from "./MixxDelayEngine";
import MixxLimiterVisualizer from "../components/plugins/MixxLimiterVisualizer";
import { getMixxLimiterEngine } from "./MixxLimiterEngine";
import MixxClipperVisualizer from "../components/plugins/MixxClipperVisualizer";
import { getMixxClipperEngine } from "./MixxClipperEngine";
import MixxDriveVisualizer from "../components/plugins/MixxDriveVisualizer";
import { getMixxDriveEngine } from "./MixxDriveEngine";
import MixxGlueVisualizer from "../components/plugins/MixxGlueVisualizer";
import { getMixxGlueEngine } from "./MixxGlueEngine";
import { PLUGIN_CATALOG } from "./pluginCatalog";
import type { PluginId, PluginCatalogEntry } from "./pluginTypes";

export interface PluginConfig extends PluginCatalogEntry {
  component: React.FC<any>;
  engineInstance: (ctx: BaseAudioContext) => IAudioEngine;
}

// A placeholder for generic plugins or those not yet implemented
export class PlaceholderAudioEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null = null;
  private isInitialized = false;
  private params: Record<string, number> = {};

  constructor(ctx: BaseAudioContext) {
    this.audioContext = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.makeup = ctx.createGain();
    // Directly connect input to output for placeholder
    this.input.connect(this.makeup);
    this.makeup.connect(this.output);
  }
  
  async initialize(ctx: BaseAudioContext): Promise<void> {
    if(!this.audioContext) this.audioContext = ctx;
    this.isInitialized = true;
  }

  getIsInitialized(): boolean {
      return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {}
  dispose(): void {
      this.input.disconnect();
      this.output.disconnect();
      this.makeup.disconnect();
  }
  isActive(): boolean { return this.isInitialized; }
  setParameter(name: string, value: number): void { this.params[name] = value; }
  getParameter(name: string): number { return this.params[name] || 0; }
  getParameterNames(): string[] { return Object.keys(this.params); }
  getParameterMin(name: string): number { return 0; }
  getParameterMax(name: string): number { return 1; }
}


const COMPONENT_REGISTRY: Partial<Record<PluginId, React.FC<any>>> = {
  "velvet-curve": VelvetCurveVisualizer,
  "harmonic-lattice": HarmonicLatticeVisualizer,
  "mixx-tune": MixxTuneVisualizer,
  "mixx-verb": MixxVerbVisualizer,
  "mixx-delay": MixxDelayVisualizer,
  "mixx-drive": MixxDriveVisualizer,
  "mixx-glue": MixxGlueVisualizer,
  "mixx-limiter": MixxLimiterVisualizer,
  "mixx-clip": MixxClipperVisualizer,
  "mixx-fx": MixxFXVisualizer,
  "time-warp": TimeWarpVisualizer,
};

const resolveEngineFactory = (
  id: PluginId,
  ctx: BaseAudioContext
): ((ctx: BaseAudioContext) => IAudioEngine) => {
  switch (id) {
    case "velvet-curve":
      return () => getVelvetCurveEngine(ctx);
    case "harmonic-lattice":
      return () => getHarmonicLattice(ctx);
    case "mixx-tune":
      return () => getMixxTuneEngine(ctx);
    case "mixx-verb":
      return () => getMixxVerbEngine(ctx);
    case "mixx-delay":
      return () => getMixxDelayEngine(ctx);
    case "mixx-drive":
      return () => getMixxDriveEngine(ctx);
    case "mixx-glue":
      return () => getMixxGlueEngine(ctx);
    case "mixx-limiter":
      return () => getMixxLimiterEngine(ctx);
    case "mixx-clip":
      return () => getMixxClipperEngine(ctx);
    case "mixx-fx":
      return () => getMixxFXEngine(ctx);
    case "time-warp":
      return () => getTimeWarpEngine(ctx);
    default:
      return (innerCtx) => new PlaceholderAudioEngine(innerCtx);
  }
};

export function getPluginRegistry(ctx: BaseAudioContext): PluginConfig[] {
  return Object.values(PLUGIN_CATALOG)
    .filter((entry) => Boolean(COMPONENT_REGISTRY[entry.id]))
    .map((entry) => {
      const component = COMPONENT_REGISTRY[entry.id]!;
      const engineInstance = resolveEngineFactory(entry.id, ctx);
      return {
        ...entry,
        component,
        engineInstance,
      };
    });
}

export type {
  PluginId,
  PluginTier,
  PluginCatalogEntry,
  PluginInventoryItem,
} from "./pluginTypes";
