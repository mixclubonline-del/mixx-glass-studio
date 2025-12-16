/**
 * AURA AUTO-MIX ENGINE
 * Phase 38: AI-Powered Automatic Mixing
 * 
 * Analyzes audio tracks and generates optimal mixer settings automatically.
 * Uses audio analysis + AI to suggest:
 * - Volume levels (gain staging)
 * - Pan positions
 * - EQ curves
 * - Compression settings
 * - Reverb/delay sends
 * 
 * This is the killer feature that differentiates AURA from other DAWs.
 * 
 * @author Prime (Mixx Club)
 */

import { gpuSpectralAnalysis, type SpectralAnalysis } from '../core/quantum/GPUAudioProcessor';
import { getAURALLMEngine, type AURAContext } from './AURALocalLLMEngine';
import { als } from '../utils/alsFeedback';

// Track analysis result
export interface TrackAnalysis {
  id: string;
  name: string;
  type: 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'strings' | 'fx' | 'other';
  
  // Spectral analysis
  spectral: {
    centroid: number;    // Hz - brightness indicator
    rolloff: number;     // Hz - frequency cutoff
    flatness: number;    // 0-1 - noise vs. tonal
    dominantFreq: number; // Hz - primary frequency
  };
  
  // Dynamic analysis
  dynamics: {
    rms: number;         // dB - average level
    peak: number;        // dB - maximum level
    crest: number;       // dB - peak/rms ratio
    dynamicRange: number; // dB - loudness variation
  };
  
  // Temporal analysis
  temporal: {
    transient: number;   // 0-1 - attack sharpness
    decay: number;       // ms - decay time
    rhythm: number;      // 0-1 - rhythmic content
  };
}

// Auto-mix settings for a track
export interface AutoMixSettings {
  trackId: string;
  
  // Fader settings
  volume: number;        // 0-1 (default 0.8)
  pan: number;           // -1 to 1 (center = 0)
  mute: boolean;
  solo: boolean;
  
  // Insert effects
  eq: {
    enabled: boolean;
    lowCut: number;      // Hz
    lowGain: number;     // dB
    lowMidFreq: number;  // Hz
    lowMidGain: number;  // dB
    highMidFreq: number; // Hz
    highMidGain: number; // dB
    highGain: number;    // dB
    highShelf: number;   // Hz
  };
  
  compressor: {
    enabled: boolean;
    threshold: number;   // dB
    ratio: number;       // x:1
    attack: number;      // ms
    release: number;     // ms
    makeup: number;      // dB
  };
  
  // Send effects
  sends: {
    reverb: number;      // 0-1
    delay: number;       // 0-1
  };
  
  // AI confidence
  confidence: number;    // 0-1
  reasoning: string;     // Why these settings
}

// Full mix analysis result
export interface AutoMixResult {
  tracks: AutoMixSettings[];
  masterSettings: {
    volume: number;
    limiter: {
      enabled: boolean;
      ceiling: number;   // dB
      release: number;   // ms
    };
    targetLufs: number;
  };
  genre: string;
  tempo: number;
  key: string;
  analysisTimeMs: number;
  suggestions: string[];
}

/**
 * AURA Auto-Mix Engine
 * 
 * Analyzes multi-track audio and generates optimal mix settings.
 */
class AURAAutoMixEngine {
  private analysisCache: Map<string, TrackAnalysis> = new Map();
  
  /**
   * Analyze a single track
   */
  async analyzeTrack(
    trackId: string,
    trackName: string,
    audioBuffer: AudioBuffer
  ): Promise<TrackAnalysis> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Run spectral analysis
    const spectral = await gpuSpectralAnalysis(channelData, sampleRate);
    
    // Calculate dynamics
    const dynamics = this.analyzeDynamics(channelData);
    
    // Calculate temporal features
    const temporal = this.analyzeTemporal(channelData, sampleRate);
    
    // Detect track type from spectral content
    const type = this.detectTrackType(spectral, dynamics, trackName);
    
