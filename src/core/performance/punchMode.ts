/**
 * Punch Mode Engine
 * 
 * The canonical Mixx Club behavior model for vocal punch recording.
 * 
 * Punch Mode activates when the Studio detects:
 * - Armed track + recording patterns
 * - Fast record button taps (double-tap within 800ms)
 * - Cursor locked in tight region (1-4 bars)
 * - Repeated recording cycles (punch cadence)
 * - Looping over same bar repeatedly
 * 
 * When active, Punch Mode:
 * - Learns punch zones and cadence patterns
 * - Sets smart pre-roll & post-roll
 * - Detects punch types (fast/slow/end-line/double/bar-locked)
 * - Remembers take memory and rhythm
 * - Adapts ALS for vocal punching
 * - Enables auto-crossfade and waveform smoothing
 * 
 * This is what makes Mixx Club Studio different from every DAW on the planet.
 */

import { getSmartRolls, recordTakeMemory } from './takeMemory';

declare global {
  interface Window {
    __mixx_recordState?: {
      recording: boolean;
      armedTrack: boolean;
      noiseFloor: number;
      threshold?: number;
      hush?: boolean;
    };
    __mixx_playbackState?: {
      playing: boolean;
      looping: boolean;
      playCount?: number;
      cursor?: number; // Current playhead position in seconds
      regionLength?: number; // Loop region length in seconds
      cursorLock?: boolean; // Cursor locked in tight region
    };
    __mixx_punchHistory?: Array<{
      ts: number; // Timestamp
      cursor: number; // Cursor position
      duration?: number; // Punch duration
      type?: 'fast' | 'slow' | 'end-line' | 'double' | 'bar-locked';
    }>;
    __mixx_recordTaps?: Array<{
      ts: number; // Timestamp of record button tap
    }>;
  }
}

export interface PunchModeState {
  isPunch: boolean;
  punchCadence: boolean;
  doubleTap: boolean;
  inPunchRegion: boolean;
  punchCount: number;
  lastPunchTime: number | null;
}

export type PunchType = 'fast' | 'slow' | 'end-line' | 'double' | 'bar-locked';

/**
 * Detect Punch Mode from current session state.
 * 
 * Punch Mode activates when ANY TWO of these are true:
 * 1. Armed track is ON
 * 2. Recording toggled twice within 5 seconds (punch cadence)
 * 3. Cursor stays locked inside a 1-4 bar region
 * 4. HUSH events register during performance
 * 5. Playback loops over the same bar repeatedly
 * 6. User taps record button fast (within 800ms - double tap)
 * 
 * Returns state object for use in Flow Loop and components.
 */
export function usePunchMode(): PunchModeState {
  if (typeof window === 'undefined') {
    return {
      isPunch: false,
      punchCadence: false,
      doubleTap: false,
      inPunchRegion: false,
      punchCount: 0,
      lastPunchTime: null,
    };
  }

  const rec = window.__mixx_recordState || {};
  const play = window.__mixx_playbackState || {};
  const punches = window.__mixx_punchHistory || [];
  const recordTaps = window.__mixx_recordTaps || [];
  
  const now = performance.now();
  
  // Check 1: Armed track
  const isArmed = !!rec.armedTrack;
  
  // Check 2: Punch cadence (recording toggled twice within 5 seconds)
  const punchCadence = punches.length >= 2 && 
    now - punches[punches.length - 1].ts < 5000;
  
  // Check 3: Cursor locked in tight region (1-4 bars, ~1-6 seconds at 120 BPM)
  const inPunchRegion = 
    !!play.looping ||
    (play.regionLength && play.regionLength < 6) ||
    !!play.cursorLock;
  
  // Check 4: HUSH events during performance
  const hushDuringPerformance = !!rec.hush && !!play.playing;
  
  // Check 5: Looping over same bar repeatedly
  const loopingRepeatedly = !!play.looping && (play.playCount || 0) >= 3;
  
  // Check 6: Double tap (record button tapped twice within 800ms)
  const doubleTap = recordTaps.length >= 2 &&
    now - recordTaps[recordTaps.length - 1].ts < 800;
  
  // Count how many conditions are true
  let conditionCount = 0;
  if (isArmed) conditionCount++;
  if (punchCadence) conditionCount++;
  if (inPunchRegion) conditionCount++;
  if (hushDuringPerformance) conditionCount++;
  if (loopingRepeatedly) conditionCount++;
  if (doubleTap) conditionCount++;
  
  // Punch Mode activates when ANY TWO conditions are true
  const isPunch = conditionCount >= 2 && isArmed;
  
  // Record take memory when Punch Mode reactivates (if recording just stopped)
  if (isPunch && !rec.recording && punches.length > 0) {
    const lastPunch = punches[punches.length - 1];
    const timeSinceLastPunch = now - lastPunch.ts;
    // If last punch was recent (< 2 seconds), record take memory
    if (timeSinceLastPunch < 2000) {
      recordTakeMemory();
    }
  }
  
  return {
    isPunch,
    punchCadence,
    doubleTap,
    inPunchRegion,
    punchCount: punches.length,
    lastPunchTime: punches.length > 0 ? punches[punches.length - 1].ts : null,
  };
}

