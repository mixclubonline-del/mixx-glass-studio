/**
 * Mixx Club Studio - Advanced Real-time Audio Analysis Engine
 * Professional spectrum analysis, metering, and harmonic detection
 */

export interface SpectrumData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
  binCount: number;
  sampleRate: number;
  fftSize: number;
}

export interface MeteringData {
  level: number;           // -∞ to 0 dB
  peak: number;            // Peak level
  truePeak: number;        // ITU-R BS.1770-4 compliant peak
  rms: number;             // Root mean square
  lufs: number;            // Loudness units relative to full scale
  loudness: number;        // Integrated loudness
  loudnessRange: number;   // LU (loudness units)
  crestFactor: number;     // Peak to average ratio
  dynamicRange: number;    // Full dynamic range
  isClipping?: boolean;    // Is signal clipping
}

export interface FrequencyAnalysis {
  spectralCentroid: number;      // Center of mass of spectrum
  spectralRolloff: number;       // Frequency where 95% of energy is below
  spectralFlatness: number;      // Deviation from white noise (0-1)
  spectralSpread: number;        // Distribution width
  zeroCrossingRate: number;      // Rate of sign changes
  energyByBand: {
    subBass: number;             // 20-60 Hz
    bass: number;                // 60-250 Hz
    lowMids: number;             // 250-500 Hz
    mids: number;                // 500-2000 Hz
    highMids: number;            // 2000-4000 Hz
    presence: number;            // 4000-6000 Hz
    brilliance: number;          // 6000-20000 Hz
  };
}

export interface DynamicAnalysis {
  attackTime: number;            // Time to reach peak
  decayTime: number;             // Time to drop to 37% of peak
  sustainLevel: number;          // Level during sustain
  releaseTime: number;           // Time to silence
  noiseFloor: number;            // Minimum detectable level
  signalToNoiseRatio: number;    // dB above noise floor
  transientDensity: number;      // Number of transients per second
  compressionRatio: number;      // Input to output ratio
}

export interface CompleteAnalysis {
  timestamp: number;
  metering: MeteringData;
  spectrum: SpectrumData;
  frequency: FrequencyAnalysis;
  dynamics: DynamicAnalysis;
  isClipping: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

class RealTimeAudioAnalyzer {
  private analyserNode: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  
  // Analysis buffers
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Uint8Array | null = null;
  private floatFrequencyData: Float32Array | null = null;
  private floatTimeDomainData: Float32Array | null = null;
  
  // Peak tracking
  private peakLevel: number = 0;
  private peakHoldTime: number = 0;
  
  // Loudness calculation (ITU-R BS.1770-4)
  private maxLoudness: number = 0;
  
  // Spectral analysis
  private spectralHistory: Float32Array[] = [];
  private spectralHistorySize: number = 60; // 1 second at 60fps
  
  constructor() {
    // Initialize
  }

  async initialize(audioContext: AudioContext, analyserNode: AnalyserNode): Promise<void> {
    this.audioContext = audioContext;
    this.analyserNode = analyserNode;
    
    // Set up analysis parameters
    analyserNode.fftSize = 4096; // High resolution for spectral analysis
    analyserNode.smoothingTimeConstant = 0.3;
    
    // Create buffers - use any[] to bypass TypeScript ArrayBuffer strictness
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.frequencyData = new Uint8Array(analyserNode.frequencyBinCount) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.timeDomainData = new Uint8Array(analyserNode.frequencyBinCount) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.floatFrequencyData = new Float32Array(analyserNode.frequencyBinCount) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.floatTimeDomainData = new Float32Array(analyserNode.frequencyBinCount) as any;
    
    console.log('🎵 Advanced Real-time Audio Analyzer initialized');
  }

