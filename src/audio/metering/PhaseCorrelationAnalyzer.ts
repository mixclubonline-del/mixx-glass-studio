/**
 * Phase Correlation Analyzer
 * Calculates stereo phase correlation coefficient
 */

export class PhaseCorrelationAnalyzer {
  /**
   * Calculate phase correlation between left and right channels
   * Returns value between -1 (out of phase) and +1 (mono/in phase)
   * 
   * @param left Left channel samples
   * @param right Right channel samples
   * @returns Correlation coefficient (-1 to +1)
   */
  calculateCorrelation(left: Float32Array, right: Float32Array): number {
    if (left.length !== right.length || left.length === 0) {
      return 0;
    }
    
    let sumLR = 0;
    let sumLL = 0;
    let sumRR = 0;
    
    for (let i = 0; i < left.length; i++) {
      const l = left[i];
      const r = right[i];
      
      sumLR += l * r;
      sumLL += l * l;
      sumRR += r * r;
    }
    
    const denominator = Math.sqrt(sumLL * sumRR);
    
    if (denominator === 0) return 0;
    
    return sumLR / denominator;
  }
  
  /**
   * Calculate stereo width (0 = mono, 1 = full stereo)
   */
  calculateStereoWidth(left: Float32Array, right: Float32Array): number {
    const correlation = this.calculateCorrelation(left, right);
    
    // Convert correlation to width
    // +1 (mono) -> 0 width
    // 0 (uncorrelated) -> 0.5 width
    // -1 (phase inverted) -> 1 width (theoretical max)
    return (1 - correlation) / 2;
  }
  
  /**
   * Check for mono compatibility issues
   * Returns true if phase correlation is problematic (< -0.3)
   */
  hasMonoCompatibilityIssue(correlation: number): boolean {
    return correlation < -0.3;
  }
}
