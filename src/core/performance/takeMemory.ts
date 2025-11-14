/**
 * Take Memory Engine
 * 
 * The crown jewel of Punch Mode - learns user patterns to make every punch
 * tighter, smarter, and smoother.
 * 
 * Take Memory learns:
 * - How YOU punch
 * - How long YOUR takes usually run
 * - Your breathing patterns
 * - Your redo rhythm
 * - Your bar alignment habits
 * - The length of your typical gap
 * - Your punch-in "sweet spot"
 * - Your tendency to redo the first word vs the middle
 * - Where you usually "fix the flow"
 * 
 * This is what allows the Studio to catch your rhythm and keep you locked in.
 */

declare global {
  interface Window {
    __mixx_playbackState?: {
      playing: boolean;
      looping: boolean;
      playCount?: number;
      cursor?: number;
      regionStart?: number;
      regionEnd?: number;
      bar?: number;
    };
    __mixx_recordState?: {
      recording: boolean;
      armedTrack: boolean;
      noiseFloor: number;
      threshold?: number;
      hush?: boolean;
      recordStart?: number;
      lastBreathMs?: number;
    };
    __mixx_punchHistory?: Array<{
      ts: number;
      cursor: number;
      duration?: number;
      type?: string;
    }>;
    __mixx_takeMemory?: Array<TakeMemory>;
    __primeBrainInstance?: {
      state?: {
        flow?: number;
      };
    };
  }
}

export interface TakeMemory {
  startTime: number; // Timestamp when recording started
  endTime: number; // Timestamp when recording stopped
  regionStart: number; // Timeline position where take started
  regionEnd: number; // Timeline position where take ended
  duration: number; // Duration in milliseconds
  breathInMs: number; // Time to first breath/inhale in milliseconds
  barPosition: number; // Bar position where take started
  flowDuringTake: number; // Flow level during the take (0-1)
  hushEvents: number; // Number of HUSH noise events during take
}

/**
 * Record a take into memory.
 * Called when recording stops or when Punch Mode reactivates.
 * 
 * Stores the last 5-10 takes to understand user patterns
 * without slowing down behavior.
 */
export function recordTakeMemory(): TakeMemory | null {
  if (typeof window === 'undefined') return null;
  
  const playback = window.__mixx_playbackState || {};
  const rec = window.__mixx_recordState || {};
  
  if (!window.__mixx_takeMemory) {
    window.__mixx_takeMemory = [];
  }
  
  // Get recording start time (from recordStart or last punch)
  const start = rec.recordStart || (rec.recording ? performance.now() : null);
  if (!start) return null; // No active recording to record
  
  const end = performance.now();
  const duration = end - start;
  
  // Get region info from playback state or punch history
  const punches = window.__mixx_punchHistory || [];
  const lastPunch = punches.length > 0 ? punches[punches.length - 1] : null;
  
  const memory: TakeMemory = {
    startTime: start,
    endTime: end,
    duration,
    regionStart: playback.regionStart ?? lastPunch?.cursor ?? playback.cursor ?? 0,
    regionEnd: playback.regionEnd ?? playback.cursor ?? playback.regionStart ?? 0,
    barPosition: playback.bar ?? Math.floor((playback.cursor ?? 0) / (60 / 120)), // Assume 120 BPM default
    flowDuringTake: window.__primeBrainInstance?.state?.flow ?? 0.5,
    hushEvents: rec.hush ? 1 : 0,
    breathInMs: rec.lastBreathMs ?? 0,
  };
  
  window.__mixx_takeMemory.push(memory);
  
  // Keep last 10 takes (enough to understand patterns, not so many it slows down)
  if (window.__mixx_takeMemory.length > 10) {
    window.__mixx_takeMemory.shift();
  }
  
  return memory;
}

/**
 * Analyze take memory to predict smart punch points.
 * 
 * If user records at bar 17 three times, the Studio starts
 * dropping punch markers at 16.4 automatically.
 */
export function predictPunchPoint(takes: TakeMemory[]): number | null {
  if (takes.length < 2) return null;
  
  // Group takes by bar position
  const barGroups = new Map<number, TakeMemory[]>();
  takes.forEach(take => {
    const bar = Math.floor(take.barPosition);
    if (!barGroups.has(bar)) {
      barGroups.set(bar, []);
    }
    barGroups.get(bar)!.push(take);
  });
  
  // Find bar position with most takes (user's favorite punch spot)
  let maxCount = 0;
  let favoriteBar = 0;
  barGroups.forEach((groupTakes, bar) => {
    if (groupTakes.length > maxCount) {
      maxCount = groupTakes.length;
      favoriteBar = bar;
    }
  });
  
  if (maxCount < 2) return null; // Not enough pattern
  
  // Predict punch point slightly before favorite bar (pre-roll)
  const avgRegionStart = barGroups.get(favoriteBar)!
    .reduce((sum, take) => sum + take.regionStart, 0) / maxCount;
  
  // Return position 0.4 bars before (smart pre-roll)
  return avgRegionStart - (0.4 * (60 / 120)); // Assume 120 BPM
}

/**
 * Analyze take memory for auto-comp awareness.
 * 
 * If user redoes the first word 3 times, the Studio
 * prioritizes that region visually.
 */