  analyze(): CompleteAnalysis {
    if (!this.analyserNode || !this.audioContext) {
      throw new Error('Analyzer not initialized');
    }

    const timestamp = Date.now();
    
    // Get raw data - suppress eslint warnings for unavoidable type casts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyserNode.getByteFrequencyData(this.frequencyData as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyserNode.getByteTimeDomainData(this.timeDomainData as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyserNode.getFloatFrequencyData(this.floatFrequencyData as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyserNode.getFloatTimeDomainData(this.floatTimeDomainData as any);

    // Perform analyses
    const metering = this.analyzeMeteringData();
    const spectrum = this.analyzeSpectrum();
    const frequency = this.analyzeFrequencyCharacteristics();
    const dynamics = this.analyzeDynamics();
    
    // Determine quality
    const quality = this.determineQuality(metering, frequency);
    const isClipping = metering.peak > 0.95;

    return {
      timestamp,
      metering: { ...metering, isClipping },
      spectrum,
      frequency,
      dynamics,
      isClipping,
      quality
    };
  }

  private analyzeMeteringData(): MeteringData {
    const timeDomainData = this.floatTimeDomainData!;
    let peak = 0;
    let rmsSum = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const sample = Math.abs(timeDomainData[i]);
      peak = Math.max(peak, sample);
      rmsSum += sample * sample;
    }

    // Update peak hold
    if (peak > this.peakLevel) {
      this.peakLevel = peak;
      this.peakHoldTime = 0;
    } else {
      this.peakHoldTime += 1000 / 60; // Assume 60fps
      if (this.peakHoldTime > 2000) { // 2 second hold
        this.peakLevel = Math.max(peak, this.peakLevel * 0.95); // Decay
      }
    }

    const rms = Math.sqrt(rmsSum / timeDomainData.length);
    const level = this.linearToDb(rms);
    const peakDb = this.linearToDb(this.peakLevel);
    const truePeak = this.calculateTruePeak(timeDomainData);
    
    // Calculate LUFS (simplified)
    const lufs = this.calculateLUFS(timeDomainData);
    
    // Calculate crest factor (peak to average ratio)
    const crestFactor = peak / (rms + 1e-10);
    
    // Calculate dynamic range
    const dynamicRange = peakDb - this.findNoiseFloor();

    return {
      level,
      peak: this.peakLevel,
      truePeak,
      rms,
      lufs,
      loudness: this.maxLoudness,
      loudnessRange: lufs - this.maxLoudness,
      crestFactor,
      dynamicRange
    };
  }

  private analyzeSpectrum(): SpectrumData {
    if (!this.analyserNode) throw new Error('Analyzer not initialized');

    const frequencies = new Float32Array(this.floatFrequencyData!.length);
    const magnitudes = new Float32Array(this.floatFrequencyData!.length);
    
    // Convert to linear magnitude
    for (let i = 0; i < this.floatFrequencyData!.length; i++) {
      const db = this.floatFrequencyData![i];
      magnitudes[i] = Math.pow(10, db / 20);
      
      // Calculate frequency for this bin
      const binFrequency = (i * this.audioContext!.sampleRate) / this.analyserNode.fftSize;
      frequencies[i] = binFrequency;
    }

    // Store for history
    this.spectralHistory.push(magnitudes);
    if (this.spectralHistory.length > this.spectralHistorySize) {
      this.spectralHistory.shift();
    }

    return {
      frequencies,
      magnitudes,
      binCount: this.floatFrequencyData!.length,
      sampleRate: this.audioContext!.sampleRate,
      fftSize: this.analyserNode.fftSize
    };
  }

