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
  
  // Tool & editing
  currentTool: 'select' | 'range' | 'split' | 'trim' | 'fade' | 'pencil' | 'zoom' | 'multi';
  gridMode: 'bars' | 'beats' | 'seconds' | 'samples' | 'adaptive';
  snapMode: 'grid' | 'relative' | 'transient' | 'marker' | 'region' | 'off';
  rippleEdit: boolean;
  
  // Auto-scroll modes
  scrollMode: 'continuous' | 'page' | 'none';
  autoScrollEnabled: boolean;
  centerPlayhead: boolean;
  
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
  setCurrentTool: (tool: 'select' | 'range' | 'split' | 'trim' | 'fade' | 'pencil' | 'zoom' | 'multi') => void;
  setGridMode: (mode: 'bars' | 'beats' | 'seconds' | 'samples' | 'adaptive') => void;
  setSnapMode: (mode: 'grid' | 'relative' | 'transient' | 'marker' | 'region' | 'off') => void;
  toggleRippleEdit: () => void;
  setScrollMode: (mode: 'continuous' | 'page' | 'none') => void;
  setAutoScrollEnabled: (enabled: boolean) => void;
  setCenterPlayhead: (center: boolean) => void;
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
  
  currentTool: 'select',
  gridMode: 'adaptive',
  snapMode: 'grid',
  rippleEdit: false,
  
  scrollMode: 'none',
  autoScrollEnabled: false,
  centerPlayhead: false,
  
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
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setGridMode: (mode) => set({ gridMode: mode }),
  setSnapMode: (mode) => set({ snapMode: mode }),
  toggleRippleEdit: () => set((state) => ({ rippleEdit: !state.rippleEdit })),
  setScrollMode: (mode) => set({ scrollMode: mode }),
  setAutoScrollEnabled: (enabled) => set({ autoScrollEnabled: enabled }),
  setCenterPlayhead: (center) => set({ centerPlayhead: center }),
}));
