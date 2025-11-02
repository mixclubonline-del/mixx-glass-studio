/**
 * Tracks Store - Manages all track data, regions, and audio state
 */

import { create } from 'zustand';
import { TimelineTrack, Region } from '@/types/timeline';

interface TracksState {
  tracks: TimelineTrack[];
  regions: Region[];
  selectedTrackId: string | null;
  selectedRegionIds: string[];
  addTrackDialogOpen: boolean;
  
  // Actions
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<TimelineTrack>) => void;
  addRegion: (region: Region) => void;
  updateRegion: (id: string, updates: Partial<Region>) => void;
  removeRegion: (id: string) => void;
  duplicateRegion: (id: string) => void;
  selectTrack: (id: string | null) => void;
  selectRegion: (id: string, multi?: boolean) => void;
  selectRegions: (ids: string[]) => void;
  clearRegionSelection: () => void;
  getTrackRegions: (trackId: string) => Region[];
  setAddTrackDialogOpen: (open: boolean) => void;
}

export const useTracksStore = create<TracksState>((set, get) => ({
  tracks: [],
  regions: [],
  selectedTrackId: null,
  selectedRegionIds: [],
  addTrackDialogOpen: false,
  
  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, {
      ...track,
      inserts: track.inserts || Array(8).fill(null).map((_, i) => ({
        slotNumber: i + 1,
        pluginId: null,
        instanceId: null,
        bypass: false
      }))
    }]
  })),
  
  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== id),
    regions: state.regions.filter(r => r.trackId !== id)
  })),
  
  updateTrack: (id, updates) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  
  addRegion: (region) => set((state) => ({
    regions: [...state.regions, region]
  })),
  
  updateRegion: (id, updates) => set((state) => ({
    regions: state.regions.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  
  removeRegion: (id) => set((state) => ({
    regions: state.regions.filter(r => r.id !== id)
  })),
  
  duplicateRegion: (id) => set((state) => {
    const region = state.regions.find(r => r.id === id);
    if (!region) return state;
    
    const newRegion: Region = {
      ...region,
      id: `${region.id}-copy-${Date.now()}`,
      startTime: region.startTime + region.duration,
      name: `${region.name} (copy)`,
    };
    
    return {
      regions: [...state.regions, newRegion]
    };
  }),
  
  selectTrack: (id) => set({ selectedTrackId: id }),
  
  selectRegion: (id, multi = false) => set((state) => {
    if (multi) {
      // Toggle selection with Cmd/Ctrl
      const isSelected = state.selectedRegionIds.includes(id);
      return {
        selectedRegionIds: isSelected
          ? state.selectedRegionIds.filter(rid => rid !== id)
          : [...state.selectedRegionIds, id]
      };
    } else {
      // Single selection
      return { selectedRegionIds: [id] };
    }
  }),
  
  selectRegions: (ids) => set({ selectedRegionIds: ids }),
  
  clearRegionSelection: () => set({ selectedRegionIds: [] }),
  
  getTrackRegions: (trackId) => {
    return get().regions.filter(r => r.trackId === trackId);
  },
  
  setAddTrackDialogOpen: (open) => set({ addTrackDialogOpen: open })
}));
