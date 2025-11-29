/**
 * Plugin Test Configuration
 * 
 * Maps external plugins to their components, audio engines, and initial states.
 * This allows the test harness to dynamically load and test any plugin.
 */

import React from 'react';
import type { PluginKey, PluginStates, SpecificPluginSettingsMap } from '../types';
import { PLUGIN_TIERS } from '../constants';
import type { IAudioEngine } from '../../../types/audio-graph';

// Import all plugin components
import { MixxTune } from '../components/plugins/MixxTune';
import { MixxVerb } from '../components/plugins/MixxVerb';
import { MixxDelay } from '../components/plugins/MixxDelay';
import { MixxDrive } from '../components/plugins/MixxDrive';
import { MixxGlue } from '../components/plugins/MixxGlue';
import MixxAura from '../components/plugins/MixxAura';
import { PrimeEQ } from '../components/plugins/PrimeEQ';
import { MixxPolish } from '../components/plugins/MixxPolish';
import { MixxMorph } from '../components/plugins/MixxMorph';
import { PrimeBrainStem } from '../components/plugins/PrimeBrainStem';
import { MixxLimiter } from '../components/plugins/MixxLimiter';
import { MixxBalance } from '../components/plugins/MixxBalance';
import { MixxCeiling } from '../components/plugins/MixxCeiling';
import { PrimeMasterEQ } from '../components/plugins/PrimeMasterEQ';
import { MixxDither } from '../components/plugins/MixxDither';
import { MixxSoul } from '../components/plugins/MixxSoul';
import { MixxMotion } from '../components/plugins/MixxMotion';
import { PrimeLens } from '../components/plugins/PrimeLens';
import { MixxBrainwave } from '../components/plugins/MixxBrainwave';
import { MixxSpirit } from '../components/plugins/MixxSpirit';
import { MixxAnalyzerPro } from '../components/plugins/MixxAnalyzerPro';
import { PrimeRouter } from '../components/plugins/PrimeRouter';
import { MixxPort } from '../components/plugins/MixxPort';
import { TelemetryCollector } from '../components/plugins/TelemetryCollector';
import { PrimeBotConsole } from '../components/plugins/PrimeBotConsole';

// Import audio engines
import { getMixxAuraEngine } from '../../../audio/MixxAuraEngine';
import { getPrimeEQEngine } from '../../../audio/PrimeEQEngine';
import { getMixxPolishEngine } from '../../../audio/MixxPolishEngine';
import { getMixxTuneEngine } from '../../../audio/MixxTuneEngine';
import { getMixxVerbEngine } from '../../../audio/MixxVerbEngine';
import { getMixxDelayEngine } from '../../../audio/MixxDelayEngine';
import { getMixxDriveEngine } from '../../../audio/MixxDriveEngine';
import { getMixxGlueEngine } from '../../../audio/MixxGlueEngine';
import { getMixxLimiterEngine } from '../../../audio/MixxLimiterEngine';
import { PlaceholderAudioEngine } from '../../../audio/plugins';

// Component map
export const PLUGIN_COMPONENTS: Record<PluginKey, React.ComponentType<any>> = {
  MixxTune,
  MixxVerb,
  MixxDelay,
  MixxDrive,
  MixxGlue,
  MixxAura,
  PrimeEQ,
  MixxPolish,
  MixxMorph,
  PrimeBrainStem,
  MixxLimiter,
  MixxBalance,
  MixxCeiling,
  PrimeMasterEQ,
  MixxDither,
  MixxSoul,
  MixxMotion,
  PrimeLens,
  MixxBrainwave,
  MixxSpirit,
  MixxAnalyzerPro,
  PrimeRouter,
  MixxPort,
  TelemetryCollector,
  PrimeBotConsole,
};

// Audio engine factory map
export const PLUGIN_ENGINE_FACTORIES: Partial<Record<PluginKey, (ctx: BaseAudioContext | null) => IAudioEngine>> = {
  'MixxAura': getMixxAuraEngine,
  'PrimeEQ': getPrimeEQEngine,
  'MixxPolish': getMixxPolishEngine,
  'MixxTune': getMixxTuneEngine,
  'MixxVerb': getMixxVerbEngine,
  'MixxDelay': getMixxDelayEngine,
  'MixxDrive': getMixxDriveEngine,
  'MixxGlue': getMixxGlueEngine,
  'MixxLimiter': getMixxLimiterEngine,
  // Add more as engines become available
};

