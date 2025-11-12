import React, { useMemo } from "react";
import { TrackData, MixerSettings, TrackAnalysisData } from "../App";
import {
  TrackUIState,
  TrackContextMode,
  DEFAULT_TRACK_CONTEXT,
  MIN_TRACK_LANE_HEIGHT,
  MAX_TRACK_LANE_HEIGHT,
  COLLAPSED_TRACK_LANE_HEIGHT,
} from "../types/tracks";
import { deriveTrackALSFeedback, hexToRgba, TRACK_COLOR_SWATCH } from "../utils/ALS";

type TrackCapsuleProps = {
  track: TrackData;
  uiState: TrackUIState;
  analysis?: TrackAnalysisData;
  mixerSettings?: MixerSettings;
  isOpen: boolean;
  onClose: () => void;
  onContextChange: (context: TrackContextMode) => void;
  onToggleCollapse: () => void;
  onLaneHeightChange: (height: number) => void;
  onAction: (action: string, payload?: any) => void;
};

const CONTEXT_LABEL: Record<TrackContextMode, string> = {
  playback: "Flow Playback",
  record: "Recording",
  edit: "Edit Focus",
  performance: "Performance",
};

const CONTEXT_DESC: Record<TrackContextMode, string> = {
  playback: "Standard playback controls and level feedback.",
  record: "Arm inputs, monitor gain, and capture takes without friction.",
  edit: "Clip operations, fades, consolidation, and timeline prep.",
  performance: "Macro pads and real-time performance tweaks.",
};

const contextOrder: TrackContextMode[] = ["playback", "record", "edit", "performance"];

const TrackCapsule: React.FC<TrackCapsuleProps> = ({
  track,
  uiState,
  analysis,
  mixerSettings,
  isOpen,
  onClose,
  onContextChange,
  onToggleCollapse,
  onLaneHeightChange,
  onAction,
}) => {
  const alsFeedback = useMemo(() => {
    return deriveTrackALSFeedback({
      level: analysis?.level ?? 0,
      transient: analysis?.transient ?? false,
      volume: mixerSettings?.volume ?? 0.75,
      color: track.trackColor,
    });
  }, [analysis, mixerSettings, track.trackColor]);
  const trackSwatch =
    TRACK_COLOR_SWATCH[track.trackColor as keyof typeof TRACK_COLOR_SWATCH] ??
    TRACK_COLOR_SWATCH.cyan;

  const context = uiState.context ?? DEFAULT_TRACK_CONTEXT;
  const nextContext = () => {
    const index = contextOrder.indexOf(context);
    const value = contextOrder[(index + 1) % contextOrder.length];
    onContextChange(value);
  };

  const laneHeight = uiState.collapsed ? COLLAPSED_TRACK_LANE_HEIGHT : uiState.laneHeight;

  return (
    <div className="fixed right-6 top-1/2 z-40 pointer-events-none">
      <div
        className={`pointer-events-auto w-[360px] max-w-[calc(100vw-40px)] -translate-y-1/2 transform transition-all duration-400 ease-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative rounded-3xl bg-glass-surface/80 border border-glass-border backdrop-blur-3xl shadow-[0_45px_120px_rgba(8,13,31,0.64)] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background: `radial-gradient(circle at 25% -10%, ${hexToRgba(
                alsFeedback.glowColor,
                0.25
              )} 0%, transparent 55%), radial-gradient(circle at 90% 20%, rgba(148,163,184,0.24) 0%, transparent 60%)`,
            }}
          />
          <div className="relative p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-wide text-ink">
                  {track.trackName}
                </h2>
                <p className="text-xs uppercase tracking-[0.45em] text-ink/60">
                  {track.group} • {track.waveformType}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white/10 text-ink/70 hover:bg-white/20 hover:text-ink transition-colors px-3 py-1 text-xs uppercase tracking-[0.35em]"
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={nextContext}
                  className="px-3 py-1.5 rounded-full bg-white/8 border border-white/20 text-xs uppercase tracking-[0.35em] text-ink/80 hover:text-ink hover:border-white/40 transition-all"
                >
                  {CONTEXT_LABEL[context]}
                </button>
                <p className="mt-2 text-sm text-ink/70 max-w-[260px]">
                  {CONTEXT_DESC[context]}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-ink">
                  {(alsFeedback.intensity * 100).toFixed(0)}%
                </div>
                <div className="text-xs uppercase tracking-[0.35em] text-ink/60">
                  ALS Energy
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/2 backdrop-blur px-4 py-3 space-y-3">
              <div className="flex items-center justify-between text-sm text-ink/80">
                <span>Lane Height</span>
                <span>{Math.round(laneHeight)} px</span>
              </div>
              <input
                className="w-full accent-cyan-300"
                type="range"
                min={MIN_TRACK_LANE_HEIGHT}
                max={MAX_TRACK_LANE_HEIGHT}
                step={2}
                value={laneHeight}
                onChange={(event) => onLaneHeightChange(Number(event.target.value))}
                disabled={uiState.collapsed}
              />
              <button
                onClick={onToggleCollapse}
                className="w-full rounded-full border border-white/15 bg-white/8 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-ink/70 hover:text-ink hover:bg-white/14 transition-all"
              >
                {uiState.collapsed ? "Expand Lane" : "Collapse Lane"}
              </button>
            </div>

            <div className="space-y-3">
              {context === "record" && (
                <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100/90">
                  Arm this track, monitor input gain, and capture takes. Use Bloom to punch in,
                  loop, or drop markers without breaking flow.
                </div>
              )}
              {context === "edit" && (
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100/90 space-y-3">
                  <button
                    onClick={() => onAction("splitSelection", { trackId: track.id })}
                    className="w-full rounded-full bg-cyan-500/20 border border-cyan-400/40 py-2 text-xs uppercase tracking-[0.35em] hover:bg-cyan-500/30 transition-all"
                  >
                    Split Selection
                  </button>
                  <button
                    onClick={() => onAction("consolidateSelection", { trackId: track.id })}
                    className="w-full rounded-full bg-cyan-500/20 border border-cyan-400/40 py-2 text-xs uppercase tracking-[0.35em] hover:bg-cyan-500/30 transition-all"
                  >
                    Consolidate Clips
                  </button>
                </div>
              )}
              {context === "performance" && (
                <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100/90">
                  Performance mode primes macros and scene triggers. Bloom seeds can recall
                  automation snapshots or toggle live FX.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-ink/60">
              <span>
                {track.trackColor.toUpperCase()} • {trackSwatch.base}
              </span>
              <span>{track.waveformType.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCapsule;

