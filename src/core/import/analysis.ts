/**
 * BPM + Key Detection Layer
 * 
 * Layer 7 of the Stem Separation Engine (now uses Layer 4 intelligence).
 * Makes every import useful instantly by detecting:
 * - BPM (tempo)
 * - Key (musical key)
 * - Confidence levels
 * 
 * This enables auto-sync, tempo matching, and harmonic awareness.
 */

import { detectBPM } from './bpm';
import { detectKey } from './key';

export interface TimingAnalysis {
  bpm: number | null;
  key: string; // Musical key (e.g., "F#min", "C major", "C")
  confidence: number; // 0-1, how confident the detection is
  timeSignature?: { numerator: number; denominator: number }; // e.g., {4, 4}
  beatGrid?: number[]; // Beat positions in seconds
}

/**
 * Analyze timing and musical properties of audio buffer.
 * 
 * Uses Layer 4 intelligence modules (bpm.ts, key.ts).
 * 
 * @param audioBuffer - Audio buffer to analyze
 * @returns Timing analysis with BPM, key, confidence
 */
export async function analyzeTiming(audioBuffer: AudioBuffer): Promise<TimingAnalysis> {
  // Use Layer 4 intelligence modules
  const bpm = detectBPM(audioBuffer);
  const key = detectKey(audioBuffer);
  const confidence = estimateConfidence(audioBuffer, bpm, key);
  
  return {
    bpm: bpm || null,
    key: key || 'C',
    confidence,
    timeSignature: { numerator: 4, denominator: 4 }, // Default 4/4
  };
}

/**
 * Estimate confidence in timing analysis.
 */
function estimateConfidence(
  audioBuffer: AudioBuffer,
  bpm: number | null,
  key: string
): number {
  // Simple confidence estimation
  // Production version will consider:
  // - Signal clarity
  // - Tempo consistency
  // - Key signature clarity
  
  let confidence = 0.7; // Base confidence
  
  // Boost confidence if BPM is detected and in common range
  if (bpm !== null && bpm >= 80 && bpm <= 160) {
    confidence += 0.1;
  } else if (bpm === null) {
    confidence -= 0.2; // Reduce confidence if BPM detection failed
  }
  
  // Boost confidence if key is detected
  if (key && key !== 'C') {
    confidence += 0.05;
  }
  
  // Boost confidence if audio is not too short
  if (audioBuffer.duration > 10) {
    confidence += 0.1;
  }
  
  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Predict punch zones based on BPM and musical structure.
 * Used by Auto-Punch and Take Memory systems.
 */
export function predictPunchZones(bpm: number | null): Array<{
  start: number; // Seconds
  end: number; // Seconds
  type: 'verse' | 'chorus' | 'bridge' | 'hook';
}> {
  // Default to 120 BPM if detection failed
  const effectiveBPM = bpm || 120;
  
  const beatsPerBar = 4;
  const barsPerPhrase = 4;
  const secondsPerBar = (60 / effectiveBPM) * beatsPerBar;
  const secondsPerPhrase = secondsPerBar * barsPerPhrase;
  
  // Predict common punch zones (start of phrases)
  const zones: Array<{ start: number; end: number; type: 'verse' | 'chorus' | 'bridge' | 'hook' }> = [];
  
  // First phrase is often verse
  zones.push({
    start: 0,
    end: secondsPerPhrase,
    type: 'verse',
  });
  
  // Second phrase might be chorus/hook
  zones.push({
    start: secondsPerPhrase,
    end: secondsPerPhrase * 2,
    type: 'chorus',
  });
  
  return zones;
}