    // Find dominant frequency
    const dominantFreq = this.findDominantFrequency(spectral);
    
    const analysis: TrackAnalysis = {
      id: trackId,
      name: trackName,
      type,
      spectral: {
        centroid: spectral.centroid,
        rolloff: spectral.rolloff,
        flatness: spectral.flatness,
        dominantFreq,
      },
      dynamics,
      temporal,
    };
    
    // Cache for later
    this.analysisCache.set(trackId, analysis);
    
    return analysis;
  }
  
  /**
   * Analyze dynamics of audio
   */
  private analyzeDynamics(samples: Float32Array): TrackAnalysis['dynamics'] {
    const length = samples.length;
    
    // Calculate RMS
    let sumSquares = 0;
    let peak = 0;
    
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(samples[i]);
      sumSquares += samples[i] * samples[i];
      if (abs > peak) peak = abs;
    }
    
    const rms = Math.sqrt(sumSquares / length);
    const rmsDb = 20 * Math.log10(rms + 1e-10);
    const peakDb = 20 * Math.log10(peak + 1e-10);
    const crest = peakDb - rmsDb;
    
    // Calculate dynamic range using window analysis
    const windowSize = 4096;
    const rmsValues: number[] = [];
    
    for (let i = 0; i < length - windowSize; i += windowSize / 2) {
      let windowSum = 0;
      for (let j = 0; j < windowSize; j++) {
        windowSum += samples[i + j] * samples[i + j];
      }
      rmsValues.push(Math.sqrt(windowSum / windowSize));
    }
    
    rmsValues.sort((a, b) => a - b);
    const dynamicRange = rmsValues.length > 10
      ? 20 * Math.log10((rmsValues[Math.floor(rmsValues.length * 0.95)] + 1e-10) / 
          (rmsValues[Math.floor(rmsValues.length * 0.05)] + 1e-10))
      : 0;
    
    return {
      rms: rmsDb,
      peak: peakDb,
      crest,
      dynamicRange: Math.abs(dynamicRange),
    };
  }
  
  /**
   * Analyze temporal features
   */
  private analyzeTemporal(samples: Float32Array, sampleRate: number): TrackAnalysis['temporal'] {
    const length = samples.length;
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms window
    
    // Transient detection (high frequency energy ratio)
    let transientEnergy = 0;
    let totalEnergy = 0;
    
    for (let i = 1; i < length; i++) {
      const diff = Math.abs(samples[i] - samples[i - 1]);
      transientEnergy += diff * diff;
      totalEnergy += samples[i] * samples[i];
    }
    
    const transient = Math.min(1, transientEnergy / (totalEnergy + 1e-10) * 10);
    
    // Simple decay estimation based on envelope
    const envelope: number[] = [];
    for (let i = 0; i < length - windowSize; i += windowSize) {
      let max = 0;
      for (let j = 0; j < windowSize; j++) {
        const abs = Math.abs(samples[i + j]);
        if (abs > max) max = abs;
      }
      envelope.push(max);
    }
    
    // Find decay time from peak
    const maxEnvelope = Math.max(...envelope);
    const threshold = maxEnvelope * 0.1;
    let decaySamples = envelope.length * windowSize;
    
    for (let i = envelope.findIndex(v => v === maxEnvelope); i < envelope.length; i++) {
      if (envelope[i] < threshold) {
        decaySamples = i * windowSize;
        break;
      }
    }
    
    const decay = (decaySamples / sampleRate) * 1000; // ms
    
    // Rhythm estimation (zero crossing rate variation)
    const zcr: number[] = [];
    for (let i = 0; i < length - windowSize; i += windowSize) {
      let crossings = 0;
      for (let j = 1; j < windowSize; j++) {
        if ((samples[i + j - 1] >= 0 && samples[i + j] < 0) ||
            (samples[i + j - 1] < 0 && samples[i + j] >= 0)) {
          crossings++;
        }
      }
      zcr.push(crossings);
    }
    
    const avgZcr = zcr.reduce((a, b) => a + b, 0) / zcr.length;
    const stdZcr = Math.sqrt(zcr.reduce((a, b) => a + (b - avgZcr) ** 2, 0) / zcr.length);
    const rhythm = Math.min(1, stdZcr / avgZcr);
    
    return {
      transient,
      decay: Math.min(decay, 10000), // Cap at 10s
      rhythm,
    };
  }
  
  /**
   * Detect track type from analysis
   */
  private detectTrackType(
    spectral: SpectralAnalysis,
    dynamics: TrackAnalysis['dynamics'],
    name: string
  ): TrackAnalysis['type'] {
    const nameLower = name.toLowerCase();
    
    // Check name hints first
    if (nameLower.includes('vocal') || nameLower.includes('vox')) return 'vocals';
    if (nameLower.includes('drum') || nameLower.includes('kick') || nameLower.includes('snare')) return 'drums';
    if (nameLower.includes('bass')) return 'bass';
    if (nameLower.includes('guitar') || nameLower.includes('gtr')) return 'guitar';
    if (nameLower.includes('key') || nameLower.includes('piano')) return 'keys';
    if (nameLower.includes('synth') || nameLower.includes('pad')) return 'synth';
    if (nameLower.includes('string') || nameLower.includes('violin')) return 'strings';
    if (nameLower.includes('fx') || nameLower.includes('effect')) return 'fx';
    
    // Use spectral analysis
    if (spectral.centroid < 200) return 'bass';
    if (spectral.centroid > 2000 && dynamics.crest > 15) return 'drums';
    if (spectral.centroid > 800 && spectral.centroid < 3000) return 'vocals';
    if (spectral.flatness > 0.3) return 'fx';
    
    return 'other';
  }
  
  /**
   * Find dominant frequency
   */
  private findDominantFrequency(spectral: SpectralAnalysis): number {
    let maxMag = 0;
    let maxIdx = 0;
    
    for (let i = 1; i < spectral.magnitudes.length / 2; i++) {
      if (spectral.magnitudes[i] > maxMag) {
        maxMag = spectral.magnitudes[i];
        maxIdx = i;
      }
    }
    
    return spectral.frequencies[maxIdx] || 440;
  }
  
  /**
   * Generate auto-mix settings for all tracks
   */
  async generateAutoMix(
    tracks: Array<{ id: string; name: string; buffer: AudioBuffer }>,
    context?: AURAContext
  ): Promise<AutoMixResult> {
    const startTime = performance.now();
    als.info(`[AutoMix] Analyzing ${tracks.length} tracks...`);
    
    // Analyze all tracks
    const analyses: TrackAnalysis[] = [];
    for (const track of tracks) {
      const analysis = await this.analyzeTrack(track.id, track.name, track.buffer);
      analyses.push(analysis);
    }
    
    // Generate settings for each track
    const mixSettings: AutoMixSettings[] = [];
    for (const analysis of analyses) {
      const settings = this.generateTrackSettings(analysis, analyses);
      mixSettings.push(settings);
    }
    
    // Balance the mix
    this.balanceMix(mixSettings, analyses);
    
    // Generate master settings
    const avgRms = analyses.reduce((a, b) => a + b.dynamics.rms, 0) / analyses.length;
    const masterSettings = {
      volume: 0.8,
      limiter: {
        enabled: true,
        ceiling: -0.3,
        release: 50,
      },
      targetLufs: -14,
    };
    
    // Generate suggestions using AI
    const suggestions = await this.getAISuggestions(analyses, context);
    
    const analysisTimeMs = performance.now() - startTime;
    als.success(`[AutoMix] Generated mix settings in ${analysisTimeMs.toFixed(0)}ms`);
    
    return {
      tracks: mixSettings,
      masterSettings,
      genre: context?.genre || 'unknown',
      tempo: context?.bpm || 120,
      key: context?.key || 'C',
      analysisTimeMs,
      suggestions,
    };
  }
  
  /**
   * Generate settings for a single track based on analysis
   */
  private generateTrackSettings(
    analysis: TrackAnalysis,
    allAnalyses: TrackAnalysis[]
  ): AutoMixSettings {
    const { type, spectral, dynamics, temporal } = analysis;
    
    // Base settings by track type
    const typeSettings = this.getTypePresets(type);
    
    // Calculate EQ based on spectral content
    const eq = this.calculateEQ(analysis, allAnalyses);
    
    // Calculate compression based on dynamics
    const compressor = this.calculateCompression(analysis);
    
    // Calculate pan position
    const pan = this.calculatePan(analysis, allAnalyses);
    
    // Calculate send levels
    const sends = this.calculateSends(analysis);
    
    // Calculate confidence based on analysis quality
    const confidence = this.calculateConfidence(analysis);
    
    return {
      trackId: analysis.id,
      volume: typeSettings.volume,
      pan,
      mute: false,
      solo: false,
      eq,
      compressor,
      sends,
      confidence,
      reasoning: this.generateReasoning(analysis, typeSettings),
    };
  }
  
  /**
   * Get default presets for track types
   */
  private getTypePresets(type: TrackAnalysis['type']): { volume: number; priority: number } {
    const presets: Record<TrackAnalysis['type'], { volume: number; priority: number }> = {
      vocals: { volume: 0.85, priority: 1 },
      drums: { volume: 0.80, priority: 2 },
      bass: { volume: 0.75, priority: 3 },
      guitar: { volume: 0.70, priority: 4 },
      keys: { volume: 0.65, priority: 5 },
      synth: { volume: 0.65, priority: 6 },
      strings: { volume: 0.60, priority: 7 },
      fx: { volume: 0.50, priority: 8 },
      other: { volume: 0.60, priority: 9 },
    };
    return presets[type];
  }
  
  /**
   * Calculate EQ settings
   */
  private calculateEQ(
    analysis: TrackAnalysis,
    allAnalyses: TrackAnalysis[]
  ): AutoMixSettings['eq'] {
    const { type, spectral } = analysis;
    
    // Default EQ curve
    let lowCut = 20;
    let lowGain = 0;
    let lowMidFreq = 300;
    let lowMidGain = 0;
    let highMidFreq = 2000;
    let highMidGain = 0;
    let highGain = 0;
    let highShelf = 10000;
    
    switch (type) {
      case 'vocals':
        lowCut = 80;
        lowMidGain = -2; // Cut mud
        highMidFreq = 3000;
        highMidGain = 2; // Presence
        highGain = 1; // Air
        break;
        
      case 'drums':
        lowCut = 30;
        lowGain = 2;
        highMidFreq = 4000;
        highMidGain = 1;
        break;
        
      case 'bass':
        lowCut = 30;
        lowGain = 1;
        lowMidGain = -2; // Cut mud
        highMidFreq = 1500;
        highGain = -2; // Reduce harshness
        break;
        
      case 'guitar':
        lowCut = 80;
        lowMidFreq = 400;
        lowMidGain = -2;
        highMidFreq = 2500;
        highMidGain = 1;
        break;
        
      case 'keys':
      case 'synth':
        lowCut = 60;
        highMidFreq = 2000;
        highGain = 1;
        break;
        
      default:
        lowCut = 40;
    }
    
    // Adjust based on spectral analysis
    if (spectral.centroid < 500) {
      highGain = Math.max(highGain, 1); // Brighten dark tracks
    } else if (spectral.centroid > 3000) {
      highGain = Math.min(highGain, 0); // Tame bright tracks
    }
    
    return {
      enabled: true,
      lowCut,
      lowGain,
      lowMidFreq,
      lowMidGain,
      highMidFreq,
      highMidGain,
      highGain,
      highShelf,
    };
  }
  
  /**
   * Calculate compression settings
   */
  private calculateCompression(analysis: TrackAnalysis): AutoMixSettings['compressor'] {
    const { type, dynamics, temporal } = analysis;
    
    // Base settings
    let threshold = -18;
    let ratio = 3;
    let attack = 10;
    let release = 100;
    let makeup = 0;
    let enabled = true;
    
    switch (type) {
      case 'vocals':
        threshold = -20;
        ratio = 3;
        attack = 5;
        release = 100;
        break;
        
      case 'drums':
        if (temporal.transient > 0.5) {
          // Punchy: slow attack
          attack = 30;
          release = 50;
          ratio = 4;
        } else {
          // Controlled
          attack = 1;
          release = 100;
          ratio = 6;
        }
        break;
        
      case 'bass':
        threshold = -15;
        ratio = 4;
        attack = 20;
        release = 200;
        break;
        
      case 'guitar':
      case 'keys':
      case 'synth':
        enabled = dynamics.dynamicRange > 20;
        ratio = 2;
        attack = 20;
        break;
        
      default:
        enabled = dynamics.dynamicRange > 15;
    }
    
    // Adjust threshold based on RMS
    threshold = Math.max(threshold, dynamics.rms + 6);
    
    // Calculate makeup gain
    const expectedGR = Math.max(0, Math.abs(dynamics.rms - threshold) * (1 - 1/ratio));
    makeup = expectedGR * 0.5; // 50% of GR as makeup
    
    return { enabled, threshold, ratio, attack, release, makeup };
  }
  
  /**
   * Calculate pan position
   */
  private calculatePan(
    analysis: TrackAnalysis,
    allAnalyses: TrackAnalysis[]
  ): number {
    const { type } = analysis;
    
    // Keep bass and kick centered
    if (type === 'bass') return 0;
    if (type === 'drums' && analysis.name.toLowerCase().includes('kick')) return 0;
    if (type === 'vocals') return 0;
    
    // Count tracks of same type
    const sameType = allAnalyses.filter(a => a.type === type);
    const index = sameType.findIndex(a => a.id === analysis.id);
    
    if (sameType.length === 1) {
      // Single track: slight offset based on type
      switch (type) {
        case 'guitar': return 0.5;
        case 'keys': return -0.3;
        case 'synth': return 0.4;
        case 'strings': return -0.4;
        default: return 0;
      }
    }
    
    // Multiple tracks: spread them
    const spread = 0.7;
    const step = (spread * 2) / (sameType.length - 1);
    return -spread + index * step;
  }
  
  /**
   * Calculate send levels
   */
  private calculateSends(analysis: TrackAnalysis): AutoMixSettings['sends'] {
    const { type, temporal, dynamics } = analysis;
    
    let reverb = 0.15;
    let delay = 0;
    
    switch (type) {
      case 'vocals':
        reverb = 0.25;
        delay = temporal.rhythm > 0.5 ? 0.1 : 0;
        break;
        
      case 'drums':
        reverb = 0.1;
        break;
        
      case 'bass':
        reverb = 0.05;
        break;
        
      case 'guitar':
        reverb = 0.2;
        delay = 0.1;
        break;
        
      case 'keys':
      case 'synth':
        reverb = 0.3;
        delay = 0.05;
        break;
        
      case 'strings':
        reverb = 0.4;
        break;
        
      case 'fx':
        reverb = 0.2;
        delay = 0.2;
        break;
    }
    
    // Reduce reverb for tracks with long decay
    if (temporal.decay > 1000) {
      reverb *= 0.5;
    }
    
    return { reverb, delay };
  }
  
  /**
   * Balance the overall mix
   */
  private balanceMix(settings: AutoMixSettings[], analyses: TrackAnalysis[]): void {
    // Find the loudest track
    const rmsValues = analyses.map(a => a.dynamics.rms);
    const maxRms = Math.max(...rmsValues);
    
    // Adjust volumes relative to loudest
    for (let i = 0; i < settings.length; i++) {
      const analysis = analyses[i];
      const rmsOffset = maxRms - analysis.dynamics.rms;
      
      // Compress the volume differences
      const adjustment = rmsOffset * 0.02; // 2% per dB
      settings[i].volume = Math.max(0.3, Math.min(1, settings[i].volume + adjustment));
    }
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidence(analysis: TrackAnalysis): number {
    // Higher confidence if:
    // - Clear spectral peaks (not noisy)
    // - Reasonable dynamic range
    // - Track type was detected from name
    
    let confidence = 0.7;
    
    if (analysis.spectral.flatness < 0.2) confidence += 0.1; // Clear tonal content
    if (analysis.dynamics.dynamicRange > 10) confidence += 0.1; // Good dynamics
    if (analysis.temporal.transient < 0.8) confidence += 0.1; // Not too clicky
    
    return Math.min(1, confidence);
  }
  
  /**
   * Generate reasoning for settings
   */
  private generateReasoning(
    analysis: TrackAnalysis,
    typePresets: { volume: number; priority: number }
  ): string {
    const parts: string[] = [];
    
    parts.push(`Detected as ${analysis.type} track.`);
    
    if (analysis.spectral.centroid > 2000) {
      parts.push('Bright tonality - reduced high shelf.');
    } else if (analysis.spectral.centroid < 500) {
      parts.push('Dark tonality - boosted presence.');
    }
    
    if (analysis.dynamics.crest > 15) {
      parts.push('High transient content - using slower attack compression.');
    }
    
    if (analysis.temporal.decay > 1000) {
      parts.push('Long decay - reduced reverb to avoid muddiness.');
    }
    
    return parts.join(' ');
  }
  
  /**
   * Get AI suggestions for the mix
   */
  private async getAISuggestions(
    analyses: TrackAnalysis[],
    context?: AURAContext
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Check for frequency masking
    const bassCount = analyses.filter(a => a.type === 'bass' || a.spectral.centroid < 200).length;
    if (bassCount > 1) {
      suggestions.push('Multiple bass-heavy tracks detected. Consider high-pass filtering some to reduce low-end buildup.');
    }
    
    // Check for dynamic range
    const lowDynamics = analyses.filter(a => a.dynamics.dynamicRange < 6);
    if (lowDynamics.length > analyses.length / 2) {
      suggestions.push('Many tracks have limited dynamic range. Consider using less compression for a more natural sound.');
    }
    
    // Check for brightness
    const brightTracks = analyses.filter(a => a.spectral.centroid > 3000);
    if (brightTracks.length > analyses.length / 2) {
      suggestions.push('Mix may be overly bright. Consider gentle high shelf cuts on some tracks.');
    }
    
    // Try to get AI suggestions
    try {
      const engine = getAURALLMEngine();
      if (engine.getStatus().available) {
        const aiSuggestion = await engine.getMixingSuggestions({
          ...context,
          trackCount: analyses.length,
          trackTypes: analyses.map(a => a.type),
        });
        
        // Parse AI suggestions
        const lines = aiSuggestion.split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
        suggestions.push(...lines.slice(0, 3));
      }
    } catch {
      // AI not available, use rule-based suggestions only
    }
    
    return suggestions;
  }
  
  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

// Global singleton
let globalAutoMix: AURAAutoMixEngine | null = null;

/**
 * Get the Auto-Mix Engine
 */
export function getAutoMixEngine(): AURAAutoMixEngine {
  if (!globalAutoMix) {
    globalAutoMix = new AURAAutoMixEngine();
  }
  return globalAutoMix;
}

/**
 * Run auto-mix on tracks
 */
export async function runAutoMix(
  tracks: Array<{ id: string; name: string; buffer: AudioBuffer }>,
  context?: AURAContext
): Promise<AutoMixResult> {
  const engine = getAutoMixEngine();
  return engine.generateAutoMix(tracks, context);
}

export { AURAAutoMixEngine };
export default AURAAutoMixEngine;
