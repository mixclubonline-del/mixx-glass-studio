/**
 * Stem Debug HUD
 * 
 * Debug overlay for stem heat/energy visualization in the Arrange Window.
 * Visible only in development mode.
 * 
 * Part of ALS Stem Heatmap System - displays thermal state of stems
 * for debugging and monitoring during development.
 */

import React from 'react';

const StemDebugHUD: React.FC = () => {
  // Only show in development mode
  // Use type assertion to handle Vite's import.meta.env
  const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
  
  if (!isDev) {
    return null;
  }

  // Minimal placeholder that doesn't break the UI
  // This can be expanded later with actual stem heat data visualization
  return (
    <div className="pointer-events-none px-2 py-1 text-[10px] font-mono text-cyan-200/60 opacity-50">
      {/* Stem Debug HUD - Development Mode */}
    </div>
  );
};

export default StemDebugHUD;










