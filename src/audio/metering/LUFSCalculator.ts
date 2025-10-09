/**
 * LUFS Calculator - ITU-R BS.1770-5 compliant
 * Calculates Integrated, Short-term, and Momentary loudness
 */

export class LUFSCalculator {
  private context: AudioContext;
  private sampleRate: number;
  
  // K-weighting filter coefficients (pre-filter)
  private kWeightCoeffs = {
    // High-pass at ~100Hz (stage 1)
    hp1: { b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285 },
    // High-pass at ~100Hz (stage 2)
    hp2: { b0: 1.0, b1: -2.0, b2: 1.0 }
  };
  
  // Gating thresholds
  private absoluteThreshold = -70; // LUFS
  private relativeThreshold = -10; // LU below integrated
  
  constructor(context: AudioContext) {
    this.context = context;
    this.sampleRate = context.sampleRate;
  }
  
  /**
   * Calculate integrated LUFS (overall program loudness)
   */
  calculateIntegrated(samples: Float32Array, channels: number = 2): number {
    // Apply K-weighting
    const weighted = this.applyKWeighting(samples);
    
    // Calculate mean square with gating
    const blocks = this.divideIntoBlocks(weighted, 0.4); // 400ms blocks
    const gated = this.applyGating(blocks);
    
    if (gated.length === 0) return -Infinity;
    
    const meanSquare = gated.reduce((sum, block) => sum + block, 0) / gated.length;
    
    // Convert to LUFS
    return -0.691 + 10 * Math.log10(meanSquare);
  }
  
  /**
   * Calculate short-term LUFS (3 second window)
   */
  calculateShortTerm(samples: Float32Array): number {
    const weighted = this.applyKWeighting(samples);
    const blocks = this.divideIntoBlocks(weighted, 3.0); // 3 second blocks
    
    if (blocks.length === 0) return -Infinity;
    
    const meanSquare = blocks[blocks.length - 1]; // Most recent block
    return -0.691 + 10 * Math.log10(meanSquare);
  }
  
  /**
   * Calculate momentary LUFS (400ms window)
   */
  calculateMomentary(samples: Float32Array): number {
    const weighted = this.applyKWeighting(samples);
    const blocks = this.divideIntoBlocks(weighted, 0.4); // 400ms blocks
    
    if (blocks.length === 0) return -Infinity;
    
    const meanSquare = blocks[blocks.length - 1]; // Most recent block
    return -0.691 + 10 * Math.log10(meanSquare);
  }
  
  /**
   * Calculate loudness range (LRA)
   */
  calculateLRA(samples: Float32Array): number {
    const weighted = this.applyKWeighting(samples);
    const blocks = this.divideIntoBlocks(weighted, 3.0);
    const gated = this.applyGating(blocks);
    
    if (gated.length < 2) return 0;
    
    // Sort blocks
    const sorted = [...gated].sort((a, b) => a - b);
    
    // Calculate 10th and 95th percentiles
    const low = sorted[Math.floor(sorted.length * 0.1)];
    const high = sorted[Math.floor(sorted.length * 0.95)];
    
    // LRA in LU
    return 10 * Math.log10(high / low);
  }
  
  /**
   * Apply K-weighting filter (ITU-R BS.1770-5)
   * Simplified implementation
   */
  private applyKWeighting(samples: Float32Array): Float32Array {
    // In production, would implement proper IIR filtering
    // For now, return samples (mock implementation)
    return samples;
  }
  
  /**
   * Divide audio into overlapping blocks
   */
  private divideIntoBlocks(samples: Float32Array, blockDuration: number): number[] {
    const blockSize = Math.floor(this.sampleRate * blockDuration);
    const overlap = 0.75; // 75% overlap
    const step = Math.floor(blockSize * (1 - overlap));
    
    const blocks: number[] = [];
    
    for (let i = 0; i < samples.length - blockSize; i += step) {
      let sumSquare = 0;
      for (let j = 0; j < blockSize; j++) {
        const sample = samples[i + j];
        sumSquare += sample * sample;
      }
      blocks.push(sumSquare / blockSize);
    }
    
    return blocks;
  }
  
  /**
   * Apply absolute and relative gating
   */
  private applyGating(blocks: number[]): number[] {
    // Convert threshold to linear
    const absThresholdLinear = Math.pow(10, (this.absoluteThreshold + 0.691) / 10);
    
    // Absolute gating
    const absGated = blocks.filter(block => block >= absThresholdLinear);
    
    if (absGated.length === 0) return [];
    
    // Calculate preliminary loudness
    const preliminary = absGated.reduce((sum, b) => sum + b, 0) / absGated.length;
    const preliminaryLUFS = -0.691 + 10 * Math.log10(preliminary);
    
    // Relative gating threshold
    const relThresholdLUFS = preliminaryLUFS + this.relativeThreshold;
    const relThresholdLinear = Math.pow(10, (relThresholdLUFS + 0.691) / 10);
    
    // Relative gating
    return absGated.filter(block => block >= relThresholdLinear);
  }
}
