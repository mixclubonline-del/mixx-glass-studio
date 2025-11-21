/**
 * SAFE ANALYSER TAP - Prevents Feedback Loops
 * 
 * Creates analyser taps safely using GainNode to prevent feedback loops
 * and ensure proper signal routing.
 * 
 * Flow Doctrine: Safe audio routing
 * Reductionist Engineering: Proper tap points
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

import { audioGraphGuard } from './audioGraphGuard';

interface AnalyserTap {
  analyser: AnalyserNode;
  tapGain: GainNode;
  disconnect: () => void;
}

/**
 * Create a safe analyser tap from an audio node.
 * Uses a GainNode to create a proper monitoring tap without breaking the signal chain.
 */
export function createSafeAnalyserTap(
  sourceNode: AudioNode,
  audioContext: BaseAudioContext
): AnalyserTap {
  // Create a gain node for the tap (unity gain, just for routing)
  const tapGain = audioContext.createGain();
  tapGain.gain.value = 1.0;

  // Create analyser
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;

  // Connect: source -> tapGain -> analyser
  // The source's original connections remain intact
  sourceNode.connect(tapGain);
  tapGain.connect(analyser);

  return {
    analyser,
    tapGain,
    disconnect: () => {
      try {
        sourceNode.disconnect(tapGain);
        tapGain.disconnect(analyser);
      } catch (err) {
        // Ignore disconnect errors (node may already be disconnected)
      }
    },
  };
}

/**
 * Create a safe analyser tap that doesn't break existing connections.
 * This uses a ChannelSplitter approach for true parallel monitoring.
 */
export function createParallelAnalyserTap(
  sourceNode: AudioNode,
  audioContext: BaseAudioContext
): AnalyserTap {
  // Check guard before creating analyser
  if (audioGraphGuard.checkOverload()) {
    throw new Error('[SAFE ANALYSER TAP] System overloaded, cannot create analyser');
  }

  // Create analyser
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;

  // Register with guard
  if (!audioGraphGuard.registerAnalyser(analyser)) {
    // Failed to register, clean up
    try {
      analyser.disconnect();
    } catch {
      // Ignore
    }
    throw new Error('[SAFE ANALYSER TAP] Too many analysers, cannot create new one');
  }

  // Connect analyser in parallel (doesn't break existing connections)
  // Analysers are read-only, so this is safe
  try {
    sourceNode.connect(analyser);
  } catch (err) {
    // Connection failed, unregister and throw
    audioGraphGuard.unregisterAnalyser(analyser);
    throw new Error(`[SAFE ANALYSER TAP] Failed to connect analyser: ${err}`);
  }

  // Return with proper cleanup
  return {
    analyser,
    tapGain: audioContext.createGain(), // Dummy gain for interface compatibility
    disconnect: () => {
      try {
        sourceNode.disconnect(analyser);
      } catch (err) {
        // Ignore disconnect errors
      }
      audioGraphGuard.unregisterAnalyser(analyser);
    },
  };
}

