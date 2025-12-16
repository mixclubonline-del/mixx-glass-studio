/**
 * AUTO-MIX ALS BRIDGE
 * 
 * FLOW Doctrine Compliant Output Layer
 * 
 * Translates numeric auto-mix results into ALS-compatible feedback.
 * NO raw numbers exposed - only temperature, energy, and flow metaphors.
 * 
 * This is the bridge between numeric analysis and the AURA doctrine.
 * 
 * @author Prime (Mixx Club)
 */

import { publishAlsSignal } from '../state/flowSignals';
import { publishBloomSignal } from '../state/flowSignals';
import type { TrackALSFeedback, ALSTemperature } from '../utils/ALS';
import type { AutoMixResult, AutoMixSettings, TrackAnalysis } from './AURAAutoMixEngine';

// ============================================================================
// ALS-COMPATIBLE OUTPUT TYPES (No raw numbers)
// ============================================================================

/**
 * ALS-compatible track analysis - no Hz, dB, or ratios
 */
export interface ALSTrackCharacter {
  trackId: string;
  trackName: string;
  
  // Track identity (derived from type)
  role: 'lead' | 'foundation' | 'texture' | 'rhythm' | 'atmosphere' | 'color';
  
  // Energy characteristics (0-1 normalized)
  brightness: number;    // Spectral centroid mapped to 0-1
  weight: number;        // Low-end presence
  punch: number;         // Transient energy
  sustain: number;       // Decay characteristic
  
  // ALS channels
  temperature: ALSTemperature;
  momentum: number;      // 0-1
  pressure: number;      // 0-1
  harmony: number;       // 0-1
}

/**
 * ALS-compatible mix settings - no numeric parameters
 */
export interface ALSMixGuidance {
  trackId: string;
  
  // Energy levels (0-1, no dB)
  presence: number;      // Volume translated to presence
  space: 'left' | 'center' | 'right' | 'wide';
  
  // Character adjustments (qualitative)
  toneShape: 'warm' | 'neutral' | 'bright' | 'dark';
  dynamicFeel: 'punchy' | 'controlled' | 'natural' | 'compressed';
  
  // Effects (qualitative)
  ambience: 'dry' | 'intimate' | 'room' | 'hall' | 'vast';
  echo: 'none' | 'subtle' | 'rhythmic' | 'prominent';
  
  // ALS feedback
  alsFeedback: TrackALSFeedback;
  
  // Prime Brain guidance
  guidance: string;      // Whisper-style recommendation
  confidence: 'low' | 'medium' | 'high' | 'certain';
}

/**
 * Full ALS-compatible mix result
 */
export interface ALSMixResult {
  tracks: ALSMixGuidance[];
  
  // Overall mix character
  mixCharacter: {
    temperature: ALSTemperature;
    energy: 'calm' | 'moderate' | 'energetic' | 'intense';
    density: 'sparse' | 'balanced' | 'rich' | 'dense';
    width: 'mono' | 'narrow' | 'natural' | 'wide' | 'immersive';
  };
  
  // Prime Brain insights (whisper-style)
  insights: string[];
  
