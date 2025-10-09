/**
 * YIN Algorithm for fast pitch detection
 * Optimized for real-time, low-latency operation
 */

export class YINDetector {
  private sampleRate: number;
  private bufferSize: number;
  private threshold: number;
  
  constructor(sampleRate: number, bufferSize: number = 2048) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.threshold = 0.15; // Lower = more accurate, higher = faster
  }
  
  /**
   * Detect pitch from audio buffer
   * Returns frequency in Hz, or 0 if no pitch detected
   */
  detect(audioBuffer: Float32Array): { frequency: number; confidence: number } {
    if (audioBuffer.length < this.bufferSize) {
      return { frequency: 0, confidence: 0 };
    }
    
    const halfSize = this.bufferSize / 2;
    const yinBuffer = new Float32Array(halfSize);
    
    // Step 1: Calculate difference function
    this.differenceFunction(audioBuffer, yinBuffer);
    
    // Step 2: Cumulative mean normalized difference
    this.cumulativeMeanNormalizedDifference(yinBuffer);
    
    // Step 3: Absolute threshold
    const tauEstimate = this.absoluteThreshold(yinBuffer);
    
    if (tauEstimate === -1) {
      return { frequency: 0, confidence: 0 };
    }
    
    // Step 4: Parabolic interpolation
    const betterTau = this.parabolicInterpolation(yinBuffer, tauEstimate);
    
    const frequency = this.sampleRate / betterTau;
    const confidence = 1 - yinBuffer[tauEstimate];
    
    return { frequency, confidence };
  }
  
  private differenceFunction(buffer: Float32Array, yinBuffer: Float32Array): void {
    const halfSize = yinBuffer.length;
    
    for (let tau = 0; tau < halfSize; tau++) {
      let sum = 0;
      for (let i = 0; i < halfSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }
  }
  
  private cumulativeMeanNormalizedDifference(yinBuffer: Float32Array): void {
    yinBuffer[0] = 1;
    let runningSum = 0;
    
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / runningSum;
    }
  }
  
  private absoluteThreshold(yinBuffer: Float32Array): number {
    // Find first tau where value is below threshold
    for (let tau = 2; tau < yinBuffer.length; tau++) {
      if (yinBuffer[tau] < this.threshold) {
        // Find local minimum in this region
        while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        return tau;
      }
    }
    return -1;
  }
  
  private parabolicInterpolation(yinBuffer: Float32Array, tau: number): number {
    if (tau === 0 || tau === yinBuffer.length - 1) {
      return tau;
    }
    
    const s0 = yinBuffer[tau - 1];
    const s1 = yinBuffer[tau];
    const s2 = yinBuffer[tau + 1];
    
    return tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }
  
  /**
   * Convert frequency to MIDI note number
   */
  static frequencyToMidi(frequency: number): number {
    return 69 + 12 * Math.log2(frequency / 440);
  }
  
  /**
   * Get cents offset from nearest note
   */
  static getCentsOffset(frequency: number): { note: number; cents: number } {
    const midi = this.frequencyToMidi(frequency);
    const note = Math.round(midi);
    const cents = (midi - note) * 100;
    return { note, cents };
  }
}
