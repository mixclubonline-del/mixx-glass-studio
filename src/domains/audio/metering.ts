/**
 * Audio Metering Utilities
 * Phase 31: Extracted from App.tsx
 * 
 * Functions and types for audio level metering, spectral analysis, and transient detection.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TrackMeterBuffers {
  timeDomain: Float32Array;
  freqDomain: Uint8Array;
  lastPeak: number;
  smoothedLevel: number;
}

export interface MasterMeterBuffers extends TrackMeterBuffers {
  waveform: Uint8Array;
}

export interface MeterReading {
  rms: number;
  level: number;
  peak: number;
  crestFactor: number;
  spectralTilt: number;
  transient: boolean;
  lowBandEnergy: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

export const TRACK_ANALYSER_FFT = 2048;
export const TRACK_ANALYSER_SMOOTHING = 0.64;
export const MASTER_ANALYSER_SMOOTHING = 0.68;
export const MIN_DECIBELS = -100;
export const MAX_DECIBELS = -6;

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * Create meter buffers for a track analyser
 */
export const createTrackMeterBuffers = (analyser: AnalyserNode): TrackMeterBuffers => ({
  timeDomain: new Float32Array(analyser.fftSize),
  freqDomain: new Uint8Array(analyser.frequencyBinCount),
  lastPeak: 0,
  smoothedLevel: 0,
});

/**
 * Create meter buffers for master analyser (includes waveform)
 */
export const createMasterMeterBuffers = (analyser: AnalyserNode): MasterMeterBuffers => ({
  ...createTrackMeterBuffers(analyser),
  waveform: new Uint8Array(analyser.fftSize),
});

/**
 * Ensure track meter buffers exist and are correctly sized
 */
export const ensureTrackMeterBuffers = (
  store: Record<string, TrackMeterBuffers>,
  trackId: string,
  analyser: AnalyserNode
): TrackMeterBuffers => {
  const existing = store[trackId];
  if (
    !existing ||
    existing.timeDomain.length !== analyser.fftSize ||
    existing.freqDomain.length !== analyser.frequencyBinCount
  ) {
    store[trackId] = createTrackMeterBuffers(analyser);
    return store[trackId];
  }
  if (existing.freqDomain.length !== analyser.frequencyBinCount) {
    existing.freqDomain = new Uint8Array(analyser.frequencyBinCount);
  }
  return existing;
};

/**
 * Ensure master meter buffers exist and are correctly sized
 */
export const ensureMasterMeterBuffers = (
  current: MasterMeterBuffers | null,
  analyser: AnalyserNode
): MasterMeterBuffers => {
  if (
    !current ||
    current.timeDomain.length !== analyser.fftSize ||
    current.freqDomain.length !== analyser.frequencyBinCount ||
    current.waveform.length !== analyser.fftSize
  ) {
    return createMasterMeterBuffers(analyser);
  }
  if (current.freqDomain.length !== analyser.frequencyBinCount) {
    current.freqDomain = new Uint8Array(analyser.frequencyBinCount);
  }
  if (current.waveform.length !== analyser.fftSize) {
    current.waveform = new Uint8Array(analyser.fftSize);
  }
  return current;
};

/**
 * Compute spectral tilt (balance between low and high frequencies)
 * Returns -1 (low-heavy) to +1 (high-heavy)
 */
export const computeSpectralTilt = (freqDomain: Uint8Array): number => {
  const bins = freqDomain.length;
  if (bins === 0) {
    return 0;
  }
  const split = Math.max(1, Math.floor(bins * 0.32));
  let lowSum = 0;
  let highSum = 0;
  for (let i = 0; i < split; i++) {
    lowSum += freqDomain[i];
  }
  for (let i = bins - split; i < bins; i++) {
    highSum += freqDomain[i];
  }
  const lowAvg = (lowSum / split) / 255;
  const highAvg = (highSum / split) / 255;
  const delta = highAvg - lowAvg;
  return Math.max(-1, Math.min(1, delta));
};

/**
 * Measure audio levels from an analyser node
 */
export const measureAnalyser = (
  analyser: AnalyserNode,
  buffers: TrackMeterBuffers
): MeterReading => {
  // Get time domain data
  if (typeof analyser.getFloatTimeDomainData === 'function') {
    analyser.getFloatTimeDomainData(buffers.timeDomain as Float32Array<ArrayBuffer>);
  } else {
    const byteSamples = new Uint8Array(buffers.timeDomain.length);
    analyser.getByteTimeDomainData(byteSamples);
    for (let i = 0; i < buffers.timeDomain.length; i++) {
      buffers.timeDomain[i] = (byteSamples[i] - 128) / 128;
    }
  }
  
  // Get frequency domain data
  analyser.getByteFrequencyData(buffers.freqDomain as Uint8Array<ArrayBuffer>);

  // Calculate peak and RMS
  let peak = 0;
  let sumSquares = 0;
  const { timeDomain } = buffers;
  for (let i = 0; i < timeDomain.length; i++) {
    const sample = timeDomain[i];
    const absolute = Math.abs(sample);
    if (absolute > peak) {
      peak = absolute;
    }
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / timeDomain.length);
  const normalizedRms = clamp01(rms * 2.35);
  const smoothedLevel = buffers.smoothedLevel * 0.68 + normalizedRms * 0.32;
  buffers.smoothedLevel = smoothedLevel;

  const normalizedPeak = clamp01(peak);
  const crestFactor = normalizedPeak / Math.max(rms, 1e-5);
  const spectralTilt = computeSpectralTilt(buffers.freqDomain);
  
  // Transient detection
  const transient =
    normalizedPeak > buffers.lastPeak * 1.12 &&
    normalizedPeak - smoothedLevel > 0.12;

  // Low band energy
  const lowBandBins = Math.max(4, Math.floor(buffers.freqDomain.length * 0.12));
  let lowBandSum = 0;
  for (let i = 0; i < lowBandBins; i++) {
    lowBandSum += buffers.freqDomain[i];
  }
  const lowBandEnergy = clamp01((lowBandSum / lowBandBins) / 255);

  // Update peak tracking
  buffers.lastPeak = normalizedPeak * 0.6 + buffers.lastPeak * 0.4;

  return {
    rms: normalizedRms,
    level: smoothedLevel,
    peak: normalizedPeak,
    crestFactor,
    spectralTilt,
    transient,
    lowBandEnergy,
  };
};
