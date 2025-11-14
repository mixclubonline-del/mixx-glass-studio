/**
 * Auto-Punch Prediction Engine
 * 
 * The most intelligent vocal punch system in the world.
 * 
 * Auto-Punch predicts:
 * - When you want to punch
 * - Where the punch should land
 * - Your punch timing/class
 * - Your take length
 * - Your breath cycle
 * - Your bar timing
 * - Your redo rhythm
 * - Your "energy slopes"
 * - Your loop-based punch habits
 * 
 * Creates a ghost red punch region BEFORE you even hit record.
 * That's what an engineer does. Now the Studio does it too.
 */

declare global {
  interface Window {
    __mixx_takeMemory?: Array<{
      startTime: number;
      endTime: number;
      regionStart: number;
      regionEnd: number;
      duration: number;
      breathInMs: number;
      barPosition: number;
      flowDuringTake: number;
      hushEvents: number;
    }>;
    __mixx_punchHistory?: Array<{
      ts: number;
      cursor: number;
      duration?: number;
      type?: string;
    }>;
    __mixx_playbackState?: {
      playing: boolean;
      looping: boolean;
      playCount?: number;
      cursor?: number;
      regionStart?: number;
      regionEnd?: number;
      cursorLock?: boolean;
    };
    __mixx_recordState?: {
      recording: boolean;
      armedTrack: boolean;
      noiseFloor: number;
      threshold?: number;
      hush?: boolean;
    };
    __mixx_autoPunch?: {
      start: number; // Timeline position in seconds
      end: number; // Timeline position in seconds
      duration: number; // Duration in seconds
      confidence: number; // 0-1, how confident the prediction is
    };
    __primeBrainInstance?: {
      state?: {
        flow?: number;
        pulse?: number;
        momentum?: number;
        tension?: number;
      };
    };
  }
}

export interface AutoPunchPrediction {
  start: number; // Timeline position in seconds
  end: number; // Timeline position in seconds
  duration: number; // Duration in seconds
  confidence: number; // 0-1, how confident the prediction is
}

/**
 * Predict auto-punch region based on:
 * 1. Take Memory (recent takes)
 * 2. Punch History (recent punches)
 * 3. Loop Region Behavior (looping patterns)
 * 4. Rhythm Prediction (Flow + Pulse + Momentum)
 * 
 * Auto-Punch is predicted when:
 * - You loop the same bars repeatedly
 * - You punch in the same zone twice
 * - Your flow rises while cursor stays still
 * - Your hesitation drops
 * - Punch Memory sees a pattern
 */
export function useAutoPunch(): { autoPunch: AutoPunchPrediction | null } {
  if (typeof window === 'undefined') {
    return { autoPunch: null };
  }
  
  const mem = window.__mixx_takeMemory || [];
  const punches = window.__mixx_punchHistory || [];
  const playback = window.__mixx_playbackState || {};
  const rec = window.__mixx_recordState || {};
  const brain = window.__primeBrainInstance?.state || {};
  
  // Need at least 2 takes to predict pattern
  if (mem.length < 2) {
    window.__mixx_autoPunch = undefined;
    return { autoPunch: null };
  }
  
  // Don't predict if already recording
  if (rec.recording) {
    window.__mixx_autoPunch = undefined;
    return { autoPunch: null };
  }
  
  // Don't predict if not armed
  if (!rec.armedTrack) {
    window.__mixx_autoPunch = undefined;
    return { autoPunch: null };
  }
  
  const last1 = mem[mem.length - 1];
  const last2 = mem[mem.length - 2];
  
  // Predict punch region from pattern
  const avgDuration = (last1.duration + last2.duration) / 2 / 1000; // Convert to seconds
  const avgStart = (last1.regionStart + last2.regionStart) / 2;
  
  // Flow-cadence anticipation
  const flow = brain.flow ?? 0;
  const momentum = brain.momentum ?? 0;
  const pulse = brain.pulse ?? 0;
  
  const cadenceBoost = flow > 0.7 && momentum > 0.65 ? 1 : 0;
  
  // Cursor locked region (1-4 bars, typical rap punch zone)
  const cursor = playback.cursor ?? 0;
  const nearCursor = Math.abs(cursor - last1.regionStart) < 2.0; // Within 2 seconds
  
  // Loop-based prediction (if looping, predict based on loop region)
  const isLooping = !!playback.looping;
  const loopRegionStart = playback.regionStart ?? 0;
  const loopRegionEnd = playback.regionEnd ?? 0;
  
  let predictedStart: number;
  let predictedEnd: number;
  let confidence = 0.5; // Base confidence
  
  if (isLooping && loopRegionEnd > loopRegionStart) {
    // Loop-based prediction: predict within loop region
    const loopDuration = loopRegionEnd - loopRegionStart;
    predictedStart = loopRegionStart + (cadenceBoost * 0.35);
    predictedEnd = Math.min(
      predictedStart + avgDuration + 0.35,
      loopRegionEnd
    );
    
    // Higher confidence if looping repeatedly
    const playCount = playback.playCount ?? 0;
    if (playCount >= 3) {
      confidence = Math.min(0.9, 0.5 + (playCount * 0.1));
    }
  } else {
    // Pattern-based prediction from take memory
    predictedStart = avgStart + (cadenceBoost * 0.35) - (nearCursor ? 0.25 : 0);
    predictedEnd = predictedStart + avgDuration + 0.35;
    
    // Increase confidence if pattern is strong
    if (mem.length >= 3) {
      const last3 = mem[mem.length - 3];
      const patternMatch = 
        Math.abs(last1.regionStart - last2.regionStart) < 1.0 &&
        Math.abs(last2.regionStart - last3.regionStart) < 1.0;
      
      if (patternMatch) {
        confidence = Math.min(0.85, confidence + 0.3);
      }
    }
  }
  
  // Check if punches are in same zone (increases confidence)
  if (punches.length >= 2) {
    const recentPunches = punches.slice(-3);
    const sameZone = recentPunches.every((p, i) => {
      if (i === 0) return true;
      return Math.abs(p.cursor - recentPunches[i - 1].cursor) < 1.0;
    });
    
    if (sameZone) {
      confidence = Math.min(0.9, confidence + 0.2);
    }
  }
  
  // Flow + momentum boost (user is in the zone)
  if (flow > 0.75 && momentum > 0.7 && pulse > 0.6) {
    confidence = Math.min(0.95, confidence + 0.15);
  }
  
  // Hesitation drop (cursor stays still, flow rises)
  if (nearCursor && flow > 0.7 && !playback.playing) {
    confidence = Math.min(0.9, confidence + 0.1);
  }
  
  const prediction: AutoPunchPrediction = {
    start: Math.max(0, predictedStart),
    end: Math.max(predictedStart + 0.5, predictedEnd), // Minimum 0.5s duration
    duration: Math.max(0.5, predictedEnd - predictedStart),
    confidence: Math.min(1.0, Math.max(0.3, confidence)), // Clamp between 0.3 and 1.0
  };
  
  // Only set prediction if confidence is above threshold
  if (confidence >= 0.4) {
    window.__mixx_autoPunch = prediction;
    return { autoPunch: prediction };
  } else {
    window.__mixx_autoPunch = undefined;
    return { autoPunch: null };
  }
}

/**
 * Clear auto-punch prediction (called when user manually punches or cancels)
 */
export function clearAutoPunch(): void {
  if (typeof window !== 'undefined') {
    window.__mixx_autoPunch = undefined;
  }
}

