/**
 * SONIC ARCHITECTURE
 * 
 * The Mixx Club mastering philosophy encoded.
 * Velvet isn't perfection—it's comfort. We measure serenity, not sharpness.
 * 
 * Signal Flow:
 * INPUT → Velvet Floor (sub-harmonic foundation)
 *       → Harmonic Lattice (upper warmth)
 *       → Phase Weave (stereo space)
 *       → Velvet Curve (MixClub signature)
 *       → OUTPUT
 * 
 * All processing < 5ms latency.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTUAL ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface MusicalContext {
    genre: 'Streaming' | 'Hip-Hop' | 'Trap' | 'R&B' | 'Drill' | 'Afrobeat' | 'Club' | 'Audiophile';
    mood: 'Balanced' | 'Energetic' | 'Calm' | 'Dark';
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTERING PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export interface MasteringProfile {
  name: string;
  targetLUFS: number;
  truePeakCeiling: number;
  velvetFloor: VelvetFloorSettings;
  harmonicLattice: HarmonicLatticeSettings;
  phaseWeave: PhaseWeaveSettings;
}

export interface VelvetFloorSettings {
  depth: number; // 0-100
  translation: 'subtle' | 'deep' | 'resonant';
  warmth: number; // 0-100
}

export interface HarmonicLatticeSettings {
  character: 'neutral' | 'warm' | 'bright' | 'vintage';
  presence: number; // 0-100
  airiness: number; // 0-100
}

export interface PhaseWeaveSettings {
  width: number; // 0-100
  monoCompatibility: number; // 0-100
}

export const MASTERING_PROFILES = {
  streaming: {
    name: 'Streaming Standard',
    targetLUFS: -14,
    truePeakCeiling: -1,
    velvetFloor: { depth: 70, translation: 'deep', warmth: 60 },
    harmonicLattice: { character: 'warm', presence: 75, airiness: 70 },
    phaseWeave: { width: 80, monoCompatibility: 90 },
  } as MasteringProfile,
  club: {
    name: 'Club Mix',
    targetLUFS: -9,
    truePeakCeiling: -0.8,
    velvetFloor: { depth: 90, translation: 'resonant', warmth: 70 },
    harmonicLattice: { character: 'bright', presence: 85, airiness: 80 },
    phaseWeave: { width: 90, monoCompatibility: 80 },
  } as MasteringProfile,
  appleMusic: {
    name: 'Apple Music',
    targetLUFS: -16,
    truePeakCeiling: -1,
    velvetFloor: { depth: 65, translation: 'deep', warmth: 55 },
    harmonicLattice: { character: 'warm', presence: 70, airiness: 68 },
    phaseWeave: { width: 78, monoCompatibility: 92 },
  } as MasteringProfile,
  spotify: {
    name: 'Spotify Loud',
    targetLUFS: -14,
    truePeakCeiling: -1,
    velvetFloor: { depth: 72, translation: 'deep', warmth: 62 },
    harmonicLattice: { character: 'neutral', presence: 74, airiness: 72 },
    phaseWeave: { width: 82, monoCompatibility: 88 },
  } as MasteringProfile,
  tidal: {
    name: 'Tidal HiFi',
    targetLUFS: -14,
    truePeakCeiling: -2,
    velvetFloor: { depth: 68, translation: 'subtle', warmth: 58 },
    harmonicLattice: { character: 'warm', presence: 72, airiness: 75 },
    phaseWeave: { width: 85, monoCompatibility: 86 },
  } as MasteringProfile,
  dolbyAtmos: {
    name: 'Dolby Atmos Music',
    targetLUFS: -18,
    truePeakCeiling: -1,
    velvetFloor: { depth: 60, translation: 'subtle', warmth: 50 },
    harmonicLattice: { character: 'neutral', presence: 68, airiness: 80 },
    phaseWeave: { width: 92, monoCompatibility: 95 },
  } as MasteringProfile,
};

// ─────────────────────────────────────────────────────────────────────────────
// THE FOUR ANCHORS
// ─────────────────────────────────────────────────────────────────────────────

export interface FourAnchors {
  body: number;    // 0-100: Low-end foundation, sub presence, physical impact
  soul: number;    // 0-100: Mid warmth, vocal clarity, emotional center
  air: number;     // 0-100: High-end extension, brightness, space
  silk: number;    // 0-100: Smooth coherence, harmonic glue, comfort factor
}

/**
 * Real frequency band analysis using FFT.
 * Returns energy level (0-100) for the specified frequency range.
 */
