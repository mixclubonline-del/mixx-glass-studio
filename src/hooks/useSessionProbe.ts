import { useEffect, useMemo } from "react";
import { useSyncExternalStore } from "react";
import {
  SessionProbeClipSummary,
  SessionProbeContext,
  SessionProbeState,
  addSessionProbeMarker,
  exportSessionProbeData,
  getSessionProbeSnapshot,
  initSessionProbe,
  isSessionProbeEnabled,
  recordSessionProbeTimelineEvent as recordTimelineEvent,
  subscribeToSessionProbe,
  updateSessionProbeContext,
} from "../state/sessionProbe";

export interface SessionProbeContextInput {
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

const noopUnsubscribe = () => {};

export const useSessionProbeStore = (): SessionProbeState => {
  const enabled = isSessionProbeEnabled();

  const subscribe = useMemo(() => {
    if (!enabled) {
      return (_listener: () => void) => noopUnsubscribe;
    }
    return (listener: () => void) => subscribeToSessionProbe(listener);
  }, [enabled]);

  return useSyncExternalStore(
    subscribe,
    getSessionProbeSnapshot,
    getSessionProbeSnapshot
  );
};

export const useSessionProbe = (context: SessionProbeContextInput) => {
  const enabled = isSessionProbeEnabled();

  useEffect(() => {
    if (!enabled) return;
    initSessionProbe();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    updateSessionProbeContext(context);
  }, [
    enabled,
    context,
  ]);

  return enabled;
};

export const addSessionProbeNote = addSessionProbeMarker;
export const exportSessionProbeSnapshot = exportSessionProbeData;
export const recordSessionProbeTimelineEvent = recordTimelineEvent;


