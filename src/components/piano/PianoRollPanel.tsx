import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { PianoRollBinding } from "../../hooks/usePianoRoll";
import { extractQuantizationDenominator } from "../../hooks/usePianoRoll";
import { quantizeSeconds, secondsPerBeat } from "../../utils/time";
import { TRACK_COLOR_SWATCH, hexToRgba } from "../../utils/ALS";
import type { TrackData, TrackAnalysisData } from "../../App";
import type { ArrangeClip as ArrangeClipModel } from "../../hooks/useArrange";
import type { QuantizationMode } from "../../types/midi";
import type { TrapPattern } from "../../types/pianoRoll";
import {
  XIcon,
  PlusIcon,
  SparklesIcon,
  SlidersIcon,
  SaveIcon,
} from "../icons";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const PATTERN_ROOT: Record<TrapPattern["type"], number> = {
  "808": 36,
  hihat: 98,
  snare: 74,
  kick: 50,
  melody: 60,
  percussion: 82,
};

const QUANTIZATION_OPTIONS: QuantizationMode[] = ["1/4", "1/8", "1/16", "1/32"];

interface PianoRollPanelProps {
  isOpen: boolean;
  clip: ArrangeClipModel | null;
  track: TrackData | null;
  binding: PianoRollBinding;
  bpm: number;
  beatsPerBar: number;
  onClose: () => void;
  onCommit: () => void;
  currentTime: number;
  followPlayhead: boolean;
  analysis?: TrackAnalysisData | null;
  onWarpAnchors: () => void;
  onExportMidi: () => void;
}

const midiNoteName = (pitch: number) => {
  const octave = Math.floor(pitch / 12) - 1;
  const name = NOTE_NAMES[((pitch % 12) + 12) % 12];
  return `${name}${octave}`;
};

const getPatternLabelColor = (pattern: TrapPattern) => {
  switch (pattern.type) {
    case "808":
      return "text-emerald-200";
    case "hihat":
      return "text-cyan-200";
    case "snare":
      return "text-rose-200";
    case "kick":
      return "text-amber-200";
    case "melody":
      return "text-indigo-200";
    default:
      return "text-slate-200";
  }
};

