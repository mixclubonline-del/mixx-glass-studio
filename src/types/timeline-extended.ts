/**
 * Extended Timeline Types - Production features
 */

export interface Take {
  id: string;
  name: string;
  audioBuffer?: AudioBuffer;
  active: boolean;
  muted: boolean;
  color: string;
  regionId: string;
}

export interface TrackGroup {
  id: string;
  name: string;
  color: string;
  trackIds: string[];
  vcaVolume: number; // VCA master volume (0-100)
  collapsed: boolean;
}

export interface TrackTemplate {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  config: {
    tracks: any[];
    routing: any;
    effects: any;
  };
  createdAt: string;
}

export interface TimeStretchParams {
  regionId: string;
  factor: number; // 0.5 = half speed, 2.0 = double speed
  algorithm: 'psola' | 'phase-vocoder' | 'stretch';
  preservePitch: boolean;
}

export interface PitchShiftParams {
  regionId: string;
  semitones: number; // -12 to +12
  cents: number; // -100 to +100
  preserveFormants: boolean;
}
