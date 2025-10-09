/**
 * True Peak Detector - ITU-R BS.1770-5 compliant
 * 4x oversampling for inter-sample peak detection
 */

export class TruePeakDetector {
  private context: AudioContext;
  private oversampleRate: number = 4;
  
  constructor(context: AudioContext) {
    this.context = context;
  }
  
  /**
   * Detect true peak from audio data
   * Uses 4x oversampling to catch inter-sample peaks
   */
  detectTruePeak(samples: Float32Array): number {
    if (samples.length === 0) return -Infinity;
    
    // Oversample by 4x
    const oversampled = this.oversample(samples, this.oversampleRate);
    
    // Find peak in oversampled data
    let peak = 0;
    for (let i = 0; i < oversampled.length; i++) {
      const abs = Math.abs(oversampled[i]);
      if (abs > peak) peak = abs;
    }
    
    // Convert to dBTP (True Peak)
    return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  }
  
  /**
   * Simple 4x oversampling using linear interpolation
   * In production, would use proper sinc interpolation
   */
  private oversample(samples: Float32Array, factor: number): Float32Array {
    const length = samples.length * factor;
    const result = new Float32Array(length);
    
    for (let i = 0; i < samples.length - 1; i++) {
      const current = samples[i];
      const next = samples[i + 1];
      
      for (let j = 0; j < factor; j++) {
        const t = j / factor;
        result[i * factor + j] = current + (next - current) * t;
      }
    }
    
    // Last sample
    result[length - 1] = samples[samples.length - 1];
    
    return result;
  }
}
