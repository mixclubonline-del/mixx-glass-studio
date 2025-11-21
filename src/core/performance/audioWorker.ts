/**
 * QUANTUM AUDIO WORKER - Offload Heavy Computations
 * 
 * Web Worker for CPU-intensive audio analysis:
 * - LUFS calculation
 * - FFT analysis
 * - True peak detection (high oversampling)
 * - Spectral analysis
 * 
 * Flow Doctrine: Keep main thread free for real-time audio
 * Reductionist Engineering: Parallel processing for heavy tasks
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

export interface AudioWorkerMessage {
  type: 'COMPUTE_LUFS' | 'COMPUTE_FFT' | 'COMPUTE_TRUE_PEAK' | 'COMPUTE_SPECTRAL';
  id: string;
  data: Float32Array;
  sampleRate?: number;
  options?: {
    oversampleFactor?: number;
    fftSize?: number;
  };
}

export interface AudioWorkerResponse {
  type: string;
  id: string;
  result: any;
  error?: string;
}

// Worker implementation
if (typeof self !== 'undefined' && self instanceof Worker) {
  self.onmessage = (event: MessageEvent<AudioWorkerMessage>) => {
    const { type, id, data, sampleRate, options } = event.data;

    try {
      let result: any;

      switch (type) {
        case 'COMPUTE_LUFS':
          result = computeLUFS(data, sampleRate || 44100);
          break;

        case 'COMPUTE_TRUE_PEAK':
          result = computeTruePeak(data, options?.oversampleFactor || 8);
          break;

        case 'COMPUTE_FFT':
          result = computeFFT(data, options?.fftSize || 2048);
          break;

        case 'COMPUTE_SPECTRAL':
          result = computeSpectral(data, sampleRate || 44100);
          break;

        default:
          throw new Error(`Unknown worker task: ${type}`);
      }

      self.postMessage({
        type,
        id,
        result,
      } as AudioWorkerResponse);
    } catch (error) {
      self.postMessage({
        type,
        id,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      } as AudioWorkerResponse);
    }
  };
}

/**
 * Compute LUFS (Loudness Units relative to Full Scale)
 * Simplified EBU R128 implementation
 */
function computeLUFS(samples: Float32Array, sampleRate: number): number {
  if (samples.length === 0) return -Infinity;

  // Pre-filter (K-weighting) - simplified
  // In production, use proper K-weighting filter
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    sumSq += sample * sample;
  }

  const rms = Math.sqrt(sumSq / samples.length);
  if (rms === 0) return -Infinity;

  // Convert to LUFS (simplified - full implementation would use proper K-weighting)
  const lufs = 20 * Math.log10(Math.max(0.0001, rms)) - 0.691; // K-weighting offset
  return lufs;
}

/**
 * Compute true peak with high oversampling
 */
function computeTruePeak(samples: Float32Array, oversampleFactor: number): number {
  if (samples.length === 0) return -Infinity;

  let maxPeak = 0;

  // Optimized oversampling
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    const step = (b - a) / oversampleFactor;

    for (let j = 0; j < oversampleFactor; j++) {
      const interpolated = a + step * j;
      const abs = Math.abs(interpolated);
      if (abs > maxPeak) maxPeak = abs;
    }
  }

  const lastAbs = Math.abs(samples[samples.length - 1]);
  if (lastAbs > maxPeak) maxPeak = lastAbs;

  return maxPeak > 0 ? 20 * Math.log10(Math.max(0.0001, maxPeak)) : -Infinity;
}

/**
 * Compute FFT (simplified - for spectral analysis)
 */
function computeFFT(samples: Float32Array, fftSize: number): Float32Array {
  // Simplified FFT - in production, use proper FFT algorithm
  // This is a placeholder for the concept
  const result = new Float32Array(fftSize / 2);
  
  // Window function and basic frequency analysis
  for (let i = 0; i < Math.min(samples.length, fftSize); i++) {
    const windowed = samples[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / fftSize));
    const bin = Math.floor((i * result.length) / fftSize);
    if (bin < result.length) {
      result[bin] += Math.abs(windowed);
    }
  }

  return result;
}

/**
 * Compute spectral features
 */
function computeSpectral(samples: Float32Array, sampleRate: number): {
  centroid: number;
  spread: number;
  rolloff: number;
} {
  // Simplified spectral analysis
  const fft = computeFFT(samples, 2048);
  
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let i = 0; i < fft.length; i++) {
    const freq = (i * sampleRate) / (2 * fft.length);
    const magnitude = fft[i];
    weightedSum += freq * magnitude;
    magnitudeSum += magnitude;
  }

  const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  
  // Simplified spread and rolloff calculations
  let spreadSum = 0;
  for (let i = 0; i < fft.length; i++) {
    const freq = (i * sampleRate) / (2 * fft.length);
    const magnitude = fft[i];
    spreadSum += magnitude * Math.pow(freq - centroid, 2);
  }
  const spread = magnitudeSum > 0 ? Math.sqrt(spreadSum / magnitudeSum) : 0;

  // Rolloff (frequency below which 85% of energy is contained)
  let energySum = 0;
  const totalEnergy = magnitudeSum;
  let rolloff = 0;
  
  for (let i = 0; i < fft.length; i++) {
    energySum += fft[i];
    if (energySum >= totalEnergy * 0.85) {
      rolloff = (i * sampleRate) / (2 * fft.length);
      break;
    }
  }

  return { centroid, spread, rolloff };
}





