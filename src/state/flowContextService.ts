import { useSyncExternalStore } from "react";
import { subscribeToFlow } from "./flowSignals";
import type { TrackALSFeedback } from "../utils/ALS";

type FlowIntensity = "calm" | "charged" | "immersed";

export interface FlowContextSnapshot {
  momentum: number;
  momentumTrend: number;
  intensity: FlowIntensity;
  updatedAt: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const INTENSITY_THRESHOLDS: Array<{ tag: FlowIntensity; min: number }> = [
  { tag: "immersed", min: 0.72 },
  { tag: "charged", min: 0.38 },
  { tag: "calm", min: 0 },
];

const DEFAULT_SNAPSHOT: FlowContextSnapshot = {
  momentum: 0,
  momentumTrend: 0,
  intensity: "calm",
  updatedAt: Date.now(),
};

let snapshot: FlowContextSnapshot = DEFAULT_SNAPSHOT;
const listeners = new Set<() => void>();

let unsubscribeFlow: (() => void) | null = null;
let initialized = false;

const resolveIntensity = (momentum: number): FlowIntensity => {
  for (const { tag, min } of INTENSITY_THRESHOLDS) {
    if (momentum >= min) {
      return tag;
    }
  }
  return "calm";
};

const computeMomentumFromTracks = (
  tracks?: Record<string, TrackALSFeedback>,
  master?: TrackALSFeedback | null
): number => {
  const values: number[] = [];
  if (tracks) {
    values.push(
      ...Object.values(tracks).map((feedback) => clamp01(feedback.flow))
    );
  }
  if (master) {
    values.push(clamp01(master.flow));
  }
  if (!values.length) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return clamp01(sum / values.length);
};

const updateSnapshot = (nextMomentum: number) => {
  const smoothedMomentum = clamp01(snapshot.momentum * 0.65 + nextMomentum * 0.35);
  const momentumTrend = clamp01(smoothedMomentum - snapshot.momentum);
  snapshot = {
    momentum: smoothedMomentum,
    momentumTrend,
    intensity: resolveIntensity(smoothedMomentum),
    updatedAt: Date.now(),
  };
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn("[FlowContextService] listener error", error);
    }
  });
};

const handleAlsSignal = (payload: {
  tracks?: Record<string, TrackALSFeedback>;
  master?: TrackALSFeedback | null;
}) => {
  const momentum = computeMomentumFromTracks(payload.tracks, payload.master ?? undefined);
  updateSnapshot(momentum);
};

const ensureInitialized = () => {
  if (initialized) return;
  unsubscribeFlow = subscribeToFlow((signal) => {
    if (signal.channel !== "als") {
      return;
    }
    handleAlsSignal(signal.payload);
  });
  initialized = true;
};

export const destroyFlowContextService = () => {
  unsubscribeFlow?.();
  unsubscribeFlow = null;
  initialized = false;
  snapshot = DEFAULT_SNAPSHOT;
};

const subscribeSnapshot = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;

/**
 * React hook to consume Flow Context state inside Studio runtime.
 * Ensures the service is initialized before subscribing.
 */
export const useFlowContext = (): FlowContextSnapshot => {
  ensureInitialized();
  return useSyncExternalStore(subscribeSnapshot, getSnapshot, getSnapshot);
};

/**
 * Imperative access to Flow Context snapshot.
 */
export const getFlowContextSnapshot = (): FlowContextSnapshot => {
  ensureInitialized();
  return snapshot;
};


