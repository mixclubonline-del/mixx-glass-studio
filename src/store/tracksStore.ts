/**
 * Tracks Store - Manages all track data, regions, and audio state
 */

import { create } from 'zustand';
import { TimelineTrack, Region } from '@/types/timeline';
import { primeBrain } from '@/ai/primeBrain';

interface TracksState {
  tracks: TimelineTrack[];
  regions: Region[];
  selectedTrackId: string | null;
  addTrackDialogOpen: boolean;
  trackCounter: number; // Sequential track numbering
  
  // Actions
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<TimelineTrack>) => void;
  addRegion: (region: Region) => void;
  updateRegion: (id: string, updates: Partial<Region>) => void;
  removeRegion: (id: string) => void;
  duplicateRegion: (id: string) => void;
  selectTrack: (id: string | null) => void;
  getTrackRegions: (trackId: string) => Region[];
  setAddTrackDialogOpen: (open: boolean) => void;
}

export const useTracksStore = create<TracksState>((set, get) => ({
  tracks: [],
  regions: [],
  selectedTrackId: null,
  addTrackDialogOpen: false,
  trackCounter: 0,
  
  addTrack: (track) => {
    const state = get();
    const newCounter = state.trackCounter + 1;
    
    // Generate sequential ID and name if not provided
    const trackWithDefaults = {
      ...track,
      id: track.id || `track-${newCounter}`,
      name: track.name || `Track ${newCounter}`,
      inserts: track.inserts || Array(8).fill(null).map((_, i) => ({
        slotNumber: i + 1,
        pluginId: null,
        instanceId: null,
        bypass: false
      }))
    };
    
    // Notify Prime Brain of track creation
    primeBrain.processSceneChange({
      sceneId: trackWithDefaults.id,
      sceneName: `TRACK_ADDED: ${trackWithDefaults.name}`,
      timestamp: Date.now()
    });
    
    set((state) => ({
      tracks: [...state.tracks, trackWithDefaults],
      trackCounter: newCounter
    }));
  },
  
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
  
  getTrackRegions: (trackId) => {
    return get().regions.filter(r => r.trackId === trackId);
  },
  
  setAddTrackDialogOpen: (open) => set({ addTrackDialogOpen: open })
}));