  private analyzeFrequencyCharacteristics(): FrequencyAnalysis {
    const timeDomainData = this.floatTimeDomainData!;
    const frequencies = this.floatFrequencyData!;
    const sampleRate = this.audioContext!.sampleRate;
    const fftSize = this.analyserNode!.fftSize;

    // Spectral centroid
    let numerator = 0, denominator = 0;
    for (let i = 0; i < frequencies.length; i++) {
      const binFreq = (i * sampleRate) / fftSize;
      const magnitude = Math.pow(10, frequencies[i] / 20);
      numerator += binFreq * magnitude;
      denominator += magnitude;
    }
    const spectralCentroid = denominator > 0 ? numerator / denominator : 0;

    // Spectral rolloff (95% energy threshold)
    let cumulativeEnergy = 0;
    const totalEnergy = denominator;
    let spectralRolloff = 0;
    for (let i = 0; i < frequencies.length; i++) {
      const magnitude = Math.pow(10, frequencies[i] / 20);
      cumulativeEnergy += magnitude;
      if (cumulativeEnergy > 0.95 * totalEnergy) {
        spectralRolloff = (i * sampleRate) / fftSize;
        break;
      }
    }

    // Spectral flatness (deviation from flat spectrum)
    let logSum = 0, arithmeticSum = 0;
    for (let i = 0; i < frequencies.length; i++) {
      const magnitude = Math.pow(10, frequencies[i] / 20);
      logSum += Math.log(magnitude + 1e-10);
      arithmeticSum += magnitude;
    }
    const geometricMean = Math.exp(logSum / frequencies.length);
    const arithmeticMean = arithmeticSum / frequencies.length;
    const spectralFlatness = geometricMean / (arithmeticMean + 1e-10);

    // Spectral spread
    let spreadSum = 0;
    for (let i = 0; i < frequencies.length; i++) {
      const binFreq = (i * sampleRate) / fftSize;
      const magnitude = Math.pow(10, frequencies[i] / 20);
      spreadSum += magnitude * Math.pow(binFreq - spectralCentroid, 2);
    }
    const spectralSpread = Math.sqrt(spreadSum / denominator);

    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeDomainData.length; i++) {
      if ((timeDomainData[i] >= 0 && timeDomainData[i - 1] < 0) ||
          (timeDomainData[i] < 0 && timeDomainData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / timeDomainData.length;

    // Energy by frequency band
    const energyByBand = this.calculateEnergyByBand(frequencies, sampleRate, fftSize);

    return {
      spectralCentroid,
      spectralRolloff,
      spectralFlatness: Math.min(spectralFlatness, 1),
      spectralSpread,
      zeroCrossingRate,
      energyByBand
    };
  }

  private calculateEnergyByBand(frequencies: Float32Array, sampleRate: number, fftSize: number) {
    const bands = {
      subBass: 0,      // 20-60 Hz
      bass: 0,         // 60-250 Hz
      lowMids: 0,      // 250-500 Hz
      mids: 0,         // 500-2000 Hz
      highMids: 0,     // 2000-4000 Hz
      presence: 0,     // 4000-6000 Hz
      brilliance: 0    // 6000-20000 Hz
    };

    const bandRanges = [
      { key: 'subBass', min: 20, max: 60 },
      { key: 'bass', min: 60, max: 250 },
      { key: 'lowMids', min: 250, max: 500 },
      { key: 'mids', min: 500, max: 2000 },
      { key: 'highMids', min: 2000, max: 4000 },
      { key: 'presence', min: 4000, max: 6000 },
      { key: 'brilliance', min: 6000, max: 20000 }
    ];

    for (let i = 0; i < frequencies.length; i++) {
      const binFreq = (i * sampleRate) / fftSize;
      const magnitude = Math.pow(10, frequencies[i] / 20);

      for (const band of bandRanges) {
        if (binFreq >= band.min && binFreq <= band.max) {
          bands[band.key as keyof typeof bands] += magnitude;
        }
      }
    }

    // Normalize to 0-1
    const total = Object.values(bands).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(bands).forEach(key => {
        bands[key as keyof typeof bands] /= total;
      });
    }

    return bands;
  }

  private analyzeDynamics(): DynamicAnalysis {
    const timeDomainData = this.floatTimeDomainData!;
    
    // Find peak and surrounding envelope
    let maxSample = 0;
    let maxIndex = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      if (Math.abs(timeDomainData[i]) > maxSample) {
        maxSample = Math.abs(timeDomainData[i]);
        maxIndex = i;
      }
    }

    // Calculate attack time (from threshold to peak)
    const threshold = maxSample * 0.1;
    let attackTime = 0;
    for (let i = maxIndex; i >= 0; i--) {
      if (Math.abs(timeDomainData[i]) < threshold) {
        attackTime = (maxIndex - i) / this.audioContext!.sampleRate * 1000;
        break;
      }
    }

    // Calculate decay/release time
    const decayThreshold = maxSample * 0.37;
    let releaseTime = 0;
    for (let i = maxIndex; i < timeDomainData.length; i++) {
      if (Math.abs(timeDomainData[i]) < decayThreshold) {
        releaseTime = (i - maxIndex) / this.audioContext!.sampleRate * 1000;
        break;
      }
    }

    // Noise floor detection
    const noiseFloor = this.findNoiseFloor();
    const signalPeak = this.linearToDb(maxSample);
    const signalToNoiseRatio = signalPeak - noiseFloor;

    // Transient density (peaks per second)
    let transients = 0;
    const threshold2 = maxSample * 0.3;
    for (let i = 1; i < timeDomainData.length - 1; i++) {
      if (Math.abs(timeDomainData[i]) > threshold2 &&
          Math.abs(timeDomainData[i]) > Math.abs(timeDomainData[i - 1]) &&
          Math.abs(timeDomainData[i]) > Math.abs(timeDomainData[i + 1])) {
        transients++;
      }
    }
    const transientDensity = transients / (timeDomainData.length / this.audioContext!.sampleRate);

    return {
      attackTime: Math.max(attackTime, 0.1),
      decayTime: Math.max(releaseTime, 1),
      sustainLevel: maxSample * 0.5,
      releaseTime: Math.max(releaseTime, 1),
      noiseFloor,
      signalToNoiseRatio,
      transientDensity,
      compressionRatio: 1 // Would calculate from actual compression
    };
  }

