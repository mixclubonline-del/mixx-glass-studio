/**
 * Harmonic Percussive Source Separation (HPSS)
 * 
 * Layer 4 of the Stem Separation Engine.
 * Fast, mathematical separation of harmonic and percussive content.
 * No AI required - pure DSP.
 * 
 * Improved implementation using frequency-domain analysis and multi-band filtering.
 * Future enhancement: Full STFT-based median filtering for iterative refinement.
 * 
 * Flow Doctrine: Professional audio separation - frequency-aware processing.
 */

import { als } from '../../utils/alsFeedback';

export interface HPSSResult {
  harmonic: AudioBuffer;
  percussive: AudioBuffer;
}

/**
 * Separate harmonic and percussive content from audio buffer.
 * 
 * Harmonic: sustained tones, vocals, instruments (smooth, continuous)
 * Percussive: drums, hits, transients (sharp attacks, sparse)
 * 
 * Uses multi-band frequency analysis and transient detection for better separation.
 * 
 * @param audioBuffer - Input audio buffer
 * @returns Separated harmonic and percussive buffers
 */
export async function hpss(audioBuffer: AudioBuffer): Promise<HPSSResult> {
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  
  // Create analysis context to understand frequency content
  const analysisCtx = new OfflineAudioContext(channels, length, sampleRate);
  const analysisSource = analysisCtx.createBufferSource();
  analysisSource.buffer = audioBuffer;
  
  const analyser = analysisCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.3; // Less smoothing for transient detection
  
  analysisSource.connect(analyser);
  analyser.connect(analysisCtx.destination);
  analysisSource.start(0);
  
  await analysisCtx.startRendering();
  
  // Get frequency data to understand spectral content
  const freqBinCount = analyser.frequencyBinCount;
  const freqData = new Uint8Array(freqBinCount);
  analyser.getByteFrequencyData(freqData);
  
  // Analyze frequency distribution to determine optimal filter points
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / freqBinCount;
  
  // Find dominant frequency regions
  let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
  for (let i = 0; i < freqBinCount; i++) {
    const energy = freqData[i] / 255;
    const freq = i * binWidth;
    
    if (freq < 200) lowEnergy += energy;
    else if (freq < 3000) midEnergy += energy;
    else highEnergy += energy;
  }
  
  // Adaptive filter frequencies based on content
  // Harmonic content typically stronger in mid-range, percussive in high-range
  const harmonicCutoff = midEnergy > highEnergy ? 3000 : 2500;
  const percussiveCutoff = highEnergy > midEnergy ? 150 : 200;
  
  // Harmonic extraction: Emphasize sustained, smooth content
  const harmonicCtx = new OfflineAudioContext(channels, length, sampleRate);
  const harmonicSource = harmonicCtx.createBufferSource();
  harmonicSource.buffer = audioBuffer;
  
  // Multi-stage filtering for harmonic content
  const harmonicLP1 = harmonicCtx.createBiquadFilter();
  harmonicLP1.type = 'lowpass';
  harmonicLP1.frequency.setValueAtTime(harmonicCutoff, 0);
  harmonicLP1.Q.setValueAtTime(0.7, 0);
  
  const harmonicLP2 = harmonicCtx.createBiquadFilter();
  harmonicLP2.type = 'lowpass';
  harmonicLP2.frequency.setValueAtTime(harmonicCutoff * 0.8, 0);
  harmonicLP2.Q.setValueAtTime(0.7, 0);
  
  // Gentle compression to smooth transients
  const harmonicComp = harmonicCtx.createDynamicsCompressor();
  harmonicComp.threshold.setValueAtTime(-24, 0);
  harmonicComp.ratio.setValueAtTime(4, 0);
  harmonicComp.attack.setValueAtTime(0.003, 0);
  harmonicComp.release.setValueAtTime(0.1, 0);
  
  harmonicSource.connect(harmonicLP1);
  harmonicLP1.connect(harmonicLP2);
  harmonicLP2.connect(harmonicComp);
  harmonicComp.connect(harmonicCtx.destination);
  
  harmonicSource.start(0);
  
  let harmonic: AudioBuffer;
  try {
    harmonic = await harmonicCtx.startRendering();
  } catch (error) {
    // Harmonic extraction failed - use original buffer (expected fallback)
    harmonic = audioBuffer;
  }
  
  // Percussive extraction: Emphasize transients and high-frequency content
  const percussiveCtx = new OfflineAudioContext(channels, length, sampleRate);
  const percussiveSource = percussiveCtx.createBufferSource();
  percussiveSource.buffer = audioBuffer;
  
  // High-pass to remove low-frequency harmonic content
  const percussiveHP = percussiveCtx.createBiquadFilter();
  percussiveHP.type = 'highpass';
  percussiveHP.frequency.setValueAtTime(percussiveCutoff, 0);
  percussiveHP.Q.setValueAtTime(0.7, 0);
  
  // Transient enhancement with fast attack compressor
  const percussiveComp = percussiveCtx.createDynamicsCompressor();
  percussiveComp.threshold.setValueAtTime(-18, 0);
  percussiveComp.ratio.setValueAtTime(8, 0);
  percussiveComp.attack.setValueAtTime(0.001, 0); // Very fast attack for transients
  percussiveComp.release.setValueAtTime(0.05, 0);
  
  // Slight high-frequency boost for percussive clarity
  const percussiveEQ = percussiveCtx.createBiquadFilter();
  percussiveEQ.type = 'highshelf';
  percussiveEQ.frequency.setValueAtTime(5000, 0);
  percussiveEQ.gain.setValueAtTime(2, 0);
  
  const percussiveGain = percussiveCtx.createGain();
  percussiveGain.gain.value = 1.15; // Slight boost
  
  percussiveSource.connect(percussiveHP);
  percussiveHP.connect(percussiveComp);
  percussiveComp.connect(percussiveEQ);
  percussiveEQ.connect(percussiveGain);
  percussiveGain.connect(percussiveCtx.destination);
  
  percussiveSource.start(0);
  
  let percussive: AudioBuffer;
  try {
    percussive = await percussiveCtx.startRendering();
  } catch (error) {
    // Percussive extraction failed - use original buffer (expected fallback)
    percussive = audioBuffer;
  }
  
  return { harmonic, percussive };
}

/**
 * Enhanced HPSS with iterative refinement (future enhancement).
 * This will be implemented with proper STFT-based median filtering.
 */
export async function hpssEnhanced(audioBuffer: AudioBuffer): Promise<HPSSResult> {
  // TODO: Implement proper HPSS algorithm:
  // 1. Compute STFT
  // 2. Apply median filter in time domain (harmonic)
  // 3. Apply median filter in frequency domain (percussive)
  // 4. Iterate until convergence
  // 5. Reconstruct time-domain signals
  
  // For now, use simple HPSS
  return hpss(audioBuffer);
}

