/**
 * Stem Separation Snapshot Builder
 * 
 * Creates training snapshots from stem separation operations.
 * Exports quantum features, musical context, and separation results
 * for Prime Fabric training pipeline.
 */

import { v4 as uuid } from 'uuid';
import type { QuantumStemFeatures } from './quantumStemEngine';
import type { MusicalContext } from './musicalContextStemEngine';
import type { StemResult } from './stemEngine';
import type { AudioClassification } from './classifier';

export interface StemSeparationSnapshot {
  id: string;
  timestamp: number;
  
  // Input: Original audio context
  originalAudio: {
    duration: number;
    sampleRate: number;
    channels: number;
  };
  
  // Quantum features extracted
  quantumFeatures: {
    spectral: number[];
    temporal: number[];
    harmonic: number[];
    percussive: number[];
    stereo: number[];
    energy: number[];
  };
  
  // Musical context
  musicalContext: {
    key: string;
    mode?: 'major' | 'minor';
    bpm: number | null;
    transients: Array<{
      time: number;
      strength: number;
    }>;
    harmonicContent: {
      dominantFrequencies: number[];
      tensionLevel: number;
    };
  };
  
  // Ground truth: Separated stems (feature representation)
  groundTruthStems?: {
    vocals?: number[]; // Feature representation, not raw audio
    drums?: number[];
    bass?: number[];
    harmonic?: number[];
    perc?: number[];
    sub?: number[];
  };
  
  // User corrections (manual adjustments)
  userCorrections?: {
    correctedStem: string; // 'vocals', 'drums', etc.
    correctionType: 'boost' | 'cut' | 'isolation' | 'masking';
    frequencyRange?: [number, number];
    timeRange?: [number, number];
    strength: number; // 0-1
  }[];
  
  // Metadata
  metadata: {
    classification: string; // 'twotrack', 'full', etc.
    confidence: number;
    processingTime: number;
  };
}

/**
 * Build stem separation snapshot from separation result
 */
export function buildStemSeparationSnapshot(inputs: {
  audioBuffer: AudioBuffer;
  quantumFeatures: QuantumStemFeatures;
  musicalContext: MusicalContext | null;
  stemResult: StemResult;
  classification: AudioClassification;
  processingTime: number;
  groundTruthStems?: StemResult; // Optional: user-corrected stems
  userCorrections?: StemSeparationSnapshot['userCorrections'];
}): StemSeparationSnapshot {
  const {
    audioBuffer,
    quantumFeatures,
    musicalContext,
    stemResult,
    classification,
    processingTime,
    groundTruthStems,
    userCorrections,
  } = inputs;

  // Convert quantum features to arrays (extract from Float32Array)
  const convertFeatures = (arr: Float32Array): number[] => {
    // Sample or downsample if too large (limit to reasonable size for training)
    const maxSize = 1000;
    if (arr.length <= maxSize) {
      return Array.from(arr);
    }
    // Downsample for large arrays
    const step = Math.ceil(arr.length / maxSize);
    const sampled: number[] = [];
    for (let i = 0; i < arr.length; i += step) {
      sampled.push(arr[i]);
    }
    return sampled;
  };

  // Convert stems to feature representations (if ground truth provided)
  const stemsToFeatures = (stem: AudioBuffer | null): number[] | undefined => {
    if (!stem) return undefined;
    
    // Extract features from audio buffer (simplified - just use channel data)
    const channel = stem.getChannelData(0);
    const maxSize = 500; // Limit size
    
    if (channel.length <= maxSize) {
      return Array.from(channel);
    }
    
    // Downsample
    const step = Math.ceil(channel.length / maxSize);
    const sampled: number[] = [];
    for (let i = 0; i < channel.length; i += step) {
      sampled.push(channel[i]);
    }
    return sampled;
  };

  const snapshot: StemSeparationSnapshot = {
    id: uuid(),
    timestamp: Date.now(),
    originalAudio: {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
    },
    quantumFeatures: {
      spectral: convertFeatures(quantumFeatures.spectral),
      temporal: convertFeatures(quantumFeatures.temporal),
      harmonic: convertFeatures(quantumFeatures.harmonic),
      percussive: convertFeatures(quantumFeatures.percussive),
      stereo: convertFeatures(quantumFeatures.stereo),
      energy: convertFeatures(quantumFeatures.energy),
    },
    musicalContext: musicalContext ? {
      key: musicalContext.key,
      mode: musicalContext.mode,
      bpm: musicalContext.bpm,
      transients: musicalContext.transients.map(t => ({
        time: t.time,
        strength: t.strength,
      })),
      harmonicContent: {
        dominantFrequencies: musicalContext.harmonicContent.dominantFrequencies.slice(0, 10),
        tensionLevel: musicalContext.harmonicContent.tensionLevel,
      },
    } : {
      key: 'C',
      bpm: null,
      transients: [],
      harmonicContent: {
        dominantFrequencies: [],
        tensionLevel: 0.5,
      },
    },
    groundTruthStems: groundTruthStems ? {
      vocals: stemsToFeatures(groundTruthStems.vocals),
      drums: stemsToFeatures(groundTruthStems.drums),
      bass: stemsToFeatures(groundTruthStems.bass),
      harmonic: stemsToFeatures(groundTruthStems.harmonic),
      perc: stemsToFeatures(groundTruthStems.perc),
      sub: stemsToFeatures(groundTruthStems.sub),
    } : undefined,
    userCorrections,
    metadata: {
      classification: classification.type,
      confidence: classification.confidence,
      processingTime,
    },
  };

  return snapshot;
}

