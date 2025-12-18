/**
 * Mixer Utilities
 * Phase 31: Extracted from App.tsx
 * 
 * Functions and constants for mixer configuration, bus routing, and channel settings.
 */

import type { 
  TrackData, 
  MixerSettings, 
  MixerBusId, 
  ChannelDynamicsSettings, 
  ChannelEQSettings,
  FxWindowId,
  TrackGroup,
  TrackColorKey,
} from '../../types/app';

// ═══════════════════════════════════════════════════════════════════════════
// Signal Chain Definitions
// ═══════════════════════════════════════════════════════════════════════════

export const TWO_TRACK_SIGNAL_CHAIN: FxWindowId[] = ['velvet-curve', 'mixx-glue', 'mixx-limiter'];
export const HUSH_TRACK_SIGNAL_CHAIN: FxWindowId[] = [];

// ═══════════════════════════════════════════════════════════════════════════
// Mixer Bus Definitions
// ═══════════════════════════════════════════════════════════════════════════

export interface MixerBusDefinition {
  id: MixerBusId;
  name: string;
  shortLabel: string;
  colorKey: TrackColorKey;
  groups: TrackGroup[];
}

export const MIXER_BUS_DEFINITIONS: MixerBusDefinition[] = [
  {
    id: 'velvet-curve',
    name: 'Velvet Curve',
    shortLabel: 'VC',
    colorKey: 'magenta',
    groups: ['Vocals', 'Harmony'],
  },
  {
    id: 'phase-weave',
    name: 'Phase Weave',
    shortLabel: 'PW',
    colorKey: 'blue',
    groups: ['Drums', 'Adlibs'],
  },
  {
    id: 'velvet-floor',
    name: 'Velvet Floor',
    shortLabel: 'VF',
    colorKey: 'green',
    groups: ['Bass', 'Drums'],
  },
  {
    id: 'harmonic-lattice',
    name: 'Harmonic Lattice',
    shortLabel: 'HL',
    colorKey: 'purple',
    groups: ['Instruments', 'Harmony'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Default Settings Factories
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create default send levels for a track based on its group
 */
export const createDefaultSendLevels = (
  track: TrackData
): Record<MixerBusId, number> => {
  const levels = {} as Record<MixerBusId, number>;
  MIXER_BUS_DEFINITIONS.forEach((bus) => {
    levels[bus.id] = bus.groups.includes(track.group) ? 0.72 : 0;
  });
  return levels;
};

/**
 * Create default dynamics settings for a track based on its group
 */
export const createDefaultDynamicsSettings = (
  track: TrackData
): ChannelDynamicsSettings => {
  switch (track.group) {
    case 'Drums':
      return { drive: 0.68, release: 0.32, blend: 0.6 };
    case 'Bass':
      return { drive: 0.62, release: 0.48, blend: 0.52 };
    case 'Vocals':
      return { drive: 0.52, release: 0.4, blend: 0.48 };
    case 'Harmony':
    case 'Instruments':
      return { drive: 0.45, release: 0.46, blend: 0.5 };
    case 'Adlibs':
      return { drive: 0.5, release: 0.38, blend: 0.55 };
    default:
      return { drive: 0.5, release: 0.45, blend: 0.5 };
  }
};

/**
 * Create default EQ settings for a track based on its group
 */
export const createDefaultEQSettings = (track: TrackData): ChannelEQSettings => {
  switch (track.group) {
    case 'Bass':
      return { low: 0.72, mid: 0.48, air: 0.38, tilt: 0.42 };
    case 'Drums':
      return { low: 0.62, mid: 0.55, air: 0.5, tilt: 0.48 };
    case 'Vocals':
      return { low: 0.42, mid: 0.54, air: 0.66, tilt: 0.6 };
    case 'Harmony':
      return { low: 0.48, mid: 0.5, air: 0.6, tilt: 0.56 };
    case 'Adlibs':
      return { low: 0.44, mid: 0.52, air: 0.62, tilt: 0.58 };
    case 'Instruments':
    default:
      return { low: 0.5, mid: 0.5, air: 0.55, tilt: 0.52 };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Initial State Factories (using templates)
// ═══════════════════════════════════════════════════════════════════════════

import { TWO_TRACK_TEMPLATE, HUSH_TRACK_TEMPLATE } from '../tracks/trackUtils';

const BASE_TRACK_TEMPLATES: ReadonlyArray<TrackData> = [TWO_TRACK_TEMPLATE, HUSH_TRACK_TEMPLATE];

/**
 * Create initial mixer settings for base tracks
 */
export const createInitialMixerSettings = (): Record<string, MixerSettings> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    const volume =
      track.role === 'twoTrack'
        ? 0.82
        : track.role === 'hushRecord'
        ? 0.78
        : 0.75;
    acc[track.id] = { volume, pan: 0, isMuted: false };
    return acc;
  }, {} as Record<string, MixerSettings>);

/**
 * Create initial send levels for base tracks
 */
export const createInitialTrackSendLevels = (): Record<string, Record<MixerBusId, number>> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    acc[track.id] = createDefaultSendLevels(track);
    return acc;
  }, {} as Record<string, Record<MixerBusId, number>>);

/**
 * Create initial dynamics settings for base tracks
 */
export const createInitialDynamicsSettings = (): Record<string, ChannelDynamicsSettings> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    acc[track.id] = createDefaultDynamicsSettings(track);
    return acc;
  }, {} as Record<string, ChannelDynamicsSettings>);

/**
 * Create initial EQ settings for base tracks
 */
export const createInitialEQSettings = (): Record<string, ChannelEQSettings> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    acc[track.id] = createDefaultEQSettings(track);
    return acc;
  }, {} as Record<string, ChannelEQSettings>);

/**
 * Create initial inserts for base tracks
 */
export const createInitialInserts = (): Record<string, FxWindowId[]> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    if (track.role === 'twoTrack') {
      acc[track.id] = [...TWO_TRACK_SIGNAL_CHAIN];
    } else if (track.role === 'hushRecord') {
      acc[track.id] = [...HUSH_TRACK_SIGNAL_CHAIN];
    } else {
      acc[track.id] = [];
    }
    return acc;
  }, {} as Record<string, FxWindowId[]>);
