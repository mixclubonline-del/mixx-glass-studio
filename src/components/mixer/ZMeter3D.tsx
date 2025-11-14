/**
 * Flow Z-Depth 3D Meter
 * Signature hardware-in-software meter with 3D depth visualization.
 * ALS Pulse Sync + Peak Hold - integrates with Flow Meter Stack.
 */

import React, { useEffect, useRef, useState } from "react";
import "./ZMeter3D.css";

export interface ZMeter3DProps {
  /** Meter levels: peak (0-1) and RMS (0-1) */
  levels: { peak: number; rms: number };
  /** ALS Pulse % (0-1) for reactive glow */
  pulse?: number;
  /** Flow-Follow Mode: 0 (idle) to 1 (playhead moving) */
  flowFollow?: number;
  /** Optional height in pixels (default 180) */
  height?: number;
}

export const ZMeter3D: React.FC<ZMeter3DProps> = ({
  levels,
  pulse = 0,
  flowFollow = 0,
  height = 180,
}) => {
  const peakRef = useRef<HTMLDivElement>(null);
  const rmsRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  const [holdLevel, setHoldLevel] = useState(0);

  useEffect(() => {
    if (peakRef.current) {
      peakRef.current.style.height = `${Math.min(100, Math.max(0, levels.peak * 100))}%`;
    }
    if (rmsRef.current) {
      rmsRef.current.style.height = `${Math.min(100, Math.max(0, levels.rms * 100))}%`;
    }
    
    // Peak hold logic
    if (levels.peak > holdLevel) {
      setHoldLevel(levels.peak);
      if (holdRef.current) {
        holdRef.current.style.opacity = "1";
        holdRef.current.style.bottom = `${levels.peak * 100}%`;
      }
      const timeout = setTimeout(() => {
        if (holdRef.current) {
          holdRef.current.style.opacity = "0";
        }
      }, 850);
      return () => clearTimeout(timeout);
    }
  }, [levels, holdLevel]);

  return (
    <div
      className="zmeter-container"
      style={{
        height,
        boxShadow: `inset 0 0 ${22 + flowFollow * 14}px rgba(120,70,255,${0.25 + pulse * 0.4}), 
                    0 0 ${16 + flowFollow * 10}px rgba(160,100,255,${pulse * 0.6})`,
      }}
    >
      <div className="zmeter-depth" />
      <div className="zmeter-bar rms" ref={rmsRef} />
      <div className="zmeter-bar peak" ref={peakRef} />
      <div className="zmeter-peak-hold" ref={holdRef} />
    </div>
  );
};

