/**
 * Timeline state management with Zustand
 */

import { create } from 'zustand';
import { GridResolution, ViewMode } from '@/types/timeline';

interface TimelineState {
  // Playback
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isRecording: boolean;
  
  // View
  zoom: number; // pixels per second
  scrollX: number;
  scrollY: number;
  viewMode: ViewMode;
  gridSnap: boolean;
  gridResolution: GridResolution;
  
  // Loop
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  
  // Selection
  selectedRegions: Set<string>;
  selectedTracks: Set<string>;
  
  // Actions
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setZoom: (zoom: number) => void;
  setScrollX: (x: number) => void;
  setScrollY: (y: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setGridSnap: (snap: boolean) => void;
  setGridResolution: (resolution: GridResolution) => void;
  setLoopEnabled: (enabled: boolean) => void;
  setLoopStart: (time: number) => void;
  setLoopEnd: (time: number) => void;
  toggleRegionSelection: (id: string) => void;
  clearSelection: () => void;
  selectTrack: (id: string) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  // Initial state
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isRecording: false,
  
  zoom: 50, // 50 pixels per second
  scrollX: 0,
  scrollY: 0,
  viewMode: 'bars',
  gridSnap: true,
  gridResolution: '1/16',
  
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,
  
  selectedRegions: new Set(),
  selectedTracks: new Set(),
  
  // Actions
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
  setScrollX: (x) => set({ scrollX: Math.max(0, x) }),
  setScrollY: (y) => set({ scrollY: Math.max(0, y) }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setGridSnap: (snap) => set({ gridSnap: snap }),
  setGridResolution: (resolution) => set({ gridResolution: resolution }),
  setLoopEnabled: (enabled) => set({ loopEnabled: enabled }),
  setLoopStart: (time) => set({ loopStart: time }),
  setLoopEnd: (time) => set({ loopEnd: time }),
  
  toggleRegionSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedRegions);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedRegions: newSelection };
    }),
    
  clearSelection: () => set({ selectedRegions: new Set() }),
  selectTrack: (id) => set({ selectedTracks: new Set([id]) }),
}));
