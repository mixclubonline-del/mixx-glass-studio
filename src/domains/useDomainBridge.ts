/**
 * useDomainBridge - Hook to bridge FlowRuntime state with Domain contexts
 * Phase 31.2: State Migration
 * 
 * This hook provides a gradual migration path by syncing FlowRuntime state
 * with the new domain contexts. Components can start using domain hooks
 * while FlowRuntime still manages the actual state.
 * 
 * Usage:
 * 1. Wrap app in DomainBridge
 * 2. Call useDomainBridge() in FlowRuntime to sync state
 * 3. Child components can use useAudioDomain(), useTracks(), etc.
 */

import { useEffect, useCallback } from 'react';
import { useAudioDomain } from './audio';
import { useTransport } from './transport';
import { useTracks } from './tracks';
import { useMixer } from './mixer';
import { usePlugins } from './plugins';
import { useAI } from './ai';
import { useUI } from './ui';
import { useProject } from './project';
import { useSession } from './session';

// Type for FlowRuntime state that we'll sync from
export interface FlowRuntimeState {
  // Transport
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  isLooping: boolean;
  
  // Tracks
  tracks: Array<{
    id: string;
    trackName: string;
    trackColor: string;
    role: string;
    group: string;
  }>;
  
  // Mixer
  mixerSettings: Record<string, { volume: number; pan: number; isMuted: boolean }>;
  soloedTracks: Set<string>;
  masterVolume: number;
  
  // Audio
  masterReady: boolean;

  // Session (Panel visibility)
  isPianoRollOpen?: boolean;
  isSpectralEditorOpen?: boolean;
  followPlayhead?: boolean;

  // Project
  getProjectState?: () => any;
}

/**
 * Syncs FlowRuntime state with domain contexts
 * Call this in FlowRuntime to enable child components to use domain hooks
 */
export function useDomainBridgeSync(state: Partial<FlowRuntimeState>) {
  // Get domain contexts - call them at the top level to follow hook rules
  const transport = useTransport();
  const tracks = useTracks();
  const mixer = useMixer();
  const project = useProject();
  const session = useSession();

  // Sync transport state
  useEffect(() => {
    if (!transport) return;
    
    if (state.isPlaying !== undefined) {
      if (state.isPlaying && !transport.isPlaying) {
        transport.play();
      } else if (!state.isPlaying && transport.isPlaying) {
        transport.pause();
      }
    }
    
    if (state.bpm !== undefined && state.bpm !== transport.tempo) {
      transport.setTempo(state.bpm);
    }
    
    if (state.isLooping !== undefined && state.isLooping !== transport.loopEnabled) {
      transport.toggleLoop();
    }
  }, [transport, state.isPlaying, state.bpm, state.isLooping]);

  // Sync mixer state
  useEffect(() => {
    if (!mixer || !state.mixerSettings) return;
    
    Object.entries(state.mixerSettings).forEach(([trackId, settings]) => {
      const current = mixer.trackSettings[trackId];
      if (!current) {
        mixer.initTrackSettings(trackId);
      }
      if (current?.volume !== settings.volume) {
        mixer.setTrackVolume(trackId, settings.volume);
      }
      if (current?.pan !== settings.pan) {
        mixer.setTrackPan(trackId, settings.pan);
      }
      if (current?.isMuted !== settings.isMuted) {
        mixer.setTrackMute(trackId, settings.isMuted);
      }
    });
  }, [mixer, state.mixerSettings]);

  // Sync Project state
  useEffect(() => {
    if (state.getProjectState) {
      project.setStateGetter(state.getProjectState);
    }
  }, [project, state.getProjectState]);

  // Sync Session state
  useEffect(() => {
    if (state.isPianoRollOpen !== undefined && state.isPianoRollOpen !== session.isPianoRollOpen) {
      if (state.isPianoRollOpen) {
        // We don't have trackId/clipId here in the simplified sync, 
        // but session.isPianoRollOpen can be updated.
        // During transition, App.tsx still opens it.
      } else {
        session.closePianoRoll();
      }
    }
    
    if (state.isSpectralEditorOpen !== undefined && state.isSpectralEditorOpen !== session.isSpectralEditorOpen) {
      if (!state.isSpectralEditorOpen) {
        session.closeSpectralEditor();
      }
    }

    if (state.followPlayhead !== undefined && state.followPlayhead !== session.followPlayhead) {
      session.setFollowPlayhead(state.followPlayhead);
    }
  }, [session, state.isPianoRollOpen, state.isSpectralEditorOpen, state.followPlayhead]);

  return {
    transport,
    tracks,
    mixer,
    project,
    session,
    isBridgeActive: !!(transport || tracks || mixer),
  };
}

/**
 * Simplified hook for components that just need to check if domains are available
 */
export function useDomainStatus() {
  let hasAudio = false;
  let hasTransport = false;
  let hasTracks = false;
  let hasMixer = false;
  let hasPlugins = false;
  let hasAI = false;
  let hasUI = false;
  
  try { useAudioDomain(); hasAudio = true; } catch { /* not available */ }
  try { useTransport(); hasTransport = true; } catch { /* not available */ }
  try { useTracks(); hasTracks = true; } catch { /* not available */ }
  try { useMixer(); hasMixer = true; } catch { /* not available */ }
  try { usePlugins(); hasPlugins = true; } catch { /* not available */ }
  try { useAI(); hasAI = true; } catch { /* not available */ }
  try { useUI(); hasUI = true; } catch { /* not available */ }
  
  return {
    hasAudio,
    hasTransport,
    hasTracks,
    hasMixer,
    hasPlugins,
    hasAI,
    hasUI,
    allActive: hasAudio && hasTransport && hasTracks && hasMixer && hasPlugins && hasAI && hasUI,
  };
}

export default useDomainBridgeSync;
