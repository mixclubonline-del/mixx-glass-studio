import { FlowSignal, subscribeToFlow } from "./flowSignals";

type TimelineProbeSignal = {
  channel: "timeline";
  timestamp: number;
  payload: {
    kind: "scroll" | "zoom";
    scrollX: number;
    pixelsPerSecond: number;
    viewportWidth: number;
    contentWidth: number;
    ratioRange?: [number, number];
  };
};

type ProbeSignal = FlowSignal | TimelineProbeSignal;

export interface SessionProbeClipSummary {
  id: string;
  name: string;
  trackId: string;
  start: number;
  duration: number;
}

export interface SessionProbeContext {
  timestamp: number;
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  selection: { start: number; end: number } | null;
  pixelsPerSecond: number;
  scrollX: number;
  followPlayhead: boolean;
  viewMode: string;
  bloomContext: string;
  selectedClips: SessionProbeClipSummary[];
}

export type SessionProbeEvent = ProbeSignal & {
  testing: true;
  context: SessionProbeContext | null;
};

export interface SessionProbeMarker {
  id: string;
  label: string;
  timestamp: number;
  context: SessionProbeContext | null;
  meta?: Record<string, unknown>;
}

export interface SessionProbeState {
  enabled: boolean;
  startedAt: number | null;
  events: SessionProbeEvent[];
  markers: SessionProbeMarker[];
  context: SessionProbeContext | null;
}

const MAX_PROBE_EVENTS = 1200;

const resolveEnv = (): boolean => {
  if (typeof import.meta === "undefined") return false;
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_SESSION_PROBE === "1";
  } catch {
    return false;
  }
};

const PROBE_ENABLED = resolveEnv();

let state: SessionProbeState = {
  enabled: PROBE_ENABLED,
  startedAt: null,
  events: [],
  markers: [],
  context: null,
};

const listeners = new Set<() => void>();
let unsubscribeFlow: (() => void) | null = null;

const emit = () => {
  if (!listeners.size) return;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn("[SessionProbe] Listener error", error);
    }
  });
};

const mutateState = (mutator: (prev: SessionProbeState) => SessionProbeState) => {
  state = mutator(state);
  emit();
};

const appendEvent = (prev: SessionProbeState, signal: ProbeSignal): SessionProbeState => {
  const nextEvent: SessionProbeEvent = {
    ...signal,
    testing: true,
    context: prev.context ? { ...prev.context } : null,
  };

  const events = [...prev.events, nextEvent];
  const overflow = events.length - MAX_PROBE_EVENTS;
  if (overflow > 0) {
    events.splice(0, overflow);
  }

  return {
    ...prev,
    startedAt: prev.startedAt ?? signal.timestamp,
    events,
  };
};

export const isSessionProbeEnabled = () => PROBE_ENABLED;

export const initSessionProbe = () => {
  if (!PROBE_ENABLED || unsubscribeFlow) {
    return;
  }

  unsubscribeFlow = subscribeToFlow((signal) => {
    mutateState((prev) => appendEvent(prev, signal));
  });
};

export const shutdownSessionProbe = () => {
  if (unsubscribeFlow) {
    unsubscribeFlow();
    unsubscribeFlow = null;
  }
  mutateState((prev) => ({
    ...prev,
    events: [],
    markers: [],
    context: null,
    startedAt: null,
  }));
};

export const updateSessionProbeContext = (
  context: Omit<SessionProbeContext, "timestamp"> & { timestamp?: number }
) => {
  if (!PROBE_ENABLED) return;
  const timestamp = context.timestamp ?? Date.now();
  const normalized: SessionProbeContext = {
    timestamp,
    currentTime: context.currentTime,
    isPlaying: context.isPlaying,
    isLooping: context.isLooping,
    selection: context.selection ? { ...context.selection } : null,
    pixelsPerSecond: context.pixelsPerSecond,
    scrollX: context.scrollX,
    followPlayhead: context.followPlayhead,
    viewMode: context.viewMode,
    bloomContext: context.bloomContext,
    selectedClips: context.selectedClips.map((clip) => ({ ...clip })),
  };

  mutateState((prev) => ({
    ...prev,
    context: normalized,
  }));
};

export const addSessionProbeMarker = (
  label: string,
  meta?: SessionProbeMarker["meta"]
) => {
  if (!PROBE_ENABLED) return null;
  const marker: SessionProbeMarker = {
    id: `probe-marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: label || "Marker",
    timestamp: Date.now(),
    context: state.context ? { ...state.context } : null,
    meta,
  };

  mutateState((prev) => ({
    ...prev,
    markers: [...prev.markers, marker],
  }));

  return marker;
};

export const recordSessionProbeTimelineEvent = (
  payload: TimelineProbeSignal["payload"]
) => {
  if (!PROBE_ENABLED) return;
  const signal: TimelineProbeSignal = {
    channel: "timeline",
    timestamp: Date.now(),
    payload,
  };
  mutateState((prev) => appendEvent(prev, signal));
};

export const clearSessionProbe = () => {
  if (!PROBE_ENABLED) return;
  mutateState((prev) => ({
    ...prev,
    events: [],
    markers: [],
  }));
};

export const subscribeToSessionProbe = (listener: () => void) => {
  if (!listeners.has(listener)) {
    listeners.add(listener);
  }
  return () => {
    listeners.delete(listener);
  };
};

export const getSessionProbeSnapshot = () => state;

export const exportSessionProbeData = () => {
  if (!PROBE_ENABLED) return null;
  const snapshot = getSessionProbeSnapshot();
  return JSON.stringify(
    {
      exportedAt: Date.now(),
      ...snapshot,
    },
    null,
    2
  );
};


