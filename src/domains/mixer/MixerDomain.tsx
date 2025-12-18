/**
 * MixerDomain - Mixer state, routing, and send levels
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface MixerSettings {
  volume: number; // 0-1
  pan: number;    // -1 to 1
  isMuted: boolean;
  isSolo?: boolean;
}

export interface TrackAnalysisData {
  level: number;
  transient: boolean;
  rms?: number;
  peak?: number;
  crestFactor?: number;
  spectralTilt?: number;
  lowBandEnergy?: number;
  automationActive?: boolean;
  automationTargets?: string[];
}

export interface MasterAnalysisData {
  level: number;
  transient: boolean;
  waveform: Uint8Array;
}

export interface SendLevel {
  busId: string;
  level: number; // 0-1
  preFader: boolean;
}

export interface MixerState {
  mixerSettings: Record<string, MixerSettings>;
  sendLevels: Record<string, SendLevel[]>; // trackId -> sends
  soloedTracks: Set<string>;
  masterVolume: number;
  masterMuted: boolean;
  masterBalance: number;
  trackAnalysis: Record<string, TrackAnalysisData>;
  masterAnalysis: MasterAnalysisData;
  busLevels: Record<string, { level: number; peak: number; transient: boolean }>;
  translationProfile: string;
}

export interface MixerActions {
  setTrackVolume: (trackId: string, volume: number | ((prev: number) => number)) => void;
  setTrackPan: (trackId: string, pan: number | ((prev: number) => number)) => void;
  setTrackMute: (trackId: string, muted: boolean | ((prev: boolean) => boolean)) => void;
  setTrackSolo: (trackId: string, solo: boolean | ((prev: boolean) => boolean)) => void;
  
  setSendLevel: (trackId: string, busId: string, level: number | ((prev: number) => number)) => void;
  setSendPreFader: (trackId: string, busId: string, preFader: boolean | ((prev: boolean) => boolean)) => void;
  
  setMasterVolume: (volume: number | ((prev: number) => number)) => void;
  setMasterMuted: (muted: boolean | ((prev: boolean) => boolean)) => void;
  setMasterBalance: (balance: number | ((prev: number) => number)) => void;
  
  setTrackAnalysis: (trackId: string, analysis: TrackAnalysisData) => void;
  setMasterAnalysis: (analysis: MasterAnalysisData) => void;
  
  setBusLevels: (levels: Record<string, { level: number; peak: number; transient: boolean }> | ((prev: Record<string, { level: number; peak: number; transient: boolean }>) => Record<string, { level: number; peak: number; transient: boolean }>)) => void;
  setTranslationProfile: (profile: string) => void;
  
  setAllMixerSettings: (settings: Record<string, MixerSettings>) => void;
  setAllSoloedTracks: (tracks: Set<string>) => void;
  
  initTrackSettings: (trackId: string) => void;
  removeTrackSettings: (trackId: string) => void;
  
  // Ref access
  fxNodesRef: React.MutableRefObject<any>;
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
  const [mixerSettings, setTrackSettings] = useState<Record<string, MixerSettings>>({});
  const [sendLevels, setSendLevels] = useState<Record<string, SendLevel[]>>({});
  const [soloedTracks, setSoloedTracks] = useState<Set<string>>(new Set());
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [masterMuted, setMasterMutedState] = useState(false);
  const [masterBalance, setMasterBalanceState] = useState(0);
  const [trackAnalysis, setTrackAnalysisState] = useState<Record<string, TrackAnalysisData>>({});
  const [masterAnalysis, setMasterAnalysisState] = useState<MasterAnalysisData>({
    level: 0,
    transient: false,
    waveform: new Uint8Array(128)
  });
  const [busLevels, setBusLevelsState] = useState<Record<string, { level: number; peak: number; transient: boolean }>>({});
  const [translationProfile, setTranslationProfileState] = useState('flat');

  // Refs
  const fxNodesRef = useRef<any>({});

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
  const setTrackSolo = useCallback((trackId: string, solo: boolean | ((prev: boolean) => boolean)) => {
    setTrackSettings(prev => {
      const currentSolo = prev[trackId]?.isSolo || false;
      const nextSolo = typeof solo === 'function' ? solo(currentSolo) : solo;
      return {
        ...prev,
        [trackId]: { ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), isSolo: nextSolo }
      };
    });
    setSoloedTracks(prev => {
      const next = new Set(prev);
      // We need to know the new solo state here.
      // Since it's async, we might need to recalculate or use a functional update that handles the set.
      // For soloedTracks set, we'll just let the trackSettings be the source and sync if needed,
      // but simpler is to use functional update on the set but we need the value of 'solo'.
      // If 'solo' is a function, we have to evaluate it.
      return next; 
    });
  }, []);

  // Update setTrackSolo to be more robust
  const setTrackSoloFixed = useCallback((trackId: string, solo: boolean | ((prev: boolean) => boolean)) => {
    setTrackSettings(prev => {
      const currentSolo = prev[trackId]?.isSolo || false;
      const nextSolo = typeof solo === 'function' ? solo(currentSolo) : solo;
      
      setSoloedTracks(prevSoloSet => {
        const nextSet = new Set(prevSoloSet);
        if (nextSolo) nextSet.add(trackId);
        else nextSet.delete(trackId);
        return nextSet;
      });

      return {
        ...prev,
        [trackId]: { ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), isSolo: nextSolo }
      };
    });
  }, []);

  // Helper for functional updates on numeric values
  const applyNumericUpdate = (prev: number | undefined, update: number | ((prev: number) => number), def: number = 0) => {
    return typeof update === 'function' ? update(prev ?? def) : update;
  };

  // Helper for functional updates on boolean values
  const applyBooleanUpdate = (prev: boolean | undefined, update: boolean | ((prev: boolean) => boolean), def: boolean = false) => {
    return typeof update === 'function' ? update(prev ?? def) : update;
  };

  // Redefine volume/pan with functional update support
  const setTrackVolumeFixed = useCallback((trackId: string, volume: number | ((prev: number) => number)) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { 
        ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), 
        volume: Math.max(0, Math.min(1, applyNumericUpdate(prev[trackId]?.volume, volume, 0.8))) 
      }
    }));
  }, []);

  const setTrackPanFixed = useCallback((trackId: string, pan: number | ((prev: number) => number)) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { 
        ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), 
        pan: Math.max(-1, Math.min(1, applyNumericUpdate(prev[trackId]?.pan, pan, 0))) 
      }
    }));
  }, []);

  const setTrackMuteFixed = useCallback((trackId: string, muted: boolean | ((prev: boolean) => boolean)) => {
    setTrackSettings(prev => ({
      ...prev,
      [trackId]: { 
        ...(prev[trackId] || DEFAULT_MIXER_SETTINGS), 
        isMuted: applyBooleanUpdate(prev[trackId]?.isMuted, muted, false) 
      }
    }));
  }, []);

  // Set send level
  const setSendLevel = useCallback((trackId: string, busId: string, level: number | ((prev: number) => number)) => {
    setSendLevels(prev => {
      const trackSends = prev[trackId] || [];
      const existingIndex = trackSends.findIndex(s => s.busId === busId);
      if (existingIndex >= 0) {
        const updated = [...trackSends];
        const nextLevel = typeof level === 'function' ? level(updated[existingIndex].level) : level;
        updated[existingIndex] = { ...updated[existingIndex], level: nextLevel };
        return { ...prev, [trackId]: updated };
      } else {
        const nextLevel = typeof level === 'function' ? level(0) : level;
        return { 
          ...prev, 
          [trackId]: [...trackSends, { busId, level: nextLevel, preFader: false }] 
        };
      }
    });
  }, []);

  // Set send pre-fader
  const setSendPreFader = useCallback((trackId: string, busId: string, preFader: boolean | ((prev: boolean) => boolean)) => {
    setSendLevels(prev => {
      const trackSends = prev[trackId] || [];
      const updated = trackSends.map(s => {
        if (s.busId === busId) {
          const nextPre = typeof preFader === 'function' ? preFader(s.preFader) : preFader;
          return { ...s, preFader: nextPre };
        }
        return s;
      });
      return { ...prev, [trackId]: updated };
    });
  }, []);

  const setMasterVolume = useCallback((volume: number | ((prev: number) => number)) => {
    setMasterVolumeState(prev => {
      const next = typeof volume === 'function' ? volume(prev) : volume;
      return Math.max(0, Math.min(1, next));
    });
  }, []);

  const setMasterMuted = useCallback((muted: boolean | ((prev: boolean) => boolean)) => {
    setMasterMutedState(prev => typeof muted === 'function' ? muted(prev) : muted);
  }, []);

  const setMasterBalance = useCallback((balance: number | ((prev: number) => number)) => {
    setMasterBalanceState(prev => {
      const next = typeof balance === 'function' ? balance(prev) : balance;
      return Math.max(-1, Math.min(1, next));
    });
  }, []);

  const setTrackAnalysis = useCallback((trackId: string, analysis: TrackAnalysisData) => {
    setTrackAnalysisState(prev => ({
      ...prev,
      [trackId]: analysis
    }));
  }, []);

  const setMasterAnalysis = useCallback((analysis: MasterAnalysisData) => {
    setMasterAnalysisState(analysis);
  }, []);

  const setBusLevels = useCallback((levels: any) => {
    setBusLevelsState(levels);
  }, []);

  const setTranslationProfile = useCallback((profile: string) => {
    setTranslationProfileState(profile);
  }, []);

  const setAllMixerSettings = useCallback((settings: Record<string, MixerSettings>) => {
    setTrackSettings(settings);
    
    // Sync soloedTracks set
    const solos = new Set<string>();
    Object.entries(settings).forEach(([id, s]) => {
      if (s.isSolo) solos.add(id);
    });
    setSoloedTracks(solos);
  }, []);

  const setAllSoloedTracks = useCallback((tracks: Set<string>) => {
    setSoloedTracks(tracks);
    // Sync trackSettings isSolo flag
    setTrackSettings(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], isSolo: tracks.has(id) };
      });
      return next;
    });
  }, []);

  const contextValue: MixerDomainContextType = {
    mixerSettings,
    sendLevels,
    soloedTracks,
    masterVolume,
    masterMuted,
    masterBalance,
    trackAnalysis,
    masterAnalysis,
    busLevels,
    translationProfile,
    setTrackVolume: setTrackVolumeFixed,
    setTrackPan: setTrackPanFixed,
    setTrackMute: setTrackMuteFixed,
    setTrackSolo: setTrackSoloFixed,
    setSendLevel,
    setSendPreFader,
    setMasterVolume,
    setMasterMuted,
    setMasterBalance,
    setTrackAnalysis,
    setMasterAnalysis,
    setBusLevels,
    setTranslationProfile,
    setAllMixerSettings,
    setAllSoloedTracks,
    initTrackSettings,
    removeTrackSettings,
    fxNodesRef,
  };

  return (
    <MixerDomainContext.Provider value={contextValue}>
      {children}
    </MixerDomainContext.Provider>
  );
}

export default MixerDomainProvider;
