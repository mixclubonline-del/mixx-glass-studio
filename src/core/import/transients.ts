/**
 * Transient Detector (Punch Mode Intelligence)
 * 
 * Layer 4.3 of the Flow Import Core.
 * Pure buffer analysis: detects rapid amplitude changes.
 * 
 * Flow Impact:
 * - Auto-builds comp zones
 * - Auto-snaps auto-punch
 * - Auto-detects envelope points
 * - Drives Flow Pulse visual
 */

export interface TransientMarker {
  sample: number; // Sample index where transient occurs
  time: number; // Time in seconds
  strength: number; // Transient strength (0-1)
}

/**
 * Detect transients (rapid amplitude changes) in audio buffer.
 * 
 * @param buffer - Audio buffer to analyze
 * @param threshold - Amplitude threshold for transient detection (default 0.35)
 * @returns Array of transient markers
 */
export function detectTransients(
  buffer: AudioBuffer,
  threshold: number = 0.35
): TransientMarker[] {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const transients: TransientMarker[] = [];
  
  // Detect rapid amplitude increases (transient onsets)
  for (let i = 1; i < channel.length; i++) {
    const prev = Math.abs(channel[i - 1]);
    const curr = Math.abs(channel[i]);
    
    // Transient: current sample exceeds threshold AND previous didn't
    if (curr > threshold && prev <= threshold) {
      const strength = Math.min(1.0, curr / threshold);
      
      transients.push({
        sample: i,
        time: i / sampleRate,
        strength,
      });
    }
  }
  
  return transients;
}

/**
 * Detect transients with window-based smoothing for better accuracy.
 * 
 * @param buffer - Audio buffer to analyze
 * @param threshold - Amplitude threshold (default 0.35)
 * @param windowSize - Window size in samples for smoothing (default 512)
 * @returns Array of transient markers
 */
export function detectTransientsAdvanced(
  buffer: AudioBuffer,
  threshold: number = 0.35,
  windowSize: number = 512
): TransientMarker[] {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const transients: TransientMarker[] = [];
  
  // Calculate RMS for each window
  const windows: number[] = [];
  for (let i = 0; i < channel.length - windowSize; i += windowSize) {
    let sumSquares = 0;
    for (let j = i; j < i + windowSize; j++) {
      sumSquares += channel[j] * channel[j];
    }
    const rms = Math.sqrt(sumSquares / windowSize);
    windows.push(rms);
  }
  
  // Detect transients based on RMS changes
  for (let i = 1; i < windows.length; i++) {
    const prevRMS = windows[i - 1];
    const currRMS = windows[i];
    const delta = currRMS - prevRMS;
    
    // Transient: significant RMS increase
    if (delta > threshold * 0.5 && currRMS > threshold) {
      const sampleIndex = i * windowSize;
      const strength = Math.min(1.0, delta / threshold);
      
      transients.push({
        sample: sampleIndex,
        time: sampleIndex / sampleRate,
        strength,
      });
    }
  }
  
  return transients;
}

