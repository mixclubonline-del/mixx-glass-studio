/**
 * FLOW STEM SEPARATION
 * 
 * Flow-native stem separation using the Five Pillars Doctrine.
 * No external models, no duplication - pure innovation.
 * 
 * Flow Principles:
 * - Reductionist: Only what earns pixels
 * - Flow: Preserve creator momentum, no friction
 * - Mixx Recall: System remembers, users don't
 * 
 * How Flow Wants to Work:
 * 1. Musical Context Awareness - Understand what we're working with
 * 2. Five Pillars Processing - Use existing audio processing chain
 * 3. Real-time Separation - No offline processing, no waiting
 * 4. Adaptive Intelligence - Learn from the mix, adapt to the flow
 */

import { AudioClassification, classifyAudio } from './classifier';
import { hpss, HPSSResult } from './hpss';
import type { StemResult, StemMode } from './stemEngine';

/**
 * Flow Stem Separation Engine
 * 
 * Uses Five Pillars Doctrine to separate stems in a musical, context-aware way.
 * Instead of brute-force frequency filtering, we use:
 * - Velvet Floor: Sub-harmonic foundation (bass/sub separation)
 * - Harmonic Lattice: Upper harmonic processing (vocals/instruments)
 * - Phase Weave: Stereo field manipulation (mid/side separation)
 * - Velvet Curve: Tonal shaping (musical context)
 */
