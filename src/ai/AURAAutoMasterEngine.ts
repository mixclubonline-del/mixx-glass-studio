/**
 * AURA AUTO-MASTER ENGINE
 * Phase 39: AI-Powered Automatic Mastering
 * 
 * Analyzes the final mix and generates optimal mastering chain settings.
 * Uses spectral analysis + loudness metering + AI to apply:
 * - EQ matching / correction
 * - Multi-band compression
 * - Stereo enhancement
 * - Limiting / loudness maximization
 * - Dithering
 * 
 * Supports multiple target formats:
 * - Streaming (-14 LUFS)
 * - Club/DJ (-8 LUFS)
 * - Broadcast (-24 LUFS)
 * - Vinyl (with headroom)
 * 
 * @author Prime (Mixx Club)
 */

import { gpuSpectralAnalysis, type SpectralAnalysis } from '../core/quantum/GPUAudioProcessor';
import { getAURALLMEngine, type AURAContext } from './AURALocalLLMEngine';
import { als } from '../utils/alsFeedback';

// Target format presets
export type MasterFormat = 'streaming' | 'club' | 'broadcast' | 'vinyl' | 'custom';

// Target specifications
export interface MasterTarget {
  format: MasterFormat;
  targetLufs: number;
  truePeakCeiling: number;    // dBTP
  dynamicRange: number;        // LU
  sampleRate: number;
  bitDepth: number;
}

// Master format presets
export const MASTER_PRESETS: Record<MasterFormat, Omit<MasterTarget, 'format'>> = {
  streaming: {
    targetLufs: -14,
    truePeakCeiling: -1,
    dynamicRange: 8,
    sampleRate: 44100,
    bitDepth: 16,
  },
  club: {
    targetLufs: -8,
    truePeakCeiling: -0.3,
    dynamicRange: 6,
    sampleRate: 44100,
    bitDepth: 24,
  },
  broadcast: {
    targetLufs: -24,
    truePeakCeiling: -3,
    dynamicRange: 12,
    sampleRate: 48000,
    bitDepth: 24,
  },
  vinyl: {
    targetLufs: -12,
    truePeakCeiling: -1,
    dynamicRange: 10,
    sampleRate: 96000,
    bitDepth: 24,
  },
  custom: {
    targetLufs: -14,
    truePeakCeiling: -1,
    dynamicRange: 8,
    sampleRate: 44100,
    bitDepth: 16,
  },
};

// Mix analysis result
export interface MixAnalysis {
  // Loudness (EBU R128)
  loudness: {
    integrated: number;        // LUFS
    shortTerm: number;         // LUFS (3 sec)
    momentary: number;         // LUFS (400ms)
    range: number;             // LU
    truePeak: number;          // dBTP
  };
  
  // Spectral balance
  spectrum: {
    low: number;               // 20-250 Hz energy ratio
    mid: number;               // 250-4000 Hz energy ratio
    high: number;              // 4000-20000 Hz energy ratio
    centroid: number;          // Hz
    rolloff: number;           // Hz
  };
  
  // Stereo field
  stereo: {
    width: number;             // 0-1
    correlation: number;       // -1 to 1
    balance: number;           // -1 to 1 (L/R)
    monoCompatibility: number; // 0-1
  };
  
  // Dynamics
  dynamics: {
    rms: number;               // dB
    peak: number;              // dB
    crest: number;             // dB
    dynamicRange: number;      // dB
  };
  
  // Issues detected
  issues: string[];
}

// Mastering chain settings
export interface MasterSettings {
  // Input
  inputGain: number;           // dB
  
  // Pre-EQ (corrective)
  preEQ: {
    enabled: boolean;
    lowCut: number;            // Hz
    lowShelf: { freq: number; gain: number };
    lowMid: { freq: number; gain: number; q: number };
    mid: { freq: number; gain: number; q: number };
    highMid: { freq: number; gain: number; q: number };
    highShelf: { freq: number; gain: number };
  };
  
  // Multi-band compression
  multiband: {
    enabled: boolean;
    bands: Array<{
      lowFreq: number;
      highFreq: number;
      threshold: number;
      ratio: number;
      attack: number;
      release: number;
      makeup: number;
    }>;
  };
  
