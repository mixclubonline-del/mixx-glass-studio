import type { MasteringProfile } from '../types/sonic-architecture';
import type { VelvetLoudnessMetrics } from './VelvetLoudnessMeter';

export interface VelvetValidationResult {
  ok: boolean;
  issues: string[];
  metrics: VelvetLoudnessMetrics;
}

type FilterState = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

const DEFAULT_METRICS: VelvetLoudnessMetrics = {
  momentaryLUFS: -Infinity,
  shortTermLUFS: -Infinity,
  integratedLUFS: -Infinity,
  truePeakDb: -Infinity,
};

const MOMENTARY_WINDOW = 0.4;
const SHORT_WINDOW = 3.0;

function computeBiquad(
  sampleRate: number,
  type: 'highpass' | 'highshelf',
  freq: number,
  q: number,
  gainDb = 0
) {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  const A = Math.pow(10, gainDb / 40);

  let b0: number;
  let b1: number;
  let b2: number;
  let a0: number;
  let a1: number;
  let a2: number;

  switch (type) {
    case 'highpass':
      b0 = (1 + cosw0) / 2;
      b1 = -(1 + cosw0);
      b2 = (1 + cosw0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
      break;
    case 'highshelf':
      const common = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) + (A - 1) * cosw0 + common);
      b1 = -2 * A * ((A - 1) + (A + 1) * cosw0);
      b2 = A * ((A + 1) + (A - 1) * cosw0 - common);
      a0 = (A + 1) - (A - 1) * cosw0 + common;
      a1 = 2 * ((A - 1) + (A + 1) * cosw0);
      a2 = (A + 1) - (A - 1) * cosw0 - common;
      break;
    default:
      b0 = 1;
      b1 = 0;
      b2 = 0;
      a0 = 1;
      a1 = 0;
      a2 = 0;
  }

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
  };
}

function processSample(sample: number, coeffs: ReturnType<typeof computeBiquad>, state: FilterState) {
  const y =
    coeffs.b0 * sample +
    coeffs.b1 * state.x1 +
    coeffs.b2 * state.x2 -
    coeffs.a1 * state.y1 -
    coeffs.a2 * state.y2;
  state.x2 = state.x1;
  state.x1 = sample;
  state.y2 = state.y1;
  state.y1 = y;
  return y;
}

function toLUFS(meanSquare: number) {
  if (meanSquare <= 0) {
    return -Infinity;
  }
  return -0.691 + 10 * Math.log10(meanSquare);
}

function fromLUFS(lufs: number) {
  return Math.pow(10, (lufs + 0.691) / 10);
}

