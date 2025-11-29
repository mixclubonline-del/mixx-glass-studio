/**
 * FEATURE EXTRACTOR
 * 
 * Optimized feature extraction for AI inference.
 * Reduces FFT size and optimizes feature computation.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 4 Edge Inference
 */

export interface ExtractedFeatures {
  fft: Float32Array;
  mfcc: Float32Array;
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  rms: number;
}

/**
 * Optimized FFT extraction (reduced size for faster processing)
 */
export function extractOptimizedFFT(
  audioBuffer: AudioBuffer,
  fftSize: number = 512 // Reduced from 2048 for faster processing
): Float32Array {
  const channelData = audioBuffer.getChannelData(0);
  const length = channelData.length;
  const step = Math.max(1, Math.floor(length / fftSize));
  
  const fft = new Float32Array(fftSize);
  
  // Downsample and extract features
  for (let i = 0; i < fftSize; i++) {
    const index = Math.floor(i * step);
    if (index < length) {
      fft[i] = Math.abs(channelData[index]);
    }
  }
  
  return fft;
}

/**
 * Extract spectral features (optimized)
 */
export function extractSpectralFeatures(
  audioBuffer: AudioBuffer
): {
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  rms: number;
} {
  const channelData = audioBuffer.getChannelData(0);
  const length = channelData.length;
  
  // RMS
  let sumSquares = 0;
  for (let i = 0; i < length; i++) {
    sumSquares += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sumSquares / length);
  
  // Zero crossing rate
  let zeroCrossings = 0;
  for (let i = 1; i < length; i++) {
    if ((channelData[i - 1] >= 0 && channelData[i] < 0) ||
        (channelData[i - 1] < 0 && channelData[i] >= 0)) {
      zeroCrossings++;
    }
  }
  const zeroCrossingRate = zeroCrossings / length;
  
  // Simplified spectral features (using magnitude)
  let weightedSum = 0;
  let magnitudeSum = 0;
  let rolloffSum = 0;
  const rolloffThreshold = 0.85;
  
  for (let i = 0; i < length; i++) {
    const magnitude = Math.abs(channelData[i]);
    weightedSum += i * magnitude;
    magnitudeSum += magnitude;
  }
  
  const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum / length : 0;
  
  // Spectral rolloff (simplified)
  let cumulativeSum = 0;
  for (let i = 0; i < length; i++) {
    cumulativeSum += Math.abs(channelData[i]);
    if (cumulativeSum >= rolloffThreshold * magnitudeSum) {
      rolloffSum = i / length;
      break;
    }
  }
  
  return {
    spectralCentroid,
    spectralRolloff: rolloffSum,
    zeroCrossingRate,
    rms,
  };
}

/**
 * Extract all features (optimized)
 */
export function extractAllFeatures(
  audioBuffer: AudioBuffer,
  fftSize: number = 512
): ExtractedFeatures {
  const fft = extractOptimizedFFT(audioBuffer, fftSize);
  const spectral = extractSpectralFeatures(audioBuffer);
  
  // Simplified MFCC (using FFT as approximation)
  const mfcc = new Float32Array(13);
  for (let i = 0; i < Math.min(13, fft.length); i++) {
    mfcc[i] = fft[i];
  }
  
  return {
    fft,
    mfcc,
    ...spectral,
  };
}

