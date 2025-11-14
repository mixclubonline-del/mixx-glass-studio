/**
 * Metadata Assembler Layer (Flow Fusion)
 * 
 * Layer 4.6 of the Flow Import Core.
 * Combines all audio intelligence into a single metadata object.
 * 
 * This is what all behavior engines read:
 * - Auto-Comp
 * - Punch Mode
 * - Take Memory
 * - Auto-Punch Prediction
 * - Comp Brain
 * - Vocal Coaching
 * - Flow-Conscious Editing
 * - ALS-Tuned Lane Assignment
 */

import { detectBPM } from './bpm';
import { detectKey } from './key';
import { detectTransients } from './transients';
import { harmonicFingerprint } from './harmonics';
import { computeHeadroom } from './headroom';
import { predictPunchZones } from './analysis';
import type { AudioClassification } from './classifier';
import type { TimingAnalysis } from './analysis';

export interface StemMetadata {
  type: AudioClassification['type'];
  bpm: number | null;
  key: string;
  stems: string[]; // Available stem names
  confidence: number;
  punchZones: Array<{
    start: number;
    end: number;
    type: 'verse' | 'chorus' | 'bridge' | 'hook';
  }>;
  sampleRate: number;
  duration: number; // milliseconds
  channels: number;
  format?: string;
  // Layer 4 Intelligence
  transients: Array<{
    sample: number;
    time: number;
    strength: number;
  }>;
  harmonics: Float32Array;
  headroom: {
    peakDB: number;
    rmsDB: number;
    targetGain: number;
    peakSample: number;
    needsGainReduction: boolean;
    needsGainBoost: boolean;
  };
}

/**
 * Assemble metadata from stems, analysis, and classification.
 * 
 * Flow Fusion: Combines all Layer 4 intelligence into a single metadata object.
 * 
 * @param stems - Object with stem names as keys and buffers as values
 * @param analysis - Timing analysis (BPM, key, etc.)
 * @param classification - Audio classification
 * @param sampleRate - Audio sample rate
 * @param duration - Audio duration in milliseconds
 * @param channels - Number of audio channels
 * @param format - File format
 * @param mainBuffer - Main audio buffer for intelligence analysis (optional, uses first stem if not provided)
 * @returns Complete metadata structure with all intelligence
 */
export function assembleMetadata(
  stems: Record<string, AudioBuffer | null>,
  analysis: TimingAnalysis,
  classification: AudioClassification,
  sampleRate: number,
  duration: number,
  channels: number,
  format?: string,
  mainBuffer?: AudioBuffer
): StemMetadata {
  // Get available stem names (non-null stems)
  const availableStems = Object.keys(stems).filter(name => stems[name] !== null);
  
  // Use main buffer or first available stem for intelligence analysis
  const bufferForAnalysis = mainBuffer || 
    (availableStems.length > 0 ? stems[availableStems[0]] : null);
  
  // Predict punch zones based on BPM
  const punchZones = predictPunchZones(analysis.bpm);
  
  // Layer 4 Intelligence Analysis
  let transients: Array<{ sample: number; time: number; strength: number }> = [];
  let harmonics: Float32Array = new Float32Array(2048);
  let headroom = {
    peakDB: 0,
    rmsDB: 0,
    targetGain: 1.0,
    peakSample: 0,
    needsGainReduction: false,
    needsGainBoost: false,
  };
  
  if (bufferForAnalysis) {
    // Detect transients (for comp zones, punch zones, envelope points)
    transients = detectTransients(bufferForAnalysis);
    
    // Generate harmonic fingerprint (for FlowPulse, Velvet Curve, Harmonic Lattice)
    harmonics = harmonicFingerprint(bufferForAnalysis);
    
    // Compute headroom (for auto-gain staging)
    headroom = computeHeadroom(bufferForAnalysis);
  }
  
  // Use analysis BPM or detect from buffer
  let detectedBPM = analysis.bpm;
  if (!detectedBPM && bufferForAnalysis) {
    detectedBPM = detectBPM(bufferForAnalysis);
  }
  
  // Use analysis key or detect from buffer
  let detectedKey = analysis.key;
  if (!detectedKey && bufferForAnalysis) {
    detectedKey = detectKey(bufferForAnalysis);
  }
  
  return {
    type: classification.type,
    bpm: detectedBPM,
    key: detectedKey,
    stems: availableStems,
    confidence: Math.min(analysis.confidence || 0.5, classification.confidence),
    punchZones,
    sampleRate,
    duration,
    channels,
    format,
    // Layer 4 Intelligence
    transients,
    harmonics,
    headroom,
  };
}

/**
 * Create metadata summary for Prime Brain.
 * Simplified version for quick reference.
 */
export function createMetadataSummary(metadata: StemMetadata): {
  type: string;
  bpm: number;
  key: string;
  stemCount: number;
  readyForPunch: boolean;
  readyForComp: boolean;
} {
  const hasVocals = metadata.stems.some(s => 
    s.toLowerCase().includes('vocal') || 
    s.toLowerCase().includes('voice')
  );
  
  return {
    type: metadata.type,
    bpm: metadata.bpm,
    key: metadata.key,
    stemCount: metadata.stems.length,
    readyForPunch: hasVocals && metadata.type === 'vocal',
    readyForComp: hasVocals && metadata.stems.length > 1,
  };
}

