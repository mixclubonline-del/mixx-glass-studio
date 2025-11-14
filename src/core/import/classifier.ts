/**
 * Smart Classifier Layer
 * 
 * Layer 2 of the Stem Separation Engine.
 * Determines the type of audio file:
 * - pure vocal
 * - two-track
 * - stems
 * - beat
 * - sample
 * - loop
 * - producer chop
 * 
 * This helps Prime Brain understand what we're working with.
 */

export interface SpectralProfile {
  low: number; // 0-1, low frequency energy (bass/sub)
  mid: number; // 0-1, mid frequency energy (vocals/instruments)
  high: number; // 0-1, high frequency energy (cymbals/harmonics)
}

export interface TransientProfile {
  count: number; // Number of transients detected
  avg: number; // Average transient strength (0-1)
  density: number; // Transients per second
}

export interface AudioClassification {
  type: 'vocal' | 'beat' | 'twotrack' | 'stems' | 'sample' | 'loop' | 'chop' | 'unknown';
  spectral: SpectralProfile;
  transients: TransientProfile;
  rms: number; // Overall RMS level (0-1)
  confidence: number; // Classification confidence (0-1)
}

/**
 * Classify audio file type based on spectral analysis.
 * 
 * Flow-safe version: Pure function, never touches audio contexts.
 * No rendering, no state, no crashes.
 * 
 * @param audioBuffer - Audio buffer to classify
 * @returns Classification result with metrics
 */
export function classifyAudio(audioBuffer: AudioBuffer): AudioClassification {
  // Get mono channel for analysis
  const channel = audioBuffer.getChannelData(0);
  const len = channel.length;
  
  // Simple spectral analysis (pure math, no context)
  let spectralCenter = 0;
  let low = 0, mid = 0, high = 0;
  
  // Sample every 128th sample for performance
  for (let i = 0; i < len; i += 128) {
    const sample = Math.abs(channel[i]);
    
    // Rough frequency band estimation based on position
    if (i < len * 0.33) {
      low += sample;
    } else if (i < len * 0.66) {
      mid += sample;
    } else {
      high += sample;
    }
  }
  
  // Normalize
  const total = low + mid + high;
  const spectral: SpectralProfile = {
    low: total > 0 ? low / total : 0,
    mid: total > 0 ? mid / total : 0,
    high: total > 0 ? high / total : 0,
  };
  
  // Simple transient detection (count rapid changes)
  let transientCount = 0;
  let transientSum = 0;
  const windowSize = Math.floor(len / 100); // 1% of buffer
  
  for (let i = windowSize; i < len - windowSize; i += windowSize) {
    const prev = Math.abs(channel[i - windowSize]);
    const curr = Math.abs(channel[i]);
    const delta = curr - prev;
    
    if (delta > 0.1) {
      transientCount++;
      transientSum += delta;
    }
  }
  
  const duration = audioBuffer.duration;
  const transients: TransientProfile = {
    count: transientCount,
    avg: transientCount > 0 ? Math.min(1.0, transientSum / transientCount) : 0,
    density: duration > 0 ? transientCount / duration : 0,
  };
  
  // RMS calculation
  let sumSquares = 0;
  for (let i = 0; i < len; i += 128) {
    sumSquares += channel[i] * channel[i];
  }
  const rms = Math.sqrt(sumSquares / (len / 128));
  
  // Rough mode detection
  let type: AudioClassification['type'] = 'unknown';
  let confidence = 0.5;
  
  if (high > mid && high > low) {
    type = 'vocal';
    confidence = 0.7;
  } else if (mid > low) {
    type = 'twotrack';
    confidence = 0.65;
  } else {
    type = 'full';
    confidence = 0.6;
  }
  
  return {
    type,
    spectral,
    transients,
    rms,
    confidence,
  };
}

/**
 * Compute RMS (Root Mean Square) level.
 */
function computeRMS(channelData: Float32Array): number {
  if (channelData.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < channelData.length; i++) {
    sum += channelData[i] * channelData[i];
  }
  
  return Math.sqrt(sum / channelData.length);
}

