/**
 * SPECTRAL ANALYSIS MODULE
 * 
 * Integration point for prime-spectral-stem-lab technology.
 * This module provides a clean interface for advanced spectral analysis
 * that can be enhanced with external algorithms.
 * 
 * Flow Principles:
 * - Modular: Can swap implementations without breaking Flow
 * - Reductionist: Only what earns pixels
 * - Flow: Preserve creator momentum
 */

export interface SpectralFrame {
  /** Frequency bins (typically 0-22050 Hz for 44.1kHz) */
  frequencies: Float32Array;
  /** Magnitude spectrum */
  magnitude: Float32Array;
  /** Phase spectrum */
  phase: Float32Array;
  /** Timestamp in seconds */
  time: number;
}

export interface SpectralAnalysisResult {
  /** All spectral frames */
  frames: SpectralFrame[];
  /** Average magnitude spectrum */
  averageMagnitude: Float32Array;
  /** Peak frequencies (dominant harmonics) */
  peakFrequencies: number[];
  /** Spectral centroid (brightness) */
  spectralCentroid: number;
  /** Spectral rolloff (high-frequency content) */
  spectralRolloff: number;
  /** Spectral flux (change over time) */
  spectralFlux: Float32Array;
  /** Harmonic content analysis */
  harmonicContent: {
    fundamental: number | null;
    harmonics: number[];
    strength: number;
  };
}

export interface SpectralStemMask {
  /** Frequency mask (0-1 for each frequency bin) */
  mask: Float32Array;
  /** Confidence score (0-1) */
  confidence: number;
  /** Stem type */
  stemType: 'vocals' | 'drums' | 'bass' | 'music' | 'perc' | 'harmonic' | 'sub';
}

/**
 * Spectral Analysis Engine
 * 
 * Base implementation that can be enhanced with prime-spectral-stem-lab technology.
 */
export class SpectralAnalysisEngine {
  private sampleRate: number;
  private fftSize: number;
  private hopSize: number;
  private windowSize: number;

