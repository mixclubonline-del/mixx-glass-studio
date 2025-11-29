/**
 * Audio Engine Adapter
 * 
 * Bridges the external plugin system with the current Studio audio engine system.
 * This allows external plugin components to work with existing audio engines.
 * 
 * Supports Flow by maintaining compatibility during transition.
 * Supports Reduction by providing a clean adapter pattern.
 * Supports Recall by preserving plugin state across systems.
 */

import { IAudioEngine } from '../../../types/audio-graph';
import type { PluginState, BasePluginSettings } from '../types';

/**
 * Maps external plugin state to audio engine parameters
 */
export function mapPluginStateToEngineParams(
  pluginState: PluginState,
  pluginId: string
): Record<string, number> {
  const params: Record<string, number> = {};
  
  // Map common parameters
  if ('mix' in pluginState) {
    params.mix = pluginState.mix;
  }
  if ('output' in pluginState) {
    params.output = pluginState.output;
  }
  
  // Plugin-specific mappings
  switch (pluginId) {
    case 'mixx-aura':
      if ('tone' in pluginState) params.tone = pluginState.tone;
      if ('width' in pluginState) params.width = pluginState.width;
      if ('shine' in pluginState) params.shine = pluginState.shine;
      break;
    case 'prime-eq':
      if ('lowGain' in pluginState) params.lowGain = pluginState.lowGain;
      if ('midGain' in pluginState) params.midGain = pluginState.midGain;
      if ('highGain' in pluginState) params.highGain = pluginState.highGain;
      if ('smartFocus' in pluginState) params.smartFocus = pluginState.smartFocus;
      break;
    case 'mixx-polish':
      if ('clarity' in pluginState) params.clarity = pluginState.clarity;
      if ('air' in pluginState) params.air = pluginState.air;
      if ('balance' in pluginState) params.balance = pluginState.balance;
      break;
    case 'mixx-tune':
      if ('retuneSpeed' in pluginState) params.retuneSpeed = pluginState.retuneSpeed;
      if ('formant' in pluginState) params.formant = pluginState.formant;
      if ('humanize' in pluginState) params.humanize = pluginState.humanize;
      break;
    case 'mixx-verb':
      if ('size' in pluginState) params.size = pluginState.size;
      if ('predelay' in pluginState) params.predelay = pluginState.predelay;
      break;
    case 'mixx-delay':
      if ('time' in pluginState) params.time = pluginState.time;
      if ('feedback' in pluginState) params.feedback = pluginState.feedback;
      if ('throwIntuition' in pluginState) params.throwIntuition = pluginState.throwIntuition;
      break;
    case 'mixx-drive':
      if ('drive' in pluginState) params.drive = pluginState.drive;
      if ('warmth' in pluginState) params.warmth = pluginState.warmth;
      if ('color' in pluginState) params.color = pluginState.color;
      break;
    case 'mixx-glue':
      if ('threshold' in pluginState) params.threshold = pluginState.threshold;
      if ('ratio' in pluginState) params.ratio = pluginState.ratio;
      if ('release' in pluginState) params.release = pluginState.release;
      break;
    case 'mixx-limiter':
      if ('ceiling' in pluginState) params.ceiling = pluginState.ceiling;
      if ('drive' in pluginState) params.drive = pluginState.drive;
      if ('lookahead' in pluginState) params.lookahead = pluginState.lookahead;
      break;
    // Add more mappings as needed
  }
  
  return params;
}

/**
 * Creates an audio engine wrapper that syncs with external plugin state
 */
export function createEngineWrapper(
  engine: IAudioEngine,
  pluginState: PluginState,
  pluginId: string
): IAudioEngine {
  // Sync parameters from plugin state to engine
  const params = mapPluginStateToEngineParams(pluginState, pluginId);
  Object.entries(params).forEach(([name, value]) => {
    engine.setParameter(name, value);
  });
  
  return engine;
}

/**
 * Adapter to convert external plugin component props to current system format
 */
export interface ExternalPluginAdapterProps {
  pluginState: PluginState;
  setPluginState: (state: Partial<PluginState> | ((prev: PluginState) => Partial<PluginState>)) => void;
  audioEngine?: IAudioEngine;
  pluginId: string;
}

/**
 * Syncs plugin state changes to audio engine
 */
export function syncStateToEngine(
  engine: IAudioEngine | null | undefined,
  pluginState: PluginState,
  pluginId: string
): void {
  if (!engine) return;
  
  const params = mapPluginStateToEngineParams(pluginState, pluginId);
  Object.entries(params).forEach(([name, value]) => {
    engine.setParameter(name, value);
  });
}

