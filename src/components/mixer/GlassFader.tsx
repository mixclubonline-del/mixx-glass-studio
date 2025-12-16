/**
 * Flow Glass Fader Engine
 * Signature hardware-in-software fader with glass physics.
 * Flow-safe: smooth drag, no jitter, preserves audio state.
 * Enhanced: dB bubble + keyboard fine control.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./GlassFader.css";

export interface GlassFaderProps {
  /** Fader value: 0 → 1 */
  value: number;
  /** Callback when value changes */
  onChange: (v: number) => void;
  /** Optional height in pixels (default 180) */
  height?: number;
}

export const GlassFader: React.FC<GlassFaderProps> = ({
  value,
  onChange,
  height = 180,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showDB, setShowDB] = useState(false);
  const onChangeRef = useRef(onChange);
  const showDBTimeoutRef = useRef<number | null>(null);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Convert value to doctrine-compliant level (no raw dB!)
  // FLOW Doctrine: temperature/energy vocabulary
  const valueToLevel = (v: number): string => {
    if (v === 0) return "Silent";
    if (v < 0.1) return "Whisper";
    if (v < 0.25) return "Soft";
    if (v < 0.5) return "Moderate";
    if (v < 0.7) return "Present";
    if (v < 0.85) return "Warm";
    if (v < 0.95) return "Hot";
    return "Peak";
  };


  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!ref.current || !dragging) return;

    const rect = ref.current.getBoundingClientRect();
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    let v = 1 - (clientY - rect.top) / rect.height;
    v = Math.min(1, Math.max(0, v));
    onChangeRef.current(v);
  }, [dragging]);

  const start = useCallback(() => {
    setDragging(true);
    setShowDB(true);
    if (showDBTimeoutRef.current) {
      clearTimeout(showDBTimeoutRef.current);
    }
  }, []);

  const stop = useCallback(() => {
    setDragging(false);
    if (showDBTimeoutRef.current) {
      clearTimeout(showDBTimeoutRef.current);
    }
    showDBTimeoutRef.current = window.setTimeout(() => {
      setShowDB(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging, handleMove, stop]);

  // Keyboard control
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowUp") delta = 0.005;
    if (e.key === "ArrowDown") delta = -0.005;
    if (e.shiftKey) delta *= 0.25; // Fine control
    if (e.altKey) delta *= 6; // Coarse control

    if (delta !== 0) {
      e.preventDefault();
      const newValue = Math.min(1, Math.max(0, value + delta));
      onChangeRef.current(newValue);
      setShowDB(true);
      
      if (showDBTimeoutRef.current) {
        clearTimeout(showDBTimeoutRef.current);
      }
      showDBTimeoutRef.current = window.setTimeout(() => {
        setShowDB(false);
      }, 600);
    }
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (showDBTimeoutRef.current) {
        clearTimeout(showDBTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="glass-fader-rail"
      style={{ height }}
      ref={ref}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div
        className="glass-fader-handle"
        ref={handleRef}
        style={{ bottom: `${value * 100}%` }}
        onMouseDown={start}
        onTouchStart={start}
      >
        {showDB && (
          <div className="glass-fader-db">
            {valueToLevel(value)}
          </div>
        )}
        <div className="glass-fader-glow" />
      </div>
    </div>
  );
};