// Initial state factories
export function getInitialPluginState<K extends PluginKey>(pluginKey: K): SpecificPluginSettingsMap[K] {
  const baseDefaults = { mix: 100, output: 50 };
  
  switch (pluginKey) {
    case 'MixxTune':
      return { ...baseDefaults, retuneSpeed: 50, formant: 50, humanize: 50, emotiveLock: false, sidechainActive: false } as SpecificPluginSettingsMap[K];
    case 'MixxVerb':
      return { ...baseDefaults, size: 50, predelay: 20 } as SpecificPluginSettingsMap[K];
    case 'MixxDelay':
      return { ...baseDefaults, time: 250, feedback: 45, throwIntuition: 50 } as SpecificPluginSettingsMap[K];
    case 'MixxDrive':
      return { ...baseDefaults, drive: 30, warmth: 50, color: 50 } as SpecificPluginSettingsMap[K];
    case 'MixxGlue':
      return { ...baseDefaults, threshold: -20, ratio: 4, release: 100, sidechainActive: false } as SpecificPluginSettingsMap[K];
    case 'MixxAura':
      return { ...baseDefaults, tone: 50, width: 50, shine: 50, moodLock: false } as SpecificPluginSettingsMap[K];
    case 'PrimeEQ':
      return { ...baseDefaults, lowGain: 0, midGain: 0, highGain: 0, smartFocus: 50 } as SpecificPluginSettingsMap[K];
    case 'MixxPolish':
      return { ...baseDefaults, clarity: 50, air: 50, balance: 50 } as SpecificPluginSettingsMap[K];
    case 'MixxMorph':
      return { ...baseDefaults, transitionTime: 1000, morphDepth: 50, syncMode: 'bpm' } as SpecificPluginSettingsMap[K];
    case 'PrimeBrainStem':
      return { ...baseDefaults } as SpecificPluginSettingsMap[K];
    case 'MixxLimiter':
      return { ...baseDefaults, ceiling: -0.1, drive: 0, lookahead: 2, clubCheck: false, sidechainActive: false } as SpecificPluginSettingsMap[K];
    case 'MixxBalance':
      return { ...baseDefaults, width: 50, phase: 50, tilt: 50 } as SpecificPluginSettingsMap[K];
    case 'MixxCeiling':
      return { ...baseDefaults, level: 0, softClip: 50, tone: 50 } as SpecificPluginSettingsMap[K];
    case 'PrimeMasterEQ':
      return { ...baseDefaults, lowShelfFreq: 120, lowShelfGain: 0, highShelfFreq: 8000, highShelfGain: 0, midSideMode: false } as SpecificPluginSettingsMap[K];
    case 'MixxDither':
      return { ...baseDefaults, bitDepth: 16, noiseShaping: 'low', ditherAmount: 100 } as SpecificPluginSettingsMap[K];
    case 'MixxSoul':
      return { ...baseDefaults, empathy: 50, depth: 50, tone: 50, vibe: 50 } as SpecificPluginSettingsMap[K];
    case 'MixxMotion':
      return { ...baseDefaults, rate: 50, depth: 50, sync: true } as SpecificPluginSettingsMap[K];
    case 'PrimeLens':
      return { ...baseDefaults, gain: 50, resolution: 50, colorMode: 'spectral' } as SpecificPluginSettingsMap[K];
    case 'MixxBrainwave':
      return { ...baseDefaults, seed: 50, variation: 50, intensity: 50 } as SpecificPluginSettingsMap[K];
    case 'MixxSpirit':
      return { ...baseDefaults, sensitivity: 50, energyLink: 50, threshold: 80 } as SpecificPluginSettingsMap[K];
    case 'MixxAnalyzerPro':
      return { ...baseDefaults } as SpecificPluginSettingsMap[K];
    case 'PrimeRouter':
      return { ...baseDefaults } as SpecificPluginSettingsMap[K];
    case 'MixxPort':
      return { ...baseDefaults, format: 'mixx', quality: 90 } as SpecificPluginSettingsMap[K];
    case 'TelemetryCollector':
      return { ...baseDefaults } as SpecificPluginSettingsMap[K];
    case 'PrimeBotConsole':
      return { ...baseDefaults } as SpecificPluginSettingsMap[K];
    default:
      return baseDefaults as SpecificPluginSettingsMap[K];
  }
}

// Get all available plugins grouped by tier
export function getAvailablePluginsByTier(): Array<{ tier: string; plugins: PluginKey[] }> {
  return Object.entries(PLUGIN_TIERS).map(([tierName, tierPlugins]) => ({
    tier: tierName,
    plugins: Object.keys(tierPlugins) as PluginKey[],
  }));
}

// Check if plugin has audio engine support
export function hasAudioEngine(pluginKey: PluginKey): boolean {
  return pluginKey in PLUGIN_ENGINE_FACTORIES;
}

