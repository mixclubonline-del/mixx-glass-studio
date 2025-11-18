/**
 * Autosave Hook - Periodically saves project state to localStorage
 */

import { useEffect, useRef } from 'react';
import { useTracksStore } from '@/store/tracksStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useMixerStore } from '@/store/mixerStore';
import { useProject } from '@/contexts/ProjectContext';

const AUTOSAVE_KEY = 'mixxclub_autosave';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export interface AutosaveData {
  timestamp: number;
  version: string;
  tracks: any[];
  regions: any[];
  timeline: {
    zoom: number;
    scrollX: number;
    scrollY: number;
    loopEnabled: boolean;
    loopStart: number;
    loopEnd: number;
    gridSnap: boolean;
    gridResolution: string;
  };
  mixer: {
    channels: any[];
    buses: any[];
  };
  project: {
    bpm: number;
    timeSignature: { numerator: number; denominator: number };
    masterVolume: number;
  };
}

export const useAutosave = (enabled: boolean = true) => {
  const lastSaveRef = useRef<number>(0);
  const { tracks, regions } = useTracksStore();
  const timelineState = useTimelineStore();
  const { channels, buses } = useMixerStore();
  const { bpm, timeSignature, masterVolume } = useProject();

  // Save to localStorage
  const save = () => {
    if (!enabled) return;

    const data: AutosaveData = {
      timestamp: Date.now(),
      version: '1.0.0',
      tracks: tracks.map(t => ({
        ...t,
        // Don't save audio buffers, just metadata
        regions: undefined
      })),
      regions: regions.map(r => ({
        ...r,
        // Reference audio by name/ID, not buffer
      })),
      timeline: {
        zoom: timelineState.zoom,
        scrollX: timelineState.scrollX,
        scrollY: timelineState.scrollY,
        loopEnabled: timelineState.loopEnabled,
        loopStart: timelineState.loopStart,
        loopEnd: timelineState.loopEnd,
        gridSnap: timelineState.gridSnap,
        gridResolution: timelineState.gridResolution,
      },
      mixer: {
        channels: Array.from(channels.values()),
        buses: Array.from(buses.values()),
      },
      project: {
        bpm,
        timeSignature,
        masterVolume,
      },
    };

    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      lastSaveRef.current = Date.now();
      console.log('💾 Project autosaved');
    } catch (error) {
      console.error('Failed to autosave:', error);
    }
  };

  // Load from localStorage
  const load = (): AutosaveData | null => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) return null;
      
      const data = JSON.parse(saved) as AutosaveData;
      return data;
    } catch (error) {
      console.error('Failed to load autosave:', error);
      return null;
    }
  };

  // Clear autosave
  const clear = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    console.log('🗑️ Autosave cleared');
  };

  // Check if autosave exists
  const hasAutosave = (): boolean => {
    return localStorage.getItem(AUTOSAVE_KEY) !== null;
  };

  // Restore from autosave
  const restore = (data: AutosaveData) => {
    try {
      // Restore tracks (without audio buffers)
      const { addTrack } = useTracksStore.getState();
      data.tracks.forEach(track => {
        addTrack(track);
      });

      // Restore regions metadata
      const { addRegion } = useTracksStore.getState();
      data.regions.forEach(region => {
        addRegion(region);
      });

      // Restore timeline state
      const {
        setZoom,
        setScrollX,
        setScrollY,
        setLoopEnabled,
        setLoopStart,
        setLoopEnd,
        setGridSnap,
        setGridResolution,
      } = useTimelineStore.getState();

      setZoom(data.timeline.zoom);
      setScrollX(data.timeline.scrollX);
      setScrollY(data.timeline.scrollY);
      setLoopEnabled(data.timeline.loopEnabled);
      setLoopStart(data.timeline.loopStart);
      setLoopEnd(data.timeline.loopEnd);
      setGridSnap(data.timeline.gridSnap);
      setGridResolution(data.timeline.gridResolution as any);

      // Restore mixer state
      const { addChannel, addBus } = useMixerStore.getState();
      data.mixer.channels.forEach(channel => {
        addChannel(channel);
      });
      data.mixer.buses.forEach(bus => {
        addBus(bus);
      });

      console.log('✅ Project restored from autosave');
    } catch (error) {
      console.error('Failed to restore autosave:', error);
    }
  };

  // Periodic autosave
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // Only save if there's actual content
      if (tracks.length > 0 || regions.length > 0) {
        save();
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled, tracks, regions, timelineState, channels, buses, bpm, timeSignature, masterVolume]);

  // Save on unmount (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tracks.length > 0 || regions.length > 0) {
        save();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tracks, regions]);

  return {
    save,
    load,
    clear,
    hasAutosave,
    restore,
    lastSaveTime: lastSaveRef.current,
  };
};
