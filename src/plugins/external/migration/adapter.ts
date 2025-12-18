/**
 * Plugin System Migration Adapter
 * 
 * Bridges the external plugin system with the current Studio plugin registry interface.
 * This allows a gradual migration while maintaining compatibility.
 * 
 * Supports Flow by maintaining existing plugin IDs and interfaces.
 * Supports Reduction by providing a clean mapping layer.
 * Supports Recall by preserving plugin state during migration.
 */

import React, { useEffect, useRef } from 'react';
import { findPlugin, PLUGIN_TIERS } from '../constants';
import type { PluginKey, PluginStates, SpecificPluginSettingsMap } from '../types';
import { PLUGIN_COMPONENTS, PLUGIN_ENGINE_FACTORIES, getInitialPluginState } from '../test/pluginTestConfig';
import { syncStateToEngine } from '../adapters/audioEngineAdapter';
import type { IAudioEngine } from '../../../types/audio-graph';
import type { PluginId, PluginCatalogEntry } from '../../../audio/pluginTypes';
import { PlaceholderAudioEngine } from '../../../audio/plugins';
import { PLUGIN_CATALOG } from '../../../audio/pluginCatalog';

/**
 * Maps external plugin keys to current plugin IDs
 */
const PLUGIN_ID_MAP: Record<PluginKey, PluginId> = {
  'MixxTune': 'mixx-tune',
  'MixxVerb': 'mixx-verb',
  'MixxDelay': 'mixx-delay',
  'MixxDrive': 'mixx-drive',
  'MixxGlue': 'mixx-glue',
  'MixxAura': 'mixx-aura',
  'PrimeEQ': 'prime-eq',
  'MixxPolish': 'mixx-polish',
  'MixxMorph': 'mixx-morph',
  'PrimeBrainStem': 'prime-brain-stem',
  'MixxLimiter': 'mixx-limiter',
  'MixxBalance': 'mixx-balance',
  'MixxCeiling': 'mixx-ceiling',
  'PrimeMasterEQ': 'prime-master-eq',
  'MixxDither': 'mixx-dither',
  'MixxSoul': 'mixx-soul',
  'MixxMotion': 'mixx-motion',
  'PrimeLens': 'prime-lens',
  'MixxBrainwave': 'mixx-brainwave',
  'MixxSpirit': 'mixx-spirit',
  'MixxAnalyzerPro': 'mixx-analyzer-pro',
  'PrimeRouter': 'prime-router',
  'MixxPort': 'mixx-port',
  'TelemetryCollector': 'telemetry-collector',
  'PrimeBotConsole': 'prime-bot-console',
};

/**
 * Reverse map: plugin ID to external plugin key
 */
const REVERSE_ID_MAP: Record<PluginId, PluginKey> = Object.fromEntries(
  Object.entries(PLUGIN_ID_MAP).map(([key, id]) => [id, key as PluginKey])
) as Record<PluginId, PluginKey>;

/**
 * Converts external plugin to current PluginConfig format
 */
export function createPluginConfig(
  pluginKey: PluginKey,
  ctx: BaseAudioContext
): {
  id: PluginId;
  name: string;
  description: string;
  tier: any;
  component: React.FC<any>;
  engineInstance: (ctx: BaseAudioContext) => IAudioEngine;
  tierLabel: string;
  parameters: string[];
  moodResponse: string;
  lightingProfile: any;
} {
  const pluginInfo = findPlugin(pluginKey);
  const pluginId = PLUGIN_ID_MAP[pluginKey];
  const ExternalComponent = PLUGIN_COMPONENTS[pluginKey];
  const engineFactory = PLUGIN_ENGINE_FACTORIES[pluginKey];

  // Wrap external component to work with VisualizerProps
  const WrappedComponent = createExternalPluginWrapper(ExternalComponent, pluginKey);

  // Create engine factory
  const engineInstanceFactory = (audioCtx: BaseAudioContext): IAudioEngine => {
    if (engineFactory) {
      return engineFactory(audioCtx);
    }
    return new PlaceholderAudioEngine(audioCtx);
  };

  const catalogEntry = PLUGIN_CATALOG[pluginId];

  return {
    id: pluginId,
    name: pluginInfo.name,
    description: pluginInfo.description,
    tier: pluginInfo.tier as any,
    component: WrappedComponent,
    engineInstance: engineInstanceFactory,
    tierLabel: catalogEntry?.tierLabel ?? 'External Plugin',
    parameters: catalogEntry?.parameters ?? [],
    moodResponse: catalogEntry?.moodResponse ?? 'Standard external processing.',
    lightingProfile: (catalogEntry?.lightingProfile ?? { hueStart: 0, hueEnd: 0, motion: 'float' }) as any,
  };
}

