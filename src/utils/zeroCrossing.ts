type Direction = "forward" | "backward" | "both";

interface ZeroCrossingOptions {
  windowSec?: number;
  direction?: Direction;
}

const ZERO_EPSILON = 1e-7;

const hasSignChange = (a: number, b: number) => {
  if (Math.abs(a) <= ZERO_EPSILON && Math.abs(b) <= ZERO_EPSILON) return false;
  return (a <= 0 && b >= 0) || (a >= 0 && b <= 0);
};

export function findNearestZeroCrossing(
  buffer: AudioBuffer,
  timeSec: number,
  options: ZeroCrossingOptions = {}
): number | null {
  const { windowSec = 0.01, direction = "both" } = options;
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const targetSample = clampSample(Math.round(timeSec * sampleRate), channelData.length);
  const windowSamples = Math.max(1, Math.round(windowSec * sampleRate));

  const searchDirection = (dir: 1 | -1) => {
    let prevSample = channelData[targetSample];
    for (let offset = dir; Math.abs(offset) <= windowSamples; offset += dir) {
      const index = targetSample + offset;
      if (index <= 0 || index >= channelData.length) break;
      const current = channelData[index];
      if (hasSignChange(prevSample, current)) {
        // Interpolate zero crossing time linearly between the two samples.
        const fraction =
          Math.abs(current - prevSample) > ZERO_EPSILON
            ? Math.abs(prevSample) / Math.abs(current - prevSample)
            : 0;
        const zeroSample = index - fraction * dir;
        return zeroSample / sampleRate;
      }
      prevSample = current;
    }
    return null;
  };

  if (direction === "backward") {
    return searchDirection(-1);
  }

  if (direction === "forward") {
    return searchDirection(1);
  }

  const backward = searchDirection(-1);
  const forward = searchDirection(1);

  if (backward === null) return forward;
  if (forward === null) return backward;

  return Math.abs(backward - timeSec) <= Math.abs(forward - timeSec) ? backward : forward;
}

const clampSample = (sampleIndex: number, length: number) =>
  Math.max(0, Math.min(sampleIndex, length - 1));






