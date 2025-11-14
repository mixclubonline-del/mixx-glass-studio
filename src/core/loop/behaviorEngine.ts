/**
 * Behavior Engine
 * 
 * Interprets session signals into Prime Brain behavior state:
 * - flow (0-1): Creative momentum
 * - pulse (0-1): Rhythmic energy
 * - momentum (0-1): Overall activity level
 * - tension (0-1): Pressure/stress indicators
 * - hushWarnings: Noise detection flags
 * - mode: idle | flow | edit | record | burst
 */

export type FlowMode = 'idle' | 'flow' | 'edit' | 'record' | 'burst' | 'punch';

export interface BehaviorState {
  flow: number; // 0-1
  pulse: number; // 0-1
  momentum: number; // 0-1
  tension: number; // 0-1
  hushWarnings: string[];
  mode: FlowMode;
}

import type { SessionSignals } from './gatherSessionSignals';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Compute behavior state from session signals.
 * This is the "feel" layer - the logic that translates signals into behavior.
 * 
 * Performance Mode (vocal recording) gets special handling:
 * - Flow tracks emotional steadiness
 * - Pulse tracks anticipation/breath control
 * - Tension rises on noise
 * - Mode switches to 'record'
 */
export function computeBehavior(signals: SessionSignals): BehaviorState {
  const isPerformanceMode = signals.recording || signals.armedTrack;
  
  // Flow: Creative momentum based on signals
  // In Performance Mode: Flow tracks emotional steadiness
  let flow = 0;
  if (isPerformanceMode) {
    // Performance Mode: Flow ≈ emotional steadiness
    // Start at moderate level, adjust based on stability
    flow = 0.55;
    if (signals.hush) {
      // Noise detected - reduce flow (instability)
      flow -= 0.15;
    }
    if (signals.playing) {
      // Playback active - increase flow (momentum)
      flow += 0.2;
    }
  } else if (signals.playing) {
    flow = 0.5;
    if (signals.editing) flow += 0.3;
    if (signals.looping) flow += 0.2;
  } else if (signals.editing) {
    flow = 0.4;
    if (signals.precision) flow += 0.2;
  }
  if (signals.creativeBurst) flow = Math.max(flow, 0.8);
  if (signals.flowing) flow = Math.max(flow, 0.6);
  flow = clamp01(flow);
  
  // Pulse: Rhythmic energy from playback
  // In Performance Mode: Pulse tracks anticipation/breath control
  let pulse = 0;
  if (isPerformanceMode) {
    // Performance Mode: Pulse ≈ anticipation / breath control
    pulse = 0.5;
    if (signals.hush) {
      // Noise detected - increase pulse (anticipation/anxiety)
      pulse += 0.1;
    }
    if (signals.playing) {
      // Playback active - increase pulse (breath sync)
      pulse += 0.2;
    }
  } else if (signals.playing) {
    pulse = 0.6;
    if (signals.looping) pulse += 0.2;
    if (signals.auditionBurst) pulse += 0.2;
  } else {
    pulse = signals.editing ? 0.3 : 0.1;
  }
  pulse = clamp01(pulse);
  
  // Momentum: Overall activity level
  let momentum = 0;
  if (signals.editing) momentum += 0.4;
  if (signals.zoomBurst) momentum += 0.3;
  if (signals.playing) momentum += 0.3;
  if (signals.creativeBurst) momentum += 0.3;
  if (signals.viewSwitchBurst) momentum += 0.2;
  momentum = clamp01(momentum);
  
  // Tension: Pressure/stress indicators
  // In Performance Mode: Tension rises on noise, plosive risk, instability
  let tension = 0;
  if (isPerformanceMode) {
    // Performance Mode: Tension tracks noise, plosive risk, instability
    if (signals.hush) {
      tension += 0.4; // Noise detected - significant tension
    }
    if (signals.recording) {
      tension += 0.2; // Recording active - baseline tension
    }
    // Add tension for precision editing during performance (vocal comping)
    if (signals.precision) tension += 0.2;
  } else {
    // Normal mode tension
    if (signals.precision) tension += 0.3;
    if (signals.hunting) tension += 0.4;
    if (signals.hush) tension += 0.3;
    if (signals.recording) tension += 0.2;
  }
  tension = clamp01(tension);
  
  // Hush warnings
  // In Performance Mode: More detailed noise warnings
  const hushWarnings: string[] = [];
  if (signals.hush) {
    if (isPerformanceMode) {
      hushWarnings.push('Mic noise detected');
    } else {
      hushWarnings.push('Noise detected');
    }
  }
  if (signals.recording && signals.hush) {
    hushWarnings.push('Hush active during recording');
  }
  if (isPerformanceMode && signals.hush && !signals.playing) {
    hushWarnings.push('Hold still - mic catching noise');
  }
  
  // Mode derivation
  // Punch Mode takes highest precedence (most specific)
  // Then Performance Mode, then other modes
  let mode: FlowMode = 'idle';
  
  // Check for Punch Mode (will be set externally if conditions met)
  // Punch Mode is detected in usePunchMode() and set via behavior state
  // For now, we'll let the Flow Loop set punch mode based on usePunchMode()
  
  if (isPerformanceMode) {
    // Performance Mode: 'record' mode (can be upgraded to 'punch' by Flow Loop)
    mode = 'record';
  } else if (signals.recording || signals.armedTrack) {
    mode = 'record';
  } else if (signals.creativeBurst || (signals.flowing && signals.editing)) {
    mode = 'burst';
  } else if (signals.editing || signals.precision) {
    mode = 'edit';
  } else if (signals.flowing || signals.playing) {
    mode = 'flow';
  }
  
  return {
    flow,
    pulse,
    momentum,
    tension,
    hushWarnings,
    mode,
  };
}
