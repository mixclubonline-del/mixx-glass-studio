/**
 * Performance Mode Hook
 * 
 * Detects when the Studio enters Performance Mode (vocal recording workflow).
 * Performance Mode is activated when:
 * - A track is armed
 * - Recording is enabled
 * - Mic input is active
 * - HUSH is listening
 * - ALS temperature rises
 * - Playback or count-in is active
 * 
 * During Performance Mode:
 * - ALS becomes a vocal meter + stability bar
 * - Prime Brain silences all suggestions
 * - SessionCore reduces UI animation noise
 * - Precision-locked latency
 * - Active monitoring enhancements
 * - Real-time take awareness
 */

// No React hooks needed - reads directly from window globals

declare global {
  interface Window {
    __mixx_recordState?: {
      recording: boolean;
      armedTrack: boolean;
      noiseFloor: number;
      threshold?: number;
    };
    __mixx_playbackState?: {
      playing: boolean;
      looping: boolean;
    };
  }
}

export interface PerformanceModeState {
  isPerformance: boolean;
  isArmed: boolean;
  isRecording: boolean;
  isHushActive: boolean;
  noiseFloor: number;
  threshold: number;
}

/**
 * Detect Performance Mode from current session state.
 * Returns state object for use in Flow Loop and components.
 * 
 * Note: This reads directly from window globals, so it's always current.
 * Called every 40ms by the Flow Loop, so no memoization needed.
 */
export function usePerformanceMode(): PerformanceModeState {
  if (typeof window === 'undefined') {
    return {
      isPerformance: false,
      isArmed: false,
      isRecording: false,
      isHushActive: false,
      noiseFloor: 0,
      threshold: 0.2,
    };
  }

  const recordState = window.__mixx_recordState || {};
  const playbackState = window.__mixx_playbackState || {};
  
  const isArmed = !!recordState.armedTrack;
  const isRecording = !!recordState.recording;
  const noiseFloor = recordState.noiseFloor || 0;
  const threshold = recordState.threshold || 0.2;
  // Use explicit hush flag if available, otherwise compute
  const isHushActive = recordState.hush !== undefined 
    ? recordState.hush 
    : noiseFloor > threshold;
  const isPlaying = !!playbackState.playing;
  
  // Performance Mode activation conditions
  const isPerformance = 
    isArmed || 
    isRecording || 
    (isHushActive && isPlaying) ||
    (isArmed && isPlaying);

  return {
    isPerformance,
    isArmed,
    isRecording,
    isHushActive,
    noiseFloor,
    threshold,
  };
}

