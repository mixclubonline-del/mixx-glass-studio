/**
 * Audio Level Detector
 * 
 * Checks if there's actual audio playing by reading from master analyser.
 * This ensures Prime Brain, ALS, and all components are contextual -
 * they only show values when there's actual sound.
 * 
 * This is the "listening" part of the closed holistic ecosystem.
 */

/**
 * Check if there's actual audio playing by reading from analyser.
 * 
 * @param analyser - AnalyserNode to read from (master chain analyser)
 * @param threshold - Minimum RMS level to consider as "audio playing" (default 0.001)
 * @returns true if audio is detected, false otherwise
 */
export function hasAudioPlaying(
  analyser: AnalyserNode | null,
  threshold: number = 0.001
): boolean {
  if (!analyser) {
    return false;
  }
  
  try {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Compute RMS from frequency data
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = dataArray[i] / 255;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    
    return rms > threshold;
  } catch (error) {
    // If analyser is not ready, assume no audio
    return false;
  }
}

/**
 * Get current audio level (RMS) from analyser.
 * 
 * @param analyser - AnalyserNode to read from
 * @returns RMS level (0-1), or 0 if analyser is not available
 */
export function getAudioLevel(analyser: AnalyserNode | null): number {
  if (!analyser) {
    return 0;
  }
  
  try {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Compute RMS from frequency data
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = dataArray[i] / 255;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    
    return Math.min(1, rms * 2); // Normalize to 0-1 range
  } catch (error) {
    return 0;
  }
}

/**
 * Check if playback state matches actual audio.
 * This ensures components only activate when there's real sound,
 * not just when playback is "active" but silent.
 * 
 * @param playbackState - Playback state from signals
 * @param analyser - Master chain analyser
 * @returns true if playback is active AND there's actual audio
 */
export function isActuallyPlaying(
  playbackState: { playing: boolean },
  analyser: AnalyserNode | null
): boolean {
  // Must be playing AND have actual audio
  return playbackState.playing && hasAudioPlaying(analyser);
}

