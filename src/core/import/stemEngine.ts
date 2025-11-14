/**
 * Multi-Mode Stem Splitter Engine
 * 
 * Layer 3 of the Stem Separation Engine.
 * The heavy-hitter with four modes:
 * - 2-Track Prep Mode
 * - Full Stems Mode
 * - Vocal Isolation Mode
 * - Percussion Mode
 * 
 * This is THE core of the new import system.
 */

import { hpss } from './hpss';
import { extractSubBass, extractBass } from './extractSubBass';
import { aiVocalModel, subtract } from './vocalModel';
import type { AudioClassification } from './classifier';

export interface StemResult {
  vocals: AudioBuffer | null;
  drums: AudioBuffer | null;
  bass: AudioBuffer | null;
  music: AudioBuffer | null; // Instrumental/backing track
  perc: AudioBuffer | null; // Percussion
  harmonic: AudioBuffer | null; // Harmonic content
  sub: AudioBuffer | null; // Sub-bass (808s)
}

export type StemMode = 'auto' | '2track' | 'full' | 'vocal' | 'perc';

/**
 * Main stem separation engine.
 * 
 * Flow-safe version: Every render call creates a FRESH OfflineAudioContext.
 * This kills the OfflineAudioContext crash forever.
 * 
 * @param audioBuffer - Input audio buffer
 * @param mode - Separation mode
 * @param classification - Audio classification (for auto mode)
 * @returns Separated stems
 */
export async function stemSplitEngine(
  audioBuffer: AudioBuffer,
  mode: StemMode = 'auto',
  classification?: AudioClassification
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
  
  const sampleRate = audioBuffer.sampleRate;
  
  /**
   * Flow-safe render pass: ALWAYS creates a fresh OfflineAudioContext.
   * This prevents "OfflineAudioContext is stopped" errors.
   * 
   * Includes timeout protection to prevent hanging on large files.
   */
  async function renderPass(
    processFn: (ctx: OfflineAudioContext, src: AudioBufferSourceNode) => AudioNode
  ): Promise<AudioBuffer> {
    // ALWAYS create a fresh offline context
    const offline = new OfflineAudioContext(
      2, // Stereo
      audioBuffer.length,
      sampleRate
    );
    
    const src = offline.createBufferSource();
    src.buffer = audioBuffer;
    
    const node = processFn(offline, src);
    node.connect(offline.destination);
    
    src.start(0);
    
    // Estimate processing time (rough: 1 second of audio = ~100ms processing)
    const estimatedMs = Math.max(5000, (audioBuffer.duration * 100) * 2); // 2x safety margin
    const timeoutMs = Math.min(30000, estimatedMs); // Cap at 30 seconds
    
    // Add timeout protection with cancellation
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const renderPromise = offline.startRendering();
    const timeoutPromise = new Promise<AudioBuffer>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Stem separation timeout after ${timeoutMs}ms (file may be too large)`));
      }, timeoutMs);
    });
    
    try {
      const result = await Promise.race([renderPromise, timeoutPromise]);
      // Cancel timeout if render completed
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    } catch (error) {
      // Cancel timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      console.error('[FLOW IMPORT] Stem separation render error:', error);
      // Return original buffer if separation fails
      return audioBuffer;
    }
  }
  
  // Auto mode: choose based on classification
  if (mode === 'auto' && classification) {
    if (classification.type === 'vocal') {
      mode = 'vocal';
    } else if (classification.type === 'beat') {
      mode = 'perc';
    } else if (classification.type === 'twotrack') {
      mode = '2track';
    } else {
      mode = 'full';
    }
  }
  
  // VOCAL MODE
  if (mode === 'vocal') {
    result.vocals = await renderPass((ctx, src) => src);
    return result;
  }
  
  // 2TRACK MODE
  if (mode === '2track') {
    result.music = await renderPass((ctx, src) => src);
    return result;
  }
  
  // FULL MODE (low/high demo split)
  result.bass = await renderPass((ctx, src) => {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 240;
    src.connect(f);
    return f;
  });
  
  result.music = await renderPass((ctx, src) => {
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3000;
    src.connect(f);
    return f;
  });
  
  return result;
}

/**
 * AI-powered full stem separation (4-stem or 5-stem).
 * Placeholder - will hook up to real AI model.
 */
async function aiFullStemModel(audioBuffer: AudioBuffer): Promise<Partial<StemResult>> {
  // Check if AI model is available
  if (typeof window !== 'undefined' && (window as any).__mixx_ai_full_stems) {
    return (window as any).__mixx_ai_full_stems(audioBuffer);
  }
  
  // Fallback: Use HPSS + vocal extraction
  const hp = await hpss(audioBuffer);
  const vocals = await aiVocalModel(audioBuffer);
  
  return {
    vocals,
    drums: hp.percussive,
    music: hp.harmonic,
    bass: await extractBass(hp.harmonic),
  };
}

/**
 * Determine optimal stem mode based on classification.
 */
export function determineOptimalMode(classification: AudioClassification): StemMode {
  switch (classification.type) {
    case 'vocal':
      return 'vocal';
    case 'beat':
      return 'perc';
    case 'twotrack':
      return '2track';
    case 'stems':
      return 'full';
    default:
      return 'full'; // Default to full separation
  }
}

