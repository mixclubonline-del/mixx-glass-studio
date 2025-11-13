import { quantizeSeconds } from "./time";

export type SnapTargetType = "grid" | "clip" | "marker" | "zero-crossing";

export interface SnapCandidate {
  time: number;
  type: SnapTargetType;
}

export interface SnapSettings {
  enableGrid: boolean;
  enableClips: boolean;
  enableMarkers: boolean;
  enableZeroCrossings: boolean;
  gridDivision: number;
  tolerancePx: number;
  strength: number;
}

export interface SnapContext {
  bpm: number;
  beatsPerBar: number;
  pixelsPerSecond: number;
  markers?: number[];
  clipBoundaries?: number[];
  zeroCrossings?: number[];
}

export interface SnapResult {
  snapped: boolean;
  time: number;
  candidate?: SnapCandidate;
  distancePx: number;
}

export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  enableGrid: true,
  enableClips: true,
  enableMarkers: true,
  enableZeroCrossings: false,
  gridDivision: 16,
  tolerancePx: 12,
  strength: 1,
};

export function buildSnapCandidates(
  context: SnapContext,
  settings: SnapSettings,
  windowStart: number,
  windowEnd: number
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];
  if (settings.enableGrid) {
    const stepSeconds =
      quantizeSeconds(1 / settings.gridDivision, context.bpm, context.beatsPerBar, "beats", settings.gridDivision) /
      (settings.gridDivision / 4 || 1);
    const first = Math.floor(windowStart / stepSeconds) * stepSeconds;
    for (let t = first; t <= windowEnd; t += stepSeconds) {
      candidates.push({ time: Math.max(0, t), type: "grid" });
    }
  }

  if (settings.enableClips && context.clipBoundaries?.length) {
    context.clipBoundaries.forEach((time) => {
      if (time >= windowStart && time <= windowEnd) {
        candidates.push({ time, type: "clip" });
      }
    });
  }

  if (settings.enableMarkers && context.markers?.length) {
    context.markers.forEach((time) => {
      if (time >= windowStart && time <= windowEnd) {
        candidates.push({ time, type: "marker" });
      }
    });
  }

  if (settings.enableZeroCrossings && context.zeroCrossings?.length) {
    context.zeroCrossings.forEach((time) => {
      if (time >= windowStart && time <= windowEnd) {
        candidates.push({ time, type: "zero-crossing" });
      }
    });
  }

  return candidates;
}

export function snapTime(
  time: number,
  context: SnapContext,
  settings: SnapSettings,
  candidates: SnapCandidate[]
): SnapResult {
  if (!candidates.length) {
    return { snapped: false, time, distancePx: 0 };
  }

  const toleranceSeconds = settings.tolerancePx / context.pixelsPerSecond;
  let bestCandidate: SnapCandidate | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    const distance = Math.abs(candidate.time - time);
    if (distance <= toleranceSeconds && distance < bestDistance) {
      bestCandidate = candidate;
      bestDistance = distance;
    }
  });

  if (!bestCandidate) {
    return { snapped: false, time, distancePx: 0 };
  }

  const snappedTime =
    time + (bestCandidate.time - time) * Math.min(1, Math.max(0, settings.strength));

  return {
    snapped: true,
    time: snappedTime,
    candidate: bestCandidate,
    distancePx: Math.abs(snappedTime - time) * context.pixelsPerSecond,
  };
}

export function applySnapIfEnabled(
  time: number,
  context: SnapContext,
  settings: SnapSettings,
  candidates: SnapCandidate[]
): { time: number; snappedTo?: SnapCandidate; deltaPx: number } {
  const result = snapTime(time, context, settings, candidates);
  return {
    time: result.time,
    snappedTo: result.candidate,
    deltaPx: result.distancePx,
  };
}

export function shouldSnap(settings: SnapSettings) {
  return (
    settings.enableGrid ||
    settings.enableClips ||
    settings.enableMarkers ||
    settings.enableZeroCrossings
  );
}

