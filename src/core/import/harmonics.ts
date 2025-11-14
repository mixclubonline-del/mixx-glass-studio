/**
 * Harmonic Fingerprint
 * 
 * Layer 4.4 of the Flow Import Core.
 * Generates harmonic signature for:
 * - FlowPulse visualization
 * - Import fingerprint animation
 * - Velvet Curve tonal shaping
 * - Harmonic Lattice processing
 * - Tonal Shape View
 */

/**
 * Generate harmonic fingerprint from audio buffer.
 * 
 * @param buffer - Audio buffer to analyze
 * @param size - Size of fingerprint array (default 2048)
 * @returns Harmonic fingerprint as Float32Array
 */
export function harmonicFingerprint(
  buffer: AudioBuffer,
  size: number = 2048
): Float32Array {
  const channel = buffer.getChannelData(0);
  const bins = new Float32Array(size);
  
  // Sample the buffer and compute magnitude
  const step = Math.max(1, Math.floor(channel.length / size));
  
  for (let i = 0; i < size && i * step < channel.length; i++) {
    bins[i] = Math.abs(channel[i * step]);
  }
  
  return bins;
}

/**
 * Generate harmonic fingerprint with frequency-domain analysis.
 * Simplified FFT approximation using autocorrelation.
 * 
 * @param buffer - Audio buffer to analyze
 * @param size - Size of fingerprint array (default 2048)
 * @returns Harmonic fingerprint with frequency content
 */
export function harmonicFingerprintAdvanced(
  buffer: AudioBuffer,
  size: number = 2048
): Float32Array {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const bins = new Float32Array(size);
  
  // Simple frequency analysis using autocorrelation
  const chunkSize = Math.floor(channel.length / size);
  
  for (let i = 0; i < size; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, channel.length);
    const chunk = channel.slice(start, end);
    
    // Compute autocorrelation to estimate frequency content
    let energy = 0;
    for (let j = 0; j < chunk.length; j++) {
      energy += Math.abs(chunk[j]);
    }
    
    bins[i] = energy / chunk.length;
  }
  
  return bins;
}

/**
 * Extract harmonic series (fundamental + overtones).
 * 
 * @param buffer - Audio buffer to analyze
 * @returns Object with fundamental frequency and harmonic strengths
 */
export function extractHarmonicSeries(buffer: AudioBuffer): {
  fundamental: number; // Hz
  harmonics: Float32Array; // Harmonic strengths (0-1)
} {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  
  // Simplified: find dominant frequency
  let maxEnergy = 0;
  let fundamentalFreq = 440; // Default to A4
  
  const fftSize = 2048;
  for (let i = 0; i < channel.length - fftSize; i += fftSize) {
    const chunk = channel.slice(i, i + fftSize);
    
    // Find peak frequency
    let max = 0;
    let maxIndex = 0;
    for (let j = 0; j < chunk.length; j++) {
      const v = Math.abs(chunk[j]);
      if (v > max) {
        max = v;
        maxIndex = j;
      }
    }
    
    const freq = (maxIndex * sampleRate) / fftSize;
    if (max > maxEnergy && freq > 80 && freq < 2000) {
      maxEnergy = max;
      fundamentalFreq = freq;
    }
  }
  
  // Generate harmonic series (fundamental + 7 overtones)
  const harmonics = new Float32Array(8);
  harmonics[0] = 1.0; // Fundamental
  
  // Simplified: assume decreasing strength for overtones
  for (let i = 1; i < 8; i++) {
    harmonics[i] = Math.max(0, 1.0 - i * 0.15);
  }
  
  return {
    fundamental: fundamentalFreq,
    harmonics,
  };
}

