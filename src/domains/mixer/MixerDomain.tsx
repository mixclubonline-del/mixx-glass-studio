/**
 * MixerDomain - Mixer state, routing, and send levels
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface MixerSettings {
  volume: number; // 0-1
  pan: number;    // -1 to 1
  isMuted: boolean;
  isSolo: boolean;
}

export interface SendLevel {
  busId: string;
  level: number; // 0-1
  preFader: boolean;
}

export interface MixerState {
  trackSettings: Record<string, MixerSettings>;
  sendLevels: Record<string, SendLevel[]>; // trackId -> sends
  soloedTracks: Set<string>;
  masterVolume: number;
  masterMuted: boolean;
}

export interface MixerActions {
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  setTrackMute: (trackId: string, muted: boolean) => void;
  setTrackSolo: (trackId: string, solo: boolean) => void;
  
  setSendLevel: (trackId: string, busId: string, level: number) => void;
  setSendPreFader: (trackId: string, busId: string, preFader: boolean) => void;
  
  initTrackSettings: (trackId: string) => void;
  removeTrackSettings: (trackId: string) => void;
}

export interface MixerDomainContextType extends MixerState, MixerActions {}

// ============================================================================
// Context
// ============================================================================

const MixerDomainContext = createContext<MixerDomainContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useMixer(): MixerDomainContextType {
  const context = useContext(MixerDomainContext);
  if (!context) {
    throw new Error('useMixer must be used within MixerDomainProvider');
  }
  return context;
}

// ============================================================================
// Default settings
// ============================================================================

const DEFAULT_MIXER_SETTINGS: MixerSettings = {
  volume: 0.8,
  pan: 0,
  isMuted: false,
  isSolo: false,
};

// ============================================================================
// Provider
// ============================================================================

interface MixerDomainProviderProps {
  children: ReactNode;
}

export function MixerDomainProvider({ children }: MixerDomainProviderProps) {
  const [trackSettings, setTrackSettings] = useState<Record<string, MixerSettings>>({});
  const [sendLevels, setSendLevels] = useState<Record<string, SendLevel[]>>({});
  const [soloedTracks, setSoloedTracks] = useState<Set<string>>(new Set());
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [masterMuted, setMasterMuted] = useState(false);

  // Initialize track settings
  const initTrackSettings = useCallback((trackId: string) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { ...DEFAULT_MIXER_SETTINGS }
    }));
    setSendLevels(prev => ({
      ...prev,
      [trackId]: []
    }));
  }, []);

  // Remove track settings
  const removeTrackSettings = useCallback((trackId: string) => {
    setTrackSettings(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
    setSendLevels(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
    setSoloedTracks(prev => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

  // Set track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), volume: Math.max(0, Math.min(1, volume)) }
    }));
  }, []);

  // Set track pan
  const setTrackPan = useCallback((trackId: string, pan: number) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), pan: Math.max(-1, Math.min(1, pan)) }
    }));
  }, []);

  // Set track mute
  const setTrackMute = useCallback((trackId: string, muted: boolean) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), isMuted: muted }
    }));
  }, []);

  // Set track solo
  const setTrackSolo = useCallback((trackId: string, solo: boolean) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), isSolo: solo }
    }));
    setSoloedTracks(prev => {
      const next = new Set(prev);
      if (solo) {
        next.add(trackId);
      } else {
        next.delete(trackId);
      }
      return next;
    });
  }, []);

  // Set send level
  const setSendLevel = useCallback((trackId: string, busId: string, level: number) => {
    setSendLevels(prev => {
      const trackSends = prev[trackId] || [];
      const existingIndex = trackSends.findIndex(s => s.busId === busId);
      if (existingIndex >= 0) {
        const updated = [...trackSends];
        updated[existingIndex] = { ...updated[existingIndex], level };
        return { ...prev, [trackId]: updated };
      } else {
        return { 
          ...prev, 
          [trackId]: [...trackSends, { busId, level, preFader: false }] 
        };
      }
    });
  }, []);

  // Set send pre-fader
  const setSendPreFader = useCallback((trackId: string, busId: string, preFader: boolean) => {
    setSendLevels(prev => {
      const trackSends = prev[trackId] || [];
      const updated = trackSends.map(s => 
        s.busId === busId ? { ...s, preFader } : s
      );
      return { ...prev, [trackId]: updated };
    });
  }, []);

  const contextValue: MixerDomainContextType = {
    trackSettings,
    sendLevels,
    soloedTracks,
    masterVolume,
    masterMuted,
    setTrackVolume,
    setTrackPan,
    setTrackMute,
    setTrackSolo,
    setSendLevel,
    setSendPreFader,
    initTrackSettings,
    removeTrackSettings,
  };

  return (
    <MixerDomainContext.Provider value={contextValue}>
      {children}
    </MixerDomainContext.Provider>
  );
}

export default MixerDomainProvider;
