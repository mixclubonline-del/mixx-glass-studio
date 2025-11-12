import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { TrackALSFeedback } from "../../utils/ALS";
import { hexToRgba } from "../../utils/ALS";

interface FlowFaderProps {
  value: number;
  onChange: (value: number) => void;
  alsFeedback: TrackALSFeedback | null;
  trackColor: string;
  glowColor: string;
  name: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const FlowFader: React.FC<FlowFaderProps> = ({
  value,
  onChange,
  alsFeedback,
  trackColor,
  glowColor,
  name,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerValue = useCallback(
    (clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relative = 1 - (clientY - rect.top) / rect.height;
      const scaled = clamp(relative * 1.2, 0, 1.2);
      onChange(Number(scaled.toFixed(3)));
    },
    [onChange]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      containerRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      handlePointerValue(event.clientY);
    },
    [handlePointerValue]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      handlePointerValue(event.clientY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerValue, isDragging]);

  const sliderRatio = clamp(value / 1.2, 0, 1);
  const intensity = alsFeedback?.intensity ?? 0;
  const pulse = alsFeedback?.pulse ?? 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-pointer select-none"
      onPointerDown={handlePointerDown}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-black/70 via-black/60 to-black/80 border border-white/5 shadow-inner overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${hexToRgba(
              glowColor,
              0.25 + intensity * 0.35
            )} 0%, transparent 65%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute left-1/2 top-0 bottom-0 w-px"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${hexToRgba(
              glowColor,
              0.45 + intensity * 0.35
            )} 45%, transparent 100%)`,
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-2 rounded-lg bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </div>

      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-10 h-3 rounded-full border border-white/10 shadow-lg backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(
            trackColor,
            0.85
          )}, ${hexToRgba(glowColor, 0.75)})`,
          top: `${(1 - sliderRatio) * 100}%`,
          boxShadow: `0 0 18px ${hexToRgba(glowColor, 0.4 + intensity * 0.4)}`,
        }}
        animate={{
          opacity: [0.95, 1, 0.95],
          scale: [1, 1 + pulse * 0.05, 1],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-y-3 left-2 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="block w-1 h-1 rounded-full bg-white/15"
            style={{ opacity: 0.4 + intensity * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
};

export default FlowFader;

