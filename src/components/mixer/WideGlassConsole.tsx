/**
 * Wide Glass Console
 * Free-floating glass console with Mixx Glass DNA aesthetic.
 * Atmospheric, frosted, light-purple, elevation glow.
 */

import React from "react";
import "./WideGlassConsole.css";

export interface WideGlassConsoleProps {
  /** Whether console is visible */
  visible: boolean;
  /** X position (pixels) */
  x: number;
  /** Y position (pixels) */
  y: number;
  /** Children to render inside console */
  children?: React.ReactNode;
  /** Optional className for custom styling */
  className?: string;
}

export const WideGlassConsole: React.FC<WideGlassConsoleProps> = ({
  visible,
  x,
  y,
  children,
  className = "",
}) => {
  if (!visible) return null;

  return (
    <div
      className={`wide-glass-console ${className}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div className="console-body">
        {children || (
          <div className="console-placeholder">
            {/* SLOT FOR YOUR CHANNEL STRIPS */}
          </div>
        )}
      </div>
    </div>
  );
};