  constructor(
    sampleRate: number = 44100,
    fftSize: number = 2048,
    hopSize: number = 512
  ) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
    this.hopSize = hopSize;
    this.windowSize = fftSize;
  }

  /**
   * Compute STFT (Short-Time Fourier Transform)
   * 
   * This is the foundation for spectral analysis.
   * Can be enhanced with prime-spectral-stem-lab algorithms.
   */
  async computeSTFT(audioBuffer: AudioBuffer): Promise<SpectralFrame[]> {
    const frames: SpectralFrame[] = [];
    const channelData = audioBuffer.getChannelData(0); // Use first channel for now
    const numFrames = Math.floor((channelData.length - this.windowSize) / this.hopSize) + 1;

    for (let i = 0; i < numFrames; i++) {
      const start = i * this.hopSize;
      const end = Math.min(start + this.windowSize, channelData.length);
      
      // Extract window
      const window = channelData.slice(start, end);
      
      // Apply window function (Hanning)
      const windowed = this.applyWindow(window);
      
      // Compute FFT (using Web Audio API AnalyserNode approach)
      const { magnitude, phase } = await this.computeFFT(windowed);
      
      const time = start / this.sampleRate;
      const frequencies = new Float32Array(this.fftSize / 2);
      for (let j = 0; j < frequencies.length; j++) {
        frequencies[j] = (j * this.sampleRate) / this.fftSize;
      }

      frames.push({
        frequencies,
        magnitude,
        phase,
        time,
      });
    }

    return frames;
  }

  /**
   * Apply window function to reduce spectral leakage
   */
  private applyWindow(data: Float32Array): Float32Array {
    const windowed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (data.length - 1))); // Hanning
      windowed[i] = data[i] * windowValue;
    }
    return windowed;
  }

  /**
   * Compute FFT using Web Audio API
   * 
   * NOTE: This is a simplified implementation.
   * prime-spectral-stem-lab technology can replace this with more advanced FFT.
   */
  private async computeFFT(timeDomain: Float32Array): Promise<{
    magnitude: Float32Array;
    phase: Float32Array;
  }> {
    // Create temporary audio context for FFT
    const ctx = new OfflineAudioContext(1, timeDomain.length, this.sampleRate);
    const buffer = ctx.createBuffer(1, timeDomain.length, this.sampleRate);
    buffer.copyToChannel(timeDomain, 0);
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const analyser = ctx.createAnalyser();
    analyser.fftSize = this.fftSize;
    
    source.connect(analyser);
    analyser.connect(ctx.destination);
    
    source.start(0);
    await ctx.startRendering();
    
    // Get frequency data
    const magnitude = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(magnitude);
    
    // Convert to linear scale and compute phase
    const magnitudeLinear = new Float32Array(magnitude.length);
    const phase = new Float32Array(magnitude.length);
    
    for (let i = 0; i < magnitude.length; i++) {
      magnitudeLinear[i] = Math.pow(10, magnitude[i] / 20); // Convert dB to linear
      // Phase computation would require complex FFT - simplified here
      phase[i] = 0; // Placeholder
    }
    
    return {
      magnitude: magnitudeLinear,
      phase,
    };
  }

  /**
   * Analyze spectral content
   * 
   * This can be enhanced with prime-spectral-stem-lab analysis algorithms.
   */
  async analyze(audioBuffer: AudioBuffer): Promise<SpectralAnalysisResult> {
    const frames = await this.computeSTFT(audioBuffer);
    
    // Compute average magnitude
    const averageMagnitude = new Float32Array(frames[0].magnitude.length);
    for (const frame of frames) {
      for (let i = 0; i < averageMagnitude.length; i++) {
        averageMagnitude[i] += frame.magnitude[i];
      }
    }
    for (let i = 0; i < averageMagnitude.length; i++) {
      averageMagnitude[i] /= frames.length;
    }
    
    // Find peak frequencies
    const peakFrequencies: number[] = [];
    for (let i = 1; i < averageMagnitude.length - 1; i++) {
      if (
        averageMagnitude[i] > averageMagnitude[i - 1] &&
        averageMagnitude[i] > averageMagnitude[i + 1] &&
        averageMagnitude[i] > 0.1 // Threshold
      ) {
        peakFrequencies.push(frames[0].frequencies[i]);
      }
    }
    
    // Compute spectral centroid (brightness)
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < averageMagnitude.length; i++) {
      const freq = frames[0].frequencies[i];
      numerator += freq * averageMagnitude[i];
      denominator += averageMagnitude[i];
    }
    const spectralCentroid = denominator > 0 ? numerator / denominator : 0;
    
    // Compute spectral rolloff (95% energy)
    let cumulativeEnergy = 0;
    const totalEnergy = averageMagnitude.reduce((sum, mag) => sum + mag * mag, 0);
    const targetEnergy = totalEnergy * 0.95;
    let spectralRolloff = frames[0].frequencies[frames[0].frequencies.length - 1];
    for (let i = 0; i < averageMagnitude.length; i++) {
      cumulativeEnergy += averageMagnitude[i] * averageMagnitude[i];
      if (cumulativeEnergy >= targetEnergy) {
        spectralRolloff = frames[0].frequencies[i];
        break;
      }
    }
    
    // Compute spectral flux (change over time)
    const spectralFlux = new Float32Array(frames.length - 1);
    for (let i = 1; i < frames.length; i++) {
      let flux = 0;
      for (let j = 0; j < frames[i].magnitude.length; j++) {
        const diff = frames[i].magnitude[j] - frames[i - 1].magnitude[j];
        if (diff > 0) {
          flux += diff * diff;
        }
      }
      spectralFlux[i - 1] = Math.sqrt(flux);
    }
    
    // Analyze harmonic content
    const harmonicContent = this.analyzeHarmonics(averageMagnitude, frames[0].frequencies);
    
    return {
      frames,
      averageMagnitude,
      peakFrequencies,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      harmonicContent,
    };
  }

  /**
   * Analyze harmonic content (fundamental and overtones)
   * 
   * This can be enhanced with prime-spectral-stem-lab harmonic detection.
   */
  private analyzeHarmonics(
    magnitude: Float32Array,
    frequencies: Float32Array
  ): {
    fundamental: number | null;
    harmonics: number[];
    strength: number;
  } {
    // Find fundamental frequency (strongest peak in low frequencies)
    let maxMagnitude = 0;
    let fundamental: number | null = null;
    const lowFreqRange = frequencies.findIndex(f => f > 200); // Below 200Hz
    
    for (let i = 0; i < Math.min(lowFreqRange, magnitude.length); i++) {
      if (magnitude[i] > maxMagnitude) {
        maxMagnitude = magnitude[i];
        fundamental = frequencies[i];
      }
    }
    
    // Find harmonics (multiples of fundamental)
    const harmonics: number[] = [];
    if (fundamental) {
      for (let harmonic = 2; harmonic <= 8; harmonic++) {
        const harmonicFreq = fundamental * harmonic;
        const index = frequencies.findIndex(f => Math.abs(f - harmonicFreq) < 10);
        if (index >= 0 && magnitude[index] > 0.1) {
          harmonics.push(harmonicFreq);
        }
      }
    }
    
    // Compute harmonic strength
    const totalEnergy = magnitude.reduce((sum, mag) => sum + mag, 0);
    const harmonicEnergy = harmonics.reduce((sum, h) => {
      const index = frequencies.findIndex(f => Math.abs(f - h) < 10);
      return sum + (index >= 0 ? magnitude[index] : 0);
    }, 0);
    const strength = totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
    
    return {
      fundamental,
      harmonics,
      strength,
    };
  }

  /**
   * Generate stem mask from spectral analysis
   * 
   * This is where prime-spectral-stem-lab technology can provide advanced masking.
   */
  async generateStemMask(
    analysis: SpectralAnalysisResult,
    stemType: SpectralStemMask['stemType']
  ): Promise<SpectralStemMask> {
    const mask = new Float32Array(analysis.averageMagnitude.length);
    let confidence = 0.5; // Default confidence
    
    switch (stemType) {
      case 'vocals':
        // Vocals typically in 200-3000 Hz range
        for (let i = 0; i < mask.length; i++) {
          const freq = analysis.frames[0].frequencies[i];
          if (freq >= 200 && freq <= 3000) {
            mask[i] = analysis.averageMagnitude[i];
            confidence = Math.max(confidence, analysis.averageMagnitude[i]);
          }
        }
        break;
        
      case 'bass':
        // Bass typically below 200 Hz
        for (let i = 0; i < mask.length; i++) {
          const freq = analysis.frames[0].frequencies[i];
          if (freq < 200) {
            mask[i] = analysis.averageMagnitude[i];
            confidence = Math.max(confidence, analysis.averageMagnitude[i]);
          }
        }
        break;
        
      case 'drums':
      case 'perc':
        // Percussive content has high spectral flux
        const avgFlux = analysis.spectralFlux.reduce((sum, f) => sum + f, 0) / analysis.spectralFlux.length;
        for (let i = 0; i < mask.length; i++) {
          mask[i] = avgFlux > 0.5 ? analysis.averageMagnitude[i] : 0;
        }
        confidence = Math.min(1, avgFlux);
        break;
        
      case 'sub':
        // Sub-bass below 60 Hz
        for (let i = 0; i < mask.length; i++) {
          const freq = analysis.frames[0].frequencies[i];
          if (freq < 60) {
            mask[i] = analysis.averageMagnitude[i];
            confidence = Math.max(confidence, analysis.averageMagnitude[i]);
          }
        }
        break;
        
      case 'music':
      case 'harmonic':
        // Harmonic content (everything else)
        for (let i = 0; i < mask.length; i++) {
          mask[i] = analysis.harmonicContent.strength > 0.3 
            ? analysis.averageMagnitude[i] 
            : 0;
        }
        confidence = analysis.harmonicContent.strength;
        break;
    }
    
    // Normalize mask
    const maxMask = Math.max(...Array.from(mask));
    if (maxMask > 0) {
      for (let i = 0; i < mask.length; i++) {
        mask[i] /= maxMask;
      }
    }
    
    return {
      mask,
      confidence,
      stemType,
    };
  }
}

