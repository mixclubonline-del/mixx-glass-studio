/**
 * Flow Timeline Store (Zustand)
 * 
 * The official immutable state management for Flow's timeline.
 * This ensures React always sees changes and ArrangeWindow hydrates correctly.
 * 
 * Flow's golden path: Import → Zustand → React → Timeline → AudioGraph
 */

import { create } from 'zustand';
import type { TrackData } from '../App';
import type { ArrangeClip } from '../hooks/useArrange';

export interface TimelineMarker {
  id: string;
  name: string;
  time: number; // seconds
  color: string;
}

export interface TimelineState {
  tracks: TrackData[];
  clips: ArrangeClip[];
  markers: TimelineMarker[];
  audioBuffers: Record<string, AudioBuffer>;
}

interface TimelineActions {
  addTrack: (track: TrackData) => void;
  addClip: (trackId: string, clip: ArrangeClip) => void;
  removeTrack: (trackId: string) => void;
  removeClip: (clipId: string) => void;
  updateTrack: (trackId: string, updates: Partial<TrackData>) => void;
  updateClip: (clipId: string, updates: Partial<ArrangeClip>) => void;
  addMarker: (marker: TimelineMarker) => void;
  removeMarker: (markerId: string) => void;
  updateMarker: (markerId: string, updates: Partial<TimelineMarker>) => void;
  setAudioBuffer: (bufferId: string, buffer: AudioBuffer) => void;
  // Sync helpers for React state
  getTracks: () => TrackData[];
  getClips: () => ArrangeClip[];
  getAudioBuffers: () => Record<string, AudioBuffer>;
}

type TimelineStore = TimelineState & TimelineActions;

/**
 * Flow Timeline Store
 * 
 * Immutable state management for tracks, clips, and audio buffers.
 * All mutations go through Zustand's immutable setters.
 */
export const useTimelineStore = create<TimelineStore>((set, get) => ({
  // Initial state
  tracks: [],
  clips: [],
  markers: [],
  audioBuffers: {},

  // Actions
  addTrack: (track: TrackData) => {
    set((state) => ({
      tracks: [...state.tracks, track],
    }));
  },

  addClip: (trackId: string, clip: ArrangeClip) => {
    set((state) => ({
      clips: [...state.clips, { ...clip, trackId }],
    }));
  },

  removeTrack: (trackId: string) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      clips: state.clips.filter((c) => c.trackId !== trackId),
    }));
  },

  removeClip: (clipId: string) => {
    set((state) => ({
      clips: state.clips.filter((c) => c.id !== clipId),
    }));
  },

  updateTrack: (trackId: string, updates: Partial<TrackData>) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    }));
  },

  updateClip: (clipId: string, updates: Partial<ArrangeClip>) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, ...updates } : c
      ),
    }));
  },

  setAudioBuffer: (bufferId: string, buffer: AudioBuffer) => {
    set((state) => ({
      audioBuffers: { ...state.audioBuffers, [bufferId]: buffer },
    }));
  },

  addMarker: (marker: TimelineMarker) => {
    set((state) => ({
      markers: [...state.markers, marker],
    }));
  },

  removeMarker: (markerId: string) => {
    set((state) => ({
      markers: state.markers.filter((m) => m.id !== markerId),
    }));
  },

  updateMarker: (markerId: string, updates: Partial<TimelineMarker>) => {
    set((state) => ({
      markers: state.markers.map((m) => (m.id === markerId ? { ...m, ...updates } : m)),
    }));
  },

  // Sync helpers for React state
  getTracks: () => get().tracks,
  getClips: () => get().clips,
  getAudioBuffers: () => get().audioBuffers,
}));

