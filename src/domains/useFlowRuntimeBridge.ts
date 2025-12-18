/**
 * useFlowRuntimeBridge - Bridge hook to sync FlowRuntime state with domains
 * Phase 31.2: State Migration
 * 
 * Call this hook at the top of FlowRuntime to enable child components
 * to access state via domain hooks.
 */

import { useEffect, useRef } from 'react';
import { useMixer } from './mixer';
import { useTransport } from './transport';
import { useAI } from './ai';

interface FlowRuntimeMixerState {
  mixerSettings: Record<string, { volume: number; pan: number; isMuted: boolean }>;
  soloedTracks: Set<string>;
  masterVolume: number;
}

interface FlowRuntimeTransportState {
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  isLooping: boolean;
}

interface FlowRuntimeAIState {
  primeBrainMode?: 'passive' | 'active' | 'learning' | 'optimizing';
}

/**
 * Syncs FlowRuntime mixer state to MixerDomain
 * This allows child components to use useMixer() hook
 */
export function useMixerBridgeSync(state: FlowRuntimeMixerState) {
  const mixer = useMixer();
  const prevSettingsRef = useRef<string>('');

  useEffect(() => {
    // Only sync if settings changed (avoid infinite loops)
    const settingsKey = JSON.stringify(state.mixerSettings);
    if (settingsKey === prevSettingsRef.current) return;
    prevSettingsRef.current = settingsKey;

    // Sync track settings
    Object.entries(state.mixerSettings).forEach(([trackId, settings]) => {
      const current = mixer.trackSettings[trackId];
      
      // Initialize if not exists
      if (!current) {
        mixer.initTrackSettings(trackId);
      }
      
      // Sync volume
      if (current?.volume !== settings.volume) {
        mixer.setTrackVolume(trackId, settings.volume);
      }
      
      // Sync pan
      if (current?.pan !== settings.pan) {
        mixer.setTrackPan(trackId, settings.pan);
      }
      
      // Sync mute
      if (current?.isMuted !== settings.isMuted) {
        mixer.setTrackMute(trackId, settings.isMuted);
      }
    });

    // Sync solos
    state.soloedTracks.forEach(trackId => {
      if (!mixer.soloedTracks.has(trackId)) {
        mixer.setTrackSolo(trackId, true);
      }
    });
  }, [state.mixerSettings, state.soloedTracks, mixer]);
}

/**
 * Syncs FlowRuntime transport state to TransportDomain
 * This allows child components to use useTransport() hook
 */
export function useTransportBridgeSync(state: FlowRuntimeTransportState) {
  const transport = useTransport();
  const prevStateRef = useRef<string>('');

  useEffect(() => {
    const stateKey = `${state.isPlaying}-${state.bpm}-${state.isLooping}`;
    if (stateKey === prevStateRef.current) return;
    prevStateRef.current = stateKey;

    // Sync playing state
    if (state.isPlaying !== transport.isPlaying) {
      if (state.isPlaying) {
        transport.play();
      } else {
        transport.pause();
      }
    }

    // Sync tempo
    if (state.bpm !== transport.bpm) {
      transport.setBpm(state.bpm);
    }

    // Sync loop
    if (state.isLooping !== transport.isLooping) {
      transport.setIsLooping(state.isLooping);
    }
  }, [state.isPlaying, state.bpm, state.isLooping, transport]);
}

/**
 * Syncs FlowRuntime AI state to AIDomain
 * This allows child components to use useAI() hook
 */
export function useAIBridgeSync(state: FlowRuntimeAIState) {
  const ai = useAI();

  useEffect(() => {
    if (state.primeBrainMode && state.primeBrainMode !== ai.primeBrainMode) {
      ai.setPrimeBrainMode(state.primeBrainMode);
    }
  }, [state.primeBrainMode, ai]);
}

/**
 * Combined bridge hook - call once in FlowRuntime
 */
export function useFlowRuntimeBridge(state: {
  mixer?: FlowRuntimeMixerState;
  transport?: FlowRuntimeTransportState;
  ai?: FlowRuntimeAIState;
}) {
  if (state.mixer) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMixerBridgeSync(state.mixer);
  }
  if (state.transport) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTransportBridgeSync(state.transport);
  }
  if (state.ai) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAIBridgeSync(state.ai);
  }
}

export default useFlowRuntimeBridge;
