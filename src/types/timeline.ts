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
}

export type GridResolution = '1/4' | '1/8' | '1/16' | '1/32' | '1/64' | '1/4T' | '1/8T' | '1/16T';
export type ViewMode = 'bars' | 'seconds';
export type CurveType = 'linear' | 'exponential' | 'logarithmic' | 'scurve';