export async function analyzeFrequencyBand(audioBuffer: AudioBuffer, lowFreq: number, highFreq: number): Promise<number> {
  // Use real FFT analysis
  const { analyzeBufferFFT, getBandEnergy } = await import('../core/audio/fftAnalysis');
  const freqData = await analyzeBufferFFT(audioBuffer, 2048);
  const sampleRate = audioBuffer.sampleRate;
  
  // Get energy in the specified band
  const energy = getBandEnergy(freqData, sampleRate, lowFreq, highFreq);
  
  // Normalize to 0-100 range (energy is already 0-1 from FFT)
  return Math.min(100, Math.max(0, Math.round(energy * 100)));
}

/**
 * Velvet Curve Analysis — analyzes audio against the Four Anchors
 * 
 * Uses real FFT-based frequency analysis to determine:
 * - Body: Low-frequency foundation (20-200Hz)
 * - Soul: Mid-frequency character (200-2000Hz)
 * - Air: High-frequency presence (5000-20000Hz)
 * - Silk: Mid-high coherence (1000-5000Hz)
 * 
 * Flow Doctrine: Professional audio analysis - real frequency domain processing.
 */
export async function analyzeVelvetCurve(audioBuffer: AudioBuffer | null): Promise<FourAnchors> {
  if (!audioBuffer) {
    return { body: 0, soul: 0, air: 0, silk: 0 };
  }

  // Real FFT-based frequency band analysis
  const bodyEnergy = await analyzeFrequencyBand(audioBuffer, 20, 200);      // Sub-bass to bass
  const soulEnergy = await analyzeFrequencyBand(audioBuffer, 200, 2000);    // Low-mid to mid
  const airEnergy = await analyzeFrequencyBand(audioBuffer, 5000, 20000);    // High frequencies
  const silkEnergy = await analyzeFrequencyBand(audioBuffer, 1000, 5000);    // Upper mid to presence

  // Silk is a coherence measure - combine mid-high energy with phase coherence
  // For now, use the energy directly (can be enhanced with phase analysis)
  const silkCoherence = Math.min(100, Math.round(silkEnergy * 0.9)); // Slight reduction for coherence

  return {
    body: Math.round(bodyEnergy),
    soul: Math.round(soulEnergy),
    air: Math.round(airEnergy),
    silk: Math.round(silkCoherence),
  };
}

/**
 * Placeholder: Calculates a "Velvet Score" based on Four Anchors.
 */
export function calculateVelvetScore(anchors: FourAnchors): number {
  // A hypothetical calculation for overall "velvet" quality
  const weightedSum = (anchors.body * 0.2) + (anchors.soul * 0.3) + (anchors.air * 0.25) + (anchors.silk * 0.25);
  return Math.min(100, Math.round(weightedSum));
}

/**
 * Placeholder: Determines a color and label based on the Velvet Score.
 */
export function getVelvetColor(score: number): { gradient: string; label: string; color: 'emerald' | 'lime' | 'amber' | 'red' | 'rose' } {
  if (score > 85) {
    return { gradient: 'from-green-500 to-emerald-600', label: 'Velvet', color: 'emerald' };
  } else if (score > 70) {
    return { gradient: 'from-lime-500 to-green-500', label: 'Lush', color: 'lime' };
  } else if (score > 50) {
    return { gradient: 'from-yellow-400 to-amber-500', label: 'Warm', color: 'amber' };
  } else if (score > 30) {
    return { gradient: 'from-orange-400 to-red-500', label: 'Rough', color: 'red' };
  } else {
    return { gradient: 'from-red-600 to-rose-700', label: 'Harsh', color: 'rose' };
  }
}