  // ALS pulse trigger
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
 * Translate numeric analysis to ALS character
 */
export function translateToALSCharacter(analysis: TrackAnalysis): ALSTrackCharacter {
  // Map track type to role
  const roleMap: Record<TrackAnalysis['type'], ALSTrackCharacter['role']> = {
    vocals: 'lead',
    drums: 'rhythm',
    bass: 'foundation',
    guitar: 'texture',
    keys: 'color',
    synth: 'texture',
    strings: 'atmosphere',
    fx: 'color',
    other: 'texture',
  };
  
  // Normalize spectral centroid to brightness (0-1)
  // 200Hz = 0, 5000Hz = 1
  const brightness = Math.min(1, Math.max(0, (analysis.spectral.centroid - 200) / 4800));
  
  // Weight from low-frequency content
  const weight = analysis.spectral.centroid < 500 ? 0.8 : 
                 analysis.spectral.centroid < 1000 ? 0.5 : 0.2;
  
  // Punch from transient
  const punch = analysis.temporal.transient;
  
  // Sustain from decay (normalized: 100ms = 0, 2000ms = 1)
  const sustain = Math.min(1, analysis.temporal.decay / 2000);
  
  // Map to temperature
  const temperature: ALSTemperature = 
    brightness > 0.7 ? 'hot' :
    brightness > 0.4 ? 'warm' :
    brightness > 0.2 ? 'cool' : 'cold';
  
  // Calculate ALS channels
  const momentum = (punch + analysis.temporal.rhythm) / 2;
  const pressure = 1 - (analysis.dynamics.dynamicRange / 30); // Higher DR = lower pressure
  const harmony = 1 - analysis.spectral.flatness; // Less noise = more harmony
  
  return {
    trackId: analysis.id,
    trackName: analysis.name,
    role: roleMap[analysis.type],
    brightness,
    weight,
    punch,
    sustain,
    temperature,
    momentum: Math.min(1, Math.max(0, momentum)),
    pressure: Math.min(1, Math.max(0, pressure)),
    harmony: Math.min(1, Math.max(0, harmony)),
  };
}

/**
 * Translate numeric settings to ALS guidance
 */
export function translateToALSGuidance(
  settings: AutoMixSettings,
  analysis: TrackAnalysis
): ALSMixGuidance {
  // Map volume to presence (0-1 stays 0-1)
  const presence = settings.volume;
  
  // Map pan to space
  const space: ALSMixGuidance['space'] = 
    settings.pan < -0.3 ? 'left' :
    settings.pan > 0.3 ? 'right' :
    settings.pan < -0.05 || settings.pan > 0.05 ? 'wide' : 'center';
  
  // Map EQ to tone shape
  const eqBalance = (settings.eq.highGain + settings.eq.highMidGain) - 
                    (settings.eq.lowGain + settings.eq.lowMidGain);
  const toneShape: ALSMixGuidance['toneShape'] = 
    eqBalance > 2 ? 'bright' :
    eqBalance < -2 ? 'dark' :
    settings.eq.lowMidGain < -1 ? 'warm' : 'neutral';
  
  // Map compression to dynamic feel
  const dynamicFeel: ALSMixGuidance['dynamicFeel'] = 
    !settings.compressor.enabled ? 'natural' :
    settings.compressor.ratio > 4 ? 'compressed' :
    settings.compressor.attack > 20 ? 'punchy' : 'controlled';
  
  // Map reverb to ambience
  const ambience: ALSMixGuidance['ambience'] = 
    settings.sends.reverb < 0.1 ? 'dry' :
    settings.sends.reverb < 0.2 ? 'intimate' :
    settings.sends.reverb < 0.3 ? 'room' :
    settings.sends.reverb < 0.4 ? 'hall' : 'vast';
  
  // Map delay to echo
  const echo: ALSMixGuidance['echo'] = 
    settings.sends.delay < 0.05 ? 'none' :
    settings.sends.delay < 0.1 ? 'subtle' :
    settings.sends.delay < 0.15 ? 'rhythmic' : 'prominent';
  
  // Map confidence
  const confidence: ALSMixGuidance['confidence'] = 
    settings.confidence > 0.9 ? 'certain' :
    settings.confidence > 0.7 ? 'high' :
    settings.confidence > 0.5 ? 'medium' : 'low';
  
  // Generate ALS feedback for this track
  const character = translateToALSCharacter(analysis);
  const alsFeedback: TrackALSFeedback = {
    color: temperatureToColor(character.temperature),
    glowColor: `${temperatureToColor(character.temperature)}80`,
    intensity: presence,
    pulse: character.punch,
    flow: character.momentum,
    temperature: character.temperature,
  };

  
  // Generate whisper-style guidance (no numbers!)
  const guidance = generateWhisperGuidance(settings, analysis, character);
  
  return {
    trackId: settings.trackId,
    presence,
    space,
    toneShape,
    dynamicFeel,
    ambience,
    echo,
    alsFeedback,
    guidance,
    confidence,
  };
}

/**
 * Generate whisper-style guidance (Prime Brain tone)
 */
function generateWhisperGuidance(
  settings: AutoMixSettings,
  analysis: TrackAnalysis,
  character: ALSTrackCharacter
): string {
  const parts: string[] = [];
  
  // Role-based opener
  const roleOpeners: Record<ALSTrackCharacter['role'], string> = {
    lead: 'This leads the story.',
    foundation: 'This anchors the low end.',
    rhythm: 'This drives the pulse.',
    texture: 'This adds depth and color.',
    atmosphere: 'This creates the space.',
    color: 'This paints the edges.',
  };
  parts.push(roleOpeners[character.role]);
  
  // Character observation
  if (character.brightness > 0.7) {
    parts.push('Bright and present.');
  } else if (character.weight > 0.6) {
    parts.push('Warm and grounded.');
  }
  
  if (character.punch > 0.6) {
    parts.push('Let the attack breathe.');
  }
  
  // Space recommendation
  if (settings.pan !== 0 && analysis.type !== 'bass' && analysis.type !== 'vocals') {
    parts.push('Positioned to create width.');
  }
  
  return parts.join(' ');
}

/**
 * Convert full AutoMixResult to ALS-compatible result
 */
export function translateAutoMixToALS(
  result: AutoMixResult,
  analyses: TrackAnalysis[]
): ALSMixResult {
  const tracks: ALSMixGuidance[] = [];
  
  for (const settings of result.tracks) {
    const analysis = analyses.find(a => a.id === settings.trackId);
    if (analysis) {
      tracks.push(translateToALSGuidance(settings, analysis));
    }
  }
  
  // Calculate overall mix character
  const avgBrightness = tracks.reduce((sum, t) => 
    sum + (analyses.find(a => a.id === t.trackId)?.spectral.centroid || 1000), 0) / tracks.length;
  
  const temperature: ALSTemperature = 
    avgBrightness > 2500 ? 'hot' :
    avgBrightness > 1500 ? 'warm' :
    avgBrightness > 800 ? 'cool' : 'cold';
  
  const energy: ALSMixResult['mixCharacter']['energy'] = 
    result.tempo > 130 ? 'intense' :
    result.tempo > 100 ? 'energetic' :
    result.tempo > 70 ? 'moderate' : 'calm';
  
  const density: ALSMixResult['mixCharacter']['density'] = 
    tracks.length > 20 ? 'dense' :
    tracks.length > 10 ? 'rich' :
    tracks.length > 5 ? 'balanced' : 'sparse';
  
  // Calculate width from pan spread
  const panSpread = tracks.reduce((max, t) => {
    const pan = Math.abs(result.tracks.find(s => s.trackId === t.trackId)?.pan || 0);
    return Math.max(max, pan);
  }, 0);
  
  const width: ALSMixResult['mixCharacter']['width'] = 
    panSpread > 0.8 ? 'immersive' :
    panSpread > 0.5 ? 'wide' :
    panSpread > 0.2 ? 'natural' :
    panSpread > 0 ? 'narrow' : 'mono';
  
  // Convert suggestions to whisper insights
  const insights = result.suggestions.map(s => 
    s.replace(/\d+(\.\d+)?\s*(dB|Hz|ms|%)/gi, 'some')
     .replace(/\d+/g, 'a few')
  );
  
  // ALS update pulse
  const alsUpdate = {
    flow: tracks.length > 0 ? 0.7 : 0.3,
    pulse: energy === 'intense' ? 0.9 : energy === 'energetic' ? 0.7 : 0.5,
    tension: 0.3, // Mix analysis is low tension
    momentum: 0.8, // We made progress!
  };
  
  return {
    tracks,
    mixCharacter: { temperature, energy, density, width },
    insights,
    alsUpdate,
  };
}

/**
 * Publish ALS signals for mix analysis completion
 */
export function publishMixAnalysisALS(result: ALSMixResult): void {
  // Publish track-level ALS
  const trackFeedback: Record<string, TrackALSFeedback> = {};
  for (const track of result.tracks) {
    trackFeedback[track.trackId] = track.alsFeedback;
  }
  
  publishAlsSignal({
    source: 'prime-brain',
    tracks: trackFeedback,
    meta: {
      event: 'auto-mix-complete',
      character: result.mixCharacter,
    },
  });
  
  // Publish Bloom action for suggestions
  if (result.insights.length > 0) {
    publishBloomSignal({
      source: 'prime-brain',
      action: 'mix-insights',
      payload: {
        insights: result.insights,
        character: result.mixCharacter,
      },
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function temperatureToColor(temp: ALSTemperature): string {
  const colors: Record<ALSTemperature, string> = {
    cold: '#4A90D9',    // Cool blue
    cool: '#67E8F9',    // Cyan
    warm: '#FCD34D',    // Amber
    hot: '#F97316',     // Orange
  };
  return colors[temp];
}
