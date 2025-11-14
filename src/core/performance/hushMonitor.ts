/**
 * HUSH Monitor
 * 
 * The "ears of the Studio" - detects noise events and updates recording state.
 * HUSH never stops recording - it adjusts Flow behavior and warns silently.
 * 
 * HUSH triggers include:
 * - noiseFloor > threshold
 * - peakToPeak > deltaThreshold
 * - sudden spikes > 10ms
 * 
 * HUSH sends:
 * - hushFlags++ (to ALS)
 * - tension ↑ (to Prime Brain)
 * - ALS flashes COLD → WARM micro pulse
 * - PrimeBrain enters "performance-sensitive" mode
 * - Bloom stays silent
 */

declare global {
  interface Window {
    __mixx_recordState?: {
      recording: boolean;
      armedTrack: boolean;
      noiseFloor: number;
      threshold?: number;
      hush?: boolean;
    };
  }
}

/**
 * Monitor HUSH noise floor and update recording state.
 * Called from audio analysis loop (HUSH system feedback).
 * 
 * @param noiseFloor - Current noise floor level (0-1)
 * @param threshold - Noise threshold (default 0.22)
 * @returns true if HUSH is active (noise detected)
 */
export function monitorHush(noiseFloor: number, threshold: number = 0.22): boolean {
  if (typeof window === 'undefined') return false;
  
  if (!window.__mixx_recordState) {
    window.__mixx_recordState = {
      recording: false,
      armedTrack: false,
      noiseFloor: 0,
      threshold,
    };
  }
  
  const hush = noiseFloor > threshold;
  
  // Update recording state
  window.__mixx_recordState.hush = hush;
  window.__mixx_recordState.noiseFloor = noiseFloor;
  window.__mixx_recordState.threshold = threshold;
  
  return hush;
}

/**
 * Detect sudden noise spikes (transient detection)
 * Useful for detecting pops, plosives, handling noise
 */
export function detectNoiseSpike(
  currentLevel: number,
  previousLevel: number,
  spikeThreshold: number = 0.15
): boolean {
  const delta = Math.abs(currentLevel - previousLevel);
  return delta > spikeThreshold;
}

/**
 * Calculate peak-to-peak noise variation
 * Useful for detecting inconsistent noise (fan, cable crackle)
 */
export function calculatePeakToPeak(levels: number[]): number {
  if (levels.length === 0) return 0;
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  return max - min;
}

