/**
 * Mixx Club Unified Stem Layout
 * - Provides canonical stem order and deterministic track IDs
 * - Ensures reserved lanes and stem lanes exist in the timeline store
 */
import { useTimelineStore } from '../../state/timelineStore';
import type { TrackData } from '../../App';

export const RESERVED_TRACK_IDS = ['track-two-track', 'track-hush-record'] as const;

export const STEM_ORDER = ['vocals', 'drums', 'bass', 'harmonic', 'perc', 'sub'] as const;

export type CanonicalStem = typeof STEM_ORDER[number];

export function stemTrackIdFor(stem: CanonicalStem): string {
  return `track-stem-${stem}`;
}

function createTrackIfMissing(tracks: TrackData[], track: TrackData) {
  const exists = tracks.some((t) => t.id === track.id);
  if (exists) return;
  const { addTrack } = useTimelineStore.getState();
  addTrack(track);
}

export function ensureStemTrackLayout(): void {
  const { getTracks } = useTimelineStore.getState();
  const tracks = getTracks();

  // 1) Reserved lanes
  createTrackIfMissing(tracks, {
    id: 'track-two-track',
    trackName: 'TWO TRACK',
    trackColor: 'cyan',
    waveformType: 'varied',
    group: 'Instruments',
    role: 'two-track' as any,
    isProcessing: false,
    locked: false,
  });

  createTrackIfMissing(tracks, {
    id: 'track-hush-record',
    trackName: 'HUSH RECORD',
    trackColor: 'magenta',
    waveformType: 'varied',
    group: 'Vocals',
    role: 'record' as any,
    isProcessing: false,
    locked: false,
  });

  // 2) Stem lanes (deterministic IDs)
  const stemColorByKey: Record<CanonicalStem, TrackData['trackColor']> = {
    vocals: 'magenta',
    drums: 'blue',
    bass: 'green',
    harmonic: 'purple',
    perc: 'cyan',
    sub: 'crimson',
  };
  const stemGroupByKey: Record<CanonicalStem, TrackData['group']> = {
    vocals: 'Vocals',
    drums: 'Drums',
    bass: 'Instruments',
    harmonic: 'Instruments',
    perc: 'Instruments',
    sub: 'Instruments',
  };

  STEM_ORDER.forEach((stem) => {
    createTrackIfMissing(tracks, {
      id: stemTrackIdFor(stem),
      trackName: stem.toUpperCase(),
      trackColor: stemColorByKey[stem],
      waveformType: 'varied',
      group: stemGroupByKey[stem],
      role: stem as any,
      isProcessing: false,
      locked: false,
    });
  });
}


