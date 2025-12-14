/**
 * FFT Analysis Utilities
 * 
 * Real frequency domain analysis using Web Audio API AnalyserNode.
 * Provides proper FFT-based frequency analysis for audio processing.
 * 
 * Flow Doctrine: Professional audio analysis - no placeholders.
 */

/**
 * Create an AnalyserNode for frequency analysis.
 * This provides real FFT-based frequency domain data.
 */
export function createFFTAnalyser(
  ctx: AudioContext | OfflineAudioContext,
  fftSize: number = 2048,
  smoothing: number = 0.8
): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothing;
  return analyser;
}

/**
 * Get frequency domain data from an AnalyserNode.
 * Returns normalized frequency data (0-1).
 */
export function getFrequencyData(
  analyser: AnalyserNode,
  useFloat: boolean = false
): Float32Array {
  const bufferLength = analyser.frequencyBinCount;
  
  if (useFloat && typeof analyser.getFloatFrequencyData === 'function') {
    const data = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(data);
    // Convert from dB to linear (0-1 range)
    return data.map(db => Math.pow(10, db / 20));
  } else {
    const data = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(data);
    // Normalize to 0-1
    return new Float32Array(data.map(byte => byte / 255));
  }
}

/**
 * Analyze frequency band energy from frequency data.
 * 
 * @param freqData - Frequency domain data (normalized 0-1)
 * @param sampleRate - Sample rate of the audio
 * @param lowFreq - Lower frequency bound (Hz)
 * @param highFreq - Upper frequency bound (Hz)
 * @returns Energy in the specified band (0-1)
 */
export function getBandEnergy(
  freqData: Float32Array,
  sampleRate: number,
  lowFreq: number,
  highFreq: number
): number {
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / freqData.length;
  
  const lowBin = Math.floor(lowFreq / binWidth);
  const highBin = Math.min(Math.ceil(highFreq / binWidth), freqData.length - 1);
  
  let energy = 0;
  for (let i = lowBin; i <= highBin; i++) {
    energy += freqData[i];
  }
  
  // Normalize by band width
  const bandWidth = highBin - lowBin + 1;
  return bandWidth > 0 ? energy / bandWidth : 0;
}

/**
 * Analyze spectral profile (low/mid/high frequency energy).
 * Uses real FFT analysis via AnalyserNode.
 * 
 * @param analyser - AnalyserNode with audio connected
 * @param sampleRate - Sample rate of the audio
 * @returns Spectral profile with low/mid/high energy ratios
 */
export function getSpectralProfile(
  analyser: AnalyserNode,
  sampleRate: number
): { low: number; mid: number; high: number } {
  const freqData = getFrequencyData(analyser);
  const nyquist = sampleRate / 2;
  
  // Standard frequency bands
  const lowEnergy = getBandEnergy(freqData, sampleRate, 0, 200);
  const midEnergy = getBandEnergy(freqData, sampleRate, 200, 3000);
  const highEnergy = getBandEnergy(freqData, sampleRate, 3000, nyquist);
  
  const total = lowEnergy + midEnergy + highEnergy;
  
  return {
    low: total > 0 ? lowEnergy / total : 0,
    mid: total > 0 ? midEnergy / total : 0,
    high: total > 0 ? highEnergy / total : 0,
  };
}

/**
 * Analyze audio buffer using offline FFT analysis.
 * Creates a temporary analyser to analyze a static buffer.
 * 
 * @param audioBuffer - Audio buffer to analyze
 * @param fftSize - FFT size (default 2048)
 * @returns Frequency domain data (normalized 0-1)
 */
export async function analyzeBufferFFT(
  audioBuffer: AudioBuffer,
  fftSize: number = 2048
): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  
  const analyser = createFFTAnalyser(ctx, fftSize);
  source.connect(analyser);
  analyser.connect(ctx.destination);
  
  source.start(0);
  await ctx.startRendering();
  
  return getFrequencyData(analyser);
}

/**
 * Get frequency band energies from an audio buffer.
 * 
 * @param audioBuffer - Audio buffer to analyze
 * @param bands - Array of frequency band definitions [{low, high}, ...]
 * @returns Array of energy values for each band
 */
export async function getBufferBandEnergies(
  audioBuffer: AudioBuffer,
  bands: Array<{ low: number; high: number }>
): Promise<number[]> {
  const freqData = await analyzeBufferFFT(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  
  return bands.map(band => getBandEnergy(freqData, sampleRate, band.low, band.high));
}








