/**
 * Flow Meter Stack - Meter Utilities (STEP 4)
 * Core meter calculations: Peak, RMS, Crest Factor, Heat
 * 
 * QUANTUM OPTIMIZATION: Uses fast math functions and lookup tables
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

import { fastLinearToDb, fastRMS, fastPeak } from '../performance/mathCache';

/**
 * Compute peak level from time domain data.
 * @param buffer - Time domain data (Uint8Array or Float32Array)
 * @returns Peak level in dB
 */
export function computePeak(buffer: Uint8Array | Float32Array): number {
  if (buffer.length === 0) return -Infinity;

  let max = 0;
  
  // Use optimized peak calculation for Float32Array
  if (buffer instanceof Float32Array) {
    max = fastPeak(buffer);
  } else {
    // Uint8Array path
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i] - 128) / 128;
      if (abs > max) max = abs;
    }
  }

  if (max === 0) return -Infinity;
  
  // Use fast dB conversion
  return fastLinearToDb(Math.max(0.0001, max));
}

/**
 * Compute RMS (Root Mean Square) level.
 * @param buffer - Time domain data
 * @returns RMS level in dB
 */
export function computeRMS(buffer: Uint8Array | Float32Array): number {
  if (buffer.length === 0) return -Infinity;

  let rms: number;
  
  if (buffer instanceof Float32Array) {
    // Use optimized RMS calculation
    rms = fastRMS(buffer);
  } else {
    // Uint8Array path
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const sample = (buffer[i] - 128) / 128;
      sum += sample * sample;
    }
    rms = Math.sqrt(sum / buffer.length);
  }

  if (rms === 0) return -Infinity;

  // Use fast dB conversion
  return fastLinearToDb(Math.max(0.0001, rms));
}

/**
 * Compute crest factor (peak to RMS ratio).
 * @param peak - Peak level in dB
 * @param rms - RMS level in dB
 * @returns Crest factor in dB
 */
export function computeCrest(peak: number, rms: number): number {
  if (peak === -Infinity || rms === -Infinity) return 0;
  return peak - rms;
}

/**
 * Compute heat value (0-1) based on energy level.
 * Used for visual heatmap coloring.
 * @param rms - RMS level in dB
 * @returns Heat value (0 = cold, 1 = hot)
 */
export function computeHeat(rms: number): number {
  // Map RMS dB to 0-1 heat value
  // -60dB = 0, -12dB = 0.5, 0dB = 1
  if (rms <= -60) return 0;
  if (rms >= 0) return 1;
  
  // Linear mapping from -60dB to 0dB
  return (rms + 60) / 60;
}

/**
 * Meter reading result.
 */
export interface MeterReading {
  peak: number;      // Peak level in dB
  rms: number;        // RMS level in dB
  crest: number;      // Crest factor in dB
  heat: number;       // Heat value (0-1)
  truePeak?: number;  // True peak in dB (if computed)
}

/**
 * Compute all meter values from analyser node.
 * @param analyser - AnalyserNode to read from
 * @param detectTruePeakValue - Optional true peak value (if already computed)
 * @returns Complete meter reading
 */
export function computeMeterReading(
  analyser: AnalyserNode,
  detectTruePeakValue?: number
): MeterReading {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  const peak = computePeak(dataArray);
  const rms = computeRMS(dataArray);
  const crest = computeCrest(peak, rms);
  const heat = computeHeat(rms);

  return {
    peak,
    rms,
    crest,
    heat,
    truePeak: detectTruePeakValue,
  };
}

