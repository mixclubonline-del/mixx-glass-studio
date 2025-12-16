/**
 * AUTO-MASTER ALS BRIDGE
 * 
 * FLOW Doctrine Compliant Output Layer for Mastering
 * 
 * Translates numeric mastering results into ALS-compatible feedback.
 * NO raw LUFS, dB, Hz exposed - only temperature, energy, and character.
 * 
 * @author Prime (Mixx Club)
 */

import { publishAlsSignal, publishBloomSignal } from '../state/flowSignals';
import type { ALSTemperature } from '../utils/ALS';
import type { 
  MixAnalysis, 
  MasterSettings, 
  AutoMasterResult, 
  MasterFormat 
} from './AURAAutoMasterEngine';

// ============================================================================
// ALS-COMPATIBLE OUTPUT TYPES (No raw numbers)
// ============================================================================

/**
 * ALS-compatible mix character (no LUFS, dB, Hz)
 */
export interface ALSMixCharacter {
  // Energy state
  energy: 'quiet' | 'moderate' | 'loud' | 'powerful';
  
  // Dynamic feel
  dynamicFeel: 'compressed' | 'controlled' | 'natural' | 'dynamic' | 'explosive';
  
  // Tonal balance
  tonalBalance: 'dark' | 'warm' | 'balanced' | 'bright' | 'harsh';
  
  // Stereo character
  stereoFeel: 'mono' | 'narrow' | 'balanced' | 'wide' | 'immersive';
  
  // Phase health
  phaseHealth: 'problematic' | 'questionable' | 'healthy' | 'pristine';
  
  // ALS channels
  temperature: ALSTemperature;
  pressure: number;     // 0-1 (how much limiting needed)
  flow: number;         // 0-1 (dynamic range quality)
  momentum: number;     // 0-1 (energy level)
}

/**
 * ALS-compatible mastering guidance (no numeric parameters)
 */
export interface ALSMasterGuidance {
  // Target format (kept as-is, it's a mode not a number)
  format: 'streaming' | 'club' | 'broadcast' | 'vinyl';
  
  // Overall approach
  approach: 'gentle' | 'balanced' | 'moderate' | 'aggressive';
  
  // Tonal adjustments (qualitative)
  toneAdjustments: {
    lowEnd: 'cut' | 'reduce' | 'neutral' | 'enhance' | 'boost';
    midRange: 'clean' | 'reduce' | 'neutral' | 'enhance' | 'warm';
    highEnd: 'tame' | 'reduce' | 'neutral' | 'enhance' | 'air';
  };
  
  // Dynamic treatment
  dynamicTreatment: {
    overall: 'preserve' | 'light' | 'moderate' | 'heavy';
    bass: 'tight' | 'controlled' | 'natural' | 'loose';
    transients: 'sharp' | 'controlled' | 'smooth' | 'soft';
  };
  
  // Stereo treatment
  stereoTreatment: {
    width: 'narrow' | 'neutral' | 'enhance' | 'wide';
    bass: 'mono' | 'narrow' | 'natural';
  };
  
  // Saturation character
  saturation: 'none' | 'subtle' | 'warm' | 'vibrant' | 'driven';
  
  // Limiting intensity
  limiting: 'transparent' | 'gentle' | 'moderate' | 'firm' | 'aggressive';
  
  // Prime Brain insights (whisper-style)
  insights: string[];
  
  // Concerns (no numbers, just observations)
  concerns: string[];
  
  // Confidence
  confidence: 'low' | 'medium' | 'high' | 'certain';
}

/**
 * Full ALS-compatible mastering result
 */
export interface ALSMasterResult {
  // Mix character before processing
  mixCharacter: ALSMixCharacter;
  
  // Mastering guidance
  guidance: ALSMasterGuidance;
  
  // ALS state update
  alsUpdate: {
    flow: number;
    pulse: number;
    tension: number;
    momentum: number;
  };
}

// ============================================================================
// TRANSLATION FUNCTIONS
// ============================================================================

/**
 * Translate mix analysis to ALS character
 */
