/**
 * WASM DSP LOADER
 * 
 * Loads and initializes the compiled WASM DSP module.
 * Provides singleton access to WASM DSP classes.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 38 WASM DSP Integration
 */

import init, {
  BiquadFilter,
  Saturator,
  MidSideProcessor,
  Compressor,
  EnvelopeFollower,
} from './pkg/mixx_dsp_wasm';

// Re-export types
export { BiquadFilter, Saturator, MidSideProcessor, Compressor, EnvelopeFollower };

let wasmInitialized = false;
let wasmInitPromise: Promise<boolean> | null = null;

/**
 * Initialize the WASM DSP module
 */
export async function initWASMDSP(): Promise<boolean> {
  if (wasmInitialized) return true;
  
  if (wasmInitPromise) {
    return wasmInitPromise;
  }
  
  wasmInitPromise = (async () => {
    try {
      await init();
      wasmInitialized = true;
      console.log('[WASM DSP] ✅ Module initialized successfully');
      return true;
    } catch (error) {
      console.error('[WASM DSP] ❌ Failed to initialize:', error);
      return false;
    }
  })();
  
  const result = await wasmInitPromise;
  wasmInitPromise = null;
  return result;
}

/**
 * Check if WASM DSP is initialized
 */
export function isWASMDSPInitialized(): boolean {
  return wasmInitialized;
}

/**
 * Create a WASM-based lowpass filter
 */
export function createWASMLowpass(frequency: number, q: number, sampleRate: number): BiquadFilter | null {
  if (!wasmInitialized) return null;
  return new BiquadFilter(frequency, q, sampleRate);
}

/**
 * Create a WASM-based highpass filter
 */
export function createWASMHighpass(frequency: number, q: number, sampleRate: number): BiquadFilter | null {
  if (!wasmInitialized) return null;
  return BiquadFilter.new_highpass(frequency, q, sampleRate);
}

/**
 * Create a WASM-based peaking EQ
 */
export function createWASMPeakingEQ(frequency: number, q: number, gainDb: number, sampleRate: number): BiquadFilter | null {
  if (!wasmInitialized) return null;
  return BiquadFilter.new_peaking(frequency, q, gainDb, sampleRate);
}

/**
 * Create a WASM-based high shelf filter
 */
export function createWASMHighShelf(frequency: number, gainDb: number, sampleRate: number): BiquadFilter | null {
  if (!wasmInitialized) return null;
  return BiquadFilter.new_highshelf(frequency, gainDb, sampleRate);
}

/**
 * Create a WASM-based saturator
 */
export function createWASMSaturator(amount: number): Saturator | null {
  if (!wasmInitialized) return null;
  return new Saturator(amount);
}

/**
 * Create a WASM-based M/S processor
 */
export function createWASMMidSide(width: number): MidSideProcessor | null {
  if (!wasmInitialized) return null;
  return new MidSideProcessor(width);
}

/**
 * Create a WASM-based compressor
 */
export function createWASMCompressor(
  thresholdDb: number,
  ratio: number,
  attackMs: number,
  releaseMs: number,
  sampleRate: number
): Compressor | null {
  if (!wasmInitialized) return null;
  return new Compressor(thresholdDb, ratio, attackMs, releaseMs, sampleRate);
}
