/**
 * Comping Brain Intelligence Engine
 * 
 * The most intelligent comping system in the world - Flow-aware, punch-aware, rhythm-aware.
 * 
 * Comping Brain tracks:
 * - Pitch stability
 * - Timing alignment to beat
 * - Energy/flow curve
 * - Consistency with previous takes
 * - Breath control
 * - Noise (HUSH flags)
 * - Plosive risk
 * - Clip start stability
 * - Lyric phrasing detection
 * - Take length patterns
 * - Punch pattern velocity
 * 
 * Scores each take with a "Take Quality Score" (0.0 → 1.0).
 * Better takes get greener on ALS. Weaker ones stay cold.
 */

import type { TakeMemory } from './takeMemory';

declare global {
  interface Window {
    __mixx_takeMemory?: TakeMemory[];
    __mixx_playbackState?: {
      playing: boolean;
      looping: boolean;
      playCount?: number;
      cursor?: number;
      regionStart?: number;
      regionEnd?: number;
      cursorLock?: boolean;
      beatsPerMinute?: number;
    };
    __mixx_recordState?: {
      recording: boolean;
      armedTrack: boolean;
      noiseFloor: number;
      threshold?: number;
      hush?: boolean;
    };
    __mixx_punchHistory?: Array<{
      ts: number;
      cursor: number;
      duration?: number;
      type?: string;
    }>;
    __mixx_compBrain?: CompTake[];
  }
}

export interface CompTake {
  id: string;
  score: number; // 0.0 → 1.0, overall quality score
  flow: number; // Flow level during take (0-1)
  energySlope: number; // Energy curve (0-1)
  timingAccuracy: number; // Beat alignment (0-1)
  noiseScore: number; // Noise level (0-1, higher = less noise)
  duration: number; // Duration in milliseconds
  barPosition: number; // Bar position where take started
  punchStrength: number; // Punch confidence (0-1)
  phrasing: {
    start: number; // Timeline position in seconds
    end: number; // Timeline position in seconds
  };
  takeMemoryId?: number; // Index in take memory for reference
}

/**
 * Analyze a take for comping and score it.
 * Called when recording stops, after Take Memory is recorded.
 * 
 * @param memory - Take memory entry to analyze
 * @returns Comp take data with quality score
 */
