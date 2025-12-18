/**
 * gatherSessionSignals.ts
 * 
 * Mixx Club Studio — Flow-Conscious Signal Extractor
 * 
 * Feeds raw user + session events into the Prime Brain behavior engine.
 * This is what the behavior loop eats every 50ms.
 * 
 * Reads from window.__mixx_* global arrays populated by UI interactions.
 */

// Type definitions for window globals
// Window interface extensions moved to src/types/globals.d.ts

export interface SessionSignals {
  // Editing + tools
  editing: boolean;
  precision: boolean;
  creativeBurst: boolean;
  
  // Zoom behavior
  zoomBurst: boolean;
  hunting: boolean;
  
  // Playback state
  playing: boolean;
  looping: boolean;
  auditionBurst: boolean;
  
  // Recording state
  recording: boolean;
  armedTrack: boolean;
  hush: boolean;
  
  // Navigation
  viewSwitchBurst: boolean;
  
  // Master chain calibration (Prime Brain awareness)
  masterChain: {
    targetLUFS: number;
    currentProfile: string;
    outputCalibrated: boolean;
    masterVolume: number; // 0-1 trim on calibrated gain
  } | null;
  
  // Internal markers
  flowing: boolean;
}

/**
 * Helper: Check if zoom events are in the same region
 */
function sameRegion(events: Array<{ pos: number }>): boolean {
  if (events.length < 2) return false;
  const regionStart = events[0].pos;
  return events.every(e => Math.abs(e.pos - regionStart) < 40);
}

/**
 * Gather session signals from window globals.
 * Called every 40-50ms by the flow loop.
 */
export function gatherSessionSignals(): SessionSignals {
  const signals: SessionSignals = {
    // Editing + tools
    editing: false,
    precision: false,
    creativeBurst: false,
    
    // Zoom behavior
    zoomBurst: false,
    hunting: false,
    
    // Playback state
    playing: false,
    looping: false,
    auditionBurst: false,
    
    // Recording state
    recording: false,
    armedTrack: false,
    hush: false,
    
    // Navigation
    viewSwitchBurst: false,
    
    // Master chain calibration (Prime Brain awareness)
    masterChain: null,
    
    // Internal markers
    flowing: false,
  };

  // ==========================
  // EDIT / TOOL SIGNALS
  // ==========================
  const editEvents = window.__mixx_editEvents || [];
  const toolEvents = window.__mixx_toolSwitches || [];
  
  if (editEvents.length > 0) signals.editing = true;
  if (editEvents.filter(e => e.distance < 12).length > 2) signals.precision = true;
  if (toolEvents.length > 3) signals.creativeBurst = true;

  // ==========================
  // ZOOM SIGNALS
  // ==========================
  const zoomEvents = window.__mixx_zoomEvents || [];
  
  if (zoomEvents.filter(z => z.delta > 1).length >= 2) {
    signals.zoomBurst = true;
  }
  
  if (zoomEvents.length > 4 && sameRegion(zoomEvents)) {
    signals.hunting = true;
  }

  // ==========================
  // PLAYBACK SIGNALS
  // ==========================
  const playback = window.__mixx_playbackState || { playing: false, looping: false };
  signals.playing = !!playback.playing;
  signals.looping = !!playback.looping;
  
  if (playback.playCount && playback.playCount >= 3) {
    signals.auditionBurst = true;
  }

  // ==========================
  // RECORDING SIGNALS
  // ==========================
  const rec = window.__mixx_recordState || { recording: false, armedTrack: false, noiseFloor: 0 };
  signals.recording = !!rec.recording;
  signals.armedTrack = !!rec.armedTrack;
  // Use explicit hush flag if available, otherwise compute from noise floor
  signals.hush = rec.hush !== undefined 
    ? rec.hush 
    : (rec.noiseFloor || 0) > (rec.threshold || 0.2);

  // ==========================
  // NAVIGATION SIGNALS
  // ==========================
  const navEvents = window.__mixx_viewSwitches || [];
  if (navEvents.length >= 2) signals.viewSwitchBurst = true;

  // ==========================
  // MASTER CHAIN CALIBRATION (Prime Brain awareness)
  // ==========================
  // Read master chain state from window global (set by App.tsx)
  const masterChainState = (window as any).__mixx_masterChain;
  if (masterChainState) {
    signals.masterChain = {
      targetLUFS: masterChainState.targetLUFS || -14,
      currentProfile: masterChainState.profile || 'streaming',
      outputCalibrated: masterChainState.calibrated || false,
      masterVolume: masterChainState.masterVolume || 0.8,
    };
  }

  // ==========================
  // FLOW STATE (high-level)
  // ==========================
  if (
    signals.creativeBurst ||
    signals.zoomBurst ||
    (signals.editing && signals.playing) ||
    signals.looping ||
    signals.auditionBurst ||
    signals.viewSwitchBurst
  ) {
    signals.flowing = true;
  }

  return signals;
}
