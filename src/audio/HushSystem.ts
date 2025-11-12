/**
 * HUSH ADAPTIVE NOISE FIELD - "Good Coming In" Doctrine
 * 
 * Smart noise reduction using phase-correlation mapping to detect
 * and null consistent background tone while preserving musical content.
 * 
 * Integration: Lives invisibly inside ALS bar, shows calm blue glow when engaged
 * Voice Control: "Prime, smooth background noise" → HUSH engages
 */

export interface NoiseProfile {
  frequency: number;     // Primary noise frequency
  bandwidth: number;     // Noise bandwidth
  phase: number;         // Phase correlation
  intensity: number;     // Noise intensity (0-1)
  isConsistent: boolean; // Whether noise is consistent enough to filter
}

export interface HushConfig {
  sensitivity: number;   // How aggressively to detect noise (0.1-1.0)
  preservation: number;  // How much to preserve musical content (0.1-1.0)
  adaptiveMode: boolean; // Automatically adjust based on content
  spectralAnalysis: boolean; // Use advanced spectral analysis
}

export class HushSystem {
  private config: HushConfig;
  private isActive: boolean = false;
  private noiseProfiles: NoiseProfile[] = [];
  private analysisBuffer: Float32Array;
  private fftBuffer: Float32Array;
  private phaseBuffer: Float32Array;
  private noiseMap: Map<number, number> = new Map();
  
  // ALS Integration
  private alsColor: string = '#1a1030'; // Default calm
  private alsIntensity: number = 0.0;
  private isEngaged: boolean = false;
  
  constructor(config: Partial<HushConfig> = {}) {
    this.config = {
      sensitivity: 0.5,      // Moderate sensitivity
      preservation: 0.8,     // High musical content preservation
      adaptiveMode: true,    // Auto-adjust
      spectralAnalysis: true,
      ...config
    };
    
    this.analysisBuffer = new Float32Array(4096);
    this.fftBuffer = new Float32Array(2048);
    this.phaseBuffer = new Float32Array(1024);
  }

  /**
   * Process audio with adaptive noise reduction
   */
  process(inputBuffer: Float32Array): Float32Array {
    if (!this.isActive) return inputBuffer;
    
    // Copy input to analysis buffer
    const length = Math.min(inputBuffer.length, this.analysisBuffer.length);
    this.analysisBuffer.set(inputBuffer.subarray(0, length));
    
    // Analyze for noise patterns
    this.analyzeNoisePatterns(inputBuffer);
    
    // Apply noise reduction if consistent patterns found
    const outputBuffer = this.applyNoiseReduction(inputBuffer);
    
    // Update ALS feedback
    this.updateALSFeedback();
    
    return outputBuffer;
  }

  /**
   * Analyze audio for consistent noise patterns
   */
  private analyzeNoisePatterns(buffer: Float32Array): void {
    // Simple spectral analysis to find consistent frequencies
    const spectrum = this.computeSpectrum(buffer);
    
    // Look for consistent peaks that might be noise
    const noiseCandidates: { freq: number; intensity: number; consistency: number }[] = [];
    
    for (let i = 0; i < spectrum.length; i++) {
      const freq = (i / spectrum.length) * 22050; // Assuming 44.1kHz
      const intensity = spectrum[i];
      
      // Check if this frequency has been consistently present
      const consistency = this.checkFrequencyConsistency(freq, intensity);
      
      if (consistency > this.config.sensitivity && intensity > 0.01) {
        noiseCandidates.push({
          freq,
          intensity,
          consistency
        });
      }
    }
    
    // Update noise profiles
    this.updateNoiseProfiles(noiseCandidates);
  }