  private linearToDb(linear: number): number {
    return 20 * Math.log10(linear + 1e-10);
  }

  private findNoiseFloor(): number {
    const frequencies = this.floatFrequencyData!;
    const sorted = Array.from(frequencies).sort((a, b) => a - b);
    const noiseFloor = sorted[Math.floor(sorted.length * 0.1)];
    return noiseFloor;
  }

  private calculateTruePeak(timeDomainData: Float32Array): number {
    // Simplified true peak (ITU-R BS.1770-4 would use oversampling)
    let peak = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      peak = Math.max(peak, Math.abs(timeDomainData[i]));
    }
    return this.linearToDb(peak);
  }

  private calculateLUFS(timeDomainData: Float32Array): number {
    // Simplified LUFS calculation (actual LUFS uses 400ms blocks and K-weighting)
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      sum += timeDomainData[i] * timeDomainData[i];
    }
    const meanSquare = sum / timeDomainData.length;
    const rms = Math.sqrt(meanSquare);
    const lufs = -0.691 + 10 * Math.log10(rms + 1e-10);
    
    // Update max loudness
    this.maxLoudness = Math.max(this.maxLoudness, lufs);
    
    return lufs;
  }

  private determineQuality(_metering: MeteringData, frequency: FrequencyAnalysis): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 100;

    // Clipping penalty
    if (_metering.isClipping) score -= 40;
    
    // Dynamic range penalty
    if (_metering.dynamicRange < 6) score -= 20;
    if (_metering.dynamicRange < 3) score -= 20;
    
    // Spectral balance
    const midBandEnergy = frequency.energyByBand.mids + frequency.energyByBand.highMids;
    if (midBandEnergy < 0.3) score -= 15;
    if (midBandEnergy > 0.8) score -= 10;

    // Distortion check (high crest factor indicates clean signal)
    if (_metering.crestFactor < 4) score -= 15;
    if (_metering.crestFactor > 20) score -= 5;

    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  dispose(): void {
    this.analyserNode = null;
    this.audioContext = null;
    console.log('🎵 Real-time Audio Analyzer disposed');
  }
}

export default RealTimeAudioAnalyzer;