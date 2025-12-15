/**
 * useMasterChain - React hook for master chain state management
 * Phase 25: React Integration Layer
 */

import { useState, useCallback, useEffect } from 'react';
import { rustAudio, MasteringProfile, MasterChainMeters, PROFILE_INFO } from '../types/rust-audio';

export interface MasterChainState {
  initialized: boolean;
  profile: MasteringProfile;
  meters: MasterChainMeters | null;
  error: string | null;
}

export function useMasterChain(sampleRate: number = 48000) {
  const [state, setState] = useState<MasterChainState>({
    initialized: false,
    profile: MasteringProfile.Streaming,
    meters: null,
    error: null,
  });

  // Initialize master chain
  const initialize = useCallback(async (profile: MasteringProfile = MasteringProfile.Streaming) => {
    try {
      await rustAudio.masterChain.create(sampleRate, profile);
      setState(prev => ({
        ...prev,
        initialized: true,
        profile,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, [sampleRate]);

  // Change profile
  const setProfile = useCallback(async (profile: MasteringProfile) => {
    try {
      await rustAudio.masterChain.setProfile(profile);
      setState(prev => ({
        ...prev,
        profile,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  // Set parameter
  const setParameter = useCallback(async (name: string, value: number) => {
    try {
      await rustAudio.masterChain.setParameter(name, value);
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  // Poll meters (optional - prefer useLoudnessMeters for event-based)
  const refreshMeters = useCallback(async () => {
    if (!state.initialized) return;
    
    try {
      const meters = await rustAudio.masterChain.getMeters();
      setState(prev => ({
        ...prev,
        meters,
        error: null,
      }));
    } catch (err) {
      // Silently fail for polling
    }
  }, [state.initialized]);

  // Get profile info
  const profileInfo = PROFILE_INFO[state.profile];

  return {
    ...state,
    profileInfo,
    initialize,
    setProfile,
    setParameter,
    refreshMeters,
  };
}

export default useMasterChain;
