/**
 * Pulse Score Normalizer
 * 
 * Layer 5.4 of Flow Pulse Engine.
 * Normalizes everything into Pulse %.
 * 
 * Flow Pulse = combined model of rhythmic + tonal + dynamic intensity.
 */

/**
 * Compute pulse score from energy, pulse map, and harmonic weight.
 * 
 * @param energy - Energy profile array
 * @param pulseMap - Pulse map array (from buildPulseMap)
 * @param harmonic - Harmonic weight value (0-1)
 * @returns Normalized pulse scores and harmonic boost
 */
export function pulseScore(
  energy: number[],
  pulseMap: number[],
  harmonic: number
): {
  normalized: number[]; // Pulse % array (0-100)
  harmonicBoost: number; // Harmonic boost value (0-100)
  raw: number[]; // Raw scores before normalization
} {
  const scores: number[] = [];
  
  // Combine energy and pulse map
  for (let i = 0; i < energy.length; i++) {
    const e = energy[i] || 0;
    const p = pulseMap[i] || 0;
    
    // Weighted combination: energy (70%) + pulse map (120% for transient emphasis)
    const base = (e * 0.7) + (p * 1.2);
    scores.push(base);
  }
  
  // Find maximum for normalization
  const max = Math.max(...scores) || 1;
  
  // Normalize to 0-100 range
  const normalized = scores.map(s => (s / max) * 100);
  
  // Harmonic boost (scaled to 0-100)
  const harmonicBoost = harmonic * 10;
  
  return {
    normalized,
    harmonicBoost,
    raw: scores,
  };
}

/**
 * Compute pulse score with BPM normalization.
 * 
 * @param energy - Energy profile array
 * @param pulseMap - Pulse map array
 * @param harmonic - Harmonic weight value
 * @param bpm - BPM for tempo normalization
 * @param sampleRate - Sample rate
 * @returns Normalized pulse scores with BPM-aware normalization
 */
export function pulseScoreWithBPM(
  energy: number[],
  pulseMap: number[],
  harmonic: number,
  bpm: number | null,
  sampleRate: number
): {
  normalized: number[];
  harmonicBoost: number;
  raw: number[];
  bpmNormalized: number[]; // BPM-aware normalized scores
} {
  const base = pulseScore(energy, pulseMap, harmonic);
  
  // If BPM is available, normalize pulse to beat grid
  let bpmNormalized = base.normalized;
  
  if (bpm !== null && bpm > 0) {
    const beatsPerSecond = bpm / 60;
    const samplesPerBeat = sampleRate / beatsPerSecond;
    const blockSize = 1024; // From energy.ts
    const blocksPerBeat = samplesPerBeat / blockSize;
    
    // Smooth pulse map to align with beats
    const smoothed: number[] = [];
    for (let i = 0; i < base.normalized.length; i++) {
      const beatStart = Math.floor(i / blocksPerBeat) * blocksPerBeat;
      const beatEnd = Math.min(beatStart + blocksPerBeat, base.normalized.length);
      
      // Average within beat
      let sum = 0;
      let count = 0;
      for (let j = beatStart; j < beatEnd; j++) {
        sum += base.normalized[j] || 0;
        count++;
      }
      
      smoothed.push(count > 0 ? sum / count : base.normalized[i]);
    }
    
    bpmNormalized = smoothed;
  }
  
  return {
    ...base,
    bpmNormalized,
  };
}

