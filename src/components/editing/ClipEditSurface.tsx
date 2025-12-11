import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ArrangeClip, ClipId } from "../../hooks/useArrange";
import type { TrackData } from "../../App";
import { WaveformRenderer } from "../WaveformRenderer";
import { hexToRgba, TrackALSFeedback } from "../../utils/ALS";
import { findNearestZeroCrossing } from "../../utils/zeroCrossing";
import { XIcon, DuplicateIcon, SplitIcon, MergeIcon, SlidersIcon, BulbIcon } from "../icons";
import { als } from "../../utils/alsFeedback";

type ZoomPresetKey = "macro" | "focus" | "micro";

type ClipEditSurfaceProps = {
  clip: ArrangeClip;
  track: TrackData | null;
  audioBuffer?: AudioBuffer;
  currentTime: number;
  isPlaying: boolean;
  followPlayhead: boolean;
  onToggleFollowPlayhead: () => void;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  onExit: () => void;
  onUpdateClip: (clipId: ClipId, props: Partial<ArrangeClip>) => void;
  onSplitAt: (clipId: ClipId, time: number) => void;
  onDuplicateClip: (clipId: ClipId) => void;
  onConsolidate?: () => void;
  clipFeedback?: TrackALSFeedback;
  projectDuration: number;
  bpm: number;
  beatsPerBar: number;
  onEmitAls?: (meta: Record<string, unknown>) => void;
};

const ZOOM_PRESETS: Record<
  ZoomPresetKey,
  { label: string; value: number; description: string }
> = {
  macro: { label: "Arc", value: 160, description: "Song arc view" },
  focus: { label: "Detail", value: 320, description: "Phrase focus" },
  micro: { label: "Grain", value: 520, description: "Sample weave" },
};

const clampTime = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const deriveFadeDescriptor = (seconds: number) => {
  if (seconds <= 0.01) return "Feather";
  if (seconds <= 0.08) return "Blend";
  if (seconds <= 0.24) return "Drape";
  return "Custom";
};

const deriveGainDescriptor = (gain: number | undefined) => {
  if (!gain || Math.abs(gain - 1) < 0.05) return "Neutral";
  if (gain < 1) return "Softer";
  if (gain > 1.4) return "Lifted";
  return "Charged";
};

