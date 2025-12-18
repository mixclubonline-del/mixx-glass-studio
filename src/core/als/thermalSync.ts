/**
 * Thermal Sync Hook
 * 
 * Global hook to sync thermal colors across the entire UI.
 * Applies thermal color filters to root element and glass containers.
 */

import { useEffect } from 'react';
import { applyThermalColorToRoot, getThermalColor } from './colors';

// Window interface extensions moved to src/types/globals.d.ts

/**
 * Initialize thermal color sync.
 * Sets up interval to update thermal colors based on ALS state.
 * 
 * @param updateInterval - Update interval in milliseconds (default 100)
 * @returns Cleanup function
 */
export function initThermalSync(updateInterval: number = 100): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const updateThermalColors = () => {
    const temp = window.__als?.temperature || 'cold';
    applyThermalColorToRoot(temp);
    
    // Also set CSS custom property for use in CSS
    const color = getThermalColor(temp);
    document.documentElement.style.setProperty('--als-thermal-glow', color);
  };
  
  // Initial update
  updateThermalColors();
  
  // Update periodically
  const interval = setInterval(updateThermalColors, updateInterval);
  
  // Cleanup function
  return () => {
    clearInterval(interval);
  };
}

/**
 * React hook for thermal color sync.
 * 
 * @param enabled - Whether sync is enabled (default true)
 * @param updateInterval - Update interval in milliseconds (default 100)
 */
export function useThermalSync(enabled: boolean = true, updateInterval: number = 100): void {
  // Hook must be called unconditionally (before any early returns)
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) {
      return;
    }
    
    return initThermalSync(updateInterval);
  }, [enabled, updateInterval]);
}