  // Stereo enhancement
  stereo: {
    enabled: boolean;
    width: number;             // 0-2 (1 = neutral)
    lowWidth: number;          // 0-1 (mono bass)
    midSideBalance: number;    // -1 to 1
  };
  
  // Saturation/harmonics
  saturation: {
    enabled: boolean;
    drive: number;             // 0-1
    type: 'tape' | 'tube' | 'transistor';
    mix: number;               // 0-1
  };
  
  // Limiter
  limiter: {
    enabled: boolean;
    threshold: number;         // dB
    ceiling: number;           // dBTP
    release: number;           // ms
    lookahead: number;         // ms
  };
  
  // Dithering
  dither: {
    enabled: boolean;
    bitDepth: number;
    type: 'triangular' | 'shaped' | 'none';
  };
  
  // Metadata
  confidence: number;
  reasoning: string[];
  warnings: string[];
}

// Full mastering result
export interface AutoMasterResult {
  analysis: MixAnalysis;
  settings: MasterSettings;
  target: MasterTarget;
  expectedLufs: number;
  processingTimeMs: number;
}

/**
 * AURA Auto-Master Engine
 * 
 * Analyzes final mix and generates optimal mastering settings.
 */
class AURAAutoMasterEngine {
  
  /**
   * Analyze the mix
   */
  async analyzeMix(audioBuffer: AudioBuffer): Promise<MixAnalysis> {
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 
      ? audioBuffer.getChannelData(1) 
      : leftChannel;
    const sampleRate = audioBuffer.sampleRate;
    
    // Combine channels for mono analysis
    const mono = new Float32Array(leftChannel.length);
    for (let i = 0; i < mono.length; i++) {
      mono[i] = (leftChannel[i] + rightChannel[i]) / 2;
    }
    
    // Spectral analysis
    const spectralResult = await gpuSpectralAnalysis(mono, sampleRate);
    const spectrum = this.analyzeSpectralBalance(spectralResult, sampleRate);
    
    // Loudness analysis
    const loudness = this.analyzeLoudness(mono, sampleRate);
    
    // Stereo analysis
    const stereo = this.analyzeStereo(leftChannel, rightChannel);
    
    // Dynamics analysis
    const dynamics = this.analyzeDynamics(mono);
    
    // Detect issues
    const issues = this.detectIssues(loudness, spectrum, stereo, dynamics);
    
    return {
      loudness,
      spectrum,
      stereo,
      dynamics,
      issues,
    };
  }
  
  /**
   * Analyze spectral balance
   */
  private analyzeSpectralBalance(
    spectral: SpectralAnalysis,
    sampleRate: number
  ): MixAnalysis['spectrum'] {
    const { frequencies, magnitudes } = spectral;
    
    let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      const mag = magnitudes[i] * magnitudes[i]; // Energy
      totalEnergy += mag;
      
      if (freq < 250) lowEnergy += mag;
      else if (freq < 4000) midEnergy += mag;
      else highEnergy += mag;
    }
    
    // Normalize to ratios
    const total = totalEnergy || 1;
    