const PianoRollPanel: React.FC<PianoRollPanelProps> = ({
  isOpen,
  clip,
  track,
  binding,
  bpm,
  beatsPerBar,
  onClose,
  onCommit,
  currentTime,
  followPlayhead,
  analysis,
  onWarpAnchors,
  onExportMidi,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);

  const noteBaseColor =
    track ? TRACK_COLOR_SWATCH[track.trackColor].base : "#7dd3fc";
  const noteGlowColor =
    track ? TRACK_COLOR_SWATCH[track.trackColor].glow : "#c4b5fd";
  const analysisLevel = analysis?.level ?? 0;
  const analysisTransient = analysis?.transient ?? false;

  const notes = binding.getNotesArray();

  const beatDuration = secondsPerBeat(bpm);
  const clipDuration = clip?.duration ?? 4;
  const maxNoteEnd = notes.reduce(
    (max, note) => Math.max(max, note.start + note.duration),
    clipDuration
  );
  const gridDuration = Math.max(clipDuration, maxNoteEnd + beatDuration);
  const gridWidth = gridDuration * binding.state.zoomX + 320;

  const defaultPitchWindow = 48 * binding.state.zoomY;
  const noteMaxHeight = notes.reduce(
    (max, note) => Math.max(max, note.y + note.height),
    defaultPitchWindow
  );
  const gridHeight = Math.max(noteMaxHeight + 160, defaultPitchWindow);
  const noteHeight = binding.state.zoomY;

  const laneCount = Math.ceil(gridHeight / noteHeight);
  const topPitch = binding.state.scrollY + 48;

  const bars = useMemo(() => {
    const barSeconds = beatDuration * beatsPerBar;
    const count = Math.ceil(gridDuration / barSeconds) + 1;
    return Array.from({ length: count }, (_, index) => ({
      left: index * barSeconds * binding.state.zoomX,
      label: index + 1,
    }));
  }, [gridDuration, beatDuration, beatsPerBar, binding.state.zoomX]);

  const beats = useMemo(() => {
    const count = Math.ceil(gridDuration / beatDuration) + 4;
    return Array.from({ length: count }, (_, index) => ({
      left: index * beatDuration * binding.state.zoomX,
    }));
  }, [gridDuration, beatDuration, binding.state.zoomX]);

  const laneData = useMemo(() => {
    return Array.from({ length: laneCount }, (_, index) => {
      const pitch = Math.round(topPitch - index);
      return {
        pitch,
        top: index * noteHeight,
      };
    });
  }, [laneCount, topPitch, noteHeight]);

  const activeScale = binding.getActiveScale();
  const scalePitchSet = useMemo(() => {
    if (!activeScale) return null;
    const rootPc = ((activeScale.root % 12) + 12) % 12;
    const set = new Set<number>();
    activeScale.intervals.forEach((interval) => {
      const pitchClass = ((rootPc + interval) % 12 + 12) % 12;
      set.add(pitchClass);
    });
    return {
      root: rootPc,
      set,
      name: activeScale.name,
    };
  }, [activeScale]);

  const playheadPosition = useMemo(() => {
    if (!clip) return 0;
    return Math.max(0, currentTime - clip.start);
  }, [clip, currentTime]);

  useEffect(() => {
    if (!clip || !isOpen) return;
    binding.setState((prev) =>
      Math.abs(prev.playheadPosition - playheadPosition) < 1e-3
        ? prev
        : { ...prev, playheadPosition }
    );
  }, [binding, clip, isOpen, playheadPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollLeft = binding.state.scrollX * binding.state.zoomX;
  }, [binding.state.scrollX, binding.state.zoomX, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (
        event.key !== "Delete" &&
        event.key !== "Backspace"
      ) {
        return;
      }
      const ids = Array.from(binding.state.selectedNoteIds);
      if (!ids.length) return;
      event.preventDefault();
      binding.deleteNotes(ids);
      onCommit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [binding, isOpen, onCommit]);

  const handleViewportScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scrollSeconds = viewport.scrollLeft / binding.state.zoomX;
    binding.setState((prev) =>
      Math.abs(prev.scrollX - scrollSeconds) < 0.001
        ? prev
        : { ...prev, scrollX: scrollSeconds }
    );
  }, [binding, binding.state.zoomX]);

  const handleClose = useCallback(() => {
    onCommit();
    onClose();
  }, [onClose, onCommit]);

  const handleToolChange = useCallback(
    (tool: PianoRollBinding["state"]["tool"]) => {
      binding.setTool(tool);
    },
    [binding]
  );

  const handleQuantizationChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      binding.setQuantization(event.target.value as QuantizationMode);
    },
    [binding]
  );

  const handleApplyPattern = useCallback(
    (pattern: TrapPattern) => {
      if (!clip) return;
      const basePitch = PATTERN_ROOT[pattern.type] ?? 60;
      binding.applyTrapPattern(
        pattern.id,
        noteBaseColor,
        binding.state.playheadPosition ?? 0,
        basePitch
      );
      onCommit();
    },
    [binding, clip, noteBaseColor, onCommit]
  );

  const handleClearNotes = useCallback(() => {
    const ids = notes
      .map((note) => note.id)
      .filter((id): id is string => Boolean(id));
    if (!ids.length) return;
    binding.deleteNotes(ids);
    binding.clearSelection();
    onCommit();
  }, [binding, notes, onCommit]);

  const handleNotePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, noteId: string) => {
      event.stopPropagation();
      binding.selectNotes([noteId], event.metaKey || event.ctrlKey || event.shiftKey);
    },
    [binding]
  );

  const handleGridPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!clip) return;
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const offsetX = event.clientX - rect.left + viewport.scrollLeft;
      const offsetY = event.clientY - rect.top + viewport.scrollTop;

      const relativeSeconds = Math.max(0, offsetX / binding.state.zoomX);
      const quantDivision = extractQuantizationDenominator(
        binding.state.quantization
      );
      const quantizedSeconds = Math.max(
        0,
        quantizeSeconds(relativeSeconds, bpm, beatsPerBar, "beats", quantDivision)
      );

      const noteUnderPointer = notes.find(
        (note) =>
          offsetX >= note.x &&
          offsetX <= note.x + note.width &&
          offsetY >= note.y &&
          offsetY <= note.y + note.height
      );

      if (binding.state.tool === "select") {
        if (noteUnderPointer?.id) {
          binding.selectNotes(
            [noteUnderPointer.id],
            event.metaKey || event.ctrlKey || event.shiftKey
          );
        } else {
          binding.clearSelection();
        }
        return;
      }

      if (binding.state.tool === "erase") {
        if (noteUnderPointer?.id) {
          binding.deleteNotes([noteUnderPointer.id]);
          onCommit();
        }
        return;
      }

      if (binding.state.tool === "velocity") {
        if (!noteUnderPointer?.id) return;
        const positionWithinNote = offsetY - noteUnderPointer.y;
        const velocity = Math.max(
          1,
          Math.min(
            127,
            Math.round(
              127 -
                (positionWithinNote / noteUnderPointer.height) * 127
            )
          )
        );
        binding.updateNote(noteUnderPointer.id, { velocity });
        onCommit();
        return;
      }

      if (quantizedSeconds >= clip.duration) {
        return;
      }

      const topVisiblePitch = binding.state.scrollY + 48;
      const proposedPitch = Math.round(
        topVisiblePitch - offsetY / binding.state.zoomY
      );
      const pitch = Math.max(24, Math.min(108, proposedPitch));
      const defaultDuration = beatDuration / 2;
      const remaining = Math.max(beatDuration / 8, clip.duration - quantizedSeconds);
      const duration = Math.min(defaultDuration, remaining);

      const velocity = 96;
      const newId = binding.addNote(
        {
          start: quantizedSeconds,
          duration,
          pitch,
          velocity,
        },
        noteBaseColor
      );
      binding.selectNotes([newId]);
      onCommit();
    },
    [
      binding,
      beatsPerBar,
      bpm,
      clip,
      noteBaseColor,
      notes,
      beatDuration,
      onCommit,
    ]
  );

  const playheadX = Math.max(
    0,
    Math.min(gridWidth, binding.state.playheadPosition * binding.state.zoomX)
  );

  const panelClasses = [
    "relative h-full w-[520px] transition-all duration-400 ease-out",
    isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-[540px] opacity-0 pointer-events-none",
  ].join(" ");

  return (
    <aside className={panelClasses}>
      <div className="flex h-full w-full flex-col border-l border-glass-border bg-glass-surface/95 backdrop-blur-2xl shadow-[0_35px_95px_rgba(4,12,26,0.65)]">
        <header className="flex items-center justify-between border-b border-glass-border px-5 py-4">
          <div className="flex flex-col gap-1 text-ink">
            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">Piano Roll</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wide">{clip?.name ?? "No Clip"}</span>
              {track && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-ink/60">
                  {track.trackName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onWarpAnchors}
              className="flex items-center gap-2 rounded-full border border-glass-border bg-glass-surface-soft px-3 py-1.5 text-[12px] uppercase tracking-[0.32em] text-ink/70 transition hover:text-ink"
            >
              <SparklesIcon className="h-4 w-4" />
              Warp
            </button>
            <button
              onClick={onExportMidi}
              className="flex items-center gap-2 rounded-full border border-glass-border bg-glass-surface-soft px-3 py-1.5 text-[12px] uppercase tracking-[0.32em] text-ink/70 transition hover:text-ink"
            >
              <SaveIcon className="h-4 w-4" />
              Extract
            </button>
            <button
              onClick={onCommit}
              className="flex items-center gap-2 rounded-full border border-glass-border bg-glass-surface-soft px-3 py-1.5 text-[12px] uppercase tracking-[0.32em] text-ink/70 transition hover:text-ink"
            >
              <SaveIcon className="h-4 w-4" />
              Lock
            </button>
            <button
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white/10 text-ink/80 transition hover:border-white/20 hover:bg-white/20"
              aria-label="Close piano roll"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="border-b border-glass-border px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-glass-border bg-glass-surface-soft px-2 py-1">
              {(["select", "draw", "erase", "velocity"] as const).map((tool) => (
                <button
                  key={tool}
                  onClick={() => handleToolChange(tool)}
                  className={`rounded-full px-3 py-1 text-[12px] uppercase tracking-[0.32em] transition ${
                    binding.state.tool === tool
                      ? "bg-white/20 text-ink shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 rounded-full border border-glass-border bg-glass-surface-soft px-3 py-1 text-[12px] uppercase tracking-[0.32em] text-ink/70">
              Grid
              <select
                value={binding.state.quantization}
                onChange={handleQuantizationChange}
                className="rounded-full border border-transparent bg-transparent text-ink focus:border-white/30 focus:outline-none"
              >
                {QUANTIZATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2 rounded-full border border-glass-border bg-glass-surface-soft px-3 py-1 text-[12px] uppercase tracking-[0.32em] text-ink/70">
              <span>Zoom</span>
              <button
                onClick={() => binding.zoomAPI.zoomBy(1 / 1.1, binding.state.playheadPosition)}
                className="rounded-full border border-white/5 px-3 py-1 text-ink/60 transition hover:text-ink"
              >
                -
              </button>
              <button
                onClick={() => binding.zoomAPI.zoomBy(1.1, binding.state.playheadPosition)}
                className="rounded-full border border-white/5 px-3 py-1 text-ink/60 transition hover:text-ink"
              >
                +
              </button>
            </div>

            <button
              onClick={() => binding.toggleGridOption("showVelocity")}
              className={`flex items-center gap-2 rounded-full border border-glass-border px-3 py-1 text-[12px] uppercase tracking-[0.32em] transition ${
                binding.state.showVelocity ? "bg-white/15 text-ink" : "text-ink/60 hover:text-ink"
              }`}
            >
              <SlidersIcon className="h-4 w-4" />
              Velocity
            </button>

            <button
              onClick={handleClearNotes}
              className="flex items-center gap-2 rounded-full border border-glass-border px-3 py-1 text-[12px] uppercase tracking-[0.32em] text-rose-200/70 transition hover:text-rose-100"
            >
              <XIcon className="h-4 w-4" />
              Purge
            </button>
          </div>
        </div>

        <div className="border-b border-glass-border px-5 py-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-ink/60">
            <span>ALS Energy</span>
            <span>{analysisTransient ? "Transient pulse" : "Steady flow"}</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, analysisLevel) * 120)}%`,
                background: `linear-gradient(90deg, ${hexToRgba(
                  noteBaseColor,
                  0.35
                )} 0%, ${hexToRgba(noteGlowColor, 0.85)} 100%)`,
                boxShadow: analysisTransient
                  ? `0 0 18px ${hexToRgba(noteGlowColor, 0.55)}`
                  : undefined,
              }}
            />
          </div>
        </div>

        <div className="border-b border-glass-border px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.32em] text-ink/60">
              Trap Macros
            </span>
            <SparklesIcon className="h-4 w-4 text-violet-300" />
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {binding.patterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => handleApplyPattern(pattern)}
                className="min-w-[140px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/10"
              >
                <p className={`text-[12px] font-semibold ${getPatternLabelColor(pattern)}`}>
                  {pattern.name}
                </p>
                <p className="text-[10px] uppercase tracking-[0.28em] text-ink/50">
                  {pattern.type}
                </p>
              </button>
            ))}
            <button
              onClick={() => {
                if (!clip) return;
                binding.loadNotes([], noteBaseColor);
                onCommit();
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink/60 transition hover:border-white/20 hover:text-ink"
              title="Reset piano roll"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-16 border-r border-glass-border/60 bg-white/[0.06]">
            <div className="sticky top-0 h-8 border-b border-glass-border/60 text-center text-[10px] uppercase tracking-[0.28em] text-ink/60">
              Key
            </div>
            <div className="relative">
              {laneData.map(({ pitch, top }) => (
                <div
                  key={`pitch-${pitch}-${top}`}
                  className="flex h-[var(--lane-height)] items-center justify-center border-b border-white/5 text-[10px] uppercase tracking-[0.18em] text-ink/50"
                  style={{
                    top,
                    height: noteHeight,
                    position: "absolute",
                  }}
                >
                  {midiNoteName(pitch)}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex-1 overflow-x-auto overflow-y-hidden" ref={viewportRef} onScroll={handleViewportScroll}>
            <div
              className="relative"
              style={{ width: gridWidth, height: gridHeight }}
              onPointerDown={handleGridPointerDown}
            >
              {bars.map((bar) => (
                <div
                  key={`bar-${bar.label}`}
                  className="absolute top-0 bottom-0 border-l border-white/10"
                  style={{ left: bar.left }}
                >
                  <div className="absolute left-2 top-1 text-[10px] uppercase tracking-[0.32em] text-ink/50">
                    {bar.label}
                  </div>
                </div>
              ))}

              {beats.map((beat, index) => (
                <div
                  key={`beat-${index}`}
                  className="absolute top-0 bottom-0 border-l border-white/5"
                  style={{ left: beat.left, opacity: 0.25 }}
                />
              ))}

              {laneData.map(({ pitch, top }) => {
                const inScale =
                  scalePitchSet?.set.has(((pitch % 12) + 12) % 12) ?? false;
                const isRoot =
                  scalePitchSet &&
                  ((pitch % 12) + 12) % 12 === scalePitchSet.root;
                return (
                  <div
                    key={`lane-${pitch}-${top}`}
                    className="absolute left-0 right-0 border-b border-white/5"
                    style={{
                      top,
                      height: noteHeight,
                      background: inScale
                        ? hexToRgba(noteGlowColor, isRoot ? 0.18 : 0.1)
                        : "transparent",
                    }}
                  />
                );
              })}

              {notes.map((note) => {
                if (!note.id) {
                  return null;
                }
                const noteId = String(note.id);
                const isSelected = binding.state.selectedNoteIds.has(noteId);
                const width = Math.max(8, note.width);
                const height = Math.max(12, note.height - 4);
                const fillColor = note.color ?? noteBaseColor;
                return (
                  <div
                    key={noteId}
                    className={`absolute rounded-lg border border-white/20 shadow-[0_12px_28px_rgba(8,15,30,0.45)] transition-all ${
                      isSelected ? "ring-2 ring-white/50" : ""
                    }`}
                    style={{
                      left: note.x,
                      top: note.y,
                      width,
                      height,
                      background: `linear-gradient(135deg, ${fillColor}cc 0%, ${hexToRgba(
                        fillColor,
                        0.35
                      )} 100%)`,
                    }}
                    onPointerDown={(event) => handleNotePointerDown(event, noteId)}
                  >
                    {binding.state.showVelocity && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-white/40"
                        style={{
                          height: `${(note.velocity / 127) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {clip && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: clip.duration * binding.state.zoomX,
                    width: 1,
                    background: hexToRgba("#ffffff", 0.18),
                  }}
                />
              )}

              {followPlayhead && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: playheadX,
                    width: 2,
                    background: hexToRgba(noteGlowColor, 0.75),
                    boxShadow: `0 0 18px ${hexToRgba(noteGlowColor, 0.8)}`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <footer className="border-t border-glass-border px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-[10px] uppercase tracking-[0.32em] text-ink/60">
              <span>{scalePitchSet?.name ?? "No scale set"}</span>
              <span>
                {clip
                  ? `${clip.duration.toFixed(2)}s clip · ${
                      notes.length
                    } notes`
                  : "Idle"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onCommit}
                className="rounded-full border border-glass-border px-4 py-1 text-[12px] uppercase tracking-[0.32em] text-ink/70 transition hover:text-ink"
              >
                Persist
              </button>
              <button
                onClick={handleClose}
                className="rounded-full border border-transparent bg-white/20 px-4 py-1 text-[12px] uppercase tracking-[0.32em] text-ink transition hover:bg-white/30"
              >
                Close
              </button>
            </div>
          </div>
        </footer>
      </div>
    </aside>
  );
};

export default PianoRollPanel;

