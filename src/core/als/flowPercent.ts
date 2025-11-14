/**
 * Flow % Model
 * 
 * Layer 6.5 of Flow Pulse → ALS Thermal Sync Engine.
 * FLOW % = combined emotional-intensity reading.
 * 
 * This is the global "vibe meter" that drives all adaptive behaviors.
 */

export interface FlowMetrics {
  pulse: number; // Pulse % (0-100)
  momentum: number; // Momentum score (0-100)
  pressure: number; // Pressure score (0-100)
  harmony: number; // Harmony score (0-100)
}

/**
 * Compute Flow % from combined metrics.
 * 
 * Flow % = weighted combination of all emotional-intensity signals.
 * 
 * @param metrics - Flow metrics object
 * @returns Flow percentage (0-100)
 */
export function computeFlowPercent(metrics: FlowMetrics): number {
  const { pulse, momentum, pressure, harmony } = metrics;
  
  // Weighted combination:
  // - Pulse: 40% (rhythmic + tonal intensity)
  // - Momentum: 25% (rhythm intensity)
  // - Pressure: 20% (psychoacoustic tension)
  // - Harmony: 15% (tonal clarity)
  const score =
    (pulse * 0.4) +
    (momentum * 0.25) +
    (pressure * 0.2) +
    (harmony * 0.15);
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute Flow % with adaptive weighting based on content type.
 * 
 * @param metrics - Flow metrics object
 * @param contentType - Content type ('vocal', 'beat', 'twotrack', etc.)
 * @returns Flow percentage (0-100) with content-aware weighting
 */
export function computeFlowPercentAdaptive(
  metrics: FlowMetrics,
  contentType?: string
): number {
  let weights = {
    pulse: 0.4,
    momentum: 0.25,
    pressure: 0.2,
    harmony: 0.15,
  };
  
  // Adjust weights based on content type
  if (contentType === 'vocal') {
    // Vocals: emphasize harmony and pressure
    weights = {
      pulse: 0.3,
      momentum: 0.2,
      pressure: 0.3,
      harmony: 0.2,
    };
  } else if (contentType === 'beat') {
    // Beats: emphasize momentum and pulse
    weights = {
      pulse: 0.5,
      momentum: 0.35,
      pressure: 0.1,
      harmony: 0.05,
    };
  } else if (contentType === 'twotrack') {
    // Two-track: balanced emphasis
    weights = {
      pulse: 0.35,
      momentum: 0.3,
      pressure: 0.2,
      harmony: 0.15,
    };
  }
  
  const score =
    (metrics.pulse * weights.pulse) +
    (metrics.momentum * weights.momentum) +
    (metrics.pressure * weights.pressure) +
    (metrics.harmony * weights.harmony);
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

