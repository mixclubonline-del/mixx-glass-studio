/**
 * Stem Separation Training Data Schema
 * 
 * Defines the structure of stem separation training data exported from Studio.
 */

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
  
  // Ground truth: Separated stems (if available from user corrections)
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

export interface SanitizedStemRecord {
  id: string;
  quantumFeatures: StemSeparationSnapshot['quantumFeatures'];
  musicalContext: Omit<StemSeparationSnapshot['musicalContext'], 'transients'> & {
    transientCount: number;
    transientDensity: number;
  };
  groundTruthFeatures?: StemSeparationSnapshot['groundTruthStems'];
  correctionFeatures?: number[]; // Derived from user corrections
  metadata: {
    classification: string;
    confidence: number;
  };
}

/**
 * Validate snapshot structure
 */
export function validateSnapshot(snapshot: unknown): snapshot is StemSeparationSnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const s = snapshot as Partial<StemSeparationSnapshot>;
  
  return (
    typeof s.id === 'string' &&
    typeof s.timestamp === 'number' &&
    s.originalAudio !== undefined &&
    s.quantumFeatures !== undefined &&
    s.musicalContext !== undefined &&
    s.metadata !== undefined
  );
}