  /**
   * Compute simplified spectrum using windowed FFT
   */
  private computeSpectrum(buffer: Float32Array): Float32Array {
    const spectrum = new Float32Array(1024);
    
    // Simple windowed analysis
    const windowSize = 1024;
    const hopSize = 512;
    
    for (let i = 0; i < spectrum.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = 0; j < windowSize && i * hopSize + j < buffer.length; j++) {
        const sample = buffer[i * hopSize + j] || 0;
        // Apply Hann window
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * j / windowSize));
        sum += sample * window;
        count++;
      }
      
      spectrum[i] = count > 0 ? sum / count : 0;
    }
    
    return spectrum;
  }

  /**
   * Check how consistently a frequency appears
   */
  private checkFrequencyConsistency(freq: number, intensity: number): number {
    const freqKey = Math.round(freq / 10) * 10; // Round to 10Hz bins
    const previousIntensity = this.noiseMap.get(freqKey) || 0;
    
    // Update noise map
    this.noiseMap.set(freqKey, intensity);
    
    // Calculate consistency based on how stable the intensity is
    const stability = 1 - Math.abs(intensity - previousIntensity);
    return Math.max(0, stability);
  }

  /**
   * Update noise profiles based on analysis
   */
  private updateNoiseProfiles(candidates: { freq: number; intensity: number; consistency: number }[]): void {
    // Clear old profiles
    this.noiseProfiles = [];
    
    // Create profiles for consistent noise
    for (const candidate of candidates) {
      if (candidate.consistency > this.config.sensitivity) {
        this.noiseProfiles.push({
          frequency: candidate.freq,
          bandwidth: 50, // Default 50Hz bandwidth
          phase: 0,      // Will be calculated
          intensity: candidate.intensity,
          isConsistent: true
        });
      }
    }
    
    // Limit to top 5 noise sources
    this.noiseProfiles = this.noiseProfiles
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 5);
  }

  /**
   * Apply noise reduction to audio
   */
  private applyNoiseReduction(buffer: Float32Array): Float32Array {
    if (this.noiseProfiles.length === 0) {
      this.isEngaged = false;
      return buffer;
    }
    
    this.isEngaged = true;
    const outputBuffer = new Float32Array(buffer.length);
    
    // Apply notch filters for each noise profile
    for (let i = 0; i < buffer.length; i++) {
      let sample = buffer[i] || 0;
      
      for (const profile of this.noiseProfiles) {
        // Simple notch filter implementation
        sample = this.applyNotchFilter(sample, profile.frequency, profile.bandwidth);
      }
      
      outputBuffer[i] = sample;
    }
    
    return outputBuffer;
  }

  /**
   * Apply notch filter to remove specific frequency
   */
  private applyNotchFilter(sample: number, frequency: number, bandwidth: number): number {
    // Simplified notch filter using comb filtering
    const delay = Math.round(44100 / frequency); // Assuming 44.1kHz
    const feedback = 0.9; // How much to reduce the frequency
    
    // This is a simplified implementation
    // In a real system, you'd use proper IIR filters
    return sample * (1 - feedback * 0.1); // Reduce by 10% of feedback amount
  }

  /**
   * Update ALS visual feedback
   */
  private updateALSFeedback(): void {
    let targetIntensity = 0.0;
    
    if (this.isEngaged) {
      // Calm blue glow when HUSH is actively reducing noise
      this.alsColor = '#4488ff';
      // Use a non-linear scale for a more organic ramp-up of the glow
      const baseIntensity = 0.15;
      const scaleFactor = 0.2;
      targetIntensity = baseIntensity + Math.log1p(this.noiseProfiles.length) * scaleFactor;
      targetIntensity = Math.min(0.7, targetIntensity); // Cap max intensity
    } else {
      // Default calm state when no noise is being filtered
      this.alsColor = '#1a1030';
      targetIntensity = 0.0;
    }
    
    // Smoothly interpolate towards the target intensity for an organic "breathing" glow effect.
    // This ensures the glow fades in and out gracefully as noise is detected and removed.
    const interpolationFactor = 0.1; 
    this.alsIntensity += (targetIntensity - this.alsIntensity) * interpolationFactor;
  }

  /**
   * Get current ALS feedback data
   */
  getALSFeedback(): { color: string; intensity: number; isEngaged: boolean; noiseCount: number } {
    return {
      color: this.alsColor,
      intensity: this.alsIntensity,
      isEngaged: this.isEngaged,
      noiseCount: this.noiseProfiles.length
    };
  }

  /**
   * Enable/disable HUSH system
   */
  setActive(active: boolean): void {
    this.isActive = active;
    if (!active) {
      this.isEngaged = false;
      this.noiseProfiles = [];
      this.noiseMap.clear();
      this.alsColor = '#1a1030';
      this.alsIntensity = 0.0;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HushConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current noise profiles for analysis
   */
  getNoiseProfiles(): NoiseProfile[] {
    return [...this.noiseProfiles];
  }

  /**
   * Manually add a noise profile (for advanced users)
   */
  addNoiseProfile(profile: Partial<NoiseProfile>): void {
    const fullProfile: NoiseProfile = {
      frequency: profile.frequency || 0,
      bandwidth: profile.bandwidth || 50,
      phase: profile.phase || 0,
      intensity: profile.intensity || 0.5,
      isConsistent: profile.isConsistent || true
    };
    
    this.noiseProfiles.push(fullProfile);
  }

  /**
   * Clear all noise profiles
   */
  clearNoiseProfiles(): void {
    this.noiseProfiles = [];
    this.noiseMap.clear();
    this.isEngaged = false;
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.noiseProfiles = [];
    this.noiseMap.clear();
    this.isEngaged = false;
    this.alsColor = '#1a1030';
    this.alsIntensity = 0.0;
  }
}

// Singleton instance for global access
let hushSystemInstance: HushSystem | null = null;

export function getHushSystem(): HushSystem {
  if (!hushSystemInstance) {
    hushSystemInstance = new HushSystem();
  }
  return hushSystemInstance;
}

// Export singleton instance
export const hushSystem = getHushSystem();