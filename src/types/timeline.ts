/**
 * Timeline data types for Mixx Club Pro Studio
 */

export interface Region {
  id: string;
  trackId: string;
  name: string;
  
  // Positioning
  startTime: number; // seconds in timeline
  duration: number;
  
  // Audio data
  bufferOffset: number; // start position in source buffer
  bufferDuration: number; // length to play from buffer
  
  // Visual
  color: string;
  waveformData?: Float32Array; // cached waveform peaks
  
  // Editing
  fadeIn: number; // seconds
  fadeOut: number;
  gain: number; // region-level gain (0-1)
  
  // State
  locked: boolean;
  muted: boolean;
  
  // Production features
  takeId?: string; // Reference to active take
  crossfadeIn?: number; // Crossfade with previous region
  crossfadeOut?: number; // Crossfade with next region
  timeStretch?: number; // Time stretch factor (1.0 = normal)
  pitchShift?: number; // Pitch shift in semitones
  velocity?: number; // MIDI-style velocity (0-1) for sliced samples
}

export interface Marker {
  id: string;
  time: number;
  name: string;
  color: string;
  type: 'marker' | 'section';
}

export interface TimelineTrack {
  id: string;
  name: string;
  color: string;
  height: number;
  regions: Region[];
  muted: boolean;
  solo: boolean;
  recordArmed: boolean;
  locked?: boolean;
  volume: number; // 0-1 range
  inserts?: import('@/audio/Track').PluginInsert[];
  automationVisible?: boolean;
  automationLanes?: {
    type: 'volume' | 'pan' | 'plugin';
    points: { time: number; value: number }[];
  }[];
  
  // Production features
  groupId?: string; // Track group membership
  template?: string; // Reference to track template
}

export type GridResolution = '1/4' | '1/8' | '1/16' | '1/32' | '1/64' | '1/4T' | '1/8T' | '1/16T';
export type ViewMode = 'bars' | 'seconds';
export type CurveType = 'linear' | 'exponential' | 'logarithmic' | 'scurve';

// Track height presets for different workflows
export type TrackHeightPreset = 'mini' | 'compact' | 'midi' | 'maxi';

// Trap/Hip-hop color palettes
export type ColorPalette = 'drums' | '808s' | 'melody' | 'vocals' | 'fx' | 'custom';

export const TRAP_COLOR_PALETTES: Record<ColorPalette, string> = {
  drums: 'hsl(0 85% 60%)',      // Hot red for drums
  '808s': 'hsl(280 90% 65%)',   // Deep purple for bass
  melody: 'hsl(191 85% 55%)',   // Cyan for melodies
  vocals: 'hsl(140 75% 55%)',   // Green for vocals
  fx: 'hsl(45 90% 60%)',        // Gold for FX
  custom: 'hsl(0 0% 50%)',      // Neutral gray
};

/**
 * Pattern System (FL Studio-style workflow)
 */

export interface Pattern {
  id: string;
  name: string;
  color: string;
  category: ColorPalette;
  
  // Pattern contents
  regionIds: string[]; // References to regions in this pattern
  
  // Metadata
  duration: number; // Default duration for pattern instances
  createdAt: number;
  variants: number; // Number of unique variants created
}

export interface PatternInstance {
  id: string;
  patternId: string; // Reference to base pattern
  trackId: string;
  startTime: number;
  duration: number; // Can override pattern default
  
  // Customization
  unique: boolean; // If true, edits don't affect other instances
  muted: boolean;
  color?: string; // Override pattern color
}

// Timeline mode
export type TimelineMode = 'audio' | 'pattern';
