/**
 * Mode Priority Override Hooks
 * 
 * Allows manual override of intent detection for specific scenarios.
 * Useful for forced mode transitions or user preferences.
 */

import type { DockMode } from "./types";

export interface ModeOverride {
  mode: DockMode;
  priority: number;
  expiresAt?: number; // Timestamp
  reason?: string;
}

let activeOverride: ModeOverride | null = null;

/**
 * Set a mode override
 */
export function setModeOverride(
  mode: DockMode,
  durationMs: number = 5000,
  reason?: string
): void {
  activeOverride = {
    mode,
    priority: 1000, // Override always wins
    expiresAt: Date.now() + durationMs,
    reason,
  };
}

/**
 * Clear mode override
 */
export function clearModeOverride(): void {
  activeOverride = null;
}

/**
 * Get active override (if valid)
 */
export function getActiveOverride(): ModeOverride | null {
  if (!activeOverride) return null;
  
  // Check expiration
  if (activeOverride.expiresAt && Date.now() > activeOverride.expiresAt) {
    activeOverride = null;
    return null;
  }
  
  return activeOverride;
}

/**
 * Check if override should take precedence
 */
export function shouldUseOverride(detectedMode: DockMode): boolean {
  const override = getActiveOverride();
  return override !== null && override.mode !== detectedMode;
}

/**
 * Get mode with override applied
 */
export function applyModeOverride(detectedMode: DockMode): DockMode {
  const override = getActiveOverride();
  if (override) return override.mode;
  return detectedMode;
}

