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
  clipboardRegions: Region[];
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
  copyRegionsToClipboard: (regions: Region[]) => void;
  pasteRegionsFromClipboard: (targetTime?: number) => void;
  moveRegionWithRipple: (id: string, newStartTime: number, rippleEnabled: boolean) => void;
  deleteRegionWithRipple: (id: string, rippleEnabled: boolean) => void;
  getTrackRegions: (trackId: string) => Region[];
  setAddTrackDialogOpen: (open: boolean) => void;
}

export const useTracksStore = create<TracksState>((set, get) => ({
  tracks: [],
  regions: [],
  selectedTrackId: null,
  selectedRegionIds: [],
  clipboardRegions: [],
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
      regions: [...state.regions, newRegion],
      selectedRegionIds: [newRegion.id]
    };
  }),
  
  copyRegionsToClipboard: (regions) => set({ 
    clipboardRegions: regions.map(r => ({ ...r }))
  }),
  
  pasteRegionsFromClipboard: (targetTime) => set((state) => {
    if (state.clipboardRegions.length === 0) return state;
    
    // Find earliest start time in clipboard
    const minStartTime = Math.min(...state.clipboardRegions.map(r => r.startTime));
    const pasteTime = targetTime ?? (state.selectedRegionIds.length > 0 
      ? Math.max(...state.regions.filter(r => state.selectedRegionIds.includes(r.id)).map(r => r.startTime + r.duration))
      : 0);
    
    const newRegions = state.clipboardRegions.map(r => ({
      ...r,
      id: `${r.id}-paste-${Date.now()}-${Math.random()}`,
      startTime: pasteTime + (r.startTime - minStartTime),
      name: `${r.name} (pasted)`
    }));
    
    return {
      regions: [...state.regions, ...newRegions],
      selectedRegionIds: newRegions.map(r => r.id)
    };
  }),
  
  moveRegionWithRipple: (id, newStartTime, rippleEnabled) => set((state) => {
    const region = state.regions.find(r => r.id === id);
    if (!region || !rippleEnabled) {
      // Normal move without ripple
      return {
        regions: state.regions.map(r => r.id === id ? { ...r, startTime: newStartTime } : r)
      };
    }
    
    const delta = newStartTime - region.startTime;
    const regionTrackId = region.trackId;
    
    // Shift all regions on same track that start after this region
    return {
      regions: state.regions.map(r => {
        if (r.id === id) {
          return { ...r, startTime: newStartTime };
        }
        if (r.trackId === regionTrackId && r.startTime >= region.startTime + region.duration) {
          return { ...r, startTime: r.startTime + delta };
        }
        return r;
      })
    };
  }),
  
  deleteRegionWithRipple: (id, rippleEnabled) => set((state) => {
    const region = state.regions.find(r => r.id === id);
    if (!region) return state;
    
    if (!rippleEnabled) {
      return {
        regions: state.regions.filter(r => r.id !== id)
      };
    }
    
    const regionEndTime = region.startTime + region.duration;
    const regionTrackId = region.trackId;
    
    // Delete region and shift all regions on same track that start after it
    return {
      regions: state.regions
        .filter(r => r.id !== id)
        .map(r => {
          if (r.trackId === regionTrackId && r.startTime >= regionEndTime) {
            return { ...r, startTime: r.startTime - region.duration };
          }
          return r;
        })
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
