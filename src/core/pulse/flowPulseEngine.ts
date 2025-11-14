/**
 * Flow Pulse Engine
 * 
 * Layer 5 of Flow Import Core.
 * The beating heart of the system.
 * 
 * This is what turns the ALS from a "meter" into a living organism
 * that breathes with the music.
 * 
 * Pure buffer math + ALS interface hooks. No crashes. No OfflineAudioContext.
 */

import { computeEnergyProfile } from './energy';
import { buildPulseMap } from './pulseMap';
import { harmonicWeight } from './harmonicWeight';
import { pulseScore, pulseScoreWithBPM } from './pulseScore';
import type { StemMetadata } from '../import/metadata';

export interface FlowPulseResult {
  energy: number[]; // Energy profile array
  pulse: number[]; // Pulse % array (0-100)
  harmonicBoost: number; // Harmonic boost value (0-100)
  raw: number[]; // Raw scores before normalization
  bpmNormalized?: number[]; // BPM-aware normalized scores (if BPM available)
}

/**
 * Compute Flow Pulse from audio buffer and metadata.
 * 
 * This is the main entry point for Flow Pulse Engine.
 * 
 * @param buffer - Audio buffer to analyze
 * @param metadata - Stem metadata (includes transients, harmonics, BPM)
 * @returns Flow Pulse result with energy, pulse, and harmonic boost
 */
export function computeFlowPulse(
  buffer: AudioBuffer,
  metadata: StemMetadata
): FlowPulseResult {
  // Step 1: Extract energy profile
  const energy = computeEnergyProfile(buffer);
  
  // Step 2: Build pulse map from transients
  const pulseMap = buildPulseMap(energy, metadata.transients);
  
  // Step 3: Compute harmonic weight
  const harmonic = harmonicWeight(metadata.harmonics, buffer.sampleRate);
  
  // Step 4: Compute pulse score
  // Use BPM-aware normalization if BPM is available
  if (metadata.bpm !== null) {
    const result = pulseScoreWithBPM(
      energy,
      pulseMap,
      harmonic,
      metadata.bpm,
      buffer.sampleRate
    );
    
    return {
      energy,
      pulse: result.normalized,
      harmonicBoost: result.harmonicBoost,
      raw: result.raw,
      bpmNormalized: result.bpmNormalized,
    };
  } else {
    const result = pulseScore(energy, pulseMap, harmonic);
    
    return {
      energy,
      pulse: result.normalized,
      harmonicBoost: result.harmonicBoost,
      raw: result.raw,
    };
  }
}

/**
 * Get current pulse value for a specific time position.
 * 
 * @param pulseResult - Flow Pulse result
 * @param time - Time in seconds
 * @param duration - Total duration in seconds
 * @returns Current pulse value (0-100)
 */
export function getPulseAtTime(
  pulseResult: FlowPulseResult,
  time: number,
  duration: number
): number {
  if (duration <= 0 || pulseResult.pulse.length === 0) {
    return 0;
  }
  
  // Map time to pulse array index
  const index = Math.floor((time / duration) * pulseResult.pulse.length);
  const clampedIndex = Math.max(0, Math.min(index, pulseResult.pulse.length - 1));
  
  // Get pulse value and add harmonic boost
  const pulseValue = pulseResult.pulse[clampedIndex] || 0;
  const totalPulse = Math.min(100, pulseValue + pulseResult.harmonicBoost);
  
  return totalPulse;
}

/**
 * Get average pulse value for a time range.
 * 
 * @param pulseResult - Flow Pulse result
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @param duration - Total duration in seconds
 * @returns Average pulse value (0-100)
 */
export function getAveragePulseInRange(
  pulseResult: FlowPulseResult,
  startTime: number,
  endTime: number,
  duration: number
): number {
  if (duration <= 0 || pulseResult.pulse.length === 0) {
    return 0;
  }
  
  const startIndex = Math.floor((startTime / duration) * pulseResult.pulse.length);
  const endIndex = Math.floor((endTime / duration) * pulseResult.pulse.length);
  
  let sum = 0;
  let count = 0;
  
  for (let i = startIndex; i <= endIndex && i < pulseResult.pulse.length; i++) {
    sum += pulseResult.pulse[i] || 0;
    count++;
  }
  
  const avgPulse = count > 0 ? sum / count : 0;
  const totalPulse = Math.min(100, avgPulse + pulseResult.harmonicBoost);
  
  return totalPulse;
}

