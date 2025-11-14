/**
 * Track Builder Layer
 * 
 * Layer 9 of the Stem Separation Engine.
 * After import, creates auto lanes, colors them, routes them,
 * tags them, and preps them for comp + punch.
 * 
 * This is the final layer that makes stems usable in the DAW.
 */

import type { StemResult } from './stemEngine';
import type { StemMetadata } from './metadata';
import { detectRole, ROLE_COLORS, getDefaultRouting, getDefaultALSState, getRoleIcon, type TrackRole } from './roleEngine';
import type { AudioClassification } from './classifier';

export interface TrackConfig {
  name: string;
  type: 'vocal' | 'drums' | 'bass' | 'music' | 'perc' | 'harmonic' | 'sub' | 'other';
  buffer: AudioBuffer;
  metadata: StemMetadata;
  readyForPunch: boolean;
  readyForComp: boolean;
  color?: string;
  role?: 'standard' | 'hushRecord' | 'master';
  group?: string;
  // Auto-role system
  autoRole?: TrackRole;
  pan?: number;
  mono?: boolean;
  width?: number;
  bus?: string;
  icon?: string;
  alsState?: {
    flow: number;
    pulse: number;
    temperature: 'cooling' | 'warming' | 'hot';
  };
}

/**
 * Build tracks from separated stems with auto-role detection.
 * 
 * Flow automatically detects what each stem IS and assigns:
 * - Role (VOCAL_MAIN, DRUMS, BASS_808, etc.)
 * - Color (Flow aesthetic palette)
 * - Default routing (pan, mono, width)
 * - Default bus assignment
 * - Default ALS state
 * 
 * @param stems - Separated stem results
 * @param metadata - Stem metadata (includes classification)
 * @param classification - Audio classification (for role detection)
 * @returns Array of track configurations ready for DAW
 */
export function buildTracks(
  stems: StemResult,
  metadata: StemMetadata,
  classification?: AudioClassification
): TrackConfig[] {
  const tracks: TrackConfig[] = [];
  
  // Get main RMS for adlib detection (use vocals as reference if available)
  let mainRMS: number | undefined;
  if (stems.vocals) {
    const vocalData = stems.vocals.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < vocalData.length; i++) {
      sum += vocalData[i] * vocalData[i];
    }
    mainRMS = Math.sqrt(sum / vocalData.length);
  }
  
  // Process each stem with auto-role detection
  const processStem = (
    name: string,
    buffer: AudioBuffer | null,
    type: TrackConfig['type'],
    defaultReadyForPunch: boolean = false,
    defaultReadyForComp: boolean = false
  ) => {
    if (!buffer) return;
    
    // Build metrics for role detection
    const metrics = classification ? {
      ...classification,
      mainRMS,
    } : {
      spectral: { low: 0, mid: 0, high: 0 },
      transients: { count: 0, avg: 0, density: 0 },
      rms: 0,
      mainRMS,
    };
    
    // Detect role
    const autoRole = detectRole(name, metrics);
    
    // Get role-based configuration
    const color = ROLE_COLORS[autoRole];
    const routing = getDefaultRouting(autoRole);
    const alsState = getDefaultALSState(autoRole);
    const icon = getRoleIcon(autoRole);
    
    // Determine if ready for punch/comp based on role
    const readyForPunch = defaultReadyForPunch || autoRole.startsWith('VOCAL_');
    const readyForComp = defaultReadyForComp || autoRole.startsWith('VOCAL_');
    
    tracks.push({
      name,
      type,
      buffer,
      metadata,
      readyForPunch,
      readyForComp,
      color,
      role: 'standard',
      group: getGroupForRole(autoRole),
      // Auto-role system
      autoRole,
      pan: routing.pan,
      mono: routing.mono,
      width: routing.width,
      bus: routing.bus,
      icon,
      alsState,
    });
  };
  
  // Process all stems
  if (stems.vocals) {
    processStem('Vocals', stems.vocals, 'vocal', true, true);
  }
  
  if (stems.drums) {
    processStem('Drums', stems.drums, 'drums');
  }
  
  if (stems.bass) {
    processStem('Bass', stems.bass, 'bass');
  }
  
  if (stems.sub) {
    processStem('Sub / 808', stems.sub, 'sub');
  }
  
  if (stems.music) {
    processStem('Music / Instrumental', stems.music, 'music');
  }
  
  if (stems.perc) {
    processStem('Percussion', stems.perc, 'perc');
  }
  
  if (stems.harmonic) {
    processStem('Harmonic', stems.harmonic, 'harmonic');
  }
  
  return tracks;
}

/**
 * Get group name for a role (for track organization).
 */
function getGroupForRole(role: TrackRole): string {
  if (role.startsWith('VOCAL_')) {
    return 'vocals';
  }
  if (role === 'DRUMS' || role === 'PERC') {
    return 'rhythm';
  }
  if (role === 'BASS_808') {
    return 'bass';
  }
  if (role === 'MUSIC') {
    return 'music';
  }
  if (role === 'FX') {
    return 'fx';
  }
  return 'other';
}

/**
 * Guess track type from stem name.
 */
function guessType(name: string): TrackConfig['type'] {
  const lower = name.toLowerCase();
  
  if (lower.includes('vocal') || lower.includes('voice') || lower.includes('vox')) {
    return 'vocal';
  }
  if (lower.includes('drum') || lower.includes('kick') || lower.includes('snare')) {
    return 'drums';
  }
  if (lower.includes('bass') && !lower.includes('sub')) {
    return 'bass';
  }
  if (lower.includes('sub') || lower.includes('808')) {
    return 'sub';
  }
  if (lower.includes('perc') || lower.includes('percussion')) {
    return 'perc';
  }
  if (lower.includes('harmonic') || lower.includes('harmony')) {
    return 'harmonic';
  }
  if (lower.includes('music') || lower.includes('instrumental') || lower.includes('backing')) {
    return 'music';
  }
  
  return 'other';
}

/**
 * Prepare tracks for Flow-aware editing.
 * Sets up initial ALS values, punch zones, comp buffers.
 * 
 * Auto-role system has already set ALS state, so we just ensure
 * vocal tracks are ready for punch/comp.
 */
export function prepareTracksForFlow(tracks: TrackConfig[]): TrackConfig[] {
  return tracks.map(track => {
    // Vocal tracks get special Flow preparation
    if (track.autoRole?.startsWith('VOCAL_')) {
      return {
        ...track,
        readyForPunch: true,
        readyForComp: true,
        // ALS state already set by auto-role system
      };
    }
    
    return track;
  });
}

/**
 * Create a clip from a track configuration.
 * Used for auto-inserting clips into the timeline.
 */
export function createClipFromTrack(
  track: TrackConfig,
  startTime: number = 0
): {
  trackId: string;
  buffer: AudioBuffer;
  start: number;
  metadata: StemMetadata;
  name: string;
  color?: string;
} {
  return {
    trackId: track.name, // Will be replaced with actual track ID when added to session
    buffer: track.buffer,
    start: startTime,
    metadata: track.metadata,
    name: track.name,
    color: track.color,
  };
}

