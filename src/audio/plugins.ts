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
import { getAllExternalPlugins } from "../plugins/external/migration/adapter";
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

/**
 * PlaceholderAudioEngine - Fallback engine for plugins without audio processing
 * 
 * This is a graceful fallback for plugins that:
 * - Don't have audio engines implemented yet
 * - Are visual-only plugins
 * - Are in development
 * 
 * Provides basic gain control so plugins can at least affect volume.
 * For production, plugins should implement their own IAudioEngine.
 * 
 * Flow Doctrine: Graceful degradation - plugins work even without full engines.
 */
export class PlaceholderAudioEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null = null;
  private isInitialized = false;
  private params: Record<string, number> = {
    gain: 1.0,      // Basic gain control (0-2.0)
    mix: 1.0        // Mix control (0-1.0)
  };

  constructor(ctx: BaseAudioContext) {
    this.audioContext = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.makeup = ctx.createGain();
    
    // Connect with gain control: input -> makeup (gain) -> output
    this.input.connect(this.makeup);
    this.makeup.connect(this.output);
    
    // Initialize gain to 1.0 (unity)
    this.makeup.gain.value = 1.0;
  }
  
  async initialize(ctx: BaseAudioContext): Promise<void> {
    if(!this.audioContext) this.audioContext = ctx;
    this.isInitialized = true;
    this.updateProcessing();
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {
    // Could use beat phase for tempo-synced effects in the future
  }
  
  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.makeup.disconnect();
  }
  
  isActive(): boolean { 
    return this.isInitialized; 
  }
  
  setParameter(name: string, value: number): void { 
    this.params[name] = value;
    this.updateProcessing();
  }
  
  getParameter(name: string): number { 
    return this.params[name] ?? 0; 
  }
  
  getParameterNames(): string[] { 
    return ['gain', 'mix']; 
  }
  
  getParameterMin(name: string): number {
    if (name === 'gain') return 0;
    if (name === 'mix') return 0;
    return 0;
  }
  
  getParameterMax(name: string): number {
    if (name === 'gain') return 2.0;
    if (name === 'mix') return 1.0;
    return 1;
  }
  
  /**
   * Update audio processing based on parameters
   */
  private updateProcessing(): void {
    if (!this.audioContext || !this.makeup) return;
    
    const gain = this.params.gain ?? 1.0;
    const mix = this.params.mix ?? 1.0;
    
    // Apply gain and mix
    // Mix of 1.0 = full effect, 0.0 = dry (but we're a placeholder, so just apply gain)
    const effectiveGain = gain * mix;
    
    const now = this.audioContext.currentTime;
    this.makeup.gain.setTargetAtTime(effectiveGain, now, 0.01);
  }
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
