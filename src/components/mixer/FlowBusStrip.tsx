/**
 * FLOW BUS STRIP - MixClub Routing Channel
 *
 * Compact bus strip showing ALS-driven energy,
 * member count, and quick solo controls.
 *
 * Doctrine: ALS is law, Flow-conscious, Reductionist
 */

import React, { memo } from "react";
import { motion } from "framer-motion";
import type { MixerBusId } from "../../App";
import { hexToRgba } from "../../utils/ALS";
import {
  MIXER_STRIP_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_GAP_PX,
} from "./mixerConstants";

export interface FlowBusStripProps {
  busId: MixerBusId;
  name: string;
  members: string[];
  alsIntensity: number;
  alsPulse: number;
  alsColor: string;
  alsGlow: string;
  alsHaloColor?: string;
  alsGlowStrength?: number;
  onSelectBus?: (busId: MixerBusId) => void;
  isActive?: boolean;
}

const FlowBusStrip: React.FC<FlowBusStripProps> = memo(
  ({
    busId,
    name,
    members,
    alsIntensity,
    alsPulse,
    alsColor,
    alsGlow,
    alsHaloColor,
    alsGlowStrength,
    onSelectBus,
    isActive,
  }) => {
    const stripWidth = {
      width: `${MIXER_STRIP_WIDTH}px`,
      minWidth: `${MIXER_STRIP_MIN_WIDTH}px`,
      maxWidth: `${MIXER_STRIP_MAX_WIDTH}px`,
    };

    const glowSource = alsHaloColor ?? alsGlow;
    const glowAlpha = Math.min(Math.max(alsGlowStrength ?? (0.25 + alsIntensity * 0.35), 0), 1);

    return (
      <motion.div
        className={`flex flex-col items-center bg-glass-surface border border-glass-border rounded-xl backdrop-blur-2xl shadow-[0_18px_60px_rgba(4,12,26,0.48)] overflow-hidden cursor-pointer transition-all text-ink ${
          isActive ? "border-cyan-300/70 shadow-[0_0_34px_rgba(56,189,248,0.45)]" : ""
        }`}
        style={stripWidth}
        onClick={() => onSelectBus?.(busId)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: isActive ? 1.03 : 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="w-full px-2 pt-2 text-[0.55rem] uppercase tracking-[0.35em] text-ink flex items-center justify-between">
          <span>{name}</span>
          <span className="text-ink/50">{members.length}</span>
        </div>

        <motion.div
          className="w-10 h-10 rounded-full border border-glass-border flex items-center justify-center text-[0.5rem] uppercase tracking-[0.3em] text-ink mt-2"
          style={{
            boxShadow: `0 0 20px ${hexToRgba(glowSource, glowAlpha)}`,
            background: `radial-gradient(circle, ${hexToRgba(
              glowSource,
              glowAlpha * 0.9
            )} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1 + alsPulse * 0.04, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          BUS
        </motion.div>

        <div className="flex-1 w-full px-2 pt-3 flex flex-col justify-between gap-2">
          <div className="h-1 rounded-full bg-[rgba(9,18,36,0.6)] overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${alsIntensity * 100}%`,
                background: `linear-gradient(90deg, ${hexToRgba(
                  alsColor,
                  Math.min(0.6 + alsIntensity * 0.3, 1)
                )}, ${hexToRgba(glowSource, glowAlpha)})`,
                boxShadow: `0 0 12px ${hexToRgba(glowSource, glowAlpha)}`,
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div
            className="grid grid-cols-2 gap-1"
            style={{ gap: `${MIXER_STRIP_GAP_PX}px` }}
          >
            {members.slice(0, 4).map((memberId) => (
              <motion.span
                key={memberId}
                className="w-full h-5 rounded-md border border-glass-border bg-[rgba(6,14,28,0.78)] text-[0.45rem] uppercase tracking-[0.25em] text-ink flex items-center justify-center"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {memberId.slice(0, 3)}
              </motion.span>
            ))}
            {members.length > 4 && (
              <span className="w-full h-5 rounded-md border border-glass-border bg-[rgba(6,14,28,0.78)] text-[0.45rem] uppercase tracking-[0.25em] text-ink/70 flex items-center justify-center">
                +{members.length - 4}
              </span>
            )}
          </div>
        </div>

        <div className="w-full px-2 pb-3">
          <div className="h-1 rounded-full bg-[rgba(9,18,36,0.6)] overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${Math.min(1, alsIntensity * 1.25) * 100}%`,
                background: `linear-gradient(90deg, ${hexToRgba(
                  alsColor,
                  Math.min(0.45 + alsIntensity * 0.4, 1)
                )}, ${hexToRgba(glowSource, glowAlpha)})`,
                boxShadow: `0 0 12px ${hexToRgba(glowSource, glowAlpha)}`,
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            {members.slice(0, 4).map((memberId, index) => (
              <span
                key={memberId}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: hexToRgba(alsColor, 0.55 + index * 0.1),
                  boxShadow: `0 0 6px ${hexToRgba(glowSource, glowAlpha * 0.8)}`,
                  opacity: 0.5 + alsIntensity * 0.5,
                }}
              />
            ))}
            {members.length > 4 && (
              <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/55">
                +{members.length - 4}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

FlowBusStrip.displayName = "FlowBusStrip";

export default FlowBusStrip;

