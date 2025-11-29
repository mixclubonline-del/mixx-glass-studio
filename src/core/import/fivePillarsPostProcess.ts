/**
 * Five Pillars Post-Processing for Stem Separation
 * 
 * Layer 4 of the Revolutionary Proprietary Stem Separation System.
 * Applies Five Pillars processing to separated stems for professional enhancement:
 * - Velvet Floor: Sub-harmonic foundation for bass stems
 * - Harmonic Lattice: Upper harmonic warmth for instrumental stems
 * - Phase Weave: Stereo field correction for all stems
 * - Velvet Curve: Dynamic tonal shaping (selective application)
 */

import { createVelvetFloorStage } from '../../audio/fivePillars';
import { createHarmonicLatticeStage } from '../../audio/fivePillars';
import { createPhaseWeaveStage } from '../../audio/fivePillars';
import { createVelvetCurveStage } from '../../audio/fivePillars';
import type { MasteringProfile } from '../../types/sonic-architecture';
import type { StemResult } from './stemEngine';

export interface FivePillarsPostProcessOptions {
  profile?: MasteringProfile;
  applyToBass?: boolean; // Apply Velvet Floor to bass
  applyToHarmonic?: boolean; // Apply Harmonic Lattice to instruments
  applyToAll?: boolean; // Apply Phase Weave to all stems
  applyVelvetCurve?: boolean; // Apply Velvet Curve selectively
}

const DEFAULT_PROFILE: MasteringProfile = {
  targetLUFS: -14,
  targetTP: -1.0,
  velvetFloor: {
    amount: 0.5,
    warmth: 0.5,
    depth: 0.5,
  },
  harmonicLattice: {
    amount: 0.5,
    warmth: 0.5,
    presence: 0.5,
  },
  phaseWeave: {
    width: 0.5,
    coherence: 0.5,
  },
};

/**
 * Apply Five Pillars post-processing to separated stems
 */
export async function applyFivePillarsToStems(
  stems: StemResult,
  options: FivePillarsPostProcessOptions = {}
): Promise<StemResult> {
  const profile = options.profile || DEFAULT_PROFILE;
  const result: StemResult = {
    vocals: stems.vocals,
    drums: stems.drums,
    bass: null,
    music: stems.music,
    perc: stems.perc,
    harmonic: null,
    sub: stems.sub,
  };

  // Apply Velvet Floor to bass stem (sub-harmonic enhancement)
  if (options.applyToBass !== false && stems.bass) {
    result.bass = await applyVelvetFloorToStem(stems.bass, profile);
  } else {
    result.bass = stems.bass;
  }

  // Apply Harmonic Lattice to harmonic/instrumental stems (warmth enhancement)
  if (options.applyToHarmonic !== false && stems.harmonic) {
    result.harmonic = await applyHarmonicLatticeToStem(stems.harmonic, profile);
  } else {
    result.harmonic = stems.harmonic;
  }

  // Apply Phase Weave to all stems for stereo field correction
  if (options.applyToAll !== false) {
    if (result.vocals) {
      result.vocals = await applyPhaseWeaveToStem(result.vocals, profile);
    }
    if (result.drums) {
      result.drums = await applyPhaseWeaveToStem(result.drums, profile);
    }
    if (result.bass) {
      result.bass = await applyPhaseWeaveToStem(result.bass, profile);
    }
    if (result.harmonic) {
      result.harmonic = await applyPhaseWeaveToStem(result.harmonic, profile);
    }
    if (result.perc) {
      result.perc = await applyPhaseWeaveToStem(result.perc, profile);
    }
    if (result.music) {
      result.music = await applyPhaseWeaveToStem(result.music, profile);
    }
  }

  // Optionally apply Velvet Curve for dynamic tonal shaping
  if (options.applyVelvetCurve) {
    // Apply selectively to harmonic content
    if (result.harmonic) {
      result.harmonic = await applyVelvetCurveToStem(result.harmonic);
    }
    if (result.music) {
      result.music = await applyVelvetCurveToStem(result.music);
    }
  }

  return result;
}

/**
 * Apply Velvet Floor to bass stem (sub-harmonic foundation)
 */
async function applyVelvetFloorToStem(
  buffer: AudioBuffer,
  profile: MasteringProfile
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const velvetFloor = createVelvetFloorStage(ctx, profile.velvetFloor);

  source.connect(velvetFloor.input);
  velvetFloor.output.connect(ctx.destination);

  source.start(0);

  try {
    return await ctx.startRendering();
  } catch (error) {
    console.warn('[FIVE PILLARS] Velvet Floor processing failed:', error);
    return buffer; // Return original if processing fails
  }
}

/**
 * Apply Harmonic Lattice to harmonic/instrumental stems (upper harmonic warmth)
 */
async function applyHarmonicLatticeToStem(
  buffer: AudioBuffer,
  profile: MasteringProfile
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const harmonicLattice = createHarmonicLatticeStage(ctx, profile.harmonicLattice);

  source.connect(harmonicLattice.input);
  harmonicLattice.output.connect(ctx.destination);

  source.start(0);

  try {
    return await ctx.startRendering();
  } catch (error) {
    console.warn('[FIVE PILLARS] Harmonic Lattice processing failed:', error);
    return buffer; // Return original if processing fails
  }
}

/**
 * Apply Phase Weave to stem (stereo field correction)
 */
async function applyPhaseWeaveToStem(
  buffer: AudioBuffer,
  profile: MasteringProfile
): Promise<AudioBuffer> {
  if (buffer.numberOfChannels < 2) {
    // Mono audio - convert to stereo first or skip
    return buffer;
  }

  const ctx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const phaseWeave = createPhaseWeaveStage(ctx, profile.phaseWeave);

  source.connect(phaseWeave.input);
  phaseWeave.output.connect(ctx.destination);

  source.start(0);

  try {
    return await ctx.startRendering();
  } catch (error) {
    console.warn('[FIVE PILLARS] Phase Weave processing failed:', error);
    return buffer; // Return original if processing fails
  }
}

/**
 * Apply Velvet Curve to stem (dynamic tonal shaping)
 */
async function applyVelvetCurveToStem(buffer: AudioBuffer): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const velvetCurve = createVelvetCurveStage(ctx);

  source.connect(velvetCurve.input);
  velvetCurve.output.connect(ctx.destination);

  source.start(0);

  try {
    return await ctx.startRendering();
  } catch (error) {
    console.warn('[FIVE PILLARS] Velvet Curve processing failed:', error);
    return buffer; // Return original if processing fails
  }
}

