/**
 * Audio Analyzer - Client-side BPM, key, and time signature detection
 */

export class AudioAnalyzer {
  /**
   * Detect BPM using energy-based onset detection and IOI histogram
   */
  static detectBPM(buffer: AudioBuffer): number {
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const hopSize = 512;
    const frameSize = 2048;
    
    // Calculate energy across frames
    const energies: number[] = [];
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < frameSize; j++) {
        energy += channelData[i + j] * channelData[i + j];
      }
      energies.push(energy);
    }
    
    // Detect onsets (peaks in energy)
    const threshold = energies.reduce((a, b) => a + b, 0) / energies.length * 1.5;
    const onsets: number[] = [];
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        onsets.push(i * hopSize / sampleRate);
      }
    }
    
    if (onsets.length < 2) return 120; // Default fallback
    
    // Calculate inter-onset intervals (IOI)
    const iois: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      iois.push(onsets[i] - onsets[i - 1]);
    }
    
    // Build histogram of IOIs
    const bpmCandidates = new Map<number, number>();
    iois.forEach(ioi => {
      const bpm = Math.round(60 / ioi);
      // Consider multiples and fractions (half-time, double-time)
      [bpm, bpm * 2, bpm / 2].forEach(candidate => {
        if (candidate >= 60 && candidate <= 180) {
          bpmCandidates.set(candidate, (bpmCandidates.get(candidate) || 0) + 1);
        }
      });
    });
    
    // Find most common BPM
    let maxVotes = 0;
    let detectedBPM = 120;
    bpmCandidates.forEach((votes, bpm) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        detectedBPM = bpm;
      }
    });
    
    return Math.round(detectedBPM);
  }
  
  /**
   * Detect musical key using chroma features and Krumhansl key profiles
   */
  static detectKey(buffer: AudioBuffer): { key: string; scale: 'major' | 'minor'; confidence: number } {
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    
    // Downmix and compute chroma (simplified pitch class distribution)
    const chromaBins = 12; // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    const chroma = new Array(chromaBins).fill(0);
    
    // FFT-like pitch detection (simplified)
    const fftSize = 8192;
    const halfSize = fftSize / 2;
    
    for (let offset = 0; offset < channelData.length - fftSize; offset += fftSize / 2) {
      for (let i = 0; i < fftSize; i++) {
        const sample = channelData[offset + i];
        const freq = (i / fftSize) * sampleRate;
        
        // Convert frequency to pitch class (0-11)
        if (freq > 20 && freq < 4000) {
          const noteNumber = 12 * Math.log2(freq / 440) + 69; // A4 = 440Hz
          const pitchClass = Math.round(noteNumber) % 12;
          chroma[pitchClass] += Math.abs(sample);
        }
      }
    }
    
    // Normalize chroma
    const maxChroma = Math.max(...chroma);
    if (maxChroma > 0) {
      chroma.forEach((_, i) => chroma[i] /= maxChroma);
    }
    
    // Krumhansl key profiles (simplified)
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    let bestKey = 'C';
    let bestScale: 'major' | 'minor' = 'major';
    let bestCorrelation = -1;
    
    // Test all 24 keys (12 major + 12 minor)
    for (let root = 0; root < 12; root++) {
      // Major
      let correlation = 0;
      for (let i = 0; i < 12; i++) {
        correlation += chroma[(i + root) % 12] * majorProfile[i];
      }
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestKey = noteNames[root];
        bestScale = 'major';
      }
      
      // Minor
      correlation = 0;
      for (let i = 0; i < 12; i++) {
        correlation += chroma[(i + root) % 12] * minorProfile[i];
      }
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestKey = noteNames[root];
        bestScale = 'minor';
      }
    }
    
    const confidence = Math.min(1, bestCorrelation / 50);
    
    return { key: bestKey, scale: bestScale, confidence };
  }
  
  /**
   * Infer time signature from onsets (simplified)
   */
  static inferTimeSignature(bpm: number, buffer: AudioBuffer): { numerator: number; denominator: number } {
    // Simplified: detect strong beat periodicity
    // For now, default to 4/4 unless clear 3/4 pattern
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const beatDuration = 60 / bpm;
    const barDurations = [3 * beatDuration, 4 * beatDuration];
    
    // Check for 3 vs 4 beat patterns (very simplified)
    let score3 = 0;
    let score4 = 0;
    
    const hopSize = Math.floor(sampleRate * beatDuration);
    for (let i = 0; i < channelData.length - hopSize * 4; i += hopSize * 3) {
      let energy3 = 0;
      for (let j = 0; j < hopSize * 3; j++) {
        energy3 += Math.abs(channelData[i + j]);
      }
      score3 += energy3;
    }
    
    for (let i = 0; i < channelData.length - hopSize * 4; i += hopSize * 4) {
      let energy4 = 0;
      for (let j = 0; j < hopSize * 4; j++) {
        energy4 += Math.abs(channelData[i + j]);
      }
      score4 += energy4;
    }
    
    // Prefer 4/4 unless 3/4 has significantly higher score
    if (score3 > score4 * 1.3) {
      return { numerator: 3, denominator: 4 };
    }
    
    return { numerator: 4, denominator: 4 };
  }
}
