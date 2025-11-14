import type { DockMode } from "./types";

/**
 * Detects user intent and returns the appropriate Flow Dock mode.
 * Checks real-time cues from the application state.
 */
export function detectIntent(): DockMode {
  // Check for record mode triggers
  if (
    (window as any).__flowState?.recordEnabled ||
    (window as any).__flowState?.inputMonitor ||
    (window as any).__flowState?.hushArmed ||
    (window as any).__flowState?.recordPressed ||
    (window as any).__flowState?.takeLaneActive ||
    (window as any).__flowState?.autoPunchPending
  ) {
    return "record";
  }

  // Check for edit mode triggers
  if (
    (window as any).__flowState?.clipSelected ||
    (window as any).__flowState?.clipEdgeDrag ||
    (window as any).__flowState?.clipSplit ||
    (window as any).__flowState?.warpActive
  ) {
    return "edit";
  }

  // Check for mix mode triggers
  if (
    (window as any).__flowState?.mixViewOpen ||
    (window as any).__flowState?.faderTouched ||
    (window as any).__flowState?.soloTouched ||
    (window as any).__flowState?.muteTouched ||
    (window as any).__flowState?.panTouched
  ) {
    return "mix";
  }

  // Check for performance mode triggers
  if (
    (window as any).__flowState?.midiInput ||
    (window as any).__flowState?.pianoRollAudition ||
    (window as any).__flowState?.padHit ||
    (window as any).__flowState?.drumGridActive
  ) {
    return "perform";
  }

  // Check for compose mode triggers
  if (
    (window as any).__flowState?.trackAdd ||
    (window as any).__flowState?.instrumentBrowse ||
    (window as any).__flowState?.dragSongSection ||
    (window as any).__flowState?.createMidiClip
  ) {
    return "compose";
  }

  // Check for navigation mode triggers
  if (
    (window as any).__flowState?.scrolling ||
    (window as any).__flowState?.zooming ||
    (window as any).__flowState?.markerJump ||
    (window as any).__flowState?.playheadMove
  ) {
    return "nav";
  }

  // Default to navigation mode
  return "nav";
}