const ClipEditSurface: React.FC<ClipEditSurfaceProps> = ({
  clip,
  track,
  audioBuffer,
  currentTime,
  isPlaying,
  followPlayhead,
  onToggleFollowPlayhead,
  onSeek,
  onPlayPause,
  onExit,
  onUpdateClip,
  onSplitAt,
  onDuplicateClip,
  onConsolidate,
  clipFeedback,
  projectDuration,
  bpm,
  beatsPerBar,
  onEmitAls,
}) => {
  const [zoom, setZoom] = useState<ZoomPresetKey>("focus");
  const [scrubTime, setScrubTime] = useState<number>(currentTime);

  useEffect(() => {
    setScrubTime(currentTime);
  }, [currentTime]);

  const clipDuration = clip.duration;
  const clipEnd = clip.start + clipDuration;
  const waveformColor = clipFeedback?.glowColor ?? hexToRgba("#38bdf8", 0.8);
  const trackName = track?.trackName ?? "CLIP";
  const viewportWidth = useMemo(
    () => (typeof window !== "undefined" ? Math.max(920, window.innerWidth - 200) : 1200),
    []
  );

  const fadeInLabel = useMemo(
    () => deriveFadeDescriptor(clip.fadeIn ?? 0),
    [clip.fadeIn]
  );
  const fadeOutLabel = useMemo(
    () => deriveFadeDescriptor(clip.fadeOut ?? 0),
    [clip.fadeOut]
  );
  const gainLabel = useMemo(
    () => deriveGainDescriptor(clip.gain),
    [clip.gain]
  );

  const handleZoomChange = (preset: ZoomPresetKey) => {
    setZoom(preset);
    onEmitAls?.({
      surface: "clip-edit",
      action: "zoom-change",
      preset,
    });
  };

  const setFade = useCallback(
    (kind: "fadeIn" | "fadeOut", seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, clipDuration / 2));
      onUpdateClip(clip.id, { [kind]: clamped });
      onEmitAls?.({
        surface: "clip-edit",
        action: "fade",
        edge: kind,
        profile: deriveFadeDescriptor(clamped),
      });
    },
    [clipDuration, clip.id, onEmitAls, onUpdateClip]
  );

  const adjustGain = useCallback(
    (delta: number) => {
      const next = Math.max(0.1, Math.min(2.5, (clip.gain ?? 1) + delta));
      onUpdateClip(clip.id, { gain: Number(next.toFixed(3)) });
      onEmitAls?.({
        surface: "clip-edit",
        action: "gain",
        descriptor: deriveGainDescriptor(next),
      });
    },
    [clip.gain, clip.id, onEmitAls, onUpdateClip]
  );

  const alignToZero = useCallback(
    (edge: "start" | "end") => {
      if (!audioBuffer) {
        // No buffer available - expected in some scenarios (no ALS needed)
        return;
      }
      const sourceOffset =
        edge === "start"
          ? clip.sourceStart ?? 0
          : (clip.sourceStart ?? 0) + clip.duration;
      const zeroTime = findNearestZeroCrossing(audioBuffer, sourceOffset, {
        windowSec: 0.006,
      });
      if (zeroTime === null) {
        // Zero crossing not found - expected in some scenarios (no ALS needed)
        return;
      }

      if (edge === "start") {
        const newSourceStart = clampTime(
          zeroTime,
          0,
          Math.max(0, audioBuffer.duration - 0.01)
        );
        const delta = newSourceStart - (clip.sourceStart ?? 0);
        const nextDuration = Math.max(
          0.01,
          clip.duration - delta
        );
        onUpdateClip(clip.id, {
          sourceStart: newSourceStart,
          duration: nextDuration,
          zeroStart: true,
        });
      } else {
        const newDuration = clampTime(
          zeroTime - (clip.sourceStart ?? 0),
          0.01,
          audioBuffer.duration
        );
        onUpdateClip(clip.id, {
          duration: newDuration,
          zeroEnd: true,
        });
      }
      onEmitAls?.({
        surface: "clip-edit",
        action: "zero-align",
        edge,
      });
    },
    [audioBuffer, clip.duration, clip.id, clip.sourceStart, onEmitAls, onUpdateClip]
  );

  const handleSplit = () => {
    const targetTime = clampTime(scrubTime, clip.start + 0.001, clipEnd - 0.001);
    onSplitAt(clip.id, targetTime);
    onEmitAls?.({
      surface: "clip-edit",
      action: "split",
      time: targetTime,
    });
  };

  const handleDuplicate = () => {
    onDuplicateClip(clip.id);
    onEmitAls?.({
      surface: "clip-edit",
      action: "duplicate",
    });
  };

  const handleConsolidate = () => {
    onConsolidate?.();
    onEmitAls?.({
      surface: "clip-edit",
      action: "consolidate",
    });
  };

  const handleScrub = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioBuffer) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clampTime((event.clientX - rect.left) / rect.width, 0, 1);
    const time =
      clip.start + ratio * Math.max(0.0001, clip.duration);
    setScrubTime(time);
  };

  const commitScrub = () => {
    onSeek(scrubTime);
    onEmitAls?.({
      surface: "clip-edit",
      action: "seek",
    });
  };

  const renderGlow = () => {
    if (!clipFeedback) return null;
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 24% 18%, ${hexToRgba(
            clipFeedback.glowColor,
            0.3
          )} 0%, transparent 55%)`,
        }}
      />
    );
  };

  const gridDescriptor = useMemo(() => {
    if (beatsPerBar === 3) return "Waltz Grid";
    if (beatsPerBar === 5) return "Odd Pulse";
    if (beatsPerBar === 7) return "Polymetric";
    return "Steady Grid";
  }, [beatsPerBar]);

  const bpmDescriptor = useMemo(() => {
    if (bpm < 72) return "Glide Tempo";
    if (bpm < 102) return "Pocket Tempo";
    if (bpm < 132) return "Drive Tempo";
    return "Rush Tempo";
  }, [bpm]);

  const arcDescriptor = useMemo(() => {
    if (projectDuration < 90) return "Short Arc";
    if (projectDuration < 210) return "Mid Arc";
    return "Long Arc";
  }, [projectDuration]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[rgba(4,9,24,0.92)] backdrop-blur-[46px] text-ink">
      <div className="relative flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-5">
          <button
            onClick={onExit}
            className="rounded-full border border-white/14 bg-white/6 px-3.5 py-2 text-xs uppercase tracking-[0.32em] text-ink/70 hover:text-ink hover:border-white/24 transition-colors flex items-center gap-2"
          >
            <XIcon className="h-4 w-4" />
            Return
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.5em] text-ink/50">
              Clip Edit Surface
            </span>
            <span className="text-xl font-semibold tracking-[0.28em] text-ink">
              {trackName} • {clip.name.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {Object.entries(ZOOM_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className={`px-3.5 py-2 rounded-full border text-[11px] uppercase tracking-[0.38em] transition-all ${
                zoom === key
                  ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100"
                  : "border-white/14 bg-white/6 text-ink/65 hover:text-ink"
              }`}
              onClick={() => handleZoomChange(key as ZoomPresetKey)}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={onToggleFollowPlayhead}
            className={`rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.38em] transition-all ${
              followPlayhead
                ? "border-violet-300/50 bg-violet-300/15 text-violet-100"
                : "border-white/14 bg-white/6 text-ink/65 hover:text-ink"
            }`}
          >
            {followPlayhead ? "Follow On" : "Follow Off"}
          </button>
          <button
            onClick={onPlayPause}
            className="rounded-full border border-white/18 bg-white/10 px-3.5 py-2 text-[11px] uppercase tracking-[0.38em] text-ink/70 hover:text-ink transition-all"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className="relative flex-1 px-10 pb-14">
        <div className="relative h-full rounded-[36px] border border-white/12 bg-black/35 shadow-[0_62px_160px_rgba(6,11,32,0.7)] overflow-hidden">
          {renderGlow()}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 80% -20%, rgba(148, 163, 255, 0.22) 0%, transparent 65%)",
            }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between px-10 pt-8 pb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm uppercase tracking-[0.4em] text-ink/60">
                  Fade In: {fadeInLabel}
                </span>
                <span className="text-sm uppercase tracking-[0.4em] text-ink/60">
                  Fade Out: {fadeOutLabel}
                </span>
                <span className="text-sm uppercase tracking-[0.4em] text-ink/60">
                  Gain: {gainLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFade("fadeIn", 0.008)}
                  className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-[10px] uppercase tracking-[0.4em] text-ink/70 hover:text-ink transition-all"
                >
                  Feather In
                </button>
                <button
                  onClick={() => setFade("fadeOut", 0.012)}
                  className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-[10px] uppercase tracking-[0.4em] text-ink/70 hover:text-ink transition-all"
                >
                  Feather Out
                </button>
                <button
                  onClick={() => adjustGain(-0.08)}
                  className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-[10px] uppercase tracking-[0.4em] text-ink/70 hover:text-ink transition-all"
                >
                  Ease Gain
                </button>
                <button
                  onClick={() => adjustGain(0.12)}
                  className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-[10px] uppercase tracking-[0.4em] text-ink/70 hover:text-ink transition-all"
                >
                  Lift Gain
                </button>
                <button
                  onClick={() => alignToZero("start")}
                  className="rounded-full border border-cyan-300/60 bg-cyan-300/15 px-3 py-2 text-[10px] uppercase tracking-[0.4em] text-cyan-100 hover:text-cyan-50 transition-all"
                >
                  Zero Start
                </button>
                <button
                  onClick={() => alignToZero("end")}
                  className="rounded-full border border-cyan-300/60 bg-cyan-300/15 px-3 py-2 text-[10px] uppercase tracking-[0.4em] text-cyan-100 hover:text-cyan-50 transition-all"
                >
                  Zero End
                </button>
              </div>
            </div>

            <div className="relative flex-1 px-8">
              <div
                className="absolute inset-0 cursor-pointer select-none"
                onMouseDown={handleScrub}
                onMouseMove={(event) => {
                  if (event.buttons === 1) {
                    handleScrub(event);
                  }
                }}
                onMouseUp={commitScrub}
              >
                {audioBuffer && (
                  <WaveformRenderer
                    audioBuffer={audioBuffer}
                    width={viewportWidth}
                    height={440}
                    color={waveformColor}
                    startTime={clip.sourceStart ?? 0}
                    duration={clip.originalDuration ?? clip.duration}
                    zoom={ZOOM_PRESETS[zoom].value}
                  />
                )}
              </div>
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute top-0 bottom-0 w-px bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.75)]"
                  style={{
                    left: `${((scrubTime - clip.start) / clipDuration) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-10 py-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSplit}
                  className="flex items-center gap-2 rounded-full border border-sky-300/60 bg-sky-300/15 px-4 py-2 text-[11px] uppercase tracking-[0.4em] text-sky-100 hover:text-sky-50 transition-all"
                >
                  <SplitIcon className="h-4 w-4" />
                  Slice
                </button>
                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-300/15 px-4 py-2 text-[11px] uppercase tracking-[0.4em] text-indigo-100 hover:text-indigo-50 transition-all"
                >
                  <DuplicateIcon className="h-4 w-4" />
                  Duplicate
                </button>
                {onConsolidate && (
                  <button
                    onClick={handleConsolidate}
                    className="flex items-center gap-2 rounded-full border border-violet-300/60 bg-violet-300/15 px-4 py-2 text-[11px] uppercase tracking-[0.4em] text-violet-100 hover:text-violet-50 transition-all"
                  >
                    <MergeIcon className="h-4 w-4" />
                    Merge
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.42em] text-ink/55">
                <span>
                  Playhead within clip:{" "}
                  {scrubTime >= clip.start && scrubTime <= clipEnd
                    ? "Aligned"
                    : "Wandering"}
                </span>
                <span>Grid: {gridDescriptor}</span>
                <span>Tempo: {bpmDescriptor}</span>
                <span>Project Arc: {arcDescriptor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 pb-8">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.45em] text-ink/45">
          <span className="flex items-center gap-2">
            <SlidersIcon className="h-4 w-4" />
            ALS Temperature •{" "}
            {clipFeedback ? clipFeedback.temperature : "Listening"}
          </span>
          <span className="flex items-center gap-2">
            <BulbIcon className="h-4 w-4" />
            Bloom Focus • Clip Sculpt
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClipEditSurface;