/**
 * Integration point for prime-spectral-stem-lab technology
 * 
 * Replace this with your advanced spectral analysis implementation.
 */
export interface SpectralStemLabIntegration {
  /**
   * Advanced STFT computation with your algorithms
   */
  computeAdvancedSTFT?(audioBuffer: AudioBuffer): Promise<SpectralFrame[]>;
  
  /**
   * Advanced spectral analysis with your algorithms
   */
  analyzeAdvanced?(audioBuffer: AudioBuffer): Promise<SpectralAnalysisResult>;
  
  /**
   * Advanced stem mask generation with your algorithms
   */
  generateAdvancedStemMask?(
    analysis: SpectralAnalysisResult,
    stemType: SpectralStemMask['stemType']
  ): Promise<SpectralStemMask>;
  
  /**
   * Apply spectral mask to audio buffer
   */
  applySpectralMask?(
    audioBuffer: AudioBuffer,
    mask: SpectralStemMask
  ): Promise<AudioBuffer>;
}

/**
 * Enhanced Spectral Analysis Engine
 * 
 * Wraps base engine with prime-spectral-stem-lab enhancements.
 */
export class EnhancedSpectralAnalysisEngine extends SpectralAnalysisEngine {
  private integration?: SpectralStemLabIntegration;
  
