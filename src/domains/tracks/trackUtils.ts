/**
 * Track Utilities
 * Phase 31: Extracted from App.tsx
 * 
 * Functions and constants for track creation, import profiling, and templates.
 */

import type { TrackData, TrackGroup, TrackColorKey, WaveformType, ImportProfileKeyword } from '../../types/app';
import type { MidiNote } from '../../types/midi';

// ═══════════════════════════════════════════════════════════════════════════
// Track ID Constants
// ═══════════════════════════════════════════════════════════════════════════

export const TWO_TRACK_ID = 'track-two-track';
export const HUSH_TRACK_ID = 'track-hush-record';

// ═══════════════════════════════════════════════════════════════════════════
// Default Mappings
// ═══════════════════════════════════════════════════════════════════════════

export const GROUP_COLOR_DEFAULTS: Record<TrackGroup, TrackColorKey> = {
  Vocals: 'magenta',
  Harmony: 'purple',
  Adlibs: 'purple',
  Bass: 'green',
  Drums: 'blue',
  Instruments: 'cyan',
};

export const GROUP_WAVEFORM_DEFAULTS: Record<TrackGroup, WaveformType> = {
  Vocals: 'varied',
  Harmony: 'varied',
  Adlibs: 'varied',
  Bass: 'bass',
  Drums: 'dense',
  Instruments: 'varied',
};

export const IMPORT_KEYWORD_PROFILES: ImportProfileKeyword[] = [
  { keywords: ['vocal', 'vox', 'lead', 'singer'], group: 'Vocals', color: 'magenta', label: 'VOCALS' },
  { keywords: ['bgv', 'harm', 'choir', 'stack'], group: 'Harmony', color: 'purple', label: 'HARMONY' },
  { keywords: ['adlib', 'ad-lib', 'fx', 'shout'], group: 'Adlibs', color: 'purple', label: 'ADLIBS' },
  { keywords: ['drum', 'kick', 'snare', 'hat', 'percussion'], group: 'Drums', color: 'blue', label: 'DRUMS' },
  { keywords: ['bass', '808', 'sub'], group: 'Bass', color: 'green', label: 'BASS' },
  { keywords: ['gtr', 'guitar', 'keys', 'piano', 'synth', 'pad', 'string'], group: 'Instruments', color: 'cyan', label: 'INSTRUMENT' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Track Templates
// ═══════════════════════════════════════════════════════════════════════════

export const TWO_TRACK_TEMPLATE: TrackData = {
  id: TWO_TRACK_ID,
  trackName: 'TWO TRACK',
  trackColor: 'blue',
  waveformType: 'varied',
  group: 'Instruments',
  role: 'twoTrack',
  locked: true,
};

export const HUSH_TRACK_TEMPLATE: TrackData = {
  id: HUSH_TRACK_ID,
  trackName: 'HUSH RECORD',
  trackColor: 'crimson',
  waveformType: 'varied',
  group: 'Vocals',
  role: 'hushRecord',
  locked: true,
};

const BASE_TRACK_TEMPLATES: ReadonlyArray<TrackData> = [TWO_TRACK_TEMPLATE, HUSH_TRACK_TEMPLATE];

export const TRACK_ROLE_TO_ID: Record<Exclude<TrackData['role'], 'standard'>, string> = {
  twoTrack: TWO_TRACK_ID,
  hushRecord: HUSH_TRACK_ID,
};

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strip file extension from filename
 */
export const stripFileExtension = (name: string): string => name.replace(/\.[^/.]+$/, '');

/**
 * Clone a track object (shallow copy)
 */
export const cloneTrack = (track: TrackData): TrackData => ({ ...track });

/**
 * Build initial set of tracks (Two Track + Hush Record)
 */
export const buildInitialTracks = (): TrackData[] => BASE_TRACK_TEMPLATES.map(cloneTrack);

/**
 * Derive track import profile from filename
 */
export const deriveTrackImportProfile = (
  fileName: string,
  existingTracks: TrackData[]
): {
  group: TrackGroup;
  color: TrackColorKey;
  trackName: string;
  waveformType: WaveformType;
} => {
  const baseName = stripFileExtension(fileName).trim();
  const normalized = baseName.toLowerCase();

  const matchedProfile = IMPORT_KEYWORD_PROFILES.find((profile) =>
    profile.keywords.some((keyword) => normalized.includes(keyword))
  );

  const group = matchedProfile?.group ?? 'Instruments';
  const color = matchedProfile?.color ?? GROUP_COLOR_DEFAULTS[group];
  const waveformType = GROUP_WAVEFORM_DEFAULTS[group];

  const sameGroupCount = existingTracks.filter((track) => track.group === group).length;
  const label = matchedProfile?.label ?? baseName.toUpperCase();
  const suffix = sameGroupCount > 0 ? ` ${sameGroupCount + 1}` : '';
  const trackName = `${label}${suffix}`;

  return { group, color, trackName, waveformType };
};

/**
 * Derive warp anchors from MIDI notes
 */
export const deriveWarpAnchorsFromNotes = (notes: MidiNote[], clipDuration: number): number[] => {
  if (!notes.length || clipDuration <= 0) {
    return [];
  }
  const threshold = 1e-3;
  const anchors = new Set<number>();
  notes.forEach((note) => {
    const start = typeof note.start === 'number' ? note.start : NaN;
    if (Number.isNaN(start)) return;
    const clamped = Math.max(0, Math.min(clipDuration, start));
    if (clamped <= threshold || clamped >= clipDuration - threshold) {
      return;
    }
    anchors.add(Math.round(clamped * 1000) / 1000);
  });
  return Array.from(anchors).sort((a, b) => a - b);
};
