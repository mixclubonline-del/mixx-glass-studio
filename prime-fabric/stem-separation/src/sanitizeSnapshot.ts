/**
 * Sanitize Stem Separation Snapshots
 * 
 * Removes personal identifiers and ensures data privacy compliance
 * for Prime Fabric training pipeline.
 */

import { StemSeparationSnapshot, SanitizedStemRecord, validateSnapshot } from './schema.js';

/**
 * Sanitize a stem separation snapshot for training
 */
export function sanitizeStemSnapshot(
  snapshot: unknown
): SanitizedStemRecord | null {
  if (!validateSnapshot(snapshot)) {
    console.warn('[SANITIZE] Invalid snapshot structure');
    return null;
  }

  const s = snapshot as StemSeparationSnapshot;

  // Remove any potential personal identifiers
  // Quantum features are safe (just audio analysis)
  // Musical context is safe (just audio properties)
  
  // Sanitize transients (remove exact timing, keep density)
  const transientCount = s.musicalContext.transients.length;
  const transientDensity = transientCount / s.originalAudio.duration;

  return {
    id: s.id, // Keep ID for tracking, but it's hashed
    quantumFeatures: {
      spectral: s.quantumFeatures.spectral,
      temporal: s.quantumFeatures.temporal,
      harmonic: s.quantumFeatures.harmonic,
      percussive: s.quantumFeatures.percussive,
      stereo: s.quantumFeatures.stereo,
      energy: s.quantumFeatures.energy,
    },
    musicalContext: {
      key: s.musicalContext.key,
      mode: s.musicalContext.mode,
      bpm: s.musicalContext.bpm,
      transientCount,
      transientDensity,
      harmonicContent: {
        dominantFrequencies: s.musicalContext.harmonicContent.dominantFrequencies.slice(0, 10), // Limit
        tensionLevel: s.musicalContext.harmonicContent.tensionLevel,
      },
    },
    groundTruthFeatures: s.groundTruthStems
      ? {
          vocals: s.groundTruthStems.vocals,
          drums: s.groundTruthStems.drums,
          bass: s.groundTruthStems.bass,
          harmonic: s.groundTruthStems.harmonic,
          perc: s.groundTruthStems.perc,
          sub: s.groundTruthStems.sub,
        }
      : undefined,
    correctionFeatures: s.userCorrections
      ? deriveCorrectionFeatures(s.userCorrections)
      : undefined,
    metadata: {
      classification: s.metadata.classification,
      confidence: s.metadata.confidence,
    },
  };
}

/**
 * Derive correction features from user corrections
 */
function deriveCorrectionFeatures(
  corrections: StemSeparationSnapshot['userCorrections']
): number[] | undefined {
  if (!corrections || corrections.length === 0) {
    return undefined;
  }

  // Encode corrections as feature vector
  const features: number[] = [];

  corrections.forEach(correction => {
    // Stem type encoding
    const stemTypes = ['vocals', 'drums', 'bass', 'harmonic', 'perc', 'sub'];
    const stemIndex = stemTypes.indexOf(correction.correctedStem);
    features.push(stemIndex >= 0 ? stemIndex / stemTypes.length : 0);

    // Correction type encoding
    const correctionTypes = ['boost', 'cut', 'isolation', 'masking'];
    const correctionIndex = correctionTypes.indexOf(correction.correctionType);
    features.push(correctionIndex >= 0 ? correctionIndex / correctionTypes.length : 0);

    // Strength
    features.push(correction.strength);

    // Frequency range (normalized)
    if (correction.frequencyRange) {
      features.push(correction.frequencyRange[0] / 20000); // Normalize to 0-20kHz
      features.push(correction.frequencyRange[1] / 20000);
    } else {
      features.push(0, 1); // Full range
    }
  });

  return features;
}








