/**
 * Track Auto-Role + Auto-Color Engine
 * 
 * Flow automatically detects what each stem IS and assigns:
 * - Role (VOCAL_MAIN, DRUMS, BASS_808, etc.)
 * - Color (Flow aesthetic palette)
 * - Default routing (pan, mono, width)
 * - Default module presets
 * - Default ALS state
 * 
 * This is what Logic/ProTools/FL never automated.
 * Flow does it instantly so the artist stays in Flow.
 */

import type { AudioClassification } from './classifier';

export type TrackRole =
  | 'VOCAL_MAIN'
  | 'VOCAL_ADLIB'
  | 'VOCAL_STACK'
  | 'VOCAL_HARMONY'
  | 'DRUMS'
  | 'BASS_808'
  | 'MUSIC'
  | 'PERC'
  | 'FX'
  | 'MISC';

export interface RoleMetrics {
  spectral: {
    low: number;
    mid: number;
    high: number;
    body?: number; // Mid-low frequency content
    harmonic?: number; // Harmonic content ratio
  };
  transients: {
    count: number;
    avg: number;
    density: number;
  };
  rms: number;
  pitchVar?: number; // Pitch variance (0-1, lower = more stable)
  mainRMS?: number; // Reference RMS for comparison (for adlib detection)
}

/**
 * Flow Role Colors (Glass + Velvet + 3D + slight purple accent)
 * 
 * Chosen to sit perfectly on top of the MixxGlass dark navy background.
 */
export const ROLE_COLORS: Record<TrackRole, string> = {
  VOCAL_MAIN: '#A78BFA',      // Soft velvet purple
  VOCAL_ADLIB: '#C084FC',     // Brighter purple glow
  VOCAL_STACK: '#C084FC',     // Same as adlib (stacked vocals)
  VOCAL_HARMONY: '#D8B4FE',   // Airy lavender
  DRUMS: '#60A5FA',            // Electric blue
  BASS_808: '#38BDF8',         // Deep aqua / sub weight
  MUSIC: '#34D399',            // Green/teal glass
  PERC: '#FBBF24',             // Gold hit
  FX: '#F472B6',               // Warm pink shimmer
  MISC: '#94A3B8',             // Neutral slate
};

/**
 * Detect track role based on stem name and audio metrics.
 * 
 * Flow determines roles using spectral analysis, transient detection,
 * RMS levels, and pitch variance.
 * 
 * @param stemName - Name of the stem (e.g., "Vocals", "Drums")
 * @param metrics - Audio classification metrics
 * @returns Detected track role
 */
export function detectRole(
  stemName: string,
  metrics: RoleMetrics | AudioClassification
): TrackRole {
  const lowerName = stemName.toLowerCase();
  
  // Extract metrics (handle both RoleMetrics and AudioClassification)
  const spectral = 'spectral' in metrics ? metrics.spectral : {
    low: 0,
    mid: 0,
    high: 0,
    body: 0,
    harmonic: 0,
  };
  
  const transients = 'transients' in metrics ? metrics.transients : {
    count: 0,
    avg: 0,
    density: 0,
  };
  
  const rms = 'rms' in metrics ? metrics.rms : 0;
  const pitchVar = 'pitchVar' in metrics ? (metrics as RoleMetrics).pitchVar : undefined;
  const mainRMS = 'mainRMS' in metrics ? (metrics as RoleMetrics).mainRMS : undefined;
  
  // ==========================
  // VOCAL DETECTION
  // ==========================
  
  // Vocal Main: high frequencies + vocal name
  if (
    lowerName.includes('vocal') ||
    lowerName.includes('vox') ||
    lowerName.includes('voice') ||
    lowerName.includes('lead') ||
    spectral.high > 0.25
  ) {
    // Check for adlib/stack (lower RMS, fewer transients)
    if (
      transients.count < 20 &&
      spectral.mid > 0.30 &&
      mainRMS !== undefined &&
      rms < mainRMS * 0.7
    ) {
      if (lowerName.includes('adlib') || lowerName.includes('ad-lib')) {
        return 'VOCAL_ADLIB';
      }
      if (lowerName.includes('stack') || lowerName.includes('backing')) {
        return 'VOCAL_STACK';
      }
      // Default to adlib if metrics suggest it
      return 'VOCAL_ADLIB';
    }
    
    // Check for harmony (stable pitch, body content)
    if (
      pitchVar !== undefined &&
      pitchVar < 0.03 &&
      spectral.body !== undefined &&
      spectral.body > 0.35
    ) {
      if (lowerName.includes('harmony') || lowerName.includes('harm')) {
        return 'VOCAL_HARMONY';
      }
    }
    
    // Default to main vocal
    return 'VOCAL_MAIN';
  }
  
  // ==========================
  // BASS / 808 DETECTION
  // ==========================
  
  if (
    lowerName.includes('bass') ||
    lowerName.includes('808') ||
    lowerName.includes('sub') ||
    lowerName.includes('low') ||
    spectral.low > 0.65
  ) {
    return 'BASS_808';
  }
  
  // ==========================
  // DRUMS DETECTION
  // ==========================
  
  if (
    lowerName.includes('drum') ||
    lowerName.includes('kick') ||
    lowerName.includes('snare') ||
    lowerName.includes('hihat') ||
    lowerName.includes('hi-hat') ||
    transients.count > 40
  ) {
    return 'DRUMS';
  }
  
  // ==========================
  // PERCUSSION DETECTION
  // ==========================
  
  if (
    lowerName.includes('perc') ||
    lowerName.includes('percussion') ||
    (transients.count > 25 && spectral.low < 0.25)
  ) {
    return 'PERC';
  }
  
  // ==========================
  // MUSIC / INSTRUMENTAL DETECTION
  // ==========================
  
  if (
    lowerName.includes('music') ||
    lowerName.includes('instrumental') ||
    lowerName.includes('backing') ||
    lowerName.includes('track') ||
    lowerName.includes('beat') ||
    spectral.harmonic !== undefined && spectral.harmonic > 0.6
  ) {
    return 'MUSIC';
  }
  
  // ==========================
  // FX / AMBIENCE DETECTION
  // ==========================
  
  if (
    lowerName.includes('fx') ||
    lowerName.includes('effect') ||
    lowerName.includes('ambience') ||
    lowerName.includes('ambient') ||
    lowerName.includes('atmosphere')
  ) {
    return 'FX';
  }
  
  // ==========================
  // DEFAULT
  // ==========================
  
  return 'MISC';
}

