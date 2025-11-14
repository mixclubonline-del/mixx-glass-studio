/**
 * Flow Micro Trim MiniMeter
 * Mid/Side balance, gain trim feedback - barely visible unless needed.
 * Flow-safe: subtle, precise, engineer-grade.
 */

import React from "react";
import "./MicroTrim.css";

export interface MicroTrimProps {
  /** Trim value: -12 to +12 dB */
  value: number;
}

export const MicroTrim: React.FC<MicroTrimProps> = ({ value }) => {
  // Clamp value to -12 to +12 dB range
  const clampedValue = Math.min(12, Math.max(-12, value));
  // Convert to percentage (0-100%)
  const percentage = ((clampedValue + 12) / 24) * 100;

  return (
    <div className="micro-trim">
      <div
        className="micro-trim-bar"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
};

