/**
 * Feature Engineering for Stem Separation Training
 * 
 * Converts quantum features, musical context, and separation results
 * into training features for the transformer model.
 */

import { SanitizedStemRecord, StemSeparationSnapshot } from './schema.js';

export interface StemTrainingFeatures {
  inputFeatures: Float32Array; // Combined quantum + musical context features
  targetStems: {
    vocals?: Float32Array;
    drums?: Float32Array;
    bass?: Float32Array;
    harmonic?: Float32Array;
    perc?: Float32Array;
    sub?: Float32Array;
  };
  metadata: {
    classification: string;
    confidence: number;
    hasGroundTruth: boolean;
  };
}

/**
 * Engineer features from sanitized stem records for training
 */
export function engineerTrainingFeatures(
  record: SanitizedStemRecord
): StemTrainingFeatures {
  // Combine quantum features into single input vector
  const quantumFeatures = [
    ...record.quantumFeatures.spectral,
    ...record.quantumFeatures.temporal,
    ...record.quantumFeatures.harmonic,
    ...record.quantumFeatures.percussive,
    ...record.quantumFeatures.stereo,
    ...record.quantumFeatures.energy,
  ];

  // Add musical context features
  const musicalFeatures = [
    // Key encoding (one-hot like)
    encodeKey(record.musicalContext.key),
    // Mode (major = 1, minor = 0)
    record.musicalContext.mode === 'major' ? 1 : 0,
    // BPM (normalized to 0-1, assuming 60-180 range)
    normalizeBPM(record.musicalContext.bpm),
    // Transient density
    record.musicalContext.transientDensity,
    // Harmonic tension
    record.musicalContext.harmonicContent.tensionLevel,
  ];

  // Combine all input features
  const inputFeatures = new Float32Array([...quantumFeatures, ...musicalFeatures]);

  // Extract target stems (ground truth or user corrections)
  const targetStems: StemTrainingFeatures['targetStems'] = {};
  
  if (record.groundTruthFeatures) {
    if (record.groundTruthFeatures.vocals) {
      targetStems.vocals = new Float32Array(record.groundTruthFeatures.vocals);
    }
    if (record.groundTruthFeatures.drums) {
      targetStems.drums = new Float32Array(record.groundTruthFeatures.drums);
    }
    if (record.groundTruthFeatures.bass) {
      targetStems.bass = new Float32Array(record.groundTruthFeatures.bass);
    }
    if (record.groundTruthFeatures.harmonic) {
      targetStems.harmonic = new Float32Array(record.groundTruthFeatures.harmonic);
    }
    if (record.groundTruthFeatures.perc) {
      targetStems.perc = new Float32Array(record.groundTruthFeatures.perc);
    }
    if (record.groundTruthFeatures.sub) {
      targetStems.sub = new Float32Array(record.groundTruthFeatures.sub);
    }
  }

  return {
    inputFeatures,
    targetStems,
    metadata: {
      classification: record.metadata.classification,
      confidence: record.metadata.confidence,
      hasGroundTruth: Object.keys(targetStems).length > 0,
    },
  };
}

/**
 * Encode musical key as feature vector
 */
function encodeKey(key: string): number {
  const keyMap: Record<string, number> = {
    'C': 0,
    'C#': 1 / 12,
    'D': 2 / 12,
    'D#': 3 / 12,
    'E': 4 / 12,
    'F': 5 / 12,
    'F#': 6 / 12,
    'G': 7 / 12,
    'G#': 8 / 12,
    'A': 9 / 12,
    'A#': 10 / 12,
    'B': 11 / 12,
  };
  return keyMap[key] ?? 0;
}

/**
 * Normalize BPM to 0-1 range (60-180 BPM)
 */
function normalizeBPM(bpm: number | null): number {
  if (!bpm) return 0.5; // Default to middle
  const min = 60;
  const max = 180;
  return Math.max(0, Math.min(1, (bpm - min) / (max - min)));
}

/**
 * Build training pairs from records
 */
export function buildTrainingPairs(records: SanitizedStemRecord[]): {
  inputs: Float32Array[];
  targets: Array<{
    vocals?: Float32Array;
    drums?: Float32Array;
    bass?: Float32Array;
    harmonic?: Float32Array;
    perc?: Float32Array;
    sub?: Float32Array;
  }>;
  metadata: Array<StemTrainingFeatures['metadata']>;
} {
  const pairs = records
    .map(record => engineerTrainingFeatures(record))
    .filter(features => features.metadata.hasGroundTruth); // Only use records with ground truth

  return {
    inputs: pairs.map(p => p.inputFeatures),
    targets: pairs.map(p => p.targetStems),
    metadata: pairs.map(p => p.metadata),
  };
}

