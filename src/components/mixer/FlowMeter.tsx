import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hexToRgba } from "../../utils/ALS";

interface FlowMeterProps {
  level: number;
  peak: number;
  transient: boolean;
  color: string;
  glow: string;
  /** ALS Pulse Sync (0-1) - enhances glow based on Flow Pulse */
  pulse?: number;
  /** Flow-Follow Mode (0-1) - enhances glow based on transport state */
  flowFollow?: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const FlowMeter: React.FC<FlowMeterProps> = ({
  level,
  peak,
  transient,
  color,
  glow,
  pulse = 0,
  flowFollow = 0,
}) => {
  const [peakHold, setPeakHold] = useState(peak);

  useEffect(() => {
    if (peak > peakHold) {
      setPeakHold(peak);
      const timeout = setTimeout(() => {
        setPeakHold((prev) => prev * 0.92);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [peak, peakHold]);

  const mainHeight = clamp01(level);
  const peakPosition = clamp01(peakHold);

  const redThreshold = 0.85;
  const amberThreshold = 0.65;

  const gradient = mainHeight > redThreshold
    ? `linear-gradient(180deg, ${hexToRgba("#ef4444", 0.9)} 0%, ${hexToRgba(
        color,
        0.8
      )} 60%, ${hexToRgba(color, 0.3)} 100%)`
    : mainHeight > amberThreshold
    ? `linear-gradient(180deg, ${hexToRgba("#f59e0b", 0.9)} 0%, ${hexToRgba(
        color,
        0.75
      )} 60%, ${hexToRgba(color, 0.3)} 100%)`
    : `linear-gradient(180deg, ${hexToRgba(color, 0.85)} 0%, ${hexToRgba(
        color,
        0.45
      )} 60%, ${hexToRgba(color, 0.15)} 100%)`;

  return (
    <div className="relative w-44 h-full flex flex-col items-center" style={{ height: '100%' }}>
      <div className="absolute inset-0 rounded-md bg-black/60 border border-white/8 shadow-inner overflow-hidden" style={{ height: '100%' }}>
        <div className="absolute inset-1 rounded-md bg-gradient-to-b from-white/5 to-transparent" />
        <motion.div
          className="absolute inset-0 h-full"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${hexToRgba(
              glow,
              0.25 + pulse * 0.3 + flowFollow * 0.2
            )} 0%, transparent 100%)`,
            boxShadow: `inset 0 0 ${20 + pulse * 15 + flowFollow * 10}px ${hexToRgba(glow, 0.15 + pulse * 0.25)}`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-1 left-1 right-1 rounded-md bg-black/10 overflow-hidden">
          <motion.div
            className="w-full origin-bottom"
            style={{
              height: `${mainHeight * 100}%`,
              background: gradient,
              boxShadow: `0 0 ${12 + pulse * 8 + flowFollow * 6}px ${hexToRgba(glow, 0.45 + pulse * 0.3)}`,
            }}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          className="absolute left-1 right-1 h-1.5 rounded-full"
          style={{
            bottom: `${peakPosition * 100}%`,
            background: hexToRgba(glow, transient ? 0.9 : 0.7),
            boxShadow: `0 0 10px ${hexToRgba(glow, 0.6)}`,
          }}
          animate={{ scaleX: transient ? [1, 1.4, 1] : 1 }}
          transition={{
            duration: 0.35,
            repeat: transient ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="absolute -right-1.5 top-1 flex flex-col text-[7px] text-white/30 uppercase tracking-[0.3em] gap-4">
        <span>+6</span>
        <span>0</span>
        <span>-6</span>
        <span>-12</span>
        <span>-24</span>
      </div>
    </div>
  );
};

export default FlowMeter;

