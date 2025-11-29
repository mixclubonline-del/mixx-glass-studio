/**
 * External Plugin Test Harness
 * 
 * Tests external plugin components with the current Studio audio engine system.
 * Supports testing any plugin from the external system with a plugin selector.
 * 
 * Supports Flow by providing a test interface that doesn't break existing workflows.
 * Supports Reduction by isolating test code from production code.
 * Supports Recall by preserving test state during evaluation.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { findPlugin, PLUGIN_TIERS } from '../constants';
import type { 
  PluginKey, 
  SessionContext, 
  AudioSignal,
  GlobalSettings,
  PluginComponentProps,
  PluginStates,
  SpecificPluginSettingsMap
} from '../types';
import { syncStateToEngine } from '../adapters/audioEngineAdapter';
import type { IAudioEngine } from '../../../types/audio-graph';
import { PlaceholderAudioEngine } from '../../../audio/plugins';
import {
  PLUGIN_COMPONENTS,
  PLUGIN_ENGINE_FACTORIES,
  getInitialPluginState,
  getAvailablePluginsByTier,
  hasAudioEngine,
} from './pluginTestConfig';

interface ExternalPluginTestHarnessProps {
  audioContext: AudioContext | null;
  onClose?: () => void;
}

/**
 * Simulates audio signal for visualizers
 */
function createSimulatedAudioSignal(): AudioSignal {
  const waveform = new Float32Array(512);
  for (let i = 0; i < waveform.length; i++) {
    waveform[i] = Math.sin((i / waveform.length) * Math.PI * 4) * 0.5 + Math.random() * 0.1;
  }
  
  return {
    level: 0.3 + Math.random() * 0.4,
    peak: 0.5 + Math.random() * 0.3,
    transients: Math.random() > 0.7,
    waveform,
    time: performance.now() / 1000,
  };
}