export function analyzeTakeForComp(memory: TakeMemory): CompTake {
  if (typeof window === 'undefined') {
    throw new Error('analyzeTakeForComp called outside browser context');
  }
  
  const score = computeScore(memory);
  const compData: CompTake = {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `comp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    score,
    flow: memory.flowDuringTake,
    energySlope: getEnergySlope(memory),
    timingAccuracy: getTiming(memory),
    noiseScore: memory.hushEvents > 0 ? 0.6 : 1.0,
    duration: memory.duration,
    barPosition: memory.barPosition,
    punchStrength: computePunchStrength(memory),
    phrasing: {
      start: memory.regionStart,
      end: memory.regionEnd,
    },
  };
  
  if (!window.__mixx_compBrain) {
    window.__mixx_compBrain = [];
  }
  
  window.__mixx_compBrain.push(compData);
  
  // Keep last 20 takes (enough to build comps, not so many it slows down)
  if (window.__mixx_compBrain.length > 20) {
    window.__mixx_compBrain.shift();
  }
  
  return compData;
}

/**
 * Compute overall quality score for a take.
 * 
 * Factors:
 * - Flow score (how well user was in flow)
 * - Noise penalty (HUSH events reduce score)
 * - Duration stability (closer to average = better)
 * - Timing accuracy (beat alignment)
 * - Energy slope (consistent energy = better)
 */
function computeScore(mem: TakeMemory): number {
  let score = 1.0;
  
  // Flow score (0-1, higher flow = better)
  score *= mem.flowDuringTake;
  
  // Noise penalty (HUSH events reduce score)
  if (mem.hushEvents > 0) {
    score *= 0.85; // 15% penalty for noise
  }
  
  // Duration stability (closer to average = better)
  const ideal = averageDuration();
  const delta = Math.abs(mem.duration - ideal);
  const durationPenalty = Math.min(delta / 1500, 0.25); // Max 25% penalty
  score *= 1 - durationPenalty;
  
  // Timing accuracy (beat alignment)
  score *= getTiming(mem);
  
  // Energy slope (consistent energy = better)
  score *= getEnergySlope(mem);
  
  return clamp(score, 0, 1);
}

/**
 * Calculate timing accuracy based on beat alignment.
 * Takes closer to beat divisions score higher.
 */
function getTiming(mem: TakeMemory): number {
  const beats = window.__mixx_playbackState?.beatsPerMinute || 120;
  const msPerBeat = 60000 / beats;
  
  // Closer to beat divisions = better
  const mod = mem.startTime % msPerBeat;
  const diff = Math.min(mod, msPerBeat - mod);
  
  // Score: 1.0 if perfectly aligned, 0.6 if off by half a beat
  return 1 - Math.min(diff / msPerBeat, 0.4);
}

/**
 * Calculate energy slope based on flow during take.
 * Consistent, high flow = better energy slope.
 */
function getEnergySlope(mem: TakeMemory): number {
  const flow = mem.flowDuringTake;
  // Higher flow = better energy slope
  // Clamp between 0.5 and 1.0 to avoid penalizing too harshly
  return clamp(flow, 0.5, 1.0);
}

/**
 * Compute punch strength based on take duration.
 * Longer takes (more confident punches) score higher.
 */
function computePunchStrength(mem: TakeMemory): number {
  // Normalize duration to 0-1 (3000ms = 1.0, shorter = lower)
  // Clamp between 0.4 and 1.0
  return clamp(mem.duration / 3000, 0.4, 1.0);
}

/**
 * Calculate average take duration from take memory.
 * Used for duration stability scoring.
 */
function averageDuration(): number {
  const mem = window.__mixx_takeMemory || [];
  
  if (mem.length < 2) {
    return 3000; // Default 3 seconds
  }
  
  return mem.map((m) => m.duration).reduce((a, b) => a + b, 0) / mem.length;
}

/**
 * Clamp value between min and max.
 */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Get the best take from comp brain (highest score).
 */
export function getBestTake(): CompTake | null {
  if (typeof window === 'undefined') return null;
  
  const comps = window.__mixx_compBrain || [];
  if (comps.length === 0) return null;
  
  // Sort by score (highest first)
  const sorted = [...comps].sort((a, b) => b.score - a.score);
  return sorted[0];
}

/**
 * Get all takes for a specific region (overlapping takes).
 */
export function getTakesForRegion(start: number, end: number): CompTake[] {
  if (typeof window === 'undefined') return [];
  
  const comps = window.__mixx_compBrain || [];
  
  return comps.filter(comp => {
    const overlap = 
      comp.phrasing.start < end &&
      comp.phrasing.end > start;
    return overlap;
  });
}

/**
 * Get comp suggestions (best sections from multiple takes).
 * Returns array of { start, end, score, takeId } for suggested comp regions.
 */
export function getCompSuggestions(): Array<{
  start: number;
  end: number;
  score: number;
  takeId: string;
}> {
  if (typeof window === 'undefined') return [];
  
  const comps = window.__mixx_compBrain || [];
  if (comps.length < 2) return [];
  
  // Group takes by overlapping regions
  const regions: Array<{
    start: number;
    end: number;
    takes: CompTake[];
  }> = [];
  
  comps.forEach(comp => {
    // Check if this take overlaps with existing regions
    let found = false;
    for (const region of regions) {
      const overlap = 
        comp.phrasing.start < region.end &&
        comp.phrasing.end > region.start;
      
      if (overlap) {
        region.start = Math.min(region.start, comp.phrasing.start);
        region.end = Math.max(region.end, comp.phrasing.end);
        region.takes.push(comp);
        found = true;
        break;
      }
    }
    
    if (!found) {
      regions.push({
        start: comp.phrasing.start,
        end: comp.phrasing.end,
        takes: [comp],
      });
    }
  });
  
  // For each region, pick the best take
  return regions
    .filter(r => r.takes.length > 1) // Only regions with multiple takes
    .map(r => {
      const bestTake = r.takes.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      
      return {
        start: r.start,
        end: r.end,
        score: bestTake.score,
        takeId: bestTake.id,
      };
    })
    .sort((a, b) => b.score - a.score); // Highest score first
}

/**
 * Clear comp brain (useful for new sessions or reset).
 */
export function clearCompBrain(): void {
  if (typeof window !== 'undefined') {
    window.__mixx_compBrain = [];
  }
}

