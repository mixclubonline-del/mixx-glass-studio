/**
 * Musical Context Engine
 * Analyzes full mix to understand harmonic context in real-time
 */

import { MusicalContext } from '@/types/mixxtune';

export class MusicalContextEngine {
  private audioContext: AudioContext;
  private analyserNode: AnalyserNode;
  private currentContext: MusicalContext | null = null;
  private updateInterval: number = 500; // Update every 500ms
  private lastUpdateTime: number = 0;
  private melodyHistory: number[] = [];
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = 8192; // High resolution for pitch detection
    this.analyserNode.smoothingTimeConstant = 0.8;
  }
  
  /**
   * Connect mix bus for analysis
   */
  connectSource(source: AudioNode): void {
    source.connect(this.analyserNode);
  }
  
  /**
   * Analyze current audio and extract musical context
   */
  async analyzeContext(): Promise<MusicalContext | null> {
    const now = Date.now();
    
    // Rate limit updates
    if (now - this.lastUpdateTime < this.updateInterval) {
      return this.currentContext;
    }
    
    this.lastUpdateTime = now;
    
    // Get frequency data
    const frequencyData = new Float32Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getFloatFrequencyData(frequencyData);
    
    // Extract chromagram (12-bin pitch class profile)
    const chroma = this.extractChromagram(frequencyData);
    
    // Detect key and chord
    const key = this.detectKey(chroma);
    const chord = this.detectChord(chroma);
    const scale = this.detectScale(chroma);
    
    // Calculate harmonic tension
    const tension = this.calculateTension(chroma);
    
    // Update melody contour
    const dominantPitch = this.extractDominantPitch(frequencyData);
    if (dominantPitch > 0) {
      this.melodyHistory.push(dominantPitch);
      if (this.melodyHistory.length > 8) {
        this.melodyHistory.shift();
      }
    }
    
    this.currentContext = {
      key,
      scale,
      chord,
      tension,
      melodyContour: [...this.melodyHistory],
      timeSignature: { numerator: 4, denominator: 4 }, // TODO: detect from audio
      bpm: 120 // TODO: detect from audio
    };
    
    return this.currentContext;
  }
  
  getCurrentContext(): MusicalContext | null {
    return this.currentContext;
  }
  
  /**
   * Extract chromagram (pitch class profile)
   */
  private extractChromagram(frequencyData: Float32Array): Float32Array {
    const chroma = new Float32Array(12).fill(0);
    const binFreq = this.audioContext.sampleRate / this.analyserNode.fftSize;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * binFreq;
      if (freq < 80 || freq > 1000) continue; // Focus on musical range
      
      const magnitude = Math.pow(10, frequencyData[i] / 20); // Convert dB to linear
      const midiNote = 69 + 12 * Math.log2(freq / 440);
      const pitchClass = Math.round(midiNote) % 12;
      
      if (pitchClass >= 0 && pitchClass < 12) {
        chroma[pitchClass] += magnitude;
      }
    }
    
    // Normalize
    const max = Math.max(...Array.from(chroma));
    if (max > 0) {
      for (let i = 0; i < 12; i++) {
        chroma[i] /= max;
      }
    }
    
    return chroma;
  }
  
  /**
   * Detect key from chromagram
   */
  private detectKey(chroma: Float32Array): string {
    const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    
    let bestKey = 'C';
    let bestCorr = -1;
    let isMinor = false;
    
    for (let shift = 0; shift < 12; shift++) {
      // Major correlation
      let majorCorr = 0;
      for (let i = 0; i < 12; i++) {
        majorCorr += chroma[(i + shift) % 12] * majorProfile[i];
      }
      
      // Minor correlation
      let minorCorr = 0;
      for (let i = 0; i < 12; i++) {
        minorCorr += chroma[(i + shift) % 12] * minorProfile[i];
      }
      
      if (majorCorr > bestCorr) {
        bestCorr = majorCorr;
        bestKey = keyNames[shift];
        isMinor = false;
      }
      
      if (minorCorr > bestCorr) {
        bestCorr = minorCorr;
        bestKey = keyNames[shift];
        isMinor = true;
      }
    }
    
    return isMinor ? `${bestKey}m` : bestKey;
  }
  
  /**
   * Detect current chord
   */
  private detectChord(chroma: Float32Array): string {
    // Find the three strongest pitch classes
    const indices = Array.from(chroma).map((val, i) => ({ val, i }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3)
      .map(x => x.i);
    
    const root = indices[0];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Simple chord detection (major vs minor)
    const intervals = indices.map(i => (i - root + 12) % 12).sort((a, b) => a - b);
    
    if (intervals.includes(4) && intervals.includes(7)) {
      return noteNames[root]; // Major
    } else if (intervals.includes(3) && intervals.includes(7)) {
      return noteNames[root] + 'm'; // Minor
    }
    
    return noteNames[root];
  }
  
  /**
   * Detect scale type
   */
  private detectScale(chroma: Float32Array): string {
    // Count active pitch classes
    const activeNotes = Array.from(chroma).filter(v => v > 0.3).length;
    
    if (activeNotes <= 5) {
      return 'pentatonic';
    } else if (activeNotes <= 6) {
      return 'blues';
    }
    
    // Check for harmonic minor (raised 7th)
    const seventh = chroma[11];
    if (seventh > 0.5) {
      return 'harmonic-minor';
    }
    
    return 'minor'; // Default
  }
  
  /**
   * Calculate harmonic tension (0-1)
   */
  private calculateTension(chroma: Float32Array): number {
    // Tension from dissonant intervals (minor 2nd, tritone, major 7th)
    const dissonance = chroma[1] + chroma[6] + chroma[11];
    return Math.min(dissonance / 2, 1);
  }
  
  /**
   * Extract dominant pitch from frequency data
   */
  private extractDominantPitch(frequencyData: Float32Array): number {
    let maxMag = -Infinity;
    let maxIdx = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxMag) {
        maxMag = frequencyData[i];
        maxIdx = i;
      }
    }
    
    const binFreq = this.audioContext.sampleRate / this.analyserNode.fftSize;
    const freq = maxIdx * binFreq;
    
    if (freq > 80 && freq < 1000) {
      return 69 + 12 * Math.log2(freq / 440); // MIDI note
    }
    
    return 0;
  }
  
  dispose(): void {
    this.analyserNode.disconnect();
  }
}