function analyzeBuffer(buffer: AudioBuffer): VelvetLoudnessMetrics {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;
  if (length === 0) {
    return { ...DEFAULT_METRICS };
  }

  const hpCoeffs = computeBiquad(sampleRate, 'highpass', 60, Math.SQRT1_2);
  const hsCoeffs = computeBiquad(sampleRate, 'highshelf', 6500, Math.SQRT1_2, 4);
  const hpState: FilterState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  const hsState: FilterState = { x1: 0, x2: 0, y1: 0, y2: 0 };

  const momentaryWindow: Array<{ energy: number; duration: number }> = [];
  const shortWindow: Array<{ energy: number; duration: number }> = [];
  const integratedBlocks: Array<{ energy: number; duration: number }> = [];

  let momentaryDuration = 0;
  let shortDuration = 0;
  let integratedDuration = 0;
  let truePeak = 0;
  let prevSample = 0;

  const blockSize = 128;

  const pushWindow = (
    window: Array<{ energy: number; duration: number }>,
    maxDuration: number,
    block: { energy: number; duration: number }
  ) => {
    window.push(block);
    let duration = window.reduce((acc, value) => acc + value.duration, 0);
    while (duration > maxDuration && window.length > 0) {
      window.shift();
      duration = window.reduce((acc, value) => acc + value.duration, 0);
    }
    return duration;
  };

  const segmentTruePeak = (sample: number) => {
    let max = Math.max(Math.abs(sample), Math.abs(prevSample));
    const diff = sample - prevSample;
    const fractions = [0.25, 0.5, 0.75];
    for (let i = 0; i < fractions.length; i++) {
      const interp = prevSample + diff * fractions[i];
      const absInterp = Math.abs(interp);
      if (absInterp > max) {
        max = absInterp;
      }
    }
    prevSample = sample;
    return max;
  };

  for (let offset = 0; offset < length; offset += blockSize) {
    const frames = Math.min(blockSize, length - offset);
    let blockEnergy = 0;
    for (let i = 0; i < frames; i++) {
      let sample = 0;
      for (let ch = 0; ch < channels; ch++) {
        sample += buffer.getChannelData(ch)[offset + i];
      }
      sample /= channels || 1;

      const weighted = processSample(
        processSample(sample, hpCoeffs, hpState),
        hsCoeffs,
        hsState
      );
      blockEnergy += weighted * weighted;

      const segmentPeak = segmentTruePeak(sample);
      if (segmentPeak > truePeak) {
        truePeak = segmentPeak;
      }
    }

    const mean = blockEnergy / frames;
    const durationSeconds = frames / sampleRate;
    momentaryDuration = pushWindow(momentaryWindow, MOMENTARY_WINDOW, {
      energy: mean,
      duration: durationSeconds,
    });
    shortDuration = pushWindow(shortWindow, SHORT_WINDOW, {
      energy: mean,
      duration: durationSeconds,
    });
    integratedBlocks.push({ energy: mean, duration: durationSeconds });
    integratedDuration += durationSeconds;
  }

  const averageLUFS = (window: Array<{ energy: number; duration: number }>, duration: number) => {
    if (duration === 0) return -Infinity;
    let energySum = 0;
    window.forEach((block) => {
      energySum += block.energy * block.duration;
    });
    return toLUFS(energySum / duration);
  };

  const momentaryLUFS = averageLUFS(momentaryWindow, momentaryDuration);
  const shortTermLUFS = averageLUFS(shortWindow, shortDuration);

  if (integratedDuration === 0) {
    return {
      momentaryLUFS,
      shortTermLUFS,
      integratedLUFS: -Infinity,
      truePeakDb: truePeak > 0 ? 20 * Math.log10(truePeak) : -Infinity,
    };
  }

  let totalEnergy = 0;
  integratedBlocks.forEach((block) => {
    totalEnergy += block.energy * block.duration;
  });

  const meanSquareUngated = totalEnergy / integratedDuration;
  const ungatedLUFS = toLUFS(meanSquareUngated);
  const thresholdLUFS = Math.max(ungatedLUFS - 10, -70);
  const thresholdLinear = fromLUFS(thresholdLUFS);

  let gatedEnergy = 0;
  let gatedDuration = 0;
  integratedBlocks.forEach((block) => {
    if (block.energy >= thresholdLinear) {
      gatedEnergy += block.energy * block.duration;
      gatedDuration += block.duration;
    }
  });

  const integratedLUFS =
    gatedDuration === 0 ? -Infinity : toLUFS(gatedEnergy / gatedDuration);

  return {
    momentaryLUFS,
    shortTermLUFS,
    integratedLUFS,
    truePeakDb: truePeak > 0 ? 20 * Math.log10(truePeak) : -Infinity,
  };
}

export function validateMasterBuffer(
  buffer: AudioBuffer,
  profile: MasteringProfile
): VelvetValidationResult {
  const metrics = analyzeBuffer(buffer);
  const issues: string[] = [];

  if (!Number.isFinite(metrics.integratedLUFS)) {
    issues.push('No measurable program level detected.');
  } else {
    if (metrics.integratedLUFS < profile.targetLUFS - 1.5) {
      issues.push('Program energy below target loudness window.');
    }
    if (metrics.integratedLUFS > profile.targetLUFS + 1) {
      issues.push('Program energy above target loudness window.');
    }
  }

  if (Number.isFinite(metrics.truePeakDb) && metrics.truePeakDb > profile.truePeakCeiling + 0.1) {
    issues.push('True peak exceeds compliance ceiling.');
  }

  if (
    Number.isFinite(metrics.shortTermLUFS) &&
    Number.isFinite(metrics.momentaryLUFS)
  ) {
    const density = metrics.shortTermLUFS - metrics.momentaryLUFS;
    if (density > 3.5) {
      issues.push('Dynamics too compact — consider easing compression.');
    } else if (density < 0.4) {
      issues.push('Dynamics too loose — consider more glue before export.');
    }
  }

  return {
    metrics,
    issues,
    ok: issues.length === 0,
  };
}

export function ensureMasterCompliance(
  buffer: AudioBuffer,
  profile: MasteringProfile
): VelvetValidationResult {
  const result = validateMasterBuffer(buffer, profile);
  if (!result.ok) {
    const error = new Error('Velvet compliance validation failed.');
    (error as Error & { issues?: string[] }).issues = result.issues;
    throw error;
  }
  return result;
}





