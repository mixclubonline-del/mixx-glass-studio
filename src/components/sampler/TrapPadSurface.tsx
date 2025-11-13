import React, { useMemo } from "react";
import type { TrapPadId, TrapPadState } from "../../types/sampler";
import { TRACK_COLOR_SWATCH, hexToRgba } from "../../utils/ALS";

interface TrapPadSurfaceProps {
  pads: TrapPadState[];
  focusedPadId: TrapPadId;
  activePadId: TrapPadId | null;
  onTriggerPad: (padId: TrapPadId, velocity?: number) => void;
  onFocusPad: (padId: TrapPadId) => void;
}

const PAD_LAYOUT = [
  ["pad-1", "pad-2", "pad-3", "pad-4"],
  ["pad-5", "pad-6", "pad-7", "pad-8"],
  ["pad-9", "pad-10", "pad-11", "pad-12"],
  ["pad-13", "pad-14", "pad-15", "pad-16"],
] as const;

const TrapPadSurface: React.FC<TrapPadSurfaceProps> = ({
  pads,
  focusedPadId,
  activePadId,
  onTriggerPad,
  onFocusPad,
}) => {
  const padMap = useMemo(() => {
    return pads.reduce<Record<string, TrapPadState>>((acc, pad) => {
      acc[pad.id] = pad;
      return acc;
    }, {});
  }, [pads]);

  return (
    <div className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-[rgba(12,16,28,0.78)] p-6 shadow-[0_40px_120px_rgba(4,12,26,0.72)] backdrop-blur-2xl">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] uppercase tracking-[0.42em] text-ink/50">
          Mixx Drum Grid
        </span>
        <span className="text-[11px] uppercase tracking-[0.34em] text-ink/40">
          Adaptive Velocity
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {PAD_LAYOUT.flatMap((row) => row).map((padId) => {
          const pad = padMap[padId];
          if (!pad) return null;
          const isFocused = padId === focusedPadId;
          const isActive = padId === activePadId;
          const baseColor = TRACK_COLOR_SWATCH[pad.layers.sub.color].base;
          const glowColor = TRACK_COLOR_SWATCH[pad.layers.sub.color].glow;

          return (
            <button
              key={padId}
              style={{
                boxShadow: isActive
                  ? `0 0 28px ${hexToRgba(glowColor, 0.65)}`
                  : isFocused
                  ? `0 0 18px ${hexToRgba(glowColor, 0.35)}`
                  : "inset 0 0 18px rgba(6,10,20,0.65)",
              }}
              className={`relative aspect-square min-h-[104px] min-w-[104px] rounded-3xl border transition-colors duration-150 ${
                isActive
                  ? "border-white/55 bg-gradient-to-br from-white/45 via-white/18 to-transparent"
                  : isFocused
                  ? "border-white/28 bg-white/[0.16]"
                  : "border-white/10 bg-white/[0.06] hover:border-white/22 hover:bg-white/[0.12]"
              }`}
              onPointerDown={(event) => {
                const velocity = Math.min(1, Math.max(0.2, event.pressure || 0.92));
                onFocusPad(pad.id);
                onTriggerPad(pad.id, velocity);
              }}
            >
              <span
                className={`absolute inset-x-0 bottom-4 mx-auto w-20 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.34em] ${
                  isActive
                    ? "bg-white text-slate-900"
                    : "bg-slate-900/85 text-ink/60"
                }`}
                style={{
                  boxShadow: isActive
                    ? `0 0 12px ${hexToRgba(glowColor, 0.55)}`
                    : undefined,
                }}
              >
                {pad.label}
              </span>
              <span className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.3em] text-ink/30">
                {pad.bank}
              </span>
              <span
                className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full"
                style={{
                  background: isActive
                    ? glowColor
                    : isFocused
                    ? hexToRgba(glowColor, 0.5)
                    : "rgba(94,106,142,0.4)",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrapPadSurface;



