import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrimeBrain } from '../contexts/PrimeBrainContext';

interface HarmonicData {
  fundamentalFreq: number;
  harmonics: Array<{
    frequency: number;
    amplitude: number;
    phase: number;
    harmonic: number;
  }>;
  tonality: 'major' | 'minor' | 'dominant' | 'diminished' | 'augmented' | 'unknown';
  key: string;
  consonance: number; // 0-1 scale
  dissonance: number; // 0-1 scale
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  timestamp: number;
}

interface MusicalKey {
  note: string;
  mode: 'major' | 'minor';
  confidence: number;
}

interface HarmonicLatticeBridgeProps {
  audioData?: Float32Array;
  onHarmonicAnalysis?: (data: HarmonicData) => void;
  onKeyDetection?: (key: MusicalKey) => void;
  sampleRate?: number;
}

class HarmonicAnalysisEngine {
  private sampleRate: number;
  private windowSize: number;
  private window: Float32Array;
  
  // Musical constants
  private readonly A4_FREQ = 440;
  private readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  private readonly MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
  private readonly MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

  constructor(sampleRate: number = 48000) {
    this.sampleRate = sampleRate;
    this.windowSize = 4096;
    this.window = this.createHannWindow(this.windowSize);
  }

  private createHannWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }

  private fft(signal: Float32Array): Complex[] {
    const N = signal.length;
    const result: Complex[] = new Array(N);
    
    // Simple DFT implementation (for production, use optimized FFT)
    for (let k = 0; k < N; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      result[k] = { real, imag };
    }
    return result;
  }

  private getMagnitude(complex: Complex): number {
    return Math.sqrt(complex.real * complex.real + complex.imag * complex.imag);
  }

  private frequencyToNote(frequency: number): { note: string; cents: number } {
    const A4_MIDI = 69;
    const midiNote = 12 * Math.log2(frequency / this.A4_FREQ) + A4_MIDI;
    const noteIndex = Math.round(midiNote) % 12;
    const cents = (midiNote - Math.round(midiNote)) * 100;
    return {
      note: this.NOTE_NAMES[noteIndex < 0 ? noteIndex + 12 : noteIndex],
      cents
    };
  }

  private detectFundamental(spectrum: Float32Array): number {
    // Find the peak in the spectrum (simplified fundamental detection)
    let maxAmplitude = 0;
    let fundamentalBin = 0;
    
    // Look for fundamental in musical range (80-2000 Hz)
    const minBin = Math.floor(80 * this.windowSize / this.sampleRate);
    const maxBin = Math.floor(2000 * this.windowSize / this.sampleRate);
    
    for (let i = minBin; i < maxBin && i < spectrum.length; i++) {
      if (spectrum[i] > maxAmplitude) {
        maxAmplitude = spectrum[i];
        fundamentalBin = i;
      }
    }
    
    return fundamentalBin * this.sampleRate / this.windowSize;
  }

  private analyzeHarmonics(spectrum: Float32Array, fundamental: number): HarmonicData['harmonics'] {
    const harmonics: HarmonicData['harmonics'] = [];
    
    for (let harmonic = 1; harmonic <= 16; harmonic++) {
      const expectedFreq = fundamental * harmonic;
      const bin = Math.round(expectedFreq * this.windowSize / this.sampleRate);
      
      if (bin < spectrum.length) {
        // Look for peak around expected frequency
        let maxAmplitude = 0;
        let actualBin = bin;
        for (let i = Math.max(0, bin - 2); i <= Math.min(spectrum.length - 1, bin + 2); i++) {
          if (spectrum[i] > maxAmplitude) {
            maxAmplitude = spectrum[i];
            actualBin = i;
          }
        }
        
        const actualFreq = actualBin * this.sampleRate / this.windowSize;
        harmonics.push({
          frequency: actualFreq,
          amplitude: maxAmplitude,
          phase: 0, // Would need complex FFT for phase
          harmonic
        });
      }
    }
    
    return harmonics;
  }

  private calculateSpectralFeatures(spectrum: Float32Array): {
    centroid: number;
    rolloff: number;
    flatness: number;
  } {
    const frequencies = spectrum.map((_, i) => i * this.sampleRate / this.windowSize);
    let numerator = 0, denominator = 0;
    
    // Spectral centroid
    for (let i = 0; i < spectrum.length; i++) {
      numerator += frequencies[i] * spectrum[i];
      denominator += spectrum[i];
    }
    const centroid = denominator > 0 ? numerator / denominator : 0;
    
    // Spectral rolloff (85% of energy)
    const totalEnergy = spectrum.reduce((sum, val) => sum + val * val, 0);
    const rolloffThreshold = 0.85 * totalEnergy;
    let cumulativeEnergy = 0;
    let rolloff = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      cumulativeEnergy += spectrum[i] * spectrum[i];
      if (cumulativeEnergy >= rolloffThreshold) {
        rolloff = frequencies[i];
        break;
      }
    }
    
    // Spectral flatness (geometric mean / arithmetic mean)
    const logSum = spectrum.reduce((sum, val) => sum + Math.log(val + 1e-10), 0);
    const arithmeticMean = spectrum.reduce((sum, val) => sum + val, 0) / spectrum.length;
    const geometricMean = Math.exp(logSum / spectrum.length);
    const flatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
    
    return { centroid, rolloff, flatness };
  }

  private detectKey(harmonics: HarmonicData['harmonics']): MusicalKey {
    const chromaVector = new Array(12).fill(0);
    
    // Build chroma vector from harmonics
    harmonics.forEach(h => {
      const { note } = this.frequencyToNote(h.frequency);
      const noteIndex = this.NOTE_NAMES.indexOf(note);
      if (noteIndex >= 0) {
        chromaVector[noteIndex] += h.amplitude;
      }
    });
    
    // Test against major and minor keys
    let bestKey: MusicalKey = { note: 'C', mode: 'major' as const, confidence: 0 };
    
    for (let tonic = 0; tonic < 12; tonic++) {
      // Test major
      let majorScore = 0;
      this.MAJOR_INTERVALS.forEach(interval => {
        majorScore += chromaVector[(tonic + interval) % 12];
      });
      
      // Test minor
      let minorScore = 0;
      this.MINOR_INTERVALS.forEach(interval => {
        minorScore += chromaVector[(tonic + interval) % 12];
      });
      
      if (majorScore > bestKey.confidence) {
        bestKey = {
          note: this.NOTE_NAMES[tonic],
          mode: 'major',
          confidence: majorScore
        };
      }
      
      if (minorScore > bestKey.confidence) {
        bestKey = {
          note: this.NOTE_NAMES[tonic],
          mode: 'minor' as const,
          confidence: minorScore
        };
      }
    }
    
    return bestKey;
  }

  analyze(audioData: Float32Array): HarmonicData {
    // Apply window function
    const windowedData = new Float32Array(this.windowSize);
    const startIndex = Math.max(0, audioData.length - this.windowSize);
    
    for (let i = 0; i < this.windowSize; i++) {
      const audioIndex = startIndex + i;
      windowedData[i] = (audioIndex < audioData.length ? audioData[audioIndex] : 0) * this.window[i];
    }
    
    // Perform FFT
    const fftResult = this.fft(windowedData);
    const spectrum = new Float32Array(fftResult.length / 2);
    for (let i = 0; i < spectrum.length; i++) {
      spectrum[i] = this.getMagnitude(fftResult[i]);
    }
    
    // Detect fundamental frequency
    const fundamental = this.detectFundamental(spectrum);
    
    // Analyze harmonics
    const harmonics = this.analyzeHarmonics(spectrum, fundamental);
    
    // Calculate spectral features
    const { centroid, rolloff, flatness } = this.calculateSpectralFeatures(spectrum);
    
    // Calculate consonance/dissonance based on harmonic relationships
    const consonance = harmonics.length > 1 ? 
      harmonics.slice(1, 6).reduce((sum, h) => sum + h.amplitude, 0) / harmonics.length : 0;
    const dissonance = 1 - consonance;
    
    // Determine tonality (simplified)
    const tonality = consonance > 0.7 ? 'major' : 
                    consonance > 0.4 ? 'minor' : 
                    dissonance > 0.6 ? 'diminished' : 'unknown';
    
    const keyData = this.detectKey(harmonics);
    
    return {
      fundamentalFreq: fundamental,
      harmonics,
      tonality,
      key: `${keyData.note} ${keyData.mode}`,
      consonance,
      dissonance,
      spectralCentroid: centroid,
      spectralRolloff: rolloff,
      spectralFlatness: flatness,
      timestamp: Date.now()
    };
  }
}