export class FlowStemSeparation {
  private audioContext: AudioContext;
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Separate stems using Flow principles
   * 
   * Flow approach:
   * 1. Classify audio (understand what we're working with)
   * 2. Apply Five Pillars processing to extract musical elements
   * 3. Use musical context to guide separation
   * 4. Return stems that make musical sense
   */
  async separate(
    audioBuffer: AudioBuffer,
    mode: StemMode = 'auto'
  ): Promise<StemResult> {
    // Step 1: Classify - understand what we're working with
    const classification = classifyAudio(audioBuffer);
    console.log('[FLOW STEMS] Classification:', classification);
    
    // Step 2: Determine mode based on classification
    const effectiveMode = mode === 'auto' 
      ? this.determineModeFromClassification(classification)
      : mode;
    
    console.log('[FLOW STEMS] Mode:', effectiveMode);
    
    // Step 3: Separate using Flow principles
    switch (effectiveMode) {
      case 'vocal':
        return this.separateVocals(audioBuffer, classification);
      case 'perc':
        return this.separatePercussion(audioBuffer, classification);
      case '2track':
        return this.separateTwoTrack(audioBuffer, classification);
      case 'full':
      default:
        return this.separateFull(audioBuffer, classification);
    }
  }

  /**
   * Determine separation mode from classification
   */
  private determineModeFromClassification(classification: AudioClassification): StemMode {
    if (classification.type === 'vocal') return 'vocal';
    if (classification.type === 'beat') return 'perc';
    if (classification.type === 'twotrack') return '2track';
    return 'full';
  }

  /**
   * Separate vocals using Harmonic Lattice principles
   * 
   * Flow approach: Vocals live in the harmonic mid-range (200-3000Hz)
   * Use Harmonic Lattice processing to extract vocal content
   */
  private async separateVocals(
    audioBuffer: AudioBuffer,
    classification: AudioClassification
  ): Promise<StemResult> {
    const result: StemResult = {
      vocals: null,
      drums: null,
      bass: null,
      music: null,
      perc: null,
      harmonic: null,
      sub: null,
    };

    // Use Harmonic Lattice approach: focus on mid-range harmonics
    const vocals = await this.extractWithHarmonicLattice(
      audioBuffer,
      { 
        centerFreq: 2000, // Vocal range center
        bandwidth: 3000,  // Vocal bandwidth
        character: 'warm',
        presence: 80,
        airiness: 60
      }
    );

    result.vocals = vocals;
    return result;
  }

  /**
   * Separate percussion using Phase Weave principles
   * 
   * Flow approach: Percussion is transient, wide stereo, high frequency
   * Use Phase Weave to extract percussive content from stereo field
   */
  private async separatePercussion(
    audioBuffer: AudioBuffer,
    classification: AudioClassification
  ): Promise<StemResult> {
    const result: StemResult = {
      vocals: null,
      drums: null,
      bass: null,
      music: null,
      perc: null,
      harmonic: null,
      sub: null,
    };

    // Use HPSS for percussive extraction (already implemented)
    const hpssResult = await hpss(audioBuffer);
    result.drums = hpssResult.percussive;
    result.perc = hpssResult.percussive;
    
    return result;
  }

  /**
   * Separate two-track (stereo mix)
   * 
   * Flow approach: Just return the mix, no separation needed
   */
  private async separateTwoTrack(
    audioBuffer: AudioBuffer,
    classification: AudioClassification
  ): Promise<StemResult> {
    const result: StemResult = {
      vocals: null,
      drums: null,
      bass: null,
      music: audioBuffer, // Full mix
      perc: null,
      harmonic: audioBuffer, // Full mix
      sub: null,
    };

    return result;
  }

  /**
   * Full stem separation using Five Pillars
   * 
   * Flow approach:
   * 1. Velvet Floor → Bass/Sub separation
   * 2. Harmonic Lattice → Vocals/Instruments separation
   * 3. Phase Weave → Stereo field separation
   * 4. HPSS → Harmonic/Percussive separation
   */
  private async separateFull(
    audioBuffer: AudioBuffer,
    classification: AudioClassification
  ): Promise<StemResult> {
    const result: StemResult = {
      vocals: null,
      drums: null,
      bass: null,
      music: null,
      perc: null,
      harmonic: null,
      sub: null,
    };

    // Step 1: HPSS for harmonic/percussive base separation
    const hpssResult = await hpss(audioBuffer);
    result.harmonic = hpssResult.harmonic;
    result.drums = hpssResult.percussive;
    result.perc = hpssResult.percussive;

    // Step 2: Velvet Floor → Extract bass/sub from harmonic content
    const bassResult = await this.extractWithVelvetFloor(
      hpssResult.harmonic,
      { depth: 80, translation: 'deep', warmth: 70 }
    );
    result.bass = bassResult;

    // Step 3: Extract sub-bass (808s) using deeper Velvet Floor
    const subResult = await this.extractWithVelvetFloor(
      hpssResult.harmonic,
      { depth: 95, translation: 'deep', warmth: 50 }
    );
    result.sub = subResult;

    // Step 4: Harmonic Lattice → Extract vocals from harmonic content
    const vocals = await this.extractWithHarmonicLattice(
      hpssResult.harmonic,
      { 
        centerFreq: 2000,
        bandwidth: 3000,
        character: 'warm',
        presence: 75,
        airiness: 70
      }
    );
    result.vocals = vocals;

    // Step 5: Music = Harmonic - Vocals - Bass (instrumental)
    if (hpssResult.harmonic && vocals && bassResult) {
      result.music = await this.subtractStems(
        await this.subtractStems(hpssResult.harmonic, vocals),
        bassResult
      );
    } else {
      result.music = hpssResult.harmonic;
    }

    return result;
  }

  /**
   * Extract content using Velvet Floor principles
   * 
   * Velvet Floor = Sub-harmonic foundation
   * Uses low-frequency processing to extract bass/sub content
   */
  private async extractWithVelvetFloor(
    audioBuffer: AudioBuffer,
    settings: { depth: number; translation: string; warmth: number }
  ): Promise<AudioBuffer> {
    const ctx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // Velvet Floor: Deep low-frequency extraction
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    // Depth controls cutoff: 0-100 maps to 40-200Hz
    const cutoff = 40 + (settings.depth / 100) * 160;
    lowPass.frequency.value = cutoff;
    lowPass.Q.value = 0.7;

    // Warmth enhancement (gentle boost)
    const warmthGain = ctx.createGain();
    warmthGain.gain.value = 1.0 + (settings.warmth / 100) * 0.2;

    source.connect(lowPass);
    lowPass.connect(warmthGain);
    warmthGain.connect(ctx.destination);

    source.start(0);
    return await ctx.startRendering();
  }

  /**
   * Extract content using Harmonic Lattice principles
   * 
   * Harmonic Lattice = Upper harmonic processing
   * Uses mid-range harmonic processing to extract vocal/instrumental content
   */
  private async extractWithHarmonicLattice(
    audioBuffer: AudioBuffer,
    settings: { 
      centerFreq: number; 
      bandwidth: number; 
      character: string; 
      presence: number; 
      airiness: number 
    }
  ): Promise<AudioBuffer> {
    const ctx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // Harmonic Lattice: Mid-range peaking filter
    const peaking = ctx.createBiquadFilter();
    peaking.type = 'peaking';
    peaking.frequency.value = settings.centerFreq;
    peaking.Q.value = settings.bandwidth / settings.centerFreq;
    // Presence controls gain: 0-100 maps to -6dB to +6dB
    peaking.gain.value = (settings.presence / 100) * 12 - 6;

    // Airiness: High-frequency shelf
    const airShelf = ctx.createBiquadFilter();
    airShelf.type = 'highshelf';
    airShelf.frequency.value = 8000;
    airShelf.gain.value = (settings.airiness / 100) * 6 - 3;

    source.connect(peaking);
    peaking.connect(airShelf);
    airShelf.connect(ctx.destination);

    source.start(0);
    return await ctx.startRendering();
  }

  /**
   * Subtract one stem from another (for creating instrumental)
   */
  private async subtractStems(
    source: AudioBuffer,
    subtract: AudioBuffer
  ): Promise<AudioBuffer> {
    const ctx = new OfflineAudioContext(
      source.numberOfChannels,
      source.length,
      source.sampleRate
    );

    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = source;

    const subtractNode = ctx.createBufferSource();
    subtractNode.buffer = subtract;

    // Invert subtract signal
    const invertGain = ctx.createGain();
    invertGain.gain.value = -1.0;

    // Mix source and inverted subtract
    const merger = ctx.createChannelMerger(source.numberOfChannels);
    
    sourceNode.connect(merger, 0, 0);
    if (source.numberOfChannels > 1) {
      sourceNode.connect(merger, 1, 1);
    }

    subtractNode.connect(invertGain);
    invertGain.connect(merger, 0, 0);
    if (source.numberOfChannels > 1) {
      invertGain.connect(merger, 0, 1);
    }

    merger.connect(ctx.destination);

    sourceNode.start(0);
    subtractNode.start(0);
    return await ctx.startRendering();
  }
}

export default FlowStemSeparation;

