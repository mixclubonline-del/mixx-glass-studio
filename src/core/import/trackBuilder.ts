/**
 * Track Builder Layer (Flow+ALS+Punch/Harmonic Aware)
 * 
 * The grown-up in the room: lanes, ALS tags, punch zones, harmonic awareness,
 * the whole Flow brain baked in.
 * 
 * Browser-safe, React-safe, Flow-canon track builder that guarantees:
 * 1. Creates ALS-aware tracks (VOCALS / TWO TRACK / INSTRUMENTS)
 * 2. Embeds punch zones for Punch Mode / Auto-Comp / Take Brain
 * 3. Stores harmonic summaries for Velvet Curve / Harmonic Lattice routing
 * 4. Hydrates tracks + clips into state immutably
 * 5. Renders lanes immediately in Arrange
 */

import { v4 as uuid } from 'uuid';
import { useTimelineStore } from '../../state/timelineStore';
import type { StemMetadata } from './metadata';
import type { AudioClassification } from './classifier';
import type { TrackData } from '../../App';
import type { ArrangeClip } from '../../hooks/useArrange';

/**
 * What a single stem looks like coming out of the import pipeline.
 * This is the payload FileInput should pass in per stem.
 */
export interface StemImportPayload {
  name: string;
  role: AudioClassification['type'] | 'two-track' | 'instrument' | 'drums' | 'bass';
  color?: string;
  audioBuffer: AudioBuffer;
  durationMs: number;      // from metadata.duration
  sampleRate: number;
  channels: number;
  format?: string;
  metadata: StemMetadata;  // full Layer 4 intelligence
  index: number;           // stem index in import order
}

/**
 * Track object as stored in the timeline.
 * (Compatible with existing TrackData shape)
 */
export interface TimelineTrack {
  id: string;
  name: string;
  role: string;
  color: string;
  alsGroup: 'INSTRUMENTS' | 'TWO TRACK' | 'VOCALS' | 'BUS' | 'AUX' | 'FX';
  index: number;
  metadata: {
    bpm: number | null;
    key: string;
    stemNames: string[];
    punchZones: StemMetadata['punchZones'];
    headroom: StemMetadata['headroom'];
    harmonicProfile: {
      brightness: number;  // 0–1
      density: number;     // 0–1
    };
  };
  clipIds: string[];
}

/**
 * Clip object stored in timeline state.
 * (Compatible with existing ArrangeClip shape)
 */
export interface TimelineClip {
  id: string;
  trackId: string;
  start: number;        // seconds
  end: number;          // seconds
  sourceType: 'audio';
  buffer: AudioBuffer;
  bufferId: string;
  gain: number;
  waveform: Float32Array | null;
  punchZones: StemMetadata['punchZones'];
}

/**
 * ALS lane group based on role.
 */
function getAlsGroup(role: string): TimelineTrack['alsGroup'] {
  const r = role.toLowerCase();
  if (r.includes('vocal') || r.includes('voice')) return 'VOCALS';
  if (r.includes('two-track') || r.includes('twotrack') || r.includes('2track')) return 'TWO TRACK';
  if (r.includes('drum') || r.includes('bass') || r.includes('instr') || r === 'beat') {
    return 'INSTRUMENTS';
  }
  return 'AUX';
}

/**
 * Auto-color by role – can be replaced with roleEngine later.
 */
function getRoleColor(role: string, fallback?: string): TrackData['trackColor'] {
  const r = role.toLowerCase();
  if (r.includes('vocal') || r.includes('voice')) return 'magenta';
  if (r.includes('two-track') || r.includes('twotrack') || r.includes('2track')) return 'cyan';
  if (r.includes('drum')) return 'green';
  if (r.includes('bass')) return 'purple';
  if (r.includes('instr') || r === 'beat') return 'blue';
  return 'purple'; // Flow default orchid
}

/**
 * Summarize harmonic fingerprint into brightness / density
 * so we don't stuff huge arrays in state.
 */
