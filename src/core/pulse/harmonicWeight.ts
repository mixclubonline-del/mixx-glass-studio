/**
 * Harmonic Weight Calculator
 * 
 * Layer 5.3 of Flow Pulse Engine.
 * Computes harmonic weight from fingerprint.
 * 
 * This lets Flow Pulse respond not just to volume — but tonal intensity.
 */

/**
 * Compute harmonic weight from fingerprint.
 * 
 * @param fingerprint - Harmonic fingerprint (Float32Array from harmonicFingerprint)
 * @param sampleRate - Sample rate for frequency analysis (optional)
 * @returns Harmonic weight value (0-1)
 */
export function harmonicWeight(
  fingerprint: Float32Array,
  sampleRate?: number
): number {
  if (fingerprint.length === 0) {
    return 0;
  }
  
  let weight = 0;
  const step = 64; // Sample every 64th bin
  
  // Sum harmonic content
  for (let i = 0; i < fingerprint.length; i += step) {
    weight += fingerprint[i];
  }
  
  // Normalize by number of samples
  const numSamples = Math.floor(fingerprint.length / step);
  return numSamples > 0 ? weight / numSamples : 0;
}

/**
 * Compute harmonic weight with frequency weighting.
 * Higher frequencies contribute more to tonal intensity.
 * 
 * @param fingerprint - Harmonic fingerprint
 * @param sampleRate - Sample rate for frequency analysis
 * @returns Harmonic weight value (0-1)
 */
export function harmonicWeightFrequencyWeighted(
  fingerprint: Float32Array,
  sampleRate: number
): number {
  if (fingerprint.length === 0) {
    return 0;
  }
  
  let weight = 0;
  let totalWeight = 0;
  const nyquist = sampleRate / 2;
  
  // Weight higher frequencies more (they indicate tonal intensity)
  for (let i = 0; i < fingerprint.length; i++) {
    const freq = (i / fingerprint.length) * nyquist;
    const freqWeight = Math.min(1.0, freq / 2000); // Weight increases up to 2kHz
    
    weight += fingerprint[i] * freqWeight;
    totalWeight += freqWeight;
  }
  
  return totalWeight > 0 ? weight / totalWeight : 0;
}

/**
 * Extract dominant harmonic frequency.
 * 
 * @param fingerprint - Harmonic fingerprint
 * @param sampleRate - Sample rate for frequency analysis
 * @returns Dominant frequency in Hz
 */
export function extractDominantFrequency(
  fingerprint: Float32Array,
  sampleRate: number
): number {
  if (fingerprint.length === 0) {
    return 0;
  }
  
  let maxIndex = 0;
  let maxValue = 0;
  
  // Find peak in fingerprint
  for (let i = 0; i < fingerprint.length; i++) {
    if (fingerprint[i] > maxValue) {
      maxValue = fingerprint[i];
      maxIndex = i;
    }
  }
  
  // Convert index to frequency
  const nyquist = sampleRate / 2;
  return (maxIndex / fingerprint.length) * nyquist;
}