interface Complex {
  real: number;
  imag: number;
}

const HarmonicLatticeBridge: React.FC<HarmonicLatticeBridgeProps> = ({
  audioData,
  onHarmonicAnalysis,
  onKeyDetection,
  sampleRate = 48000
}) => {
  const engineRef = useRef<HarmonicAnalysisEngine | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  // 🧠 PRIME BRAIN INTEGRATION
  const primeBrain = usePrimeBrain();

  const analyzeHarmonics = useCallback(() => {
    if (engineRef.current && audioData && audioData.length > 0) {
      try {
        const harmonicData = engineRef.current.analyze(audioData);
        onHarmonicAnalysis?.(harmonicData);
        
        // 🧠 SEND HARMONIC DATA TO PRIME BRAIN
        primeBrain.updateHarmonicData(harmonicData);
        
        // Extract key information
        const keyMatch = harmonicData.key.match(/^([A-G]#?) (major|minor)$/);
        if (keyMatch) {
          const keyData = {
            note: keyMatch[1],
            mode: keyMatch[2] as 'major' | 'minor',
            confidence: harmonicData.consonance
          };
          onKeyDetection?.(keyData);
          
          // 🧠 PRIME BRAIN MUSICAL INTELLIGENCE
          if (harmonicData.consonance > 0.8) {
            primeBrain.addRecommendation({
              id: `harmonic-excellence-${Date.now()}`,
              type: 'audio',
              priority: 5,
              message: `🎼 Excellent harmonic content detected in ${harmonicData.key} - Prime Brain suggests emphasizing this section`
            });
          }
          
          if (harmonicData.dissonance > 0.7) {
            primeBrain.addRecommendation({
              id: `harmonic-tension-${Date.now()}`,
              type: 'mixing',
              priority: 7,
              message: `⚠️ High dissonance detected - Consider EQ adjustment around ${Math.round(harmonicData.fundamentalFreq)}Hz`
            });
          }
        }
        
        // 🧠 UPDATE PRIME BRAIN SYSTEM STATUS
        primeBrain.updateSystemStatus('harmonicAnalyzer', {
          active: true,
          processing: true
        });
        
      } catch (error) {
        console.error('❌ Harmonic analysis error:', error);
        primeBrain.updateSystemStatus('harmonicAnalyzer', {
          active: false,
          processing: false
        });
      }
    }
  }, [audioData, onHarmonicAnalysis, onKeyDetection, primeBrain]);

  useEffect(() => {
    // Initialize harmonic analysis engine
    try {
      console.log('🎼 Initializing Harmonic Lattice Analysis Engine...');
      engineRef.current = new HarmonicAnalysisEngine(sampleRate);
      setIsActive(true);
      
      // 🧠 NOTIFY PRIME BRAIN of harmonic analyzer initialization
      primeBrain.updateSystemStatus('harmonicAnalyzer', {
        active: true,
        processing: false
      });
      
      primeBrain.addRecommendation({
        id: 'harmonic-analyzer-ready',
        type: 'audio',
        priority: 8,
        message: '🎼 Harmonic Analysis Engine ready - Prime Brain now has musical intelligence'
      });
      
      console.log('✅ Harmonic Lattice Engine ready - Musical intelligence active');
    } catch (error) {
      console.error('❌ Failed to initialize Harmonic Lattice Engine:', error);
      setIsActive(false);
      
      // 🧠 NOTIFY PRIME BRAIN of failure
      primeBrain.updateSystemStatus('harmonicAnalyzer', { active: false, processing: false });
    }

    return () => {
      setIsActive(false);
      primeBrain.updateSystemStatus('harmonicAnalyzer', { active: false, processing: false });
      console.log('🎼 Harmonic Lattice Engine disposed');
    };
  }, [sampleRate, primeBrain]);

  useEffect(() => {
    if (isActive && audioData) {
      analyzeHarmonics();
    }
  }, [isActive, audioData, analyzeHarmonics]);

  return null; // This is a bridge component, no UI
};

export default HarmonicLatticeBridge;