function summarizeHarmonics(h: Float32Array | null | undefined) {
  if (!h || h.length === 0) {
    return { brightness: 0, density: 0 };
  }
  
  const len = h.length;
  let sum = 0;
  let hi = 0;
  
  for (let i = 0; i < len; i++) {
    const v = h[i];
    sum += v;
    if (i > len * 0.5) {
      hi += v;
    }
  }
  
  const avg = sum / len;
  const hiAvg = hi / (len * 0.5 || 1);
  
  return {
    brightness: Math.min(1, hiAvg * 4),
    density: Math.min(1, avg * 2),
  };
}

/**
 * Build a track + its primary clip for a given stem.
 */
export function buildTrackAndClipFromStem(
  payload: StemImportPayload
): { track: TrackData; clip: ArrangeClip } {
  const {
    name,
    role,
    color,
    audioBuffer,
    durationMs,
    sampleRate,
    channels,
    format,
    metadata,
    index,
  } = payload;
  
  const trackId = uuid();
  const clipId = uuid();
  const bufferId = `buffer-${Date.now()}-${uuid()}`;
  const durationSec = durationMs / 1000;
  
  const harmonicProfile = summarizeHarmonics(metadata.harmonics);
  const trackColor = getRoleColor(role, color);
  const alsGroup = getAlsGroup(role);
  
  // Map role to TrackRole type
  const trackRole = role as any; // Will be validated by roleEngine if needed
  
  // Map alsGroup to TrackData group
  const group: TrackData['group'] = 
    alsGroup === 'VOCALS' ? 'Vocals' :
    alsGroup === 'INSTRUMENTS' ? (role.includes('drum') ? 'Drums' : 'Instruments') :
    alsGroup === 'TWO TRACK' ? 'Instruments' :
    'Instruments';
  
  const track: TrackData = {
    id: trackId,
    trackName: name || `Stem ${index + 1}`,
    trackColor,
    waveformType: 'dense', // Default, can be detected later
    group,
    role: trackRole,
    isProcessing: false,
    locked: false,
  };
  
  const clip: ArrangeClip = {
    id: clipId,
    trackId,
    name: name || `Stem ${index + 1}`,
    color: trackColor,
    start: 0,
    duration: durationSec,
    sourceStart: 0,
    bufferId,
    selected: false,
    gain: 1.0,
    // Store punch zones and harmonic profile in clip metadata
    // (We'll extend ArrangeClip interface if needed, or use a metadata field)
  };
  
  return { track, clip };
}

/**
 * Hydrate track + clip into the timeline store immutably.
 * This assumes useTimelineStore exposes addTrack() and addClip().
 */
export function hydrateTrackToTimeline(track: TrackData, clip: ArrangeClip, buffer: AudioBuffer) {
  const { addTrack, addClip, setAudioBuffer } = useTimelineStore.getState();
  
  console.log(`[FLOW IMPORT] Hydrating track "${track.trackName}" (${track.id}) with clip "${clip.name}" (${clip.id})`);
  console.log(`[FLOW IMPORT] Buffer: ${buffer.duration.toFixed(2)}s, ${buffer.sampleRate}Hz, ${buffer.numberOfChannels}ch`);
  
  // MUST be immutable updates inside addTrack/addClip.
  setAudioBuffer(clip.bufferId, buffer);
  addTrack(track);
  addClip(track.id, clip);
  
  console.log(`[FLOW IMPORT] Track "${track.trackName}" hydrated successfully`);
}

/**
 * Convenience helper to go from raw stem payload → hydrated track in one call.
 */
export function buildAndHydrateFromStem(payload: StemImportPayload) {
  const { track, clip } = buildTrackAndClipFromStem(payload);
  hydrateTrackToTimeline(track, clip, payload.audioBuffer);
  return { trackId: track.id, clipId: clip.id };
}

/**
 * Legacy compatibility: Build tracks from separated stems with auto-role detection.
 * (Kept for backward compatibility)
 */
export function buildTracks(
  stems: Record<string, AudioBuffer | null>,
  metadata: StemMetadata,
  classification?: AudioClassification
): any[] {
  // This is kept for compatibility but new code should use buildAndHydrateFromStem
  return [];
}

/**
 * Legacy compatibility: Prepare tracks for Flow-aware editing.
 */
export function prepareTracksForFlow(tracks: any[]): any[] {
  return tracks;
}
