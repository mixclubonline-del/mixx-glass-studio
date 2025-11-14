/**
 * UI Ghost Mode Layering
 * 
 * Previous mode fades behind current mode for 200ms.
 * Creates smooth visual continuity during transitions.
 */

import type { DockMode } from "./types";

export interface GhostLayer {
  mode: DockMode;
  opacity: number;
  timestamp: number;
}

let ghostLayer: GhostLayer | null = null;
const GHOST_DURATION = 200; // ms

/**
 * Set ghost layer from previous mode
 */
export function setGhostLayer(mode: DockMode): void {
  ghostLayer = {
    mode,
    opacity: 0.3,
    timestamp: Date.now(),
  };
}

/**
 * Update ghost layer opacity (call in animation loop)
 */
export function updateGhostLayer(): GhostLayer | null {
  if (!ghostLayer) return null;
  
  const elapsed = Date.now() - ghostLayer.timestamp;
  const progress = elapsed / GHOST_DURATION;
  
  if (progress >= 1) {
    ghostLayer = null;
    return null;
  }
  
  // Fade out
  ghostLayer.opacity = 0.3 * (1 - progress);
  
  return ghostLayer;
}

/**
 * Get current ghost layer
 */
export function getGhostLayer(): GhostLayer | null {
  return ghostLayer;
}

/**
 * Clear ghost layer immediately
 */
export function clearGhostLayer(): void {
  ghostLayer = null;
}