export function translateMixToALSCharacter(analysis: MixAnalysis): ALSMixCharacter {
  const { loudness, spectrum, stereo, dynamics } = analysis;
  
  // Energy from integrated loudness
  // -24 = quiet, -14 = moderate, -8 = loud, -4 = powerful
  const energy: ALSMixCharacter['energy'] = 
    loudness.integrated < -20 ? 'quiet' :
    loudness.integrated < -12 ? 'moderate' :
    loudness.integrated < -6 ? 'loud' : 'powerful';
  
  // Dynamic feel from crest factor and range
  const dynamicFeel: ALSMixCharacter['dynamicFeel'] = 
    dynamics.crest < 6 ? 'compressed' :
    dynamics.crest < 10 ? 'controlled' :
    dynamics.crest < 15 ? 'natural' :
    dynamics.crest < 20 ? 'dynamic' : 'explosive';
  
  // Tonal balance from spectral centroid
  const tonalBalance: ALSMixCharacter['tonalBalance'] = 
    spectrum.centroid < 800 ? 'dark' :
    spectrum.centroid < 1200 ? 'warm' :
    spectrum.centroid < 2500 ? 'balanced' :
    spectrum.centroid < 4000 ? 'bright' : 'harsh';
  
  // Stereo feel from width
  const stereoFeel: ALSMixCharacter['stereoFeel'] = 
    stereo.width < 0.1 ? 'mono' :
    stereo.width < 0.3 ? 'narrow' :
    stereo.width < 0.6 ? 'balanced' :
    stereo.width < 0.8 ? 'wide' : 'immersive';
  
  // Phase health from correlation
  const phaseHealth: ALSMixCharacter['phaseHealth'] = 
    stereo.correlation < 0.3 ? 'problematic' :
    stereo.correlation < 0.6 ? 'questionable' :
    stereo.correlation < 0.85 ? 'healthy' : 'pristine';
  
  // Map to ALS temperature
  const temperature: ALSTemperature = 
    tonalBalance === 'dark' ? 'cold' :
    tonalBalance === 'warm' ? 'warm' :
    tonalBalance === 'bright' || tonalBalance === 'harsh' ? 'hot' : 'cool';
  
  // Calculate ALS channels
  const pressure = Math.min(1, Math.max(0, (loudness.integrated + 24) / 20)); // Louder = more pressure
  const flow = Math.min(1, dynamics.dynamicRange / 20); // More DR = more flow
  const momentum = Math.min(1, Math.max(0, (loudness.integrated + 20) / 12)); // Energy level
  
  return {
    energy,
    dynamicFeel,
    tonalBalance,
    stereoFeel,
    phaseHealth,
    temperature,
    pressure,
    flow,
    momentum,
  };
}

/**
 * Translate master settings to ALS guidance
 */
export function translateSettingsToALSGuidance(
  settings: MasterSettings,
  format: MasterFormat,
  analysis: MixAnalysis
): ALSMasterGuidance {
  
  // Overall approach from input gain
  const approach: ALSMasterGuidance['approach'] = 
    settings.inputGain > 6 ? 'aggressive' :
    settings.inputGain > 3 ? 'moderate' :
    settings.inputGain > 0 ? 'balanced' : 'gentle';
  
  // Tonal adjustments from EQ
  const toneAdjustments: ALSMasterGuidance['toneAdjustments'] = {
    lowEnd: 
      settings.preEQ.lowShelf.gain < -2 ? 'cut' :
      settings.preEQ.lowShelf.gain < -0.5 ? 'reduce' :
      settings.preEQ.lowShelf.gain < 0.5 ? 'neutral' :
      settings.preEQ.lowShelf.gain < 2 ? 'enhance' : 'boost',
    midRange: 
      settings.preEQ.mid.gain < -1 ? 'clean' :
      settings.preEQ.mid.gain < 0 ? 'reduce' :
      settings.preEQ.mid.gain < 0.5 ? 'neutral' :
      settings.preEQ.mid.gain < 2 ? 'enhance' : 'warm',
    highEnd: 
      settings.preEQ.highShelf.gain < -1 ? 'tame' :
      settings.preEQ.highShelf.gain < 0 ? 'reduce' :
      settings.preEQ.highShelf.gain < 0.5 ? 'neutral' :
      settings.preEQ.highShelf.gain < 2 ? 'enhance' : 'air',
  };
  
  // Dynamic treatment from multiband settings
  const avgRatio = settings.multiband.enabled 
    ? settings.multiband.bands.reduce((s, b) => s + b.ratio, 0) / settings.multiband.bands.length
    : 1;
  
  const dynamicTreatment: ALSMasterGuidance['dynamicTreatment'] = {
    overall: 
      avgRatio > 4 ? 'heavy' :
      avgRatio > 2.5 ? 'moderate' :
      avgRatio > 1.5 ? 'light' : 'preserve',
    bass: 
      settings.multiband.bands[0]?.ratio > 4 ? 'tight' :
      settings.multiband.bands[0]?.ratio > 2.5 ? 'controlled' :
      settings.multiband.bands[0]?.ratio > 1.5 ? 'natural' : 'loose',
    transients:
      settings.multiband.bands[1]?.attack < 10 ? 'smooth' :
      settings.multiband.bands[1]?.attack < 20 ? 'controlled' :
      settings.multiband.bands[1]?.attack < 40 ? 'sharp' : 'sharp',
  };
  
  // Stereo treatment
  const stereoTreatment: ALSMasterGuidance['stereoTreatment'] = {
    width: 
      settings.stereo.width < 0.9 ? 'narrow' :
      settings.stereo.width < 1.1 ? 'neutral' :
      settings.stereo.width < 1.3 ? 'enhance' : 'wide',
    bass: 
      settings.stereo.lowWidth < 0.4 ? 'mono' :
      settings.stereo.lowWidth < 0.7 ? 'narrow' : 'natural',
  };
  
  // Saturation
  const saturation: ALSMasterGuidance['saturation'] = 
    !settings.saturation.enabled ? 'none' :
    settings.saturation.drive < 0.1 ? 'subtle' :
    settings.saturation.drive < 0.2 ? 'warm' :
    settings.saturation.drive < 0.3 ? 'vibrant' : 'driven';
  
  // Limiting
  const limiting: ALSMasterGuidance['limiting'] = 
    settings.limiter.threshold > -1 ? 'transparent' :
    settings.limiter.threshold > -3 ? 'gentle' :
    settings.limiter.threshold > -6 ? 'moderate' :
    settings.limiter.threshold > -10 ? 'firm' : 'aggressive';
  
  // Convert reasoning to whisper-style insights (remove numbers!)
  const insights = settings.reasoning.map(r =>
    r.replace(/[-+]?\d+(\.\d+)?\s*(dB|LUFS|Hz|ms|LU|dBTP)/gi, 'appropriately')
     .replace(/\d+/g, '')
     .trim()
  ).filter(r => r.length > 5);
  
  // Convert warnings to concerns
  const concerns = settings.warnings.map(w =>
    w.replace(/[-+]?\d+(\.\d+)?\s*(dB|LUFS|Hz|ms|LU|dBTP)/gi, 'significantly')
     .replace(/\d+/g, '')
     .trim()
  );
  
  // Convert confidence
  const confidence: ALSMasterGuidance['confidence'] = 
    settings.confidence > 0.85 ? 'certain' :
    settings.confidence > 0.65 ? 'high' :
    settings.confidence > 0.45 ? 'medium' : 'low';
  
  // Map format to allowed values
  const mappedFormat: 'streaming' | 'club' | 'broadcast' | 'vinyl' = 
    format === 'custom' ? 'streaming' : format;
  
  return {
    format: mappedFormat,
    approach,
    toneAdjustments,
    dynamicTreatment,
    stereoTreatment,
    saturation,
    limiting,
    insights,
    concerns,
    confidence,
  };
}

