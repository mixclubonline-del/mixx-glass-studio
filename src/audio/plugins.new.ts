/**
 * New Plugin Registry - Using External Plugin System
 * 
 * This replaces the old plugin registry with the external plugin system.
 * All plugins now use the external components with proper audio engine integration.
 * 
 * Supports Flow by maintaining plugin ID compatibility.
 * Supports Reduction by using a single unified plugin system.
 * Supports Recall by preserving all plugin metadata and state.
 */

import React from "react";
import { IAudioEngine } from "../types/audio-graph";
import { getAllExternalPlugins, getPluginKeyFromId } from "../plugins/external/migration/adapter";
import { PLUGIN_CATALOG } from "./pluginCatalog";
import type { PluginId, PluginCatalogEntry } from "./pluginTypes";

// Keep Five Pillars and core processors from old system
import VelvetCurveVisualizer from "../components/VelvetCurveVisualizer";
import { getVelvetCurveEngine } from "./VelvetCurveEngine";
import HarmonicLatticeVisualizer from "../components/HarmonicLatticeVisualizer";
import { getHarmonicLattice } from "./HarmonicLattice";
import MixxFXVisualizer from "../components/MixxFXVisualizer";
import { getMixxFXEngine } from "./MixxFXEngine";
import TimeWarpVisualizer from "../components/TimeWarpVisualizer";
import { getTimeWarpEngine } from "./TimeWarpEngine";

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

/**
 * Legacy plugin registry for Five Pillars and core processors
 * These stay in the old system as they're engine-level processors
 */
const LEGACY_COMPONENT_REGISTRY: Partial<Record<PluginId, React.FC<any>>> = {
  "velvet-curve": VelvetCurveVisualizer,
  "harmonic-lattice": HarmonicLatticeVisualizer,
  "mixx-fx": MixxFXVisualizer,
  "time-warp": TimeWarpVisualizer,
};

const LEGACY_ENGINE_FACTORIES: Partial<Record<PluginId, (ctx: BaseAudioContext) => IAudioEngine>> = {
  "velvet-curve": (ctx) => getVelvetCurveEngine(ctx),
  "harmonic-lattice": (ctx) => getHarmonicLattice(ctx),
  "mixx-fx": (ctx) => getMixxFXEngine(ctx),
  "time-warp": (ctx) => getTimeWarpEngine(ctx),
};

/**
 * Main plugin registry - combines external plugins with legacy processors
 */
export function getPluginRegistry(ctx: BaseAudioContext): PluginConfig[] {
  // Get all external plugins
  const externalPlugins = getAllExternalPlugins(ctx);

  // Get legacy plugins (Five Pillars)
  const legacyPlugins: PluginConfig[] = Object.entries(LEGACY_COMPONENT_REGISTRY)
    .map(([id, component]) => {
      const catalogEntry = PLUGIN_CATALOG[id as PluginId];
      if (!catalogEntry) return null;

      const engineFactory = LEGACY_ENGINE_FACTORIES[id as PluginId];
      if (!engineFactory) return null;

      return {
        ...catalogEntry,
        component: component!,
        engineInstance: engineFactory,
      };
    })
    .filter((plugin): plugin is PluginConfig => plugin !== null);

  // Combine external and legacy plugins
  const allPlugins = [...legacyPlugins, ...externalPlugins];

  // Filter to only include plugins in catalog
  return allPlugins.filter(plugin => PLUGIN_CATALOG[plugin.id]);
}

export type {
  PluginId,
  PluginTier,
  PluginCatalogEntry,
  PluginInventoryItem,
} from "./pluginTypes";


