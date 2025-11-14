import React, { useLayoutEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import type { PrimeBrainStatus } from "../types/primeBrainStatus";
import { PrimeBrainIcon } from "./flowdock/glyphs/PrimeBrainIcon";

interface HeaderProps {
  primeBrainStatus: PrimeBrainStatus;
  hushFeedback: { color: string; intensity: number; isEngaged: boolean; noiseCount?: number };
  isPlaying: boolean;
  onHeightChange?: (height: number) => void;
  className?: string;
}

const channelValueToPercent = (value: number) => `${Math.min(1, Math.max(0, value)) * 100}%`;

const Header: React.FC<HeaderProps> = ({
  primeBrainStatus,
  hushFeedback,
  isPlaying,
  onHeightChange,
  className,
}) => {
  const { mode, modeCaption, guidanceLine, bloomSummary, lastAction, health, alsChannels } = primeBrainStatus;
  const guidance = guidanceLine ?? bloomSummary ?? lastAction ?? "Flow is standing by.";

  const alsChannelBlocks = useMemo(() => {
    return alsChannels.slice(0, 6);
  }, [alsChannels]);

  const hushStateLabel = hushFeedback.isEngaged ? "HUSH ACTIVE" : "HUSH IDLE";
  const hushStateClass = hushFeedback.isEngaged ? "text-emerald-200" : "text-slate-300";
  const containerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!onHeightChange) return;
    const node = containerRef.current;
    if (!node) return;

    const notify = () => {
      onHeightChange(node.offsetHeight);
    };

    notify();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", notify);
      return () => window.removeEventListener("resize", notify);
    }

    const observer = new ResizeObserver(() => notify());
    observer.observe(node);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <header
      ref={containerRef}
      className={clsx(
        "fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[rgba(6,9,20,0.78)] px-6 py-3 text-white backdrop-blur-2xl shadow-[0_15px_35px_rgba(2,6,23,0.6)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex min-w-[220px] flex-col">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-[0_0_18px_rgba(148,163,255,0.55)]">
              <PrimeBrainIcon className="w-4 h-4 text-indigo-200" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.45em] text-white/50">
              Prime Brain · ALS
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-semibold tracking-wide">{mode}</span>
            <span className="text-sm uppercase tracking-[0.4em] text-white/50">{modeCaption}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col min-w-[200px]">
          <div className="text-[12px] uppercase tracking-[0.4em] text-white/50">Guidance</div>
          <div className="text-sm text-white/80 line-clamp-1">{guidance}</div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.45em]">
          <div
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
            style={{
              boxShadow: `0 0 18px ${health.glowColor}`,
              color: health.color,
            }}
          >
            <span className="text-[10px] text-white/50">Health</span>
            <span>{health.caption}</span>
          </div>

          <div
            className={clsx(
              "flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5",
              hushStateClass
            )}
            style={{
              background: hushFeedback.isEngaged
                ? `linear-gradient(90deg, ${hushFeedback.color}22, ${hushFeedback.color}55)`
                : "rgba(15,23,42,0.35)",
            }}
          >
            <span>{hushStateLabel}</span>
            {typeof hushFeedback.noiseCount === "number" && (
              <span className="text-[10px] tracking-[0.2em] text-white/50">
                {hushFeedback.noiseCount} noise flags
              </span>
            )}
          </div>

          <div
            className={clsx(
              "flex items-center gap-2 rounded-full px-3 py-1.5 border",
              isPlaying
                ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/40"
                : "bg-slate-800/40 text-slate-200 border-white/10"
            )}
          >
            <span>{isPlaying ? "Playback · Live" : "Playback · Idle"}</span>
            <span className={clsx("inline-flex h-2 w-2 rounded-full bg-current", isPlaying && "animate-pulse")} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {alsChannelBlocks.map((channel) => (
          <div
            key={channel.channel}
            className="rounded-xl border border-white/5 bg-white/5/5 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-white/60"
          >
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <span>{channel.channel}</span>
              <span>{channel.descriptor}</span>
            </div>
            <div className="mt-1 h-[6px] w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: channelValueToPercent(channel.value),
                  background: `linear-gradient(90deg, ${channel.accent}, ${channel.aura})`,
                  boxShadow: `0 0 12px ${channel.aura}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </header>
  );
};

export default Header;