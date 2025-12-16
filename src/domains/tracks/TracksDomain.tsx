/**
 * TracksDomain - Track state and CRUD operations
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type TrackRole = 'vocals' | 'drums' | 'bass' | 'guitar' | 'piano' | 'synths' | 'strings' | 'other';
export type TrackColor = 'cyan' | 'magenta' | 'blue' | 'green' | 'purple' | 'crimson';
export type TrackGroup = 'Vocals' | 'Harmony' | 'Adlibs' | 'Bass' | 'Drums' | 'Instruments';
export type WaveformType = 'dense' | 'sparse' | 'varied' | 'bass';

export interface Track {
  id: string;
  trackName: string;
  trackColor: TrackColor;
  waveformType: WaveformType;
  group: TrackGroup;
  role: TrackRole;
  isProcessing?: boolean;
  locked?: boolean;
}

export interface Clip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  buffer?: AudioBuffer;
  name: string;
  offset: number;
}

export interface TracksState {
  tracks: Track[];
  clips: Record<string, Clip[]>; // trackId -> clips
  selectedTrackId: string | null;
  selectedClipIds: string[];
}

export interface TracksActions {
  addTrack: (track: Omit<Track, 'id'>) => string;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  selectTrack: (trackId: string | null) => void;
  
  addClip: (trackId: string, clip: Omit<Clip, 'id'>) => string;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  selectClips: (clipIds: string[]) => void;
  
  reorderTracks: (fromIndex: number, toIndex: number) => void;
}

export interface TracksDomainContextType extends TracksState, TracksActions {}

// ============================================================================
// Context
// ============================================================================

const TracksDomainContext = createContext<TracksDomainContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useTracks(): TracksDomainContextType {
  const context = useContext(TracksDomainContext);
  if (!context) {
    throw new Error('useTracks must be used within TracksDomainProvider');
  }
  return context;
}

// ============================================================================
// Utilities
// ============================================================================

let trackIdCounter = 0;
const generateTrackId = () => `track-${++trackIdCounter}-${Date.now().toString(36)}`;

let clipIdCounter = 0;
const generateClipId = () => `clip-${++clipIdCounter}-${Date.now().toString(36)}`;

// ============================================================================
// Provider
// ============================================================================

interface TracksDomainProviderProps {
  children: ReactNode;
}

export function TracksDomainProvider({ children }: TracksDomainProviderProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [clips, setClips] = useState<Record<string, Clip[]>>({});
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);

  // Add track
  const addTrack = useCallback((trackData: Omit<Track, 'id'>): string => {
    const id = generateTrackId();
    const track: Track = { ...trackData, id };
    setTracks(prev => [...prev, track]);
    setClips(prev => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  // Remove track
  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setClips(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
  }, [selectedTrackId]);

  // Update track
  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, ...updates } : t
    ));
  }, []);

  // Select track
  const selectTrack = useCallback((trackId: string | null) => {
    setSelectedTrackId(trackId);
  }, []);

  // Add clip
  const addClip = useCallback((trackId: string, clipData: Omit<Clip, 'id'>): string => {
    const id = generateClipId();
    const clip: Clip = { ...clipData, id };
    setClips(prev => ({
      ...prev,
      [trackId]: [...(prev[trackId] || []), clip]
    }));
    return id;
  }, []);

  // Remove clip
  const removeClip = useCallback((clipId: string) => {
    setClips(prev => {
      const next: Record<string, Clip[]> = {};
      for (const [trackId, trackClips] of Object.entries(prev)) {
        next[trackId] = trackClips.filter(c => c.id !== clipId);
      }
      return next;
    });
    setSelectedClipIds(prev => prev.filter(id => id !== clipId));
  }, []);

  // Update clip
  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    setClips(prev => {
      const next: Record<string, Clip[]> = {};
      for (const [trackId, trackClips] of Object.entries(prev)) {
        next[trackId] = trackClips.map(c => 
          c.id === clipId ? { ...c, ...updates } : c
        );
      }
      return next;
    });
  }, []);

  // Select clips
  const selectClips = useCallback((clipIds: string[]) => {
    setSelectedClipIds(clipIds);
  }, []);

  // Reorder tracks
  const reorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    setTracks(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const contextValue: TracksDomainContextType = {
    tracks,
    clips,
    selectedTrackId,
    selectedClipIds,
    addTrack,
    removeTrack,
    updateTrack,
    selectTrack,
    addClip,
    removeClip,
    updateClip,
    selectClips,
    reorderTracks,
  };

  return (
    <TracksDomainContext.Provider value={contextValue}>
      {children}
    </TracksDomainContext.Provider>
  );
}

export default TracksDomainProvider;
