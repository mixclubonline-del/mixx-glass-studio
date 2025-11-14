/**
 * Flow Stereo Width Lens
 * Compression & Expansion visualization for stereo width.
 * Flow-safe: smooth transitions, ALS-linked.
 */

import React from "react";
import "./WidthLens.css";

export interface WidthLensProps {
  /** Width value: 0 (mono) to 2 (super wide) */
  width: number;
  /** Optional size in pixels (default 54) */
  size?: number;
}

export const WidthLens: React.FC<WidthLensProps> = ({
  width,
  size = 54,
}) => {
  // Clamp width to valid range
  const clampedWidth = Math.min(2, Math.max(0, width));
  
  return (
    <div
      className="width-lens"
      style={{
        width: size,
        height: size,
        boxShadow: `inset 0 0 ${12 + clampedWidth * 18}px rgba(150, 90, 255, ${0.2 + clampedWidth * 0.3})`,
      }}
    >
      <div
        className="width-iris"
        style={{
          transform: `scale(${0.5 + clampedWidth * 0.5})`,
        }}
      />
    </div>
  );
};