/**
 * Get spectral profile (low/mid/high frequency energy).
 */
function getSpectralProfile(channelData: Float32Array, sampleRate: number): SpectralProfile {
  // Simple frequency analysis using FFT approximation
  // For production, use proper FFT (Web Audio API AnalyserNode)
  
  const fftSize = 2048;
  const hopSize = fftSize / 4;
  const nyquist = sampleRate / 2;
  
  let lowEnergy = 0;
  let midEnergy = 0;
  let highEnergy = 0;
  let count = 0;
  
  // Analyze chunks
  for (let i = 0; i < channelData.length - fftSize; i += hopSize) {
    const chunk = channelData.slice(i, i + fftSize);
    
    // Simple frequency domain analysis (placeholder for real FFT)
    const rms = computeRMS(chunk);
    
    // Estimate frequency content (simplified - real implementation uses FFT)
    // Low: 0-200Hz, Mid: 200-3000Hz, High: 3000Hz+
    const lowFreq = estimateFrequencyBand(chunk, sampleRate, 0, 200);
    const midFreq = estimateFrequencyBand(chunk, sampleRate, 200, 3000);
    const highFreq = estimateFrequencyBand(chunk, sampleRate, 3000, nyquist);
    
    lowEnergy += lowFreq * rms;
    midEnergy += midFreq * rms;
    highEnergy += highFreq * rms;
    count++;
  }
  
  const total = lowEnergy + midEnergy + highEnergy;
  
  return {
    low: total > 0 ? lowEnergy / total : 0,
    mid: total > 0 ? midEnergy / total : 0,
    high: total > 0 ? highEnergy / total : 0,
  };
}

/**
 * Estimate frequency band energy (simplified - placeholder for real FFT).
 */
function estimateFrequencyBand(
  chunk: Float32Array,
  sampleRate: number,
  lowFreq: number,
  highFreq: number
): number {
  // Placeholder: use autocorrelation to estimate dominant frequency
  // Real implementation should use FFT
  const autocorr = autocorrelate(chunk);
  const maxLag = Math.floor(sampleRate / lowFreq);
  const minLag = Math.floor(sampleRate / highFreq);
  
  let maxCorr = 0;
  for (let lag = minLag; lag < maxLag && lag < autocorr.length; lag++) {
    maxCorr = Math.max(maxCorr, Math.abs(autocorr[lag]));
  }
  
  return maxCorr;
}

/**
 * Simple autocorrelation for frequency estimation.
 */
function autocorrelate(data: Float32Array): Float32Array {
  const result = new Float32Array(data.length);
  
  for (let lag = 0; lag < data.length; lag++) {
    let sum = 0;
    for (let i = 0; i < data.length - lag; i++) {
      sum += data[i] * data[i + lag];
    }
    result[lag] = sum / (data.length - lag);
  }
  
  return result;
}

/**
 * Detect transients (percussive hits, drum hits, etc.).
 */
function detectTransients(channelData: Float32Array, sampleRate: number): TransientProfile {
  const windowSize = Math.floor(sampleRate * 0.01); // 10ms window
  const threshold = 0.15; // Transient threshold
  
  let count = 0;
  let totalStrength = 0;
  
  // Simple transient detection: look for rapid energy changes
  for (let i = windowSize; i < channelData.length - windowSize; i += windowSize) {
    const prevWindow = channelData.slice(i - windowSize, i);
    const currWindow = channelData.slice(i, i + windowSize);
    
    const prevRMS = computeRMS(prevWindow);
    const currRMS = computeRMS(currWindow);
    
    const delta = currRMS - prevRMS;
    
    if (delta > threshold) {
      count++;
      totalStrength += delta;
    }
  }
  
  const duration = channelData.length / sampleRate;
  const density = duration > 0 ? count / duration : 0;
  const avg = count > 0 ? totalStrength / count : 0;
  
  return {
    count,
    avg: Math.min(1.0, avg),
    density,
  };
}