export const ExternalPluginTestHarness: React.FC<ExternalPluginTestHarnessProps> = ({
  audioContext,
  onClose,
}) => {
  const [selectedPlugin, setSelectedPlugin] = useState<PluginKey>('MixxAura');
  const [sessionContext, setSessionContext] = useState<SessionContext>({ mood: 'Neutral' });
  const [pluginStates, setPluginStates] = useState<PluginStates>(() => {
    const states = {} as PluginStates;
    Object.keys(PLUGIN_COMPONENTS).forEach((key) => {
      states[key as PluginKey] = getInitialPluginState(key as PluginKey);
    });
    return states;
  });
  const [audioSignal, setAudioSignal] = useState<AudioSignal>(createSimulatedAudioSignal());
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    uiTheme: 'dark',
    animationIntensity: 75,
    visualizerComplexity: 'high',
  });
  
  const engineRef = useRef<IAudioEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentPluginState = pluginStates[selectedPlugin];
  const pluginInfo = findPlugin(selectedPlugin);
  const PluginComponent = PLUGIN_COMPONENTS[selectedPlugin];
  const engineFactory = PLUGIN_ENGINE_FACTORIES[selectedPlugin];
  const pluginId = pluginInfo.id;

  // Initialize audio engine when plugin changes
  useEffect(() => {
    if (!audioContext) return;
    
    // Cleanup previous engine
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    // Initialize new engine
    if (engineFactory) {
      const engine = engineFactory(audioContext);
      engine.initialize(audioContext).then(() => {
        engineRef.current = engine;
        // Initial sync
        syncStateToEngine(engine, currentPluginState, pluginId);
      });
    } else {
      // Use placeholder engine if no factory available
      engineRef.current = new PlaceholderAudioEngine(audioContext);
      engineRef.current.initialize(audioContext);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [audioContext, selectedPlugin, engineFactory, pluginId]);

  // Sync plugin state to audio engine
  useEffect(() => {
    if (engineRef.current && engineFactory) {
      syncStateToEngine(engineRef.current, currentPluginState, pluginId);
    }
  }, [currentPluginState, engineFactory, pluginId]);

  // Simulate audio signal updates
  useEffect(() => {
    const updateAudioSignal = () => {
      setAudioSignal(createSimulatedAudioSignal());
      animationFrameRef.current = requestAnimationFrame(updateAudioSignal);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateAudioSignal);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handlePluginStateChange = useCallback(<K extends PluginKey>(
    newState: Partial<SpecificPluginSettingsMap[K]> | ((prev: SpecificPluginSettingsMap[K]) => Partial<SpecificPluginSettingsMap[K]>)
  ) => {
    setPluginStates(prev => {
      const currentState = prev[selectedPlugin];
      const updated = typeof newState === 'function' 
        ? (newState as Function)(currentState)
        : newState;
      
      return {
        ...prev,
        [selectedPlugin]: {
          ...currentState,
          ...updated,
        } as SpecificPluginSettingsMap[K],
      };
    });
  }, [selectedPlugin]);

  const handleMidiLearn = useCallback((paramName: string, min: number, max: number) => {
    console.log('[TEST] MIDI Learn requested:', { plugin: selectedPlugin, paramName, min, max });
    // MIDI learn not implemented in test harness
  }, [selectedPlugin]);

  const isLearning = useCallback((paramName: string) => {
    return false; // MIDI learn not active in test
  }, []);

  const pluginProps: PluginComponentProps<any> = {
    name: pluginInfo.name,
    description: pluginInfo.description,
    sessionContext,
    setSessionContext,
    pluginState: currentPluginState,
    setPluginState: handlePluginStateChange,
    isLearning,
    onMidiLearn: handleMidiLearn,
    isSidechainTarget: false,
    audioSignal,
    onClose,
    globalSettings,
  };

  const availablePlugins = getAvailablePluginsByTier();
  const hasEngine = hasAudioEngine(selectedPlugin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[90vw] h-[90vh] max-w-6xl max-h-[800px]">
        {/* Test Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">External Plugin Test</h2>
                <p className="text-sm text-white/60">{pluginInfo.name} - {pluginInfo.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-white/80 text-sm">Plugin:</label>
                <select
                  value={selectedPlugin}
                  onChange={(e) => setSelectedPlugin(e.target.value as PluginKey)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm border border-white/20"
                >
                  {availablePlugins.map(({ tier, plugins }) => (
                    <optgroup key={tier} label={tier}>
                      {plugins.map((pluginKey) => (
                        <option key={pluginKey} value={pluginKey}>
                          {findPlugin(pluginKey).name} {hasAudioEngine(pluginKey) ? '🎛️' : '🎨'}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {hasEngine ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-200 text-xs rounded border border-green-500/30">
                    Audio Engine
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 text-xs rounded border border-yellow-500/30">
                    Visual Only
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setGlobalSettings(prev => ({ ...prev, animationIntensity: Math.min(100, prev.animationIntensity + 10) }))}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
            >
              + Animation
            </button>
            <button
              onClick={() => setGlobalSettings(prev => ({ ...prev, animationIntensity: Math.max(0, prev.animationIntensity - 10) }))}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
            >
              - Animation
            </button>
            <select
              value={sessionContext.mood}
              onChange={(e) => setSessionContext({ mood: e.target.value as SessionContext['mood'] })}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm border border-white/20"
            >
              <option value="Neutral">Neutral</option>
              <option value="Warm">Warm</option>
              <option value="Bright">Bright</option>
              <option value="Dark">Dark</option>
              <option value="Energetic">Energetic</option>
            </select>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-white text-sm font-bold"
              >
                Close Test
              </button>
            )}
          </div>
        </div>

        {/* Plugin Component */}
        <div className="absolute inset-0 top-24 bottom-20">
          <PluginComponent {...pluginProps} />
        </div>

        {/* Debug Info */}
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/20 text-xs text-white/80 font-mono">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-white/60 mb-1">Engine Status</div>
              <div>{engineRef.current ? '✅ Connected' : '⏳ Initializing...'}</div>
              <div className="text-white/40 mt-1">{hasEngine ? 'Real Audio Engine' : 'Placeholder Engine'}</div>
            </div>
            <div>
              <div className="text-white/60 mb-1">Plugin State</div>
              <div className="truncate">
                {Object.entries(currentPluginState)
                  .filter(([key]) => key !== 'mix' && key !== 'output')
                  .slice(0, 3)
                  .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(0) : String(value)}`)
                  .join(' | ')}
              </div>
            </div>
            <div>
              <div className="text-white/60 mb-1">Audio Signal</div>
              <div>Level: {(audioSignal.level * 100).toFixed(1)}% | Peak: {(audioSignal.peak * 100).toFixed(1)}%</div>
              <div className="text-white/40 mt-1">Transients: {audioSignal.transients ? '✅' : '❌'}</div>
            </div>
            <div>
              <div className="text-white/60 mb-1">Tier & Info</div>
              <div>{pluginInfo.tier} • {pluginInfo.parameters.length} params</div>
              <div className="text-white/40 mt-1">{pluginInfo.suggestedBy ? `Suggested by ${pluginInfo.suggestedBy}` : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
