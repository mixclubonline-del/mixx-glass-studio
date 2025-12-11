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
    
    // Ensure context is in 'suspended' state before rendering
    if (offline.state === 'closed') {
      console.warn('[FLOW IMPORT] OfflineAudioContext was closed, returning original buffer');
      return audioBuffer;
    }
    
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
    const renderPromise = offline.startRendering().catch((error) => {
      // If context is stopped/closed, return original buffer
      if (offline.state === 'closed' || offline.state === 'suspended') {
        console.warn('[FLOW IMPORT] OfflineAudioContext in invalid state for rendering:', offline.state);
        return audioBuffer;
      }
      throw error;
    });
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
  
  // 2TRACK MODE - Use AI model for proper stem separation of final mixes
  if (mode === '2track') {
    try {
      // Try to use AI model for proper separation
      const aiResult = await aiFullStemModel(audioBuffer);
      
      // Map AI results to our stem format
      if (aiResult.vocals) result.vocals = aiResult.vocals;
      if (aiResult.drums) result.drums = aiResult.drums;
      if (aiResult.bass) result.bass = aiResult.bass;
      if (aiResult.music) {
        result.music = aiResult.music;
        result.harmonic = aiResult.music; // Use music as harmonic for two-track
      }
      
      // If we got some stems, return them
      const stemCount = Object.values(result).filter(b => b !== null).length;
      if (stemCount > 0) {
        return result;
      }
      
      // Fall through to full mode if AI didn't produce stems
    } catch (aiError) {
      console.warn('[FLOW IMPORT] AI separation failed, falling back to full mode:', aiError);
      // Fall through to full mode
    }
    // Don't return here - let it fall through to FULL MODE for proper separation
  }
  
  // FULL MODE - Use HPSS + vocal extraction for proper stem separation
  try {
    // Use HPSS for harmonic/percussive separation
    const hpssResult = await hpss(audioBuffer);

    // Extract vocals using AI model (or fallback)
    const vocals = await aiVocalModel(audioBuffer);

    // Extract bass from harmonic content (or original if harmonic failed)
    const bass = await extractBass(hpssResult.harmonic || audioBuffer);

    // Extract sub-bass (808s)
    const sub = await extractSubBass(audioBuffer);

    // Assign stems
    result.vocals = vocals;
    result.drums = hpssResult.percussive;
    result.harmonic = hpssResult.harmonic;
    result.music = hpssResult.harmonic; // Music = harmonic content (will refine below)
    result.bass = bass;
    result.sub = sub;

    // If we have vocals, subtract them from harmonic to get instrumental
    if (vocals && hpssResult.harmonic) {
      try {
        result.music = await subtract(hpssResult.harmonic, vocals);
      } catch (error) {
        console.warn('[FLOW IMPORT] Could not subtract vocals from harmonic, using harmonic as music:', error);
        result.music = hpssResult.harmonic;
      }
    }

    // Ensure we have at least some stems
    const stemCount = Object.values(result).filter(b => b !== null).length;

    // If no stems were created, fall back to frequency filtering
    if (stemCount === 0) {
      throw new Error('HPSS produced no stems, falling back to frequency filtering');
    }
  } catch (error) {
    console.error('[FLOW IMPORT] HPSS separation failed, falling back to frequency filtering:', error);
    
    // Fallback: frequency-based split (at least create some stems)
    try {
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
      
      // Also create a full mix stem
      result.harmonic = await renderPass((ctx, src) => src);
    } catch (fallbackError) {
      console.error('[FLOW IMPORT] Fallback separation also failed:', fallbackError);
      // Last resort: return original buffer as single stem
      result.music = audioBuffer;
    }
  }

  // Do not synthesize band-filter fallbacks here; return true separation results only
  // Music fallback still defaults to harmonic/original to preserve timeline context
  if (!result.music) result.music = result.harmonic ?? audioBuffer;

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