/**
 * Gets all external plugins as current PluginConfig format
 */
export function getAllExternalPlugins(ctx: BaseAudioContext) {
  const allPluginKeys = Object.keys(PLUGIN_TIERS).flatMap(
    tier => Object.keys(PLUGIN_TIERS[tier as keyof typeof PLUGIN_TIERS]) as PluginKey[]
  );

  return allPluginKeys.map(key => createPluginConfig(key, ctx));
}

/**
 * Wraps external plugin component to work with current VisualizerProps interface
 * 
 * Converts between:
 * - VisualizerProps (current system): params, onChange(param, value)
 * - PluginComponentProps (external system): pluginState, setPluginState(partial | function)
 */
export function createExternalPluginWrapper(
  ExternalComponent: React.ComponentType<any>,
  pluginKey: PluginKey
): React.FC<any> {
  return (props: any) => {
    const pluginInfo = findPlugin(pluginKey);
    const pluginId = PLUGIN_ID_MAP[pluginKey];
    const initialState = getInitialPluginState(pluginKey);
    const engineRef = useRef<IAudioEngine | null>(props.engineInstance || null);
    
    // Update engine ref when it changes
    useEffect(() => {
      engineRef.current = props.engineInstance || null;
    }, [props.engineInstance]);
    
    // Convert params object to pluginState
    const pluginState = { ...initialState, ...(props.params || {}) };
    
    // Sync plugin state to audio engine when params change
    useEffect(() => {
      if (engineRef.current) {
        syncStateToEngine(engineRef.current, pluginState, pluginId);
      }
    }, [pluginState, pluginId]);
    
    // Create setPluginState that works with onChange and syncs to engine
    const setPluginState = (newState: any) => {
      if (!props.onChange) return;
      
      let updatedState: any;
      
      if (typeof newState === 'function') {
        // Functional update
        const currentState = { ...initialState, ...(props.params || {}) };
        updatedState = newState(currentState);
      } else {
        // Partial update
        updatedState = newState;
      }
      
      // Update via onChange (for React state)
      Object.entries(updatedState).forEach(([key, value]) => {
        props.onChange(key, value);
      });
      
      // Also sync directly to engine for immediate effect
      if (engineRef.current) {
        const newPluginState = { ...pluginState, ...updatedState };
        syncStateToEngine(engineRef.current, newPluginState, pluginId);
      }
    };

    // Create simulated audio signal for visualizers
    const audioSignal = {
      level: 0.3 + Math.random() * 0.4,
      peak: 0.5 + Math.random() * 0.3,
      transients: Math.random() > 0.7,
      waveform: new Float32Array(512).map(() => Math.random() * 0.5),
      time: props.currentTime || 0,
    };

    // Map current props to external props format
    const externalProps = {
      name: pluginInfo.name,
      description: pluginInfo.description,
      sessionContext: { mood: 'Neutral' as const },
      setSessionContext: () => {},
      pluginState,
      setPluginState,
      isLearning: () => false,
      onMidiLearn: () => {},
      isSidechainTarget: false,
      audioSignal,
      onClose: props.onClose,
      globalSettings: {
        uiTheme: 'dark' as const,
        animationIntensity: 75,
        visualizerComplexity: 'high' as const,
      },
    };

    return React.createElement(ExternalComponent, externalProps);
  };
}

/**
 * Gets plugin key from plugin ID
 */
export function getPluginKeyFromId(pluginId: PluginId): PluginKey | null {
  return REVERSE_ID_MAP[pluginId] || null;
}

/**
 * Gets plugin ID from plugin key
 */
export function getPluginIdFromKey(pluginKey: PluginKey): PluginId {
  return PLUGIN_ID_MAP[pluginKey];
}

