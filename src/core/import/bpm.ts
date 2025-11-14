/**
 * BPM Detector (Flow-Safe, Offline)
 * 
 * Layer 4.1 of the Flow Import Core.
 * Pure buffer math: no AudioContext required.
 * 
 * Flow Impact:
 * - Determines quantize grid
 * - Defines punch zones
 * - Sets comp slice distance
 * - Locks timeline visually
 * - Auto-colorizes grid
 * - ALS "Flow %" increases
 */

/**
 * Detect BPM from audio buffer using peak detection.
 * 
 * @param buffer - Audio buffer to analyze
 * @returns Detected BPM (rounded) or null if detection fails
 */
export function detectBPM(buffer: AudioBuffer): number | null {
  const channel = buffer.getChannelData(0);
  const len = channel.length;
  const sampleRate = buffer.sampleRate;
  
  // Detect peaks (high amplitude points)
  const peaks: number[] = [];
  for (let i = 0; i < len; i += 512) {
    if (Math.abs(channel[i]) > 0.6) {
      peaks.push(i);
    }
  }
  
  // Need at least 2 peaks to calculate intervals
  if (peaks.length < 2) {
    return null;
  }
  
  // Calculate intervals between peaks (in samples)
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const diff = peaks[i] - peaks[i - 1];
    if (diff > 0) {
      // Convert sample difference to frequency (Hz)
      const freqHz = sampleRate / diff;
      intervals.push(freqHz);
    }
  }
  
  if (intervals.length === 0) {
    return null;
  }
  
  // Average frequency, convert to BPM
  const avgFreq = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = avgFreq * 60; // Convert Hz to BPM
  
  return Math.round(bpm);
}

