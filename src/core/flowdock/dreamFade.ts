/**
 * Dream Fade Animation Acceleration Curve
 * 
 * Custom easing functions for smooth, Flow-aware transitions.
 * Based on cubic-bezier curves optimized for glass morphism UI.
 */

/**
 * Dream Fade easing curve
 * Smooth acceleration with gentle deceleration
 */
export const DREAM_FADE_EASING = "cubic-bezier(0.4, 0.0, 0.2, 1.0)";

/**
 * Pulse Carryover easing
 * Maintains momentum during mode transitions
 */
export const PULSE_CARRYOVER_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

/**
 * Ghost Mode easing
 * Fade-out for previous mode ghost layer
 */
export const GHOST_MODE_EASING = "cubic-bezier(0.55, 0.06, 0.68, 0.19)";

/**
 * Weight Shift easing
 * For expanding/contracting central elements
 */
export const WEIGHT_SHIFT_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * Compute transition duration based on mode priority
 */
export function getTransitionDuration(
  fromPriority: number,
  toPriority: number
): number {
  const priorityDiff = Math.abs(toPriority - fromPriority);
  
  // Higher priority changes = faster transition
  if (priorityDiff > 30) return 120; // Fast
  if (priorityDiff > 15) return 150; // Normal
  return 180; // Slow
}

/**
 * Get transition style object for React
 */
export function getDreamFadeTransition(
  duration: number = 150,
  delay: number = 0
): { transition: string; transitionDelay: string } {
  return {
    transition: `opacity ${duration}ms ${DREAM_FADE_EASING}, transform ${duration * 0.6}ms ${PULSE_CARRYOVER_EASING}`,
    transitionDelay: `${delay}ms`,
  };
}

