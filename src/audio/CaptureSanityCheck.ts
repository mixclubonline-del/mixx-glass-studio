import type { VelvetLoudnessMetrics } from './VelvetLoudnessMeter';

export interface CaptureSanityReport {
  integratedLUFS: number;
  momentaryLUFS: number;
  crestFactor: number;
  noiseFloor: number;
  notes: string[];
}

const FLOAT_EPSILON = 1e-9;

function bytesToRms(bytes: Uint8Array): number {
  if (!bytes.length) return 0;
  let sum = 0;
  for (let i = 0; i < bytes.length; i++) {
    const sample = (bytes[i] - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / bytes.length);
}

export function evaluateCapture(
  metrics: VelvetLoudnessMetrics,
  waveform?: Uint8Array
): CaptureSanityReport {
  const crestFactor = Number.isFinite(metrics.truePeakDb) && Number.isFinite(metrics.integratedLUFS)
    ? metrics.truePeakDb - metrics.integratedLUFS
    : 0;

  const rms = waveform ? bytesToRms(waveform) : 0;
  const noiseFloor = rms > 0 ? 20 * Math.log10(rms + FLOAT_EPSILON) : -Infinity;

  const notes: string[] = [];

  if (!Number.isFinite(metrics.integratedLUFS)) {
    notes.push('⚠️ Capture contains silence.');
  } else if (metrics.integratedLUFS < -32) {
    notes.push('⚠️ Capture is below healthy input range.');
  }

  if (Number.isFinite(metrics.truePeakDb) && metrics.truePeakDb > -3) {
    notes.push('⚠️ Input crest near clipping.');
  }

  if (Number.isFinite(noiseFloor) && noiseFloor > -50) {
    notes.push('⚠️ Elevated room noise detected.');
  }

  if (notes.length === 0) {
    notes.push('✅ Capture sits inside Mixx comfort band.');
  }

  return {
    integratedLUFS: metrics.integratedLUFS,
    momentaryLUFS: metrics.momentaryLUFS,
    crestFactor,
    noiseFloor,
    notes,
  };
}

