/**
 * Dynamic Range Calculator - EBU Tech 3342 compliant
 * Calculates DR score and crest factor
 */

export class DynamicRangeCalculator {
  /**
   * Calculate DR score (EBU Tech 3342)
   * Measures the difference between peak and average levels
   * 
   * @param samples Audio samples
   * @returns DR score (higher = more dynamic, lower = more compressed)
   */
  calculateDRScore(samples: Float32Array): number {
    if (samples.length === 0) return 0;
    
    // Divide into 3-second blocks
    const blockSize = 3 * 44100; // Assuming 44.1kHz
    const blocks: { peak: number; rms: number }[] = [];
    
    for (let i = 0; i < samples.length; i += blockSize) {
      const end = Math.min(i + blockSize, samples.length);
      const block = samples.slice(i, end);
      
      // Calculate peak
      let peak = 0;
      for (let j = 0; j < block.length; j++) {
        const abs = Math.abs(block[j]);
        if (abs > peak) peak = abs;
      }
      
      // Calculate RMS
      let sumSquare = 0;
      for (let j = 0; j < block.length; j++) {
        sumSquare += block[j] * block[j];
      }
      const rms = Math.sqrt(sumSquare / block.length);
      
      blocks.push({ peak, rms });
    }
    
    if (blocks.length === 0) return 0;
    
    // Calculate second-highest peak (to avoid outliers)
    const peaks = blocks.map(b => b.peak).sort((a, b) => b - a);
    const peak2 = peaks.length > 1 ? peaks[1] : peaks[0];
    
    // Calculate average RMS of top 20% blocks
    const sortedByRMS = [...blocks].sort((a, b) => b.rms - a.rms);
    const top20Count = Math.max(1, Math.floor(sortedByRMS.length * 0.2));
    const avgRMS = sortedByRMS.slice(0, top20Count)
      .reduce((sum, b) => sum + b.rms, 0) / top20Count;
    
    // DR = Peak (dB) - RMS (dB)
    const peakDB = 20 * Math.log10(peak2);
    const rmsDB = 20 * Math.log10(avgRMS);
    
    return Math.round(peakDB - rmsDB);
  }
  
  /**
   * Calculate crest factor (peak-to-RMS ratio)
   * 
   * @param samples Audio samples
   * @returns Crest factor in dB
   */
  calculateCrestFactor(samples: Float32Array): number {
    if (samples.length === 0) return 0;
    
    // Find peak
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > peak) peak = abs;
    }
    
    // Calculate RMS
    let sumSquare = 0;
    for (let i = 0; i < samples.length; i++) {
      sumSquare += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sumSquare / samples.length);
    
    if (rms === 0 || peak === 0) return 0;
    
    // Crest factor in dB
    return 20 * Math.log10(peak / rms);
  }
  
  /**
   * Estimate compression amount based on crest factor
   * Returns value between 0 (no compression) and 1 (heavy compression)
   */
  estimateCompression(crestFactor: number): number {
    // Typical crest factors:
    // Uncompressed music: 12-18 dB
    // Light compression: 8-12 dB
    // Heavy compression: 4-8 dB
    // Brick-walled: < 4 dB
    
    if (crestFactor >= 12) return 0; // No compression
    if (crestFactor <= 4) return 1; // Maximum compression
    
    // Linear interpolation between 4-12 dB
    return (12 - crestFactor) / 8;
  }
}
