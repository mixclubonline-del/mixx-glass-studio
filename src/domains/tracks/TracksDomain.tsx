/**
 * TracksDomain - Track state and CRUD operations
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useArrange, ArrangeClip } from '../../hooks/useArrange';

// ============================================================================
// Types
// ============================================================================

// From App.tsx
export type TrackRole = 'twoTrack' | 'hushRecord' | 'standard';

export interface Track {
  id: string;
  trackName: string;
  trackColor: 'cyan' | 'magenta' | 'blue' | 'green' | 'purple' | 'crimson';
  waveformType: 'dense' | 'sparse' | 'varied' | 'bass';
  group: 'Vocals' | 'Harmony' | 'Adlibs' | 'Bass' | 'Drums' | 'Instruments';
  isProcessing?: boolean;
  role: TrackRole;
  locked?: boolean;
}

// From useArrange.ts
export type { ArrangeClip as Clip } from '../../hooks/useArrange';
import { ArrangeClip as Clip } from '../../hooks/useArrange';

export interface TracksState {
  tracks: Track[];
  selectedTrackId: string | null;
  // Arrange state
  clips: Clip[];
  selection: { start: number; end: number } | null;
  selectedClipIds: string[];
  pixelsPerSecond: number;
  scrollX: number;
  ppsAPI: {
    value: number;
    set: (pps: number) => void;
    zoomBy: (factor: number, anchorSec: number) => void;
  };
  canUndo: boolean;
  canRedo: boolean;
}

export interface TracksActions {
  // Track Actions
  addTrack: (track: Omit<Track, 'id'>) => string;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  selectTrack: (trackId: string | null) => void;
  setAllTracks: (tracks: Track[]) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;

  // Clip / Arrange actions (proxied from useArrange)
  addClip: (clip: Omit<Clip, 'id'>) => string; 
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  selectClips: (clipIds: string[]) => void;
  setAllClips: (clips: Clip[]) => void;

  setClips: (clips: Clip[] | ((prev: Clip[]) => Clip[])) => void;
  setSelection: (start: number, end: number) => void;
  clearSelection: () => void;
  setPps: (pps: number) => void;
  zoomBy: (factor: number, anchorSec: number) => void;
  setScrollX: (x: number) => void;
  moveClip: (id: string, newStart: number, newTrackId: string) => void;
  resizeClip: (id: string, newStart: number, newDuration: number, newSourceStart?: number) => void;
  updateClipProperties: (id: string, props: Partial<Clip>) => void;
  onSplitAt: (clipId: string, splitTime: number) => void;
  splitSelection: (splitTime: number) => void;
  setClipsSelect: (ids: string[], selected: boolean) => void;
  duplicateClips: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
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
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Use Arrange Hook (State source of truth for clips)
  const arrange = useArrange({ clips: [] });
  
  // Destructure arrange for clarity
  const { 
    clips, setClips, selection, setSelection, clearSelection, 
    ppsAPI, scrollX, setScrollX, 
    moveClip, resizeClip, onSplitAt, setClipsSelect, 
    duplicateClips, updateClipProperties, splitSelection,
    undo, redo, canUndo, canRedo 
  } = arrange;

  // --- Track Actions ---

  const addTrack = useCallback((trackData: Omit<Track, 'id'>): string => {
    const id = generateTrackId();
    const track: Track = { ...trackData, id };
    setTracks(prev => [...prev, track]);
    return id;
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    // Also remove clips for this track
    setClips(prev => prev.filter(c => c.trackId !== trackId));
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
  }, [selectedTrackId, setClips]);

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, ...updates } : t
    ));
  }, []);

  const selectTrack = useCallback((trackId: string | null) => {
    setSelectedTrackId(trackId);
  }, []);

  const setAllTracks = useCallback((tracks: Track[]) => {
    setTracks(tracks);
  }, []);

  const reorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    setTracks(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  // --- Clip Actions (Wrappers) ---

  const addClip = useCallback((clipData: Omit<Clip, 'id'>): string => {
    const id = generateClipId();
    const clip: Clip = { ...clipData, id };
    setClips(prev => [...prev, clip]);
    return id;
  }, [setClips]);
  
  const removeClip = useCallback((clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
  }, [setClips]);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
      updateClipProperties(clipId, updates);
  }, [updateClipProperties]);

  const selectClips = useCallback((clipIds: string[]) => {
      setClipsSelect(clipIds, true);
  }, [setClipsSelect]);

  const setAllClips = useCallback((clips: Clip[]) => {
    setClips(clips);
  }, [setClips]);


  const contextValue: TracksDomainContextType = {
    // Track State
    tracks,
    selectedTrackId,
    
    // Arrange State (from hook)
    clips,
    selection,
    selectedClipIds: clips.filter(c => c.selected).map(c => c.id),
    pixelsPerSecond: ppsAPI.value,
    ppsAPI,
    scrollX,
    canUndo: canUndo(),
    canRedo: canRedo(),
    
    // Track Actions
    addTrack,
    removeTrack,
    updateTrack,
    selectTrack,
    setAllTracks,
    reorderTracks,
    
    // Arrange Actions
    addClip,
    removeClip,
    updateClip,
    selectClips,
    setAllClips,
    setClips,
    
    setSelection,
    clearSelection,
    setPps: ppsAPI.set,
    zoomBy: ppsAPI.zoomBy,
    setScrollX,
    moveClip,
    resizeClip,
    updateClipProperties,
    onSplitAt,
    splitSelection,
    setClipsSelect,
    duplicateClips,
    undo,
    redo
  };

  return (
    <TracksDomainContext.Provider value={contextValue}>
      {children}
    </TracksDomainContext.Provider>
  );
}

export default TracksDomainProvider;
