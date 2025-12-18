/**
 * Prime Brain Overlay Sync
 * 
 * Syncs Flow Dock with Prime Brain guidance and state.
 * Shows contextual hints and meta-feedback above dock.
 */

// Window interface extensions moved to src/types/globals.d.ts

export interface PrimeBrainState {
  guidance: string;
  active: boolean;
  showOverlay: boolean;
}

/**
 * Get current Prime Brain state
 */
export function getPrimeBrainState(): PrimeBrainState {
  const brain = (window as any).__primeBrain || (window as any).__primeBrainInstance?.state || {};
  
  return {
    guidance: brain.guidance || "",
    active: brain.active || false,
    showOverlay: Boolean(brain.guidance && brain.guidance.length > 0),
  };
}

/**
 * Format guidance for dock display
 */
export function formatGuidanceForDock(guidance: string, maxLength: number = 60): string {
  if (guidance.length <= maxLength) return guidance;
  return guidance.substring(0, maxLength - 3) + "...";
}

