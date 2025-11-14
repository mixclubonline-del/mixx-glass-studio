/**
 * Flow Glass Pan Orb
 * Spatial control knob with glass physics.
 * Flow-safe: smooth drag, no jitter, preserves audio state.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import "./GlassPanOrb.css";

export interface GlassPanOrbProps {
  /** Pan value: -1 (LEFT) to +1 (RIGHT) */
  value: number;
  /** Callback when value changes */
  onChange: (v: number) => void;
  /** Optional size in pixels (default 54) */
  size?: number;
}

export const GlassPanOrb: React.FC<GlassPanOrbProps> = ({
  value,
  onChange,
  size = 54,
}) => {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drag || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const cx = rect.x + rect.width / 2;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    let v = (clientX - cx) / (rect.width / 2);
    v = Math.min(1, Math.max(-1, v));
    onChangeRef.current(v);
  }, [drag]);

  const start = useCallback(() => setDrag(true), []);
  const stop = useCallback(() => setDrag(false), []);

  useEffect(() => {
    if (!drag) return;

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
  }, [drag, handleMove, stop]);

  // Determine pan label
  const panLabel = value < -0.05 ? "L" : value > 0.05 ? "R" : "C";

  return (
    <div
      className="glass-pan-orb"
      ref={ref}
      style={{ width: size, height: size }}
      onMouseDown={start}
      onTouchStart={start}
    >
      <div
        className="glass-pan-indicator"
        style={{ transform: `translate(-50%, -50%) translateX(${value * 16}px)` }}
      />
      <div className="pan-label">{panLabel}</div>
    </div>
  );
};