/**
 * Convert full AutoMasterResult to ALS-compatible result
 */
export function translateAutoMasterToALS(result: AutoMasterResult): ALSMasterResult {
  const mixCharacter = translateMixToALSCharacter(result.analysis);
  const guidance = translateSettingsToALSGuidance(
    result.settings, 
    result.target.format, 
    result.analysis
  );
  
  // ALS update based on mastering results
  const alsUpdate = {
    flow: mixCharacter.flow,
    pulse: guidance.approach === 'gentle' ? 0.5 : 
           guidance.approach === 'moderate' ? 0.7 : 0.8,
    tension: guidance.concerns.length > 2 ? 0.7 : 
             guidance.concerns.length > 0 ? 0.4 : 0.2,
    momentum: 0.8, // Mastering analysis is progress!
  };
  
  return {
    mixCharacter,
    guidance,
    alsUpdate,
  };
}

/**
 * Publish ALS signals for mastering completion
 */
export function publishMasterAnalysisALS(result: ALSMasterResult): void {
  // Publish to ALS channel
  publishAlsSignal({
    source: 'prime-brain',
    meta: {
      event: 'auto-master-complete',
      mixCharacter: result.mixCharacter,
      approach: result.guidance.approach,
    },
  });
  
  // Publish to Bloom for actionable insights
  if (result.guidance.insights.length > 0 || result.guidance.concerns.length > 0) {
    publishBloomSignal({
      source: 'prime-brain',
      action: 'master-insights',
      payload: {
        insights: result.guidance.insights,
        concerns: result.guidance.concerns,
        format: result.guidance.format,
      },
    });
  }
}

// ============================================================================
// FORMAT DESCRIPTIONS (No numbers)
// ============================================================================

export const FORMAT_DESCRIPTIONS: Record<MasterFormat, {
  name: string;
  character: string;
  bestFor: string;
}> = {
  streaming: {
    name: 'Streaming',
    character: 'Balanced loudness with preserved dynamics',
    bestFor: 'Spotify, Apple Music, YouTube',
  },
  club: {
    name: 'Club / DJ',
    character: 'Punchy and loud, optimized for big systems',
    bestFor: 'DJ sets, club play, festivals',
  },
  broadcast: {
    name: 'Broadcast',
    character: 'Wide dynamic range for broadcast standards',
    bestFor: 'TV, film, podcast, radio',
  },
  vinyl: {
    name: 'Vinyl',
    character: 'Analog-ready with headroom for pressing',
    bestFor: 'Vinyl cutting, analog playback',
  },
  custom: {
    name: 'Custom',
    character: 'Your own specifications',
    bestFor: 'Special requirements',
  },
};