    return {
      low: lowEnergy / total,
      mid: midEnergy / total,
      high: highEnergy / total,
      centroid: spectral.centroid,
      rolloff: spectral.rolloff,
    };
  }
  
  /**
   * Analyze loudness (simplified EBU R128-like)
   */
  private analyzeLoudness(
    samples: Float32Array,
    sampleRate: number
  ): MixAnalysis['loudness'] {
    const length = samples.length;
    
    // Calculate RMS for LUFS approximation
    let sumSquares = 0;
    let peak = 0;
    
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(samples[i]);
      sumSquares += samples[i] * samples[i];
      if (abs > peak) peak = abs;
    }
    
    const rms = Math.sqrt(sumSquares / length);
    
    // Approximate LUFS (simplified - real LUFS uses K-weighting)
    const rmsDb = 20 * Math.log10(rms + 1e-10);
    const lufs = rmsDb - 0.691; // Rough approximation
    
    // Short-term LUFS (3 second windows)
    const windowSize = sampleRate * 3;
    const shortTermValues: number[] = [];
    
    for (let i = 0; i < length - windowSize; i += sampleRate) {
      let windowSum = 0;
      for (let j = 0; j < windowSize && i + j < length; j++) {
        windowSum += samples[i + j] * samples[i + j];
      }
      const windowRms = Math.sqrt(windowSum / windowSize);
      shortTermValues.push(20 * Math.log10(windowRms + 1e-10) - 0.691);
    }
    
    const shortTerm = shortTermValues.length > 0
      ? shortTermValues.reduce((a, b) => a + b, 0) / shortTermValues.length
      : lufs;
    
    // Loudness range
    shortTermValues.sort((a, b) => a - b);
    const rangeHigh = shortTermValues[Math.floor(shortTermValues.length * 0.95)] || lufs;
    const rangeLow = shortTermValues[Math.floor(shortTermValues.length * 0.10)] || lufs;
    const range = rangeHigh - rangeLow;
    
    // True peak
    const truePeak = 20 * Math.log10(peak + 1e-10);
    
    return {
      integrated: lufs,
      shortTerm,
      momentary: lufs, // Would need 400ms window
      range: Math.abs(range),
      truePeak,
    };
  }
  
  /**
   * Analyze stereo field
   */
  private analyzeStereo(
    left: Float32Array,
    right: Float32Array
  ): MixAnalysis['stereo'] {
    const length = left.length;
    
    let sumLL = 0, sumRR = 0, sumLR = 0;
    let leftSum = 0, rightSum = 0;
    let midSum = 0, sideSum = 0;
    
    for (let i = 0; i < length; i++) {
      const l = left[i];
      const r = right[i];
      
      sumLL += l * l;
      sumRR += r * r;
      sumLR += l * r;
      
      leftSum += Math.abs(l);
      rightSum += Math.abs(r);
      
      const mid = (l + r) / 2;
      const side = (l - r) / 2;
      midSum += mid * mid;
      sideSum += side * side;
    }
    
    // Correlation (-1 to 1)
    const correlation = sumLR / (Math.sqrt(sumLL * sumRR) + 1e-10);
    
    // Balance (-1 = left, 1 = right)
    const totalLR = leftSum + rightSum;
    const balance = totalLR > 0 ? (rightSum - leftSum) / totalLR : 0;
    
    // Width (0-1, based on side/mid ratio)
    const totalMS = midSum + sideSum;
    const width = totalMS > 0 ? sideSum / totalMS : 0;
    
    // Mono compatibility (how much is lost in mono)
    const monoEnergy = midSum;
    const stereoEnergy = midSum + sideSum;
    const monoCompatibility = stereoEnergy > 0 ? monoEnergy / stereoEnergy : 1;
    
    return {
      width: Math.min(1, width * 2), // Scale up
      correlation,
      balance,
      monoCompatibility,
    };
  }
  
  /**
   * Analyze dynamics
   */
  private analyzeDynamics(samples: Float32Array): MixAnalysis['dynamics'] {
    const length = samples.length;
    
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
    
    // Dynamic range from windowed analysis
    const windowSize = 4096;
    const rmsValues: number[] = [];
    
    for (let i = 0; i < length - windowSize; i += windowSize / 2) {
      let windowSum = 0;
      for (let j = 0; j < windowSize; j++) {
        windowSum += samples[i + j] * samples[i + j];
      }
      const windowRms = Math.sqrt(windowSum / windowSize);
      if (windowRms > 1e-10) {
        rmsValues.push(20 * Math.log10(windowRms));
      }
    }
    
    rmsValues.sort((a, b) => a - b);
    const highRms = rmsValues[Math.floor(rmsValues.length * 0.9)] || rmsDb;
    const lowRms = rmsValues[Math.floor(rmsValues.length * 0.1)] || rmsDb;
    const dynamicRange = Math.abs(highRms - lowRms);
    
    return {
      rms: rmsDb,
      peak: peakDb,
      crest,
      dynamicRange,
    };
  }
  
  /**
   * Detect issues in the mix
   */
  private detectIssues(
    loudness: MixAnalysis['loudness'],
    spectrum: MixAnalysis['spectrum'],
    stereo: MixAnalysis['stereo'],
    dynamics: MixAnalysis['dynamics']
  ): string[] {
    const issues: string[] = [];
    
    // Loudness issues
    if (loudness.truePeak > -0.1) {
      issues.push('True peak is clipping - reduce input gain');
    }
    if (loudness.integrated < -24) {
      issues.push('Mix is very quiet - may need significant gain');
    }
    if (loudness.range < 4) {
      issues.push('Low loudness range - mix may be over-compressed');
    }
    
    // Spectral issues
    if (spectrum.low > 0.5) {
      issues.push('Excessive low frequency energy - consider high-pass or low shelf cut');
    }
    if (spectrum.high < 0.05) {
      issues.push('Lacking high frequency content - mix may sound dull');
    }
    if (spectrum.centroid < 800) {
      issues.push('Low spectral centroid - mix is bass-heavy');
    }
    if (spectrum.centroid > 4000) {
      issues.push('High spectral centroid - mix may sound harsh');
    }
    
    // Stereo issues
    if (stereo.correlation < 0.3) {
      issues.push('Poor stereo correlation - potential phase issues');
    }
    if (Math.abs(stereo.balance) > 0.2) {
      issues.push(`Stereo imbalance detected (${stereo.balance > 0 ? 'right' : 'left'} heavy)`);
    }
    if (stereo.monoCompatibility < 0.6) {
      issues.push('Poor mono compatibility - mix loses energy in mono');
    }
    
    // Dynamics issues
    if (dynamics.crest < 6) {
      issues.push('Very low crest factor - mix is over-compressed');
    }
    if (dynamics.crest > 20) {
      issues.push('Very high crest factor - may need compression');
    }
    
    return issues;
  }
  
  /**
   * Generate mastering settings
   */
  async generateMasterSettings(
    analysis: MixAnalysis,
    target: MasterTarget,
    context?: AURAContext
  ): Promise<MasterSettings> {
    const { loudness, spectrum, stereo, dynamics, issues } = analysis;
    const warnings: string[] = [];
    const reasoning: string[] = [];
    
    // Calculate needed gain
    const gainNeeded = target.targetLufs - loudness.integrated;
    const inputGain = Math.max(-12, Math.min(12, gainNeeded * 0.7)); // Conservative
    reasoning.push(`Input gain: ${inputGain.toFixed(1)}dB to approach -${Math.abs(target.targetLufs)} LUFS`);
    
    // Pre-EQ settings
    const preEQ = this.generatePreEQ(spectrum, reasoning);
    
    // Multiband compression
    const multiband = this.generateMultiband(dynamics, spectrum, target, reasoning);
    
    // Stereo settings
    const stereoSettings = this.generateStereo(stereo, reasoning, warnings);
    
    // Saturation
    const saturation = this.generateSaturation(dynamics, context, reasoning);
    
    // Limiter
    const limiter = this.generateLimiter(
      loudness,
      target,
      gainNeeded - inputGain,
      reasoning,
      warnings
    );
    
    // Dithering
    const dither = {
      enabled: target.bitDepth < 24,
      bitDepth: target.bitDepth,
      type: 'shaped' as const,
    };
    if (dither.enabled) {
      reasoning.push(`Dithering to ${target.bitDepth}-bit with noise shaping`);
    }
    
    // Calculate confidence
    let confidence = 0.8;
    if (issues.length > 3) confidence -= 0.2;
    if (warnings.length > 2) confidence -= 0.1;
    if (Math.abs(gainNeeded) > 10) confidence -= 0.1;
    
    return {
      inputGain,
      preEQ,
      multiband,
      stereo: stereoSettings,
      saturation,
      limiter,
      dither,
      confidence: Math.max(0.3, confidence),
      reasoning,
      warnings,
    };
  }
  
  /**
   * Generate Pre-EQ settings
   */
  private generatePreEQ(
    spectrum: MixAnalysis['spectrum'],
    reasoning: string[]
  ): MasterSettings['preEQ'] {
    const eq: MasterSettings['preEQ'] = {
      enabled: true,
      lowCut: 25,
      lowShelf: { freq: 80, gain: 0 },
      lowMid: { freq: 300, gain: 0, q: 1 },
      mid: { freq: 1000, gain: 0, q: 1 },
      highMid: { freq: 3000, gain: 0, q: 1 },
      highShelf: { freq: 10000, gain: 0 },
    };
    
    // Adjust based on spectral balance
    if (spectrum.low > 0.4) {
      eq.lowCut = 30;
      eq.lowShelf.gain = -2;
      reasoning.push('Reducing low end to clean up bass');
    } else if (spectrum.low < 0.2) {
      eq.lowShelf.gain = 1.5;
      reasoning.push('Boosting low shelf for warmth');
    }
    
    // Cut mud around 300Hz
    if (spectrum.mid > 0.6 && spectrum.centroid < 1500) {
      eq.lowMid.gain = -2;
      reasoning.push('Cutting 300Hz to reduce mud');
    }
    
    // High frequency
    if (spectrum.high < 0.1) {
      eq.highShelf.gain = 2;
      reasoning.push('Adding high shelf for air and presence');
    } else if (spectrum.centroid > 3500) {
      eq.highMid = { freq: 4000, gain: -1.5, q: 0.7 };
      reasoning.push('Taming harsh high-mids');
    }
    
    // Check if any EQ is applied
    const hasEQ = eq.lowShelf.gain !== 0 || 
                  eq.lowMid.gain !== 0 || 
                  eq.mid.gain !== 0 || 
                  eq.highMid.gain !== 0 || 
                  eq.highShelf.gain !== 0;
    eq.enabled = hasEQ;
    
    return eq;
  }
  
  /**
   * Generate multiband compression settings
   */
  private generateMultiband(
    dynamics: MixAnalysis['dynamics'],
    spectrum: MixAnalysis['spectrum'],
    target: MasterTarget,
    reasoning: string[]
  ): MasterSettings['multiband'] {
    const needsMultiband = dynamics.dynamicRange > target.dynamicRange + 3;
    
    if (!needsMultiband) {
      reasoning.push('Dynamic range within target - light multiband compression');
    }
    
    // Three-band compression
    const bands = [
      {
        lowFreq: 20,
        highFreq: 150,
        threshold: -20,
        ratio: 3,
        attack: 30,
        release: 200,
        makeup: spectrum.low > 0.3 ? 0 : 1,
      },
      {
        lowFreq: 150,
        highFreq: 4000,
        threshold: -18,
        ratio: 2.5,
        attack: 10,
        release: 100,
        makeup: 0,
      },
      {
        lowFreq: 4000,
        highFreq: 20000,
        threshold: -22,
        ratio: 2,
        attack: 5,
        release: 50,
        makeup: spectrum.high < 0.1 ? 1 : 0,
      },
    ];
    
    reasoning.push('Three-band multiband compression for frequency-specific dynamics control');
    
    return {
      enabled: true,
      bands,
    };
  }
  
  /**
   * Generate stereo settings
   */
  private generateStereo(
    stereo: MixAnalysis['stereo'],
    reasoning: string[],
    warnings: string[]
  ): MasterSettings['stereo'] {
    let width = 1;
    let lowWidth = 0.5; // Narrow bass
    let midSideBalance = 0;
    
    // Widen narrow mixes
    if (stereo.width < 0.3) {
      width = 1.2;
      reasoning.push('Subtle stereo widening for narrow mix');
    }
    
    // Narrow too-wide mixes
    if (stereo.width > 0.8) {
      width = 0.9;
      warnings.push('Mix is very wide - applying subtle narrowing for consistency');
    }
    
    // Mono bass for tightness
    if (stereo.correlation < 0.5) {
      lowWidth = 0.3;
      reasoning.push('Mono-ing bass frequencies for punch and focus');
    }
    
    // Correct balance
    if (Math.abs(stereo.balance) > 0.15) {
      midSideBalance = -stereo.balance * 0.5;
      warnings.push(`Correcting ${stereo.balance > 0 ? 'right' : 'left'} stereo bias`);
    }
    
    return {
      enabled: width !== 1 || lowWidth < 1 || midSideBalance !== 0,
      width,
      lowWidth,
      midSideBalance,
    };
  }
  
  /**
   * Generate saturation settings
   */
  private generateSaturation(
    dynamics: MixAnalysis['dynamics'],
    context: AURAContext | undefined,
    reasoning: string[]
  ): MasterSettings['saturation'] {
    const genre = context?.genre?.toLowerCase() || '';
    
    // Genres that benefit from saturation
    const warmGenres = ['rock', 'blues', 'soul', 'funk', 'jazz'];
    const hardGenres = ['metal', 'punk', 'industrial'];
    
    let drive = 0;
    let type: 'tape' | 'tube' | 'transistor' = 'tape';
    
    if (warmGenres.some(g => genre.includes(g))) {
      drive = 0.2;
      type = 'tape';
      reasoning.push('Gentle tape saturation for analog warmth');
    } else if (hardGenres.some(g => genre.includes(g))) {
      drive = 0.3;
      type = 'transistor';
      reasoning.push('Transistor saturation for edge and grit');
    } else if (dynamics.crest > 15) {
      drive = 0.1;
      type = 'tape';
      reasoning.push('Subtle tape saturation to tame transients');
    }
    
    return {
      enabled: drive > 0,
      drive,
      type,
      mix: 0.3,
    };
  }
  
  /**
   * Generate limiter settings
   */
  private generateLimiter(
    loudness: MixAnalysis['loudness'],
    target: MasterTarget,
    remainingGain: number,
    reasoning: string[],
    warnings: string[]
  ): MasterSettings['limiter'] {
    // Calculate threshold for target LUFS
    const threshold = Math.min(
      -0.5,
      target.truePeakCeiling - remainingGain
    );
    
    // Release time based on tempo (if available) or default
    const release = 50; // ms
    
    if (remainingGain > 6) {
      warnings.push(`High gain reduction needed (${remainingGain.toFixed(1)}dB) - may affect dynamics`);
    }
    
    reasoning.push(`Limiting with ${target.truePeakCeiling}dBTP ceiling for ${target.format} format`);
    
    return {
      enabled: true,
      threshold,
      ceiling: target.truePeakCeiling,
      release,
      lookahead: 5,
    };
  }
  
  /**
   * Run full auto-master
   */
  async autoMaster(
    audioBuffer: AudioBuffer,
    format: MasterFormat = 'streaming',
    context?: AURAContext
  ): Promise<AutoMasterResult> {
    const startTime = performance.now();
    als.info(`[AutoMaster] Analyzing mix for ${format} format...`);
    
    // Get target
    const targetPreset = MASTER_PRESETS[format];
    const target: MasterTarget = { format, ...targetPreset };
    
    // Analyze mix
    const analysis = await this.analyzeMix(audioBuffer);
    
    // Generate settings
    const settings = await this.generateMasterSettings(analysis, target, context);
    
    // Calculate expected output
    const expectedLufs = analysis.loudness.integrated + settings.inputGain;
    
    const processingTimeMs = performance.now() - startTime;
    als.success(`[AutoMaster] Generated settings in ${processingTimeMs.toFixed(0)}ms`);
    
    if (analysis.issues.length > 0) {
      als.warning(`[AutoMaster] Issues detected: ${analysis.issues.length}`);
    }
    
    return {
      analysis,
      settings,
      target,
      expectedLufs,
      processingTimeMs,
    };
  }
}

// Global singleton
let globalMaster: AURAAutoMasterEngine | null = null;

/**
 * Get the Auto-Master Engine
 */
export function getAutoMasterEngine(): AURAAutoMasterEngine {
  if (!globalMaster) {
    globalMaster = new AURAAutoMasterEngine();
  }
  return globalMaster;
}

/**
 * Run auto-mastering
 */
export async function runAutoMaster(
  audioBuffer: AudioBuffer,
  format: MasterFormat = 'streaming',
  context?: AURAContext
): Promise<AutoMasterResult> {
  const engine = getAutoMasterEngine();
  return engine.autoMaster(audioBuffer, format, context);
}

export { AURAAutoMasterEngine };
export default AURAAutoMasterEngine;