export function getCompPriorityRegions(takes: TakeMemory[]): Array<{
  start: number;
  end: number;
  priority: number; // 0-1, higher = more likely to need comping
  redoCount: number;
}> {
  if (takes.length < 2) return [];
  
  // Group takes by region overlap
  const regions: Array<{ start: number; end: number; count: number }> = [];
  
  takes.forEach(take => {
    // Check if this take overlaps with existing regions
    let found = false;
    for (const region of regions) {
      const overlap = 
        take.regionStart < region.end && 
        take.regionEnd > region.start;
      
      if (overlap) {
        region.start = Math.min(region.start, take.regionStart);
        region.end = Math.max(region.end, take.regionEnd);
        region.count++;
        found = true;
        break;
      }
    }
    
    if (!found) {
      regions.push({
        start: take.regionStart,
        end: take.regionEnd,
        count: 1,
      });
    }
  });
  
  // Convert to priority regions (more redos = higher priority)
  return regions
    .filter(r => r.count > 1) // Only regions with multiple takes
    .map(r => ({
      start: r.start,
      end: r.end,
      priority: Math.min(r.count / 5, 1.0), // Cap at 1.0
      redoCount: r.count,
    }))
    .sort((a, b) => b.priority - a.priority); // Highest priority first
}

/**
 * Analyze take memory for flow anticipation.
 * 
 * If user's takes are usually 2.8-3.2 seconds long,
 * the Studio smooths crossfades accordingly.
 */
export function analyzeTakePatterns(takes: TakeMemory[]): {
  avgDuration: number; // Average take duration in seconds
  durationRange: { min: number; max: number }; // Duration range in seconds
  avgBreathTime: number; // Average time to first breath in seconds
  avgFlow: number; // Average flow during takes
  redoFrequency: number; // How often user redoes (0-1)
  barAlignmentPreference: number; // Preferred bar position (0-16)
} {
  if (takes.length === 0) {
    return {
      avgDuration: 3.0,
      durationRange: { min: 2.0, max: 4.0 },
      avgBreathTime: 0.5,
      avgFlow: 0.6,
      redoFrequency: 0,
      barAlignmentPreference: 0,
    };
  }
  
  const durations = takes.map(t => t.duration / 1000); // Convert to seconds
  const breathTimes = takes.filter(t => t.breathInMs > 0).map(t => t.breathInMs / 1000);
  const flows = takes.map(t => t.flowDuringTake);
  
  // Calculate average duration
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  // Calculate duration range
  const durationRange = {
    min: Math.min(...durations),
    max: Math.max(...durations),
  };
  
  // Calculate average breath time
  const avgBreathTime = breathTimes.length > 0
    ? breathTimes.reduce((a, b) => b + a, 0) / breathTimes.length
    : 0.5;
  
  // Calculate average flow
  const avgFlow = flows.reduce((a, b) => a + b, 0) / flows.length;
  
  // Calculate redo frequency (takes in same region)
  const regionGroups = new Map<string, number>();
  takes.forEach(take => {
    const regionKey = `${Math.floor(take.regionStart)}-${Math.floor(take.regionEnd)}`;
    regionGroups.set(regionKey, (regionGroups.get(regionKey) || 0) + 1);
  });
  const redoCount = Array.from(regionGroups.values()).filter(c => c > 1).length;
  const redoFrequency = redoCount / takes.length;
  
  // Calculate bar alignment preference (most common bar position)
  const barCounts = new Map<number, number>();
  takes.forEach(take => {
    const bar = Math.floor(take.barPosition);
    barCounts.set(bar, (barCounts.get(bar) || 0) + 1);
  });
  let maxCount = 0;
  let preferredBar = 0;
  barCounts.forEach((count, bar) => {
    if (count > maxCount) {
      maxCount = count;
      preferredBar = bar;
    }
  });
  
  return {
    avgDuration,
    durationRange,
    avgBreathTime,
    avgFlow,
    redoFrequency,
    barAlignmentPreference: preferredBar,
  };
}

/**
 * Get smart pre-roll and post-roll based on take memory.
 * 
 * Adapts to user's typical take length and breath patterns.
 */
export function getSmartRolls(takes: TakeMemory[]): {
  preRoll: number; // Seconds
  postRoll: number; // Seconds
  smoothing: number; // Seconds
} {
  const patterns = analyzeTakePatterns(takes);
  
  // Pre-roll: Based on breath time + a bit of buffer
  const preRoll = Math.max(0.3, Math.min(1.5, patterns.avgBreathTime + 0.2));
  
  // Post-roll: Based on typical take length (5% of average duration)
  const postRoll = Math.max(0.2, Math.min(0.8, patterns.avgDuration * 0.05));
  
  // Smoothing: Based on duration range (more variation = more smoothing)
  const durationVariance = patterns.durationRange.max - patterns.durationRange.min;
  const smoothing = Math.max(0.05, Math.min(0.2, durationVariance * 0.1));
  
  return { preRoll, postRoll, smoothing };
}

/**
 * Detect if user is redoing a take (same region, multiple attempts).
 */
export function isRedoTake(takes: TakeMemory[], currentTake: TakeMemory): boolean {
  if (takes.length === 0) return false;
  
  // Check if current take overlaps with previous takes
  return takes.some(prevTake => {
    const overlap = 
      currentTake.regionStart < prevTake.regionEnd &&
      currentTake.regionEnd > prevTake.regionStart;
    
    // Also check if it's within 1 bar of previous take
    const barDistance = Math.abs(currentTake.barPosition - prevTake.barPosition);
    
    return overlap || barDistance < 1;
  });
}

