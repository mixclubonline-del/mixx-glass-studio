/**
 * Tracks Store - Manages all track data, regions, and audio state
 */

import { create } from 'zustand';
import { TimelineTrack, Region } from '@/types/timeline';
import { TrackGroup, TrackTemplate, Take } from '@/types/timeline-extended';

interface TracksState {
  tracks: TimelineTrack[];
  regions: Region[];
  selectedTrackId: string | null;
  selectedRegionIds: string[];
  clipboardRegions: Region[];
  addTrackDialogOpen: boolean;
  trackGroups: TrackGroup[];
  trackTemplates: TrackTemplate[];
  takes: Take[];
  
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
  
  // Track Groups
  createTrackGroup: (name: string, trackIds: string[]) => void;
  deleteTrackGroup: (groupId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  updateGroupVCA: (groupId: string, volume: number) => void;
  
  // Track Templates
  saveTrackTemplate: (name: string, description: string) => void;
  loadTrackTemplate: (templateId: string) => void;
  deleteTrackTemplate: (templateId: string) => void;
  
  // Takes Management
  addTake: (regionId: string, take: Take) => void;
  selectTake: (regionId: string, takeId: string) => void;
  toggleTakeMute: (takeId: string) => void;
  compTakes: (regionId: string, takeIds: string[]) => void;
}

export const useTracksStore = create<TracksState>((set, get) => ({
  tracks: [],
  regions: [],
  selectedTrackId: null,
  selectedRegionIds: [],
  clipboardRegions: [],
  addTrackDialogOpen: false,
  trackGroups: [],
  trackTemplates: [],
  takes: [],
  
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
  
  setAddTrackDialogOpen: (open) => set({ addTrackDialogOpen: open }),

  // Track Groups
  createTrackGroup: (name: string, trackIds: string[]) => {
    const newGroup: TrackGroup = {
      id: `group-${Date.now()}`,
      name,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      trackIds,
      vcaVolume: 100,
      collapsed: false,
    };
    set((state) => ({
      trackGroups: [...state.trackGroups, newGroup],
      tracks: state.tracks.map(t => 
        trackIds.includes(t.id) ? { ...t, groupId: newGroup.id } : t
      ),
    }));
  },

  deleteTrackGroup: (groupId: string) => {
    set((state) => ({
      trackGroups: state.trackGroups.filter(g => g.id !== groupId),
      tracks: state.tracks.map(t => 
        t.groupId === groupId ? { ...t, groupId: undefined } : t
      ),
    }));
  },

  toggleGroupCollapse: (groupId: string) => {
    set((state) => ({
      trackGroups: state.trackGroups.map(g =>
        g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
      ),
    }));
  },

  updateGroupVCA: (groupId: string, volume: number) => {
    set((state) => ({
      trackGroups: state.trackGroups.map(g =>
        g.id === groupId ? { ...g, vcaVolume: volume } : g
      ),
    }));
  },

  // Track Templates
  saveTrackTemplate: (name: string, description: string) => {
    const state = get();
    const newTemplate: TrackTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      trackCount: state.tracks.length,
      config: {
        tracks: state.tracks,
        routing: {},
        effects: {},
      },
      createdAt: new Date().toISOString(),
    };
    set({ trackTemplates: [...state.trackTemplates, newTemplate] });
  },

  loadTrackTemplate: (templateId: string) => {
    const state = get();
    const template = state.trackTemplates.find(t => t.id === templateId);
    if (template) {
      set({
        tracks: template.config.tracks.map(t => ({ ...t, id: `track-${Date.now()}-${Math.random()}` })),
        regions: [],
      });
    }
  },

  deleteTrackTemplate: (templateId: string) => {
    set((state) => ({
      trackTemplates: state.trackTemplates.filter(t => t.id !== templateId),
    }));
  },

  // Takes Management
  addTake: (regionId: string, take: Take) => {
    set((state) => ({
      takes: [...state.takes, { ...take, regionId }],
    }));
  },

  selectTake: (regionId: string, takeId: string) => {
    set((state) => ({
      takes: state.takes.map(t =>
        t.regionId === regionId
          ? { ...t, active: t.id === takeId }
          : t
      ),
      regions: state.regions.map(r =>
        r.id === regionId ? { ...r, takeId } : r
      ),
    }));
  },

  toggleTakeMute: (takeId: string) => {
    set((state) => ({
      takes: state.takes.map(t =>
        t.id === takeId ? { ...t, muted: !t.muted } : t
      ),
    }));
  },

  compTakes: (regionId: string, takeIds: string[]) => {
    // Create composite from selected takes
    // This would involve audio processing to combine the takes
    console.log('Comping takes:', regionId, takeIds);
  },
}));
