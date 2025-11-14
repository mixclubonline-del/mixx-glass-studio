/**
 * Flow Meter Stack - True Peak Detector (STEP 3)
 * Detects inter-sample peaks that standard meters miss.
 * Uses oversampling to catch peaks between samples.
 */

/**
 * Detect true peak using oversampling.
 * @param inputSamples - Audio samples (Float32Array)
 * @param oversampleFactor - Oversampling factor (4x or 8x recommended)
 * @returns True peak in dB
 */
export function detectTruePeak(
  inputSamples: Float32Array,
  oversampleFactor: number = 4
): number {
  if (inputSamples.length === 0) {
    return -Infinity;
  }

  const oversampled = new Float32Array(inputSamples.length * oversampleFactor);

  // Linear interpolation between samples
  for (let i = 0; i < inputSamples.length - 1; i++) {
    const a = inputSamples[i];
    const b = inputSamples[i + 1];
    const step = (b - a) / oversampleFactor;

    for (let j = 0; j < oversampleFactor; j++) {
      oversampled[i * oversampleFactor + j] = a + step * j;
    }
  }

  // Handle last sample
  const lastSample = inputSamples[inputSamples.length - 1];
  for (let j = 0; j < oversampleFactor; j++) {
    oversampled[(inputSamples.length - 1) * oversampleFactor + j] = lastSample;
  }

  // Find peak in oversampled data
  let peak = 0;
  for (let i = 0; i < oversampled.length; i++) {
    const abs = Math.abs(oversampled[i]);
    if (abs > peak) {
      peak = abs;
    }
  }

  // Convert to dB, clamp to prevent -Infinity
  if (peak === 0) {
    return -Infinity;
  }

  return 20 * Math.log10(peak);
}

/**
 * Detect true peak from AnalyserNode time domain data.
 * @param analyser - AnalyserNode to read from
 * @param oversampleFactor - Oversampling factor (default 4)
 * @returns True peak in dB
 */
export function detectTruePeakFromAnalyser(
  analyser: AnalyserNode,
  oversampleFactor: number = 4
): number {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(dataArray);
  return detectTruePeak(dataArray, oversampleFactor);
}

