/**
 * Flow Loop Events
 * 
 * Utilities to populate window.__mixx_* globals for the flow loop.
 * These events are read by gatherSessionSignals() every 40ms.
 */

// Window interface extensions moved to src/types/globals.d.ts

const MAX_EVENTS = 50; // Keep last 50 events per type (safety limit)
const EVENT_TTL_MS = 2000; // Events expire after 2 seconds (fallback)

function ensureArray(key: keyof Window): void {
  if (typeof window === 'undefined') return;
  if (!window[key]) {
    (window as any)[key] = [];
  }
}

function trimArray(arr: Array<any>): void {
  // Safety trim: remove expired events and enforce max size
  // Note: Main pruning happens in pruneEvents() called by Flow Loop
  const now = performance.now();
  while (arr.length > 0 && now - arr[arr.length - 1].timestamp > EVENT_TTL_MS) {
    arr.pop();
  }
  // Trim to max size as safety limit
  while (arr.length > MAX_EVENTS) {
    arr.shift();
  }
}

/**
 * Record an edit event (clip drag, resize, split, etc.)
 */
export function recordEditEvent(distance: number = 0): void {
  if (typeof window === 'undefined') return;
  ensureArray('__mixx_editEvents');
  const arr = window.__mixx_editEvents!;
  arr.push({ distance, timestamp: performance.now() });
  trimArray(arr);
}

/**
 * Record a tool switch event
 */
export function recordToolSwitch(tool: string): void {
  if (typeof window === 'undefined') return;
  ensureArray('__mixx_toolSwitches');
  const arr = window.__mixx_toolSwitches!;
  arr.push({ tool, timestamp: performance.now() });
  trimArray(arr);
}

/**
 * Record a zoom event
 */
export function recordZoomEvent(delta: number, pos: number): void {
  if (typeof window === 'undefined') return;
  ensureArray('__mixx_zoomEvents');
  const arr = window.__mixx_zoomEvents!;
  arr.push({ delta, pos, timestamp: performance.now() });
  trimArray(arr);
}

/**
 * Record a view switch event
 */
export function recordViewSwitch(view: string): void {
  if (typeof window === 'undefined') return;
  ensureArray('__mixx_viewSwitches');
  const arr = window.__mixx_viewSwitches!;
  arr.push({ view, timestamp: performance.now() });
  trimArray(arr);
}

/**
 * Update playback state (called when play/pause/stop/loop changes)
 */
export function updatePlaybackState(state: {
  playing?: boolean;
  looping?: boolean;
  playCount?: number;
  cursor?: number;
  regionLength?: number;
  cursorLock?: boolean;
}): void {
  if (typeof window === 'undefined') return;
  if (!window.__mixx_playbackState) {
    window.__mixx_playbackState = { playing: false, looping: false };
  }
  window.__mixx_playbackState = {
    ...window.__mixx_playbackState,
    ...state,
  };
}

/**
 * Update recording state (called when armed/recording/HUSH changes)
 */
export function updateRecordState(update: {
  recording?: boolean;
  armedTrack?: boolean;
  noiseFloor?: number;
  threshold?: number;
  hush?: boolean;
  recordStart?: number;
}): void {
  if (typeof window === 'undefined') return;
  if (!window.__mixx_recordState) {
    window.__mixx_recordState = { recording: false, armedTrack: false, noiseFloor: 0, hush: false };
  }
  window.__mixx_recordState = {
    ...window.__mixx_recordState,
    ...update,
  };
}

/**
 * Clear all events (useful for testing or reset)
 */
export function clearFlowLoopEvents(): void {
  if (typeof window === 'undefined') return;
  if (window.__mixx_editEvents) window.__mixx_editEvents = [];
  if (window.__mixx_toolSwitches) window.__mixx_toolSwitches = [];
  if (window.__mixx_zoomEvents) window.__mixx_zoomEvents = [];
  if (window.__mixx_viewSwitches) window.__mixx_viewSwitches = [];
}