/**
 * Get default routing settings for a role.
 * 
 * @param role - Track role
 * @returns Default routing configuration
 */
export function getDefaultRouting(role: TrackRole): {
  pan: number; // -1 to 1, 0 = center
  mono: boolean;
  width: number; // 0 to 2, 1 = normal stereo
  bus?: string; // Default bus assignment
} {
  switch (role) {
    case 'VOCAL_MAIN':
    case 'VOCAL_HARMONY':
      return {
        pan: 0, // Center
        mono: false,
        width: 1.0,
        bus: 'vocals',
      };
    
    case 'VOCAL_ADLIB':
    case 'VOCAL_STACK':
      return {
        pan: 0, // Center (can be panned manually)
        mono: false,
        width: 1.1, // Slightly wider for depth
        bus: 'vocals',
      };
    
    case 'BASS_808':
      return {
        pan: 0, // Center
        mono: true, // Bass is typically mono
        width: 1.0,
        bus: 'bass',
      };
    
    case 'DRUMS':
      return {
        pan: 0, // Center (individual drums can be panned)
        mono: false,
        width: 1.15, // Slightly wide for stereo image
        bus: 'drums',
      };
    
    case 'PERC':
      return {
        pan: 0,
        mono: false,
        width: 1.2, // Wider for percussion
        bus: 'drums',
      };
    
    case 'MUSIC':
      return {
        pan: 0,
        mono: false,
        width: 1.0,
        bus: 'music',
      };
    
    case 'FX':
      return {
        pan: 0,
        mono: false,
        width: 1.5, // Very wide for ambience
        bus: 'fx',
      };
    
    case 'MISC':
    default:
      return {
        pan: 0,
        mono: false,
        width: 1.0,
        bus: 'master',
      };
  }
}

/**
 * Get default ALS state for a role.
 * 
 * @param role - Track role
 * @returns Default ALS configuration
 */
export function getDefaultALSState(role: TrackRole): {
  flow: number; // 0-1
  pulse: number; // 0-1
  temperature: 'cooling' | 'warming' | 'hot';
} {
  switch (role) {
    case 'VOCAL_MAIN':
      return {
        flow: 0.7,
        pulse: 0.6,
        temperature: 'warming',
      };
    
    case 'VOCAL_ADLIB':
    case 'VOCAL_STACK':
      return {
        flow: 0.5,
        pulse: 0.4,
        temperature: 'cooling',
      };
    
    case 'VOCAL_HARMONY':
      return {
        flow: 0.6,
        pulse: 0.5,
        temperature: 'warming',
      };
    
    case 'DRUMS':
      return {
        flow: 0.8,
        pulse: 0.9,
        temperature: 'hot',
      };
    
    case 'BASS_808':
      return {
        flow: 0.75,
        pulse: 0.7,
        temperature: 'hot',
      };
    
    case 'PERC':
      return {
        flow: 0.7,
        pulse: 0.8,
        temperature: 'warming',
      };
    
    case 'MUSIC':
      return {
        flow: 0.65,
        pulse: 0.5,
        temperature: 'warming',
      };
    
    case 'FX':
      return {
        flow: 0.4,
        pulse: 0.3,
        temperature: 'cooling',
      };
    
    case 'MISC':
    default:
      return {
        flow: 0.5,
        pulse: 0.5,
        temperature: 'cooling',
      };
  }
}

/**
 * Get track icon name for a role.
 * 
 * @param role - Track role
 * @returns Icon identifier
 */
export function getRoleIcon(role: TrackRole): string {
  switch (role) {
    case 'VOCAL_MAIN':
      return 'microphone';
    case 'VOCAL_ADLIB':
    case 'VOCAL_STACK':
      return 'microphone-alt';
    case 'VOCAL_HARMONY':
      return 'microphone-harmony';
    case 'DRUMS':
      return 'drum';
    case 'BASS_808':
      return 'bass';
    case 'PERC':
      return 'percussion';
    case 'MUSIC':
      return 'music';
    case 'FX':
      return 'fx';
    case 'MISC':
    default:
      return 'track';
  }
}