/**
 * Record a punch event (called when recording starts/stops in punch context)
 */
export function recordPunchEvent(cursor?: number, duration?: number, type?: PunchType): void {
  if (typeof window === 'undefined') return;
  
  if (!window.__mixx_punchHistory) {
    window.__mixx_punchHistory = [];
  }
  
  const play = window.__mixx_playbackState || {};
  
  window.__mixx_punchHistory.push({
    ts: performance.now(),
    cursor: cursor ?? play.cursor ?? 0,
    duration,
    type,
  });
  
  // Keep only last 20 punches for memory
  if (window.__mixx_punchHistory.length > 20) {
    window.__mixx_punchHistory.shift();
  }
}

/**
 * Record a record button tap (for double-tap detection)
 */
export function recordRecordTap(): void {
  if (typeof window === 'undefined') return;
  
  if (!window.__mixx_recordTaps) {
    window.__mixx_recordTaps = [];
  }
  
  window.__mixx_recordTaps.push({
    ts: performance.now(),
  });
  
  // Keep only last 5 taps (for double-tap detection)
  if (window.__mixx_recordTaps.length > 5) {
    window.__mixx_recordTaps.shift();
  }
}

/**
 * Analyze punch cadence to detect punch type
 */
export function detectPunchType(punches: Array<{ ts: number; cursor?: number }>): PunchType | null {
  if (punches.length < 2) return null;
  
  const lastPunch = punches[punches.length - 1];
  const prevPunch = punches[punches.length - 2];
  
  const timeDelta = lastPunch.ts - prevPunch.ts;
  const cursorDelta = lastPunch.cursor && prevPunch.cursor 
    ? Math.abs(lastPunch.cursor - prevPunch.cursor)
    : null;
  
  // Fast punch: < 2 seconds between punches
  if (timeDelta < 2000) {
    return 'fast';
  }
  
  // Slow punch: > 5 seconds (phrasing fix)
  if (timeDelta > 5000) {
    return 'slow';
  }
  
  // End-line punch: cursor near end of region
  if (cursorDelta !== null && cursorDelta < 0.5) {
    return 'end-line';
  }
  
  // Double punch: very fast (< 1 second)
  if (timeDelta < 1000) {
    return 'double';
  }
  
  // Bar-locked: cursor delta matches bar length (hip-hop flow)
  if (cursorDelta !== null && cursorDelta > 1 && cursorDelta < 4) {
    return 'bar-locked';
  }
  
  return null;
}

/**
 * Calculate smart pre-roll and post-roll based on punch history.
 * 
 * Now enhanced with Take Memory for smarter adaptation.
 */
export function calculatePunchRolls(punches: Array<{ ts: number; cursor?: number; duration?: number }>): {
  preRoll: number; // seconds
  postRoll: number; // seconds
  smoothing: number; // seconds
} {
  // Try to use Take Memory first (more accurate)
  if (typeof window !== 'undefined' && window.__mixx_takeMemory && window.__mixx_takeMemory.length > 0) {
    return getSmartRolls(window.__mixx_takeMemory);
  }
  
  // Fallback to punch history analysis
  if (punches.length < 2) {
    // Default values for first punches
    return {
      preRoll: 0.5,
      postRoll: 0.3,
      smoothing: 0.1,
    };
  }
  
  // Analyze last 2-4 punches
  const recentPunches = punches.slice(-4);
  const durations = recentPunches
    .filter(p => p.duration !== undefined)
    .map(p => p.duration!);
  
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 1.0;
  
  // Pre-roll: ~10% of average punch duration, min 0.3s, max 1.5s
  const preRoll = Math.max(0.3, Math.min(1.5, avgDuration * 0.1));
  
  // Post-roll: ~5% of average punch duration, min 0.2s, max 0.8s
  const postRoll = Math.max(0.2, Math.min(0.8, avgDuration * 0.05));
  
  // Smoothing: ~2% of average punch duration, min 0.05s, max 0.2s
  const smoothing = Math.max(0.05, Math.min(0.2, avgDuration * 0.02));
  
  return { preRoll, postRoll, smoothing };
}

/**
 * Get punch zone information (where user usually punches)
 */
export function getPunchZones(punches: Array<{ cursor?: number }>): {
  zones: Array<{ start: number; end: number; count: number }>;
  mostCommonZone: { start: number; end: number } | null;
} {
  if (punches.length === 0) {
    return { zones: [], mostCommonZone: null };
  }
  
  // Group punches by 1-second zones
  const zoneMap = new Map<number, number>();
  
  punches.forEach(punch => {
    if (punch.cursor !== undefined) {
      const zone = Math.floor(punch.cursor);
      zoneMap.set(zone, (zoneMap.get(zone) || 0) + 1);
    }
  });
  
  const zones: Array<{ start: number; end: number; count: number }> = [];
  zoneMap.forEach((count, zoneStart) => {
    zones.push({
      start: zoneStart,
      end: zoneStart + 1,
      count,
    });
  });
  
  // Sort by count (most common first)
  zones.sort((a, b) => b.count - a.count);
  
  const mostCommonZone = zones.length > 0 ? zones[0] : null;
  
  return { zones, mostCommonZone };
}