  constructor(
    sampleRate: number = 44100,
    fftSize: number = 2048,
    hopSize: number = 512,
    integration?: SpectralStemLabIntegration
  ) {
    super(sampleRate, fftSize, hopSize);
    this.integration = integration;
  }
  
  /**
   * Use advanced STFT if available, otherwise fall back to base
   */
  async computeSTFT(audioBuffer: AudioBuffer): Promise<SpectralFrame[]> {
    if (this.integration?.computeAdvancedSTFT) {
      return await this.integration.computeAdvancedSTFT(audioBuffer);
    }
    return await super.computeSTFT(audioBuffer);
  }
  
  /**
   * Use advanced analysis if available, otherwise fall back to base
   */
  async analyze(audioBuffer: AudioBuffer): Promise<SpectralAnalysisResult> {
    if (this.integration?.analyzeAdvanced) {
      return await this.integration.analyzeAdvanced(audioBuffer);
    }
    return await super.analyze(audioBuffer);
  }
  
  /**
   * Use advanced mask generation if available, otherwise fall back to base
   */
  async generateStemMask(
    analysis: SpectralAnalysisResult,
    stemType: SpectralStemMask['stemType']
  ): Promise<SpectralStemMask> {
    if (this.integration?.generateAdvancedStemMask) {
      return await this.integration.generateAdvancedStemMask(analysis, stemType);
    }
    return await super.generateStemMask(analysis, stemType);
  }
  
  /**
   * Apply spectral mask to create stem
   */
  async applySpectralMask(
    audioBuffer: AudioBuffer,
    mask: SpectralStemMask
  ): Promise<AudioBuffer> {
    if (this.integration?.applySpectralMask) {
      return await this.integration.applySpectralMask(audioBuffer, mask);
    }
    
    // Fallback: Simple frequency-domain filtering
    // This is a placeholder - prime-spectral-stem-lab should provide better implementation
    return audioBuffer;
  }
}

