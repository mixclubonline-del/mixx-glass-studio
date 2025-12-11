import { useSyncExternalStore } from "react";
import { subscribeToFlow } from "./flowSignals";
import type { TrackALSFeedback } from "../utils/ALS";
import type { SessionProbeContext } from "./sessionProbe";
import { subscribeToSessionProbe, getSessionProbeSnapshot } from "./sessionProbe";
import { als } from "../utils/alsFeedback";

type FlowIntensity = "calm" | "charged" | "immersed";

export interface FlowContextSnapshot {
  momentum: number;
  momentumTrend: number;
  intensity: FlowIntensity;
  updatedAt: number;
  // Session Probe derived context
  sessionContext: {
    isPlaying: boolean;
    hasSelection: boolean;
    hasClips: boolean;
    viewMode: string;
    bloomContext: string;
    activityLevel: "idle" | "active" | "intense";
  } | null;
  // Adaptive behavior suggestions
  adaptiveSuggestions: {
    showBloomMenu: boolean;
    suggestViewSwitch: string | null;
    uiDensity: "minimal" | "normal" | "rich";
    highlightTools: string[];
  };
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
  sessionContext: null,
  adaptiveSuggestions: {
    showBloomMenu: false,
    suggestViewSwitch: null,
    uiDensity: "normal",
    highlightTools: [],
  },
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

const deriveActivityLevel = (
  sessionContext: SessionProbeContext | null,
  momentum: number
): "idle" | "active" | "intense" => {
  if (!sessionContext) return "idle";
  if (sessionContext.isPlaying && momentum > 0.6) return "intense";
  if (sessionContext.isPlaying || sessionContext.hasSelection || sessionContext.selectedClips.length > 0) {
    return "active";
  }
  return "idle";
};

const computeAdaptiveSuggestions = (
  sessionContext: SessionProbeContext | null,
  intensity: FlowIntensity,
  momentum: number
): FlowContextSnapshot["adaptiveSuggestions"] => {
  const hasClips = (sessionContext?.selectedClips.length ?? 0) > 0;
  const isPlaying = sessionContext?.isPlaying ?? false;
  const hasSelection = sessionContext?.selection !== null;
  
  // Show Bloom Menu when user has clips selected or is actively working
  const showBloomMenu = hasClips || hasSelection || (isPlaying && intensity !== "calm");
  
  // Suggest view switches based on activity
  let suggestViewSwitch: string | null = null;
  if (sessionContext) {
    if (sessionContext.viewMode === "arrange" && hasClips && !isPlaying) {
      suggestViewSwitch = "mixer"; // Suggest mixer when clips are ready
    } else if (sessionContext.viewMode === "mixer" && !hasClips && intensity === "calm") {
      suggestViewSwitch = "arrange"; // Suggest arrange when idle
    }
  }
  
  // UI density based on intensity and activity
  let uiDensity: "minimal" | "normal" | "rich" = "normal";
  if (intensity === "immersed") {
    uiDensity = "minimal"; // Reduce clutter when deeply focused
  } else if (intensity === "calm" && !isPlaying) {
    uiDensity = "rich"; // Show more options when exploring
  }
  
  // Highlight tools based on context
  const highlightTools: string[] = [];
  if (hasClips && !isPlaying) {
    highlightTools.push("edit", "mix");
  }
  if (isPlaying) {
    highlightTools.push("transport");
  }
  if (hasSelection) {
    highlightTools.push("edit", "quantize");
  }
  
  return {
    showBloomMenu,
    suggestViewSwitch,
    uiDensity,
    highlightTools,
  };
};

const updateSnapshot = (
  nextMomentum: number,
  sessionContext: SessionProbeContext | null = null
) => {
  const smoothedMomentum = clamp01(snapshot.momentum * 0.65 + nextMomentum * 0.35);
  const momentumTrend = clamp01(smoothedMomentum - snapshot.momentum);
  const intensity = resolveIntensity(smoothedMomentum);
  
  const sessionCtx = sessionContext
    ? {
        isPlaying: sessionContext.isPlaying,
        hasSelection: sessionContext.selection !== null,
        hasClips: sessionContext.selectedClips.length > 0,
        viewMode: sessionContext.viewMode,
        bloomContext: sessionContext.bloomContext,
        activityLevel: deriveActivityLevel(sessionContext, smoothedMomentum),
      }
    : null;
  
  snapshot = {
    momentum: smoothedMomentum,
    momentumTrend,
    intensity,
    updatedAt: Date.now(),
    sessionContext: sessionCtx,
    adaptiveSuggestions: computeAdaptiveSuggestions(sessionContext, intensity, smoothedMomentum),
  };
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      // Listener error - non-critical (expected in some scenarios)
      if (import.meta.env.DEV) {
        als.warning("[FlowContextService] listener error", error);
      }
    }
  });
};

let unsubscribeSessionProbe: (() => void) | null = null;
let lastSessionContext: SessionProbeContext | null = null;

const handleAlsSignal = (payload: {
  tracks?: Record<string, TrackALSFeedback>;
  master?: TrackALSFeedback | null;
}) => {
  const momentum = computeMomentumFromTracks(payload.tracks, payload.master ?? undefined);
  updateSnapshot(momentum, lastSessionContext);
};

const handleSessionProbeUpdate = (context: SessionProbeContext | null) => {
  lastSessionContext = context;
  // Recompute snapshot with updated session context
  const currentMomentum = snapshot.momentum;
  updateSnapshot(currentMomentum, context);
};

const ensureInitialized = () => {
  if (initialized) return;
  
  // Subscribe to ALS signals
  unsubscribeFlow = subscribeToFlow((signal) => {
    if (signal.channel !== "als") {
      return;
    }
    handleAlsSignal(signal.payload);
  });
  
  // Subscribe to Session Probe context updates
  unsubscribeSessionProbe = subscribeToSessionProbe(() => {
    const probeState = getSessionProbeSnapshot();
    if (probeState?.context) {
      handleSessionProbeUpdate(probeState.context);
    }
  });
  
  // Initial update
  const initialProbeState = getSessionProbeSnapshot();
  if (initialProbeState?.context) {
    handleSessionProbeUpdate(initialProbeState.context);
  }
  
  initialized = true;
};

export const destroyFlowContextService = () => {
  unsubscribeFlow?.();
  unsubscribeFlow = null;
  unsubscribeSessionProbe?.();
  unsubscribeSessionProbe = null;
  initialized = false;
  lastSessionContext = null;
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


