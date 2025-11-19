// src/components/ArrangeWindow.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrangeClip as ClipModel, useArrange, ClipId } from "../hooks/useArrange";
import { recordSessionProbeTimelineEvent } from "../hooks/useSessionProbe";
import { ArrangeClip } from "./ArrangeClip";
import { quantizeSeconds, secondsPerBar, secondsPerBeat } from "../utils/time";
import { TrackData, MixerSettings, AutomationPoint, TrackAnalysisData, FxWindowId } from "../App";
import ArrangeTrackHeader from "./ArrangeTrackHeader";
import AutomationLane from "./AutomationLane";
import { deriveTrackALSFeedback, TrackALSFeedback, hexToRgba } from "../utils/ALS";
import { findNearestZeroCrossing } from "../utils/zeroCrossing";
import {
  TrackUIState,
  TrackContextMode,
  DEFAULT_TRACK_LANE_HEIGHT,
  COLLAPSED_TRACK_LANE_HEIGHT,
  MIN_TRACK_LANE_HEIGHT,
  MAX_TRACK_LANE_HEIGHT,
} from "../types/tracks";
import TimelineNavigator from "./timeline/TimelineNavigator";
import { useFlowContext } from "../state/flowContextService";
import { useTimelineInteractions } from "../hooks/useTimelineInteractions";
import { useFlowComponent } from "../core/flow/useFlowComponent";
import {
  DEFAULT_TIMELINE_TOOL,
  TimelineTool,
  getToolFromShortcut,
  useTimelineToolPalette,
} from "../utils/timelineTools";
import {
  DEFAULT_SNAP_SETTINGS,
  SnapCandidate,
  SnapSettings,
  applySnapIfEnabled,
  buildSnapCandidates,
  shouldSnap,
} from "../utils/snapSystem";
import { registerShortcut, unregisterShortcut } from "../utils/keyboardShortcuts";
import { recordEditEvent, recordToolSwitch, recordZoomEvent } from "../core/loop/flowLoopEvents";
import { AutoPunchGhost } from "./timeline/AutoPunchGhost";
import { CompGhost } from "./timeline/CompGhost";
import { FlowPulseBar } from "./visualizers/FlowPulseBar";
import { PlayheadPulse } from "./timeline/PlayheadPulse";
import { BreathingPlayhead } from "./timeline/BreathingPlayhead";
import { ZoomInIcon } from "./flowdock/glyphs/ZoomInIcon";
import { ZoomOutIcon } from "./flowdock/glyphs/ZoomOutIcon";
import { FitIcon } from "./flowdock/glyphs/FitIcon";
import { FitSelectionIcon } from "./flowdock/glyphs/FitSelectionIcon";
import { PlusIcon, MinusIcon } from "./icons";
import { getStemHeatColor, getStemHeatState, computeStemEnergy } from "../core/als/stemHeat";
import "../components/lane/StemLaneHeat.css";

type DragKind = "move" | "resize-left" | "resize-right" | "fade-in" | "fade-out" | "gain";

type DragState = {
  kind: DragKind;
  primaryId: ClipId;
  startX: number;
  startY: number;
  clipIds: ClipId[];
  originalClips: ClipModel[];
  ripple: boolean;
  duplicate?: boolean;
  hasDuplicated?: boolean;
  disableZeroCrossing?: boolean;
  fineAdjust?: boolean;
  hasSurpassedThreshold?: boolean;
};

type BoxSelection = {
  originClientX: number;
  originClientY: number;
  startSec: number;
  endSec: number;
  top: number;
  bottom: number;
};

type ScrubState = {
  isScrubbing: boolean;
  originX: number;
  originTime: number;
};

type WaveformDisplayMode = "peak" | "rms" | "normalized";

interface WaveformOptions {
  mode: WaveformDisplayMode;
  heightMultiplier: number;
  zoomLevel: number;
}

type Props = {
  height: number;
  tracks: TrackData[];
  clips: ClipModel[];
  setClips: (fn: (prev: ClipModel[]) => ClipModel[]) => void;
  isPlaying: boolean;
  currentTime: number;
  onSeek: (sec: number) => void;
  bpm: number;
  beatsPerBar: number;
  pixelsPerSecond: number;
  ppsAPI: { set: (pps: number) => void; zoomBy: (factor: number, anchorSec: number) => void; value: number; };
  scrollX: number;
  setScrollX: React.Dispatch<React.SetStateAction<number>>; 
  selection: { start: number; end: number } | null;
  setSelection: (a: number, b: number) => void;
  clearSelection: () => void;
  onSplitAt: (clipId: ClipId, sec: number) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: () => boolean;
  canRedo?: () => boolean;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  mixerSettings: { [key: string]: MixerSettings };
  armedTracks: Set<string>;
  soloedTracks: Set<string>;
  masterAnalysis: { level: number; transient: boolean; waveform: Uint8Array };
  // Automation Props
  automationData: Record<string, Record<string, Record<string, AutomationPoint[]>>>; // trackId -> fxId -> paramName -> points
  visibleAutomationLanes: Record<string, { fxId: string, paramName: string } | null>; // trackId -> { fxId, paramName }
  onAddAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, point: AutomationPoint) => void;
  onUpdateAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number, point: AutomationPoint) => void;
  onDeleteAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number) => void;
  // Smart Clip Editing
  onUpdateClipProperties: (clipId: ClipId, props: Partial<Pick<ClipModel, 'fadeIn' | 'fadeOut' | 'gain'>>) => void;
  style?: React.CSSProperties; // New prop for dynamic styling from App.tsx
  trackAnalysis: Record<string, TrackAnalysisData>;
  highlightClipIds?: ClipId[];
  followPlayhead: boolean;
  onManualScroll?: () => void;
  trackUiState: Record<string, TrackUIState>;
  onResizeTrack: (trackId: string, height: number) => void;
  onSetTrackContext: (trackId: string, context: TrackContextMode) => void;
  onOpenPianoRoll: (clip: ClipModel) => void;
  audioBuffers: Record<string, AudioBuffer | undefined>;
  onInvokeTrackBloom?: (trackId: string) => void;
  onToggleMute?: (trackId: string) => void;
  onToggleSolo?: (trackId: string) => void;
  onToggleArm?: (trackId: string) => void;
};

const BASE_CLIP_LANE_H = DEFAULT_TRACK_LANE_HEIGHT;
const AUTOMATION_LANE_H = 68;
const RULER_H = 24;
const TIMELINE_NAVIGATOR_H = 48;
const ZERO_CROSS_WINDOW_SEC = 0.006;
const AUTO_CROSSFADE_SEC = 0.03;
const TRACK_HEADER_WIDTH_STORAGE_KEY = 'mixxclub:arrange:headerWidth';
const TRACK_HEADER_WIDTH_DEFAULT = 240;
const TRACK_HEADER_WIDTH_MIN = 180;
const TRACK_HEADER_WIDTH_MAX = 420;
const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const CLICK_THRESHOLD_PX = 3;

const applyAutomaticCrossfades = (clips: ClipModel[]) => {
  const byTrack = new Map<string, ClipModel[]>();
  clips.forEach((clip) => {
    const list = byTrack.get(clip.trackId) ?? [];
    list.push(clip);
    byTrack.set(clip.trackId, list);
  });

  const updated = new Map<string, ClipModel>();

  byTrack.forEach((trackClips) => {
    const ordered = [...trackClips].sort((a, b) => a.start - b.start);
    for (let i = 0; i < ordered.length - 1; i++) {
      const current = ordered[i];
      const next = ordered[i + 1];
      const currentEnd = current.start + current.duration;
      const overlap = currentEnd - next.start;
      if (overlap <= 0) {
        if (current.autoFade) {
          updated.set(current.id, { ...current, autoFade: false });
        }
        continue;
      }

      const maxFade = Math.min(
        AUTO_CROSSFADE_SEC,
        overlap / 2,
        current.duration / 2,
        next.duration / 2
      );
      if (maxFade <= 0) continue;

      const fadeOut = Math.max(current.fadeOut ?? 0, maxFade);
      const fadeIn = Math.max(next.fadeIn ?? 0, maxFade);

      updated.set(current.id, { ...current, fadeOut, autoFade: true });
      updated.set(next.id, { ...next, fadeIn, autoFade: true });
    }

    const lastClip = ordered.at(-1);
    if (lastClip && lastClip.autoFade && !updated.has(lastClip.id)) {
      updated.set(lastClip.id, { ...lastClip, autoFade: false });
    }
  });

  return clips.map((clip) => updated.get(clip.id) ?? clip);
};

const deriveAdaptiveDivision = (
  pixelsPerSecond: number,
  bpm: number,
  masterLevel: number
) => {
  const beatWidthPx = secondsPerBeat(bpm) * pixelsPerSecond;
  let division: number;
  if (beatWidthPx > 480) division = 32;
  else if (beatWidthPx > 300) division = 16;
  else if (beatWidthPx > 160) division = 8;
  else if (beatWidthPx > 90) division = 4;
  else division = 4;

  if (masterLevel > 0.65 && division < 64) {
    division *= 2;
  }

  return Math.min(64, Math.max(4, division));
};

export const ArrangeWindow: React.FC<Props> = (props) => {
  const {
    height = 540,
    tracks,
    clips,
    setClips,
    isPlaying,
    currentTime,
    onSeek,
    bpm,
    beatsPerBar,
    pixelsPerSecond,
    ppsAPI,
    scrollX,
    setScrollX,
    selection,
    setSelection,
    clearSelection,
    onSplitAt,
    undo,
    redo,
    canUndo: canUndoCheck,
    canRedo: canRedoCheck,
    selectedTrackId,
    onSelectTrack,
    mixerSettings,
    armedTracks,
    soloedTracks,
    masterAnalysis,
    automationData,
    visibleAutomationLanes,
    onAddAutomationPoint,
    onUpdateAutomationPoint,
    onDeleteAutomationPoint,
    onUpdateClipProperties,
    style,
    trackAnalysis,
    highlightClipIds,
    followPlayhead,
    onManualScroll,
    trackUiState = {},
    onResizeTrack,
    onSetTrackContext,
    onOpenPianoRoll,
    onInvokeTrackBloom,
    audioBuffers = {},
    onToggleMute,
    onToggleSolo,
    onToggleArm,
  } = props;

  const flowContext = useFlowContext();

  // Register Arrange Window with Flow
  const { broadcast: broadcastArrange } = useFlowComponent({
    id: 'arrange-window',
    type: 'arrange',
    name: 'Arrange Window',
    broadcasts: [
      'clip_selected',
      'clip_moved',
      'clip_resized',
      'clip_split',
      'clip_merged',
      'track_selected',
      'timeline_seek',
      'tool_changed',
      'snap_changed',
      'selection_change',
      'zoom_event',
    ],
    listens: [
      {
        signal: 'prime_brain_guidance',
        callback: (payload) => {
          // Prime Brain can guide Arrange Window behavior
          // Could adjust tool suggestions, snap behavior, etc.
        },
      },
    ],
  });

  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  // Debug: Log when tracks/clips props change
  useEffect(() => {
    console.log('[ArrangeWindow] Props updated:', {
      tracksCount: tracks.length,
      clipsCount: clips.length,
      trackIds: tracks.map(t => t.id),
      clipIds: clips.map(c => c.id),
      clipTrackIds: clips.map(c => c.trackId),
    });
  }, [tracks, clips]);
  
  const projectDuration = useMemo(() => clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 60), [clips]);
  const contentWidth = useMemo(() => Math.max((projectDuration + 60) * pixelsPerSecond, 4000), [projectDuration, pixelsPerSecond]);
  
  const [drag, setDrag] = useState<DragState | null>(null);
  const [draggingSelection, setDraggingSelection] = useState<null | { startSec: number }>(null);
  const [snapIndicator, setSnapIndicator] = useState<number | null>(null);
  const [resizing, setResizing] = useState<null | { trackId: string; startY: number; startHeight: number }>(null);
  const [resizingHeader, setResizingHeader] = useState<null | { startX: number; startWidth: number }>(null);
  const [activeTool, setActiveTool] = useState<TimelineTool>(DEFAULT_TIMELINE_TOOL);
  // Use Flow Context for Prime Brain tool highlighting (flowContext already declared above)
  const highlightedTools = flowContext.adaptiveSuggestions.highlightTools || [];
  const toolPalette = useTimelineToolPalette({ 
    activeTool, 
    highlightedTools: highlightedTools.map(t => t.toLowerCase()),
  });
  const [snapSettings, setSnapSettings] = useState<SnapSettings>(DEFAULT_SNAP_SETTINGS);
  const [snapCandidates, setSnapCandidates] = useState<SnapCandidate[]>([]);
  const [boxSelection, setBoxSelection] = useState<BoxSelection | null>(null);
  const [scrubState, setScrubState] = useState<ScrubState>({ isScrubbing: false, originX: 0, originTime: 0 });
  const [waveformOptions, setWaveformOptions] = useState<WaveformOptions>({
    mode: "peak",
    heightMultiplier: 1,
    zoomLevel: 1,
  });
  const [isViewportPanning, setViewportPanning] = useState(false);
  const panOriginRef = useRef<{ x: number; scrollStart: number } | null>(null);
  const followInterruptedRef = useRef(false);
  const resumeFollowTimeoutRef = useRef<number | null>(null);
  const spacePressedRef = useRef(false);
  const shiftPressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) ||
          target.getAttribute("role") === "textbox");
      if (isEditable) return;

      if (event.code === "Space") {
        spacePressedRef.current = true;
        event.preventDefault();
      } else if (event.key === "Shift") {
        shiftPressedRef.current = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spacePressedRef.current = false;
        setViewportPanning(false);
        panOriginRef.current = null;
      } else if (event.key === "Shift") {
        shiftPressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, []);

  const {
    smoothScrollTo,
    zoomAroundPoint,
    zoomToFit,
    zoomToRange,
    stopMomentum,
    setPixelsPerSecondClamped,
  } = useTimelineInteractions({
    scrollX,
    setScrollX,
    getPixelsPerSecond: () => ppsAPI.value,
    setPixelsPerSecond: (value) => ppsAPI.set(value),
    contentWidth,
    viewportRef: timelineViewportRef,
    onManualScroll: () => {
      followInterruptedRef.current = true;
      onManualScroll?.();
    },
  });
  const previousScrollRef = useRef(scrollX);

  useEffect(() => {
    if (previousScrollRef.current !== scrollX) {
      recordSessionProbeTimelineEvent({
        kind: "scroll",
        scrollX,
        pixelsPerSecond,
        viewportWidth,
        contentWidth,
      });
      previousScrollRef.current = scrollX;
    }
  }, [scrollX, pixelsPerSecond, viewportWidth, contentWidth]);
  const [trackHeaderWidth, setTrackHeaderWidth] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return TRACK_HEADER_WIDTH_DEFAULT;
    }
    const stored = window.localStorage.getItem(TRACK_HEADER_WIDTH_STORAGE_KEY);
    const parsed = stored ? parseFloat(stored) : NaN;
    if (!Number.isFinite(parsed)) {
      return TRACK_HEADER_WIDTH_DEFAULT;
    }
    return clampNumber(parsed, TRACK_HEADER_WIDTH_MIN, TRACK_HEADER_WIDTH_MAX);
  });
  const clipBoundaries = useMemo(() => {
    const set = new Set<number>();
    clips.forEach((clip) => {
      set.add(clip.start);
      set.add(clip.start + clip.duration);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [clips]);

  useEffect(() => {
    if (!shouldSnap(snapSettings)) {
      setSnapCandidates([]);
      return;
    }
    const viewport = timelineViewportRef.current;
    const viewportWidthPx = viewport?.clientWidth ?? 0;
    const windowStart = Math.max(0, scrollX / pixelsPerSecond - 2);
    const windowEnd = Math.max(windowStart + 4, (scrollX + viewportWidthPx) / pixelsPerSecond + 2);
    const candidates = buildSnapCandidates(
      {
        bpm,
        beatsPerBar,
        pixelsPerSecond,
        clipBoundaries,
      },
      snapSettings,
      windowStart,
      windowEnd
    );
    setSnapCandidates(candidates);
  }, [bpm, beatsPerBar, clipBoundaries, pixelsPerSecond, scrollX, snapSettings]);

  const snapContext = useMemo(
    () => ({
      bpm,
      beatsPerBar,
      pixelsPerSecond,
      clipBoundaries,
    }),
    [bpm, beatsPerBar, clipBoundaries, pixelsPerSecond]
  );

  useEffect(() => {
    const node = timelineViewportRef.current;
    if (!node) return;

    const measure = () => {
      setViewportWidth(node.clientWidth ?? 0);
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const adaptiveDivision = useMemo(
    () => deriveAdaptiveDivision(pixelsPerSecond, bpm, masterAnalysis?.level ?? 0),
    [pixelsPerSecond, bpm, masterAnalysis?.level]
  );

  const snapToGrid = useCallback(
    (value: number) => quantizeSeconds(Math.max(0, value), bpm, beatsPerBar, "beats", adaptiveDivision),
    [adaptiveDivision, bpm, beatsPerBar]
  );

  const handleClipSplit = useCallback(
    (clipId: ClipId, splitTime: number) => {
      onSplitAt(clipId, splitTime);
      recordEditEvent(0); // Split is a precision edit
      broadcastArrange('clip_split', { clipId, splitTime });
    },
    [onSplitAt, broadcastArrange]
  );

  const handleSetTool = useCallback((tool: TimelineTool) => {
    setActiveTool(tool);
    recordToolSwitch(tool);
    broadcastArrange('tool_changed', { tool });
  }, [broadcastArrange]);

  const handleToggleSnap = useCallback(
    (key: "enableGrid" | "enableClips" | "enableMarkers" | "enableZeroCrossings") => {
      setSnapSettings((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        broadcastArrange('snap_changed', { settings: next });
        return next;
      });
    },
    [broadcastArrange]
  );

  const handleCycleWaveformMode = useCallback(() => {
    setWaveformOptions((prev) => {
      const nextMode = prev.mode === "peak" ? "rms" : prev.mode === "rms" ? "normalized" : "peak";
      return { ...prev, mode: nextMode };
    });
  }, []);

  const handleAdjustWaveformHeight = useCallback((delta: number) => {
    setWaveformOptions((prev) => ({
      ...prev,
      heightMultiplier: clampNumber(prev.heightMultiplier + delta, 0.5, 3),
    }));
  }, []);

  const handleAdjustWaveformZoom = useCallback((delta: number) => {
    setWaveformOptions((prev) => ({
      ...prev,
      zoomLevel: clampNumber(prev.zoomLevel + delta, 0.2, 3.5),
    }));
  }, []);

  const handleZoomIn = useCallback(() => {
    const viewport = timelineViewportRef.current;
    const anchorX = viewport ? viewport.clientWidth / 2 : 0;
    zoomAroundPoint(1.15, anchorX);
    recordZoomEvent(1.15, (scrollX + anchorX) / pixelsPerSecond);
  }, [zoomAroundPoint, scrollX, pixelsPerSecond]);

  const handleZoomOut = useCallback(() => {
    const viewport = timelineViewportRef.current;
    const anchorX = viewport ? viewport.clientWidth / 2 : 0;
    zoomAroundPoint(1 / 1.15, anchorX);
    recordZoomEvent(1 / 1.15, (scrollX + anchorX) / pixelsPerSecond);
  }, [zoomAroundPoint, scrollX, pixelsPerSecond]);

  const handleZoomFit = useCallback(() => {
    zoomToFit(Math.max(projectDuration, 1));
  }, [projectDuration, zoomToFit]);

  const handleZoomSelection = useCallback(() => {
    if (!selection) return;
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    if (end - start <= 0.01) return;
    zoomToRange(start, end);
  }, [selection, zoomToRange]);

  useEffect(() => {
    const handlers: string[] = [];
    const isEditableTarget = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return false;
      return (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.getAttribute("role") === "textbox"
      );
    };

    const addShortcut = (
      id: string,
      config: Parameters<typeof registerShortcut>[1],
      handler: (event: KeyboardEvent) => void
    ) => {
      registerShortcut(id, config, (event) => {
        if (isEditableTarget(event)) return;
        handler(event);
      });
      handlers.push(id);
    };

    addShortcut("timeline-tool-select", { key: "1" }, () => handleSetTool("select"));
    addShortcut("timeline-tool-move", { key: "2" }, () => handleSetTool("move"));
    addShortcut("timeline-tool-trim", { key: "3" }, () => handleSetTool("trim"));
    addShortcut("timeline-tool-split", { key: "4" }, () => handleSetTool("split"));
    addShortcut("timeline-snap-grid", { key: "g" }, () => handleToggleSnap("enableGrid"));
    addShortcut("timeline-snap-clips", { key: "s" }, () => handleToggleSnap("enableClips"));
    addShortcut("timeline-snap-markers", { key: "m" }, () => handleToggleSnap("enableMarkers"));
    addShortcut("timeline-snap-zero", { key: "z" }, () => handleToggleSnap("enableZeroCrossings"));
    addShortcut("timeline-zoom-in-meta", { meta: true, key: "=" }, () => handleZoomIn());
    addShortcut("timeline-zoom-in-ctrl", { ctrl: true, key: "=" }, () => handleZoomIn());
    addShortcut("timeline-zoom-out-meta", { meta: true, key: "-" }, () => handleZoomOut());
    addShortcut("timeline-zoom-out-ctrl", { ctrl: true, key: "-" }, () => handleZoomOut());
    addShortcut("timeline-zoom-fit-meta", { meta: true, key: "0" }, () => handleZoomFit());
    addShortcut("timeline-zoom-fit-ctrl", { ctrl: true, key: "0" }, () => handleZoomFit());
    addShortcut(
      "timeline-zoom-selection-meta",
      { meta: true, shift: true, key: "z" },
      () => handleZoomSelection()
    );
    addShortcut(
      "timeline-undo-meta",
      { meta: true, key: "z" },
      () => {
        if (undo && canUndoCheck?.()) undo();
      }
    );
    addShortcut(
      "timeline-undo-ctrl",
      { ctrl: true, key: "z" },
      () => {
        if (undo && canUndoCheck?.()) undo();
      }
    );
    addShortcut(
      "timeline-redo-meta",
      { meta: true, shift: true, key: "z" },
      () => {
        if (redo && canRedoCheck?.()) redo();
      }
    );
    addShortcut(
      "timeline-redo-ctrl",
      { ctrl: true, key: "y" },
      () => {
        if (redo && canRedoCheck?.()) redo();
      }
    );

    return () => {
      handlers.forEach((id) => unregisterShortcut(id));
    };
  }, [
    canRedoCheck,
    canUndoCheck,
    handleSetTool,
    handleToggleSnap,
    handleZoomFit,
    handleZoomIn,
    handleZoomOut,
    handleZoomSelection,
    redo,
    undo,
  ]);

  const laneLayouts = useMemo(() => {
    let top = 0;
    const laneHeightScale =
      flowContext.intensity === "immersed"
        ? 1.16 + flowContext.momentum * 0.08
        : flowContext.intensity === "charged"
        ? 1.06 + flowContext.momentum * 0.05
        : 1;
    return tracks.map((track) => {
      const ui = trackUiState[track.id] ?? {
        context: "playback" as TrackContextMode,
        laneHeight: BASE_CLIP_LANE_H,
        collapsed: false,
      };
      const collapsed = ui.collapsed;
      const requestedLaneHeight = ui.laneHeight ?? BASE_CLIP_LANE_H;
      const clipHeight = collapsed
        ? COLLAPSED_TRACK_LANE_HEIGHT
        : clampNumber(
            Math.round(requestedLaneHeight * laneHeightScale),
            MIN_TRACK_LANE_HEIGHT,
            MAX_TRACK_LANE_HEIGHT
          );
      const visibleAutomationConfig = collapsed ? null : visibleAutomationLanes[track.id];
      const isAutomationVisible = !!visibleAutomationConfig;
      const laneHeight = clipHeight + (isAutomationVisible ? AUTOMATION_LANE_H : 0);
      const layout = {
        track,
        top,
        laneHeight,
        clipHeight,
        isAutomationVisible,
        uiState: ui,
        automationConfig: visibleAutomationConfig,
      };
      top += laneHeight;
      return layout;
    });
  }, [tracks, visibleAutomationLanes, trackUiState, flowContext.intensity, flowContext.momentum]);

  const totalLaneHeight = useMemo(
    () => laneLayouts.reduce((sum, layout) => sum + layout.laneHeight, 0),
    [laneLayouts]
  );

  const trackLaneLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        top: number;
        laneHeight: number;
        clipHeight: number;
        isAutomationVisible: boolean;
        uiState: TrackUIState;
        automationConfig: { fxId: string; paramName: string } | null;
      }
    >();
    laneLayouts.forEach((layout) => {
      map.set(layout.track.id, {
        top: layout.top,
        laneHeight: layout.laneHeight,
        clipHeight: layout.clipHeight,
        isAutomationVisible: layout.isAutomationVisible,
        uiState: layout.uiState,
        automationConfig: layout.automationConfig,
      });
    });
    return map;
  }, [laneLayouts]);

  const alsFeedbackByTrack = useMemo(() => {
    const map = new Map<string, TrackALSFeedback>();
    tracks.forEach((track) => {
      const analysis = trackAnalysis[track.id];
      map.set(
        track.id,
        deriveTrackALSFeedback({
          level: analysis?.level ?? 0,
          transient: analysis?.transient ?? false,
          volume: mixerSettings[track.id]?.volume ?? 0.75,
          color: track.trackColor,
        })
      );
    });
    return map;
  }, [mixerSettings, trackAnalysis, tracks]);

  const highlightClipIdSet = useMemo(
    () => new Set(highlightClipIds ?? []),
    [highlightClipIds]
  );

  const bars = useMemo(() => {
    const spBar = secondsPerBar(bpm, beatsPerBar);
    const count = Math.ceil(contentWidth / (spBar * pixelsPerSecond));
    return Array.from({ length: count }, (_, i) => ({ bar: i + 1, x: i * spBar * pixelsPerSecond }));
  }, [bpm, beatsPerBar, pixelsPerSecond, contentWidth]);

  const beats = useMemo(() => {
    const spBeat = secondsPerBeat(bpm);
    const count = Math.ceil(contentWidth / (spBeat * pixelsPerSecond));
    return Array.from({ length: count }, (_, i) => ({ x: i * spBeat * pixelsPerSecond }));
  }, [bpm, pixelsPerSecond, contentWidth]);

  const microGuides = useMemo(() => {
    const spBeat = secondsPerBeat(bpm);
    const primaryDivision = adaptiveDivision;
    if (primaryDivision <= 4) return [];
    const stepSec = spBeat / (primaryDivision / 4);
    const count = Math.ceil(contentWidth / (stepSec * pixelsPerSecond));
    const primaryStride = Math.max(1, primaryDivision / 4);
    const guides: { x: number }[] = [];
    for (let i = 0; i < count; i++) {
      if (i % primaryStride === 0) continue;
      guides.push({ x: i * stepSec * pixelsPerSecond });
    }
    return guides;
  }, [adaptiveDivision, bpm, contentWidth, pixelsPerSecond]);

  const handleNavigatorScroll = useCallback((targetScroll: number) => {
    onManualScroll?.();
    if (viewportWidth <= 0) return;
    const maxScroll = Math.max(0, contentWidth - viewportWidth);
    const clamped = Math.max(0, Math.min(targetScroll, maxScroll));
    setScrollX(clamped);
    recordSessionProbeTimelineEvent({
      kind: "scroll",
      scrollX: clamped,
      pixelsPerSecond,
      viewportWidth,
      contentWidth,
    });
  }, [contentWidth, viewportWidth, setScrollX, onManualScroll, pixelsPerSecond]);

  const handleNavigatorZoom = useCallback((startRatio: number, endRatio: number) => {
    if (viewportWidth <= 0) return;
    const start = Math.min(startRatio, endRatio);
    const end = Math.max(startRatio, endRatio);
    if (end <= start) {
      handleNavigatorScroll(start * contentWidth - viewportWidth / 2);
      return;
    }

    const span = end - start;
    const minimalSpan = 0.01;
    if (span < minimalSpan) {
      const centerPx = ((start + end) / 2) * contentWidth;
      handleNavigatorScroll(centerPx - viewportWidth / 2);
      return;
    }

    onManualScroll?.();

    const startPx = start * contentWidth;
    const endPx = end * contentWidth;
    const startSec = startPx / pixelsPerSecond;
    const endSec = endPx / pixelsPerSecond;
    const durationSec = Math.max(0.1, endSec - startSec);
    const newPps = Math.min(500, Math.max(10, viewportWidth / durationSec));
    const newContentWidth = Math.max((projectDuration + 60) * newPps, 4000);
    const maxScroll = Math.max(0, newContentWidth - viewportWidth);
    const newScroll = Math.max(0, Math.min(startSec * newPps, maxScroll));

    ppsAPI.set(newPps);
    setScrollX(newScroll);
    const zoomDelta = newPps / pixelsPerSecond;
    const zoomPos = (startSec + endSec) / 2;
    recordZoomEvent(zoomDelta, zoomPos);
    broadcastArrange('zoom_event', { delta: zoomDelta, position: zoomPos, pps: newPps });
    recordSessionProbeTimelineEvent({
      kind: "zoom",
      scrollX: newScroll,
      pixelsPerSecond: newPps,
      viewportWidth,
      contentWidth: newContentWidth,
      ratioRange: [start, end],
    });
  }, [
    viewportWidth,
    contentWidth,
    pixelsPerSecond,
    projectDuration,
    handleNavigatorScroll,
    onManualScroll,
    ppsAPI,
    setScrollX,
  ]);

  const snapStartToZeroCrossing = useCallback(
    (
      clip: ClipModel,
      candidate: { start: number; duration: number; sourceStart: number }
    ) => {
      const buffer = audioBuffers?.[clip.bufferId];
      if (!buffer) {
        return { ...candidate, zeroStart: false };
      }
      const zeroTime = findNearestZeroCrossing(buffer, candidate.sourceStart, {
        windowSec: ZERO_CROSS_WINDOW_SEC,
        direction: "both",
      });
      if (zeroTime === null) {
        return { ...candidate, zeroStart: false };
      }
      const adjustment = zeroTime - candidate.sourceStart;
      if (Math.abs(adjustment) > ZERO_CROSS_WINDOW_SEC * 1.5) {
        return { ...candidate, zeroStart: false };
      }
      let adjustedStart = candidate.start + adjustment;
      let adjustedSourceStart = zeroTime;
      if (adjustedStart < 0) {
        adjustedSourceStart = Math.max(0, adjustedSourceStart - adjustedStart);
        adjustedStart = 0;
      }
      adjustedSourceStart = clampNumber(adjustedSourceStart, 0, buffer.duration);
      const originalEnd = candidate.start + candidate.duration;
      let newDuration = Math.max(0.01, originalEnd - adjustedStart);
      if (adjustedSourceStart + newDuration > buffer.duration) {
        newDuration = Math.max(0.01, buffer.duration - adjustedSourceStart);
      }
      return {
        start: adjustedStart,
        duration: newDuration,
        sourceStart: adjustedSourceStart,
        zeroStart: true,
      };
    },
    [audioBuffers]
  );

  const snapEndToZeroCrossing = useCallback(
    (
      clip: ClipModel,
      candidate: { start: number; duration: number; sourceStart: number }
    ) => {
      const buffer = audioBuffers?.[clip.bufferId];
      if (!buffer) {
        return { ...candidate, zeroEnd: false };
      }
      const targetEnd = candidate.sourceStart + candidate.duration;
      const zeroTime = findNearestZeroCrossing(buffer, targetEnd, {
        windowSec: ZERO_CROSS_WINDOW_SEC,
        direction: "both",
      });
      if (zeroTime === null) {
        return { ...candidate, zeroEnd: false };
      }
      const adjustment = zeroTime - targetEnd;
      if (Math.abs(adjustment) > ZERO_CROSS_WINDOW_SEC * 1.5) {
        return { ...candidate, zeroEnd: false };
      }
      let newDuration = Math.max(0.01, candidate.duration + adjustment);
      if (candidate.sourceStart + newDuration > buffer.duration) {
        newDuration = Math.max(0.01, buffer.duration - candidate.sourceStart);
      }
      return {
        ...candidate,
        duration: newDuration,
        zeroEnd: true,
      };
    },
    [audioBuffers]
  );

  const onBgMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const viewport = timelineViewportRef.current;
      if (!viewport) return;

      if (e.button === 1 || (e.button === 0 && spacePressedRef.current)) {
        stopMomentum();
        setViewportPanning(true);
        panOriginRef.current = { x: e.clientX, scrollStart: scrollX };
        followInterruptedRef.current = true;
        onManualScroll?.();
        return;
      }

      if (e.button !== 0) return;

      onManualScroll?.();
      followInterruptedRef.current = true;
      const rect = viewport.getBoundingClientRect();
      const xPx = e.clientX - rect.left + scrollX;
      const yPx = e.clientY - rect.top - RULER_H;
      const startSec = xPx / pixelsPerSecond;

      if (!shiftPressedRef.current) {
        clearSelection();
        setClips((prev) => prev.map((clip) => ({ ...clip, selected: false })));
        onSelectTrack(null);
        broadcastArrange('track_selected', { trackId: null });
      }

      setDraggingSelection({ startSec });
      setSelection(startSec, startSec);
      broadcastArrange('selection_change', { start: startSec, end: startSec });
      setBoxSelection({
        originClientX: e.clientX,
        originClientY: e.clientY,
        startSec,
        endSec: startSec,
        top: yPx,
        bottom: yPx,
      });
      setSnapIndicator(null);
    },
    [
      clearSelection,
      onManualScroll,
      onSelectTrack,
      pixelsPerSecond,
      scrollX,
      setClips,
      setSelection,
      stopMomentum,
    ]
  );
  
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = timelineViewportRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (resizingHeader) {
        const deltaX = e.clientX - resizingHeader.startX;
        const nextWidth = clampNumber(
          resizingHeader.startWidth + deltaX,
          TRACK_HEADER_WIDTH_MIN,
          TRACK_HEADER_WIDTH_MAX
        );
        setTrackHeaderWidth(nextWidth);
        return;
      }

      if (resizing) {
        const deltaY = e.clientY - resizing.startY;
        onResizeTrack(resizing.trackId, resizing.startHeight + deltaY);
        return;
      }

      if (isViewportPanning && panOriginRef.current) {
        followInterruptedRef.current = true;
        const viewportWidthPx = viewportWidth;
        const maxScroll = Math.max(0, contentWidth - viewportWidthPx);
        const deltaX = panOriginRef.current.x - e.clientX;
        const nextScroll = clampNumber(panOriginRef.current.scrollStart + deltaX, 0, maxScroll);
        setScrollX(nextScroll);
        return;
      }

      if (scrubState.isScrubbing) {
        const viewport = timelineViewportRef.current;
        if (viewport) {
          const bounds = viewport.getBoundingClientRect();
          const xPx = e.clientX - bounds.left + scrollX;
          let sec = Math.max(0, xPx / pixelsPerSecond);
          if (!e.altKey && shouldSnap(snapSettings)) {
            const result = applySnapIfEnabled(sec, snapContext, snapSettings, snapCandidates);
            sec = result.time;
          } else {
            sec = snapToGrid(sec);
          }
          onSeek(sec);
          broadcastArrange('timeline_seek', { time: sec });
        }
        return;
      }

      if (boxSelection) {
        const xPx = e.clientX - rect.left + scrollX;
        const currentSec = xPx / pixelsPerSecond;
        const yPx = e.clientY - rect.top - RULER_H;
        const topPx = Math.min(boxSelection.originClientY, e.clientY) - rect.top - RULER_H;
        const bottomPx = Math.max(boxSelection.originClientY, e.clientY) - rect.top - RULER_H;
        const minSec = Math.min(boxSelection.startSec, currentSec);
        const maxSec = Math.max(boxSelection.startSec, currentSec);

        setSelection(minSec, maxSec);
        broadcastArrange('selection_change', { start: minSec, end: maxSec });
        setBoxSelection({
          ...boxSelection,
          endSec: currentSec,
          top: topPx,
          bottom: bottomPx,
        });

        const selectedIds = new Set<ClipId>();
        clips.forEach((clip) => {
          const layout = trackLaneLookup.get(clip.trackId);
          if (!layout) return;
          const clipTop = layout.top;
          const clipBottom = layout.top + layout.clipHeight;
          if (clipBottom < Math.min(topPx, bottomPx) || clipTop > Math.max(topPx, bottomPx)) {
            return;
          }
          const clipStart = clip.start;
          const clipEnd = clip.start + clip.duration;
          if (clipEnd >= minSec && clipStart <= maxSec) {
            selectedIds.add(clip.id);
          }
        });

        setClips((prev) =>
          prev.map((clip) => {
            const alreadySelected = clip.selected;
            const shouldSelect = selectedIds.has(clip.id) || (shiftPressedRef.current && alreadySelected);
            if (shouldSelect === alreadySelected) {
              return clip;
            }
            return { ...clip, selected: shouldSelect };
          })
        );
        return;
      }

      if (drag) {
        const dxPx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (!drag.hasSurpassedThreshold) {
          if (Math.abs(dxPx) > CLICK_THRESHOLD_PX || Math.abs(dy) > CLICK_THRESHOLD_PX) {
            setDrag((prev) => (prev ? { ...prev, hasSurpassedThreshold: true } : prev));
          } else {
            return;
          }
        }

        if (drag.duplicate && !drag.hasDuplicated) {
          const duplicates = drag.originalClips.map((clip) => {
            const newId = `clip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            return { ...clip, id: newId, selected: true };
          });
          const newIds = duplicates.map((clip) => clip.id);
          if (newIds.length) {
            setClips((prev) => {
              const base = prev.map((clip) =>
                drag.clipIds.includes(clip.id) ? { ...clip, selected: false } : clip
              );
              return [...base, ...duplicates];
            });
            setDrag((prev) =>
              prev
                ? {
                    ...prev,
                    clipIds: newIds,
                    originalClips: duplicates.map((clip) => ({ ...clip })),
                    hasDuplicated: true,
                  }
                : prev
            );
            setSnapIndicator(duplicates[0].start);
          }
          return;
        }

        const constrainVerticalMovement = shiftPressedRef.current;
        const dxSec = dxPx / pixelsPerSecond;
        const rippleActive = drag.ripple || e.altKey;
        const altDisableSnap = e.altKey;
        const originalMap = new Map(drag.originalClips.map((clip) => [clip.id, clip]));
        const selectionSet = new Set(drag.clipIds);
        const primaryOriginal = originalMap.get(drag.primaryId);
        if (!primaryOriginal) return;

        let snapValue: number | null = null;

        if (drag.kind === "move") {
          const hoveredY = constrainVerticalMovement
            ? drag.startY - rect.top - RULER_H
            : e.clientY - rect.top - RULER_H;
          let targetTrackId = primaryOriginal.trackId;
          if (!constrainVerticalMovement) {
            for (const layout of laneLayouts) {
              if (hoveredY >= layout.top && hoveredY < layout.top + layout.laneHeight) {
                targetTrackId = layout.track.id;
                break;
              }
            }
          }

          const desiredStart = primaryOriginal.start + dxSec;
          let snappedPrimary = desiredStart;
          if (!altDisableSnap && shouldSnap(snapSettings)) {
            const result = applySnapIfEnabled(desiredStart, snapContext, snapSettings, snapCandidates);
            snappedPrimary = result.time;
            if (result.snappedTo) {
              snapValue = result.snappedTo.time;
            }
          } else {
            snappedPrimary = snapToGrid(desiredStart);
            snapValue = snappedPrimary;
          }

          const deltaSec = snappedPrimary - primaryOriginal.start;

        if (Math.abs(deltaSec) < 1e-6 && !rippleActive) {
            setSnapIndicator(snapValue);
            return;
          }

          const ripplePlan = new Map<string, { delta: number; selectionEnd: number }>();
          drag.originalClips.forEach((clip) => {
            const assignedTrackId = clip.id === drag.primaryId ? targetTrackId : clip.trackId;
            const clipEnd = clip.start + clip.duration;
            const existing = ripplePlan.get(assignedTrackId);
            if (existing) {
              existing.selectionEnd = Math.max(existing.selectionEnd, clipEnd);
              existing.delta = deltaSec;
            } else {
              ripplePlan.set(assignedTrackId, { delta: deltaSec, selectionEnd: clipEnd });
            }
          });

          setClips((prev) => {
            let next = prev.map((clip) => {
              if (!selectionSet.has(clip.id)) return clip;
              const reference = originalMap.get(clip.id)!;
              const assignedTrackId = reference.id === drag.primaryId ? targetTrackId : reference.trackId;
              const newStart = Math.max(0, reference.start + deltaSec);
              if (
                Math.abs(clip.start - newStart) < 1e-6 &&
                clip.trackId === assignedTrackId
              ) {
                return clip;
              }
              return {
                ...clip,
                start: newStart,
                trackId: assignedTrackId,
              };
            });

            if (rippleActive && Math.abs(deltaSec) > 1e-6) {
              next = next.map((clip) => {
                if (selectionSet.has(clip.id)) return clip;
                const plan = ripplePlan.get(clip.trackId);
                if (!plan) return clip;
                if (clip.start >= plan.selectionEnd - 1e-6) {
                  const shifted = Math.max(0, clip.start + plan.delta);
                  if (Math.abs(shifted - clip.start) > 1e-6) {
                    return { ...clip, start: shifted };
                  }
                }
                return clip;
              });
            }

            return next;
          });
          
          // Broadcast clip move
          if (Math.abs(deltaSec) > 1e-6) {
            broadcastArrange('clip_moved', { 
              clipIds: Array.from(selectionSet),
              deltaSec,
              newStart: snappedPrimary,
              targetTrackId
            });
          }
        } else if (drag.kind === "resize-left") {
          const reference = primaryOriginal;
          const desiredStart = reference.start + dxSec;
          let newStart = desiredStart;
          if (!altDisableSnap && shouldSnap(snapSettings)) {
            const result = applySnapIfEnabled(desiredStart, snapContext, snapSettings, snapCandidates);
            newStart = result.time;
            if (result.snappedTo) {
              snapValue = result.snappedTo.time;
            }
          } else {
            newStart = snapToGrid(desiredStart);
            snapValue = newStart;
          }
          const originalEnd = reference.start + reference.duration;
          const newDuration = originalEnd - newStart;
          const startChange = newStart - reference.start;
          const newSourceStart = (reference.sourceStart ?? 0) + startChange;
          if (newDuration > 0.05 && newSourceStart >= 0) {
            let finalStart = newStart;
            setClips((prev) =>
              prev.map((clip) => {
                if (clip.id !== drag.primaryId) return clip;
                let candidate = {
                  start: newStart,
                  duration: newDuration,
                  sourceStart: newSourceStart,
                };
                let zeroStart = false;
                if (!(drag.disableZeroCrossing || e.shiftKey)) {
                  const snapped = snapStartToZeroCrossing(clip, candidate);
                  candidate = {
                    start: snapped.start,
                    duration: snapped.duration,
                    sourceStart: snapped.sourceStart,
                  };
                  zeroStart = Boolean(snapped.zeroStart);
                }
                finalStart = candidate.start;
                const updatedClip = {
                  ...clip,
                  ...candidate,
                  zeroStart,
                  zeroEnd: clip.zeroEnd ?? false,
                };
                
                // Broadcast clip resize
                broadcastArrange('clip_resized', {
                  clipId: drag.primaryId,
                  kind: 'resize-left',
                  newStart: finalStart,
                  newDuration: candidate.duration,
                  zeroStart
                });
                
                return updatedClip;
              })
            );
            snapValue = finalStart;
          }
        } else if (drag.kind === "resize-right") {
          const reference = primaryOriginal;
          const desiredEnd = reference.start + reference.duration + dxSec;
          let newEnd = desiredEnd;
          if (!altDisableSnap && shouldSnap(snapSettings)) {
            const result = applySnapIfEnabled(desiredEnd, snapContext, snapSettings, snapCandidates);
            newEnd = result.time;
            if (result.snappedTo) {
              snapValue = result.snappedTo.time;
            }
          } else {
            newEnd = snapToGrid(desiredEnd);
            snapValue = newEnd;
          }
          const newDuration = Math.max(0.05, newEnd - reference.start);
          let finalEnd = reference.start + newDuration;
          setClips((prev) =>
            prev.map((clip) => {
              if (clip.id !== drag.primaryId) return clip;
              let candidate = {
                start: clip.start,
                duration: newDuration,
                sourceStart: clip.sourceStart ?? 0,
              };
              let zeroEnd = false;
              if (!(drag.disableZeroCrossing || e.shiftKey)) {
                const snapped = snapEndToZeroCrossing(clip, candidate);
                candidate = {
                  ...candidate,
                  duration: snapped.duration,
                };
                zeroEnd = Boolean(snapped.zeroEnd);
              }
              finalEnd = candidate.start + candidate.duration;
              const updatedClip = {
                ...clip,
                duration: candidate.duration,
                zeroEnd,
                zeroStart: clip.zeroStart ?? false,
              };
              
              // Broadcast clip resize
              broadcastArrange('clip_resized', {
                clipId: drag.primaryId,
                kind: 'resize-right',
                newDuration: candidate.duration,
                newEnd: finalEnd,
                zeroEnd
              });
              
              return updatedClip;
            })
          );
          snapValue = finalEnd;
        } else if (drag.kind === "fade-in") {
          snapValue = null;
          const currentClip = clips.find((clip) => clip.id === drag.primaryId) ?? primaryOriginal;
          const newFadeIn = Math.max(
            0,
            Math.min(currentClip.duration / 2, (currentClip.fadeIn ?? 0) + dxSec)
          );
          onUpdateClipProperties(currentClip.id, { fadeIn: newFadeIn });
        } else if (drag.kind === "fade-out") {
          snapValue = null;
          const currentClip = clips.find((clip) => clip.id === drag.primaryId) ?? primaryOriginal;
          const newFadeOut = Math.max(
            0,
            Math.min(currentClip.duration / 2, (currentClip.fadeOut ?? 0) - dxSec)
          );
          onUpdateClipProperties(currentClip.id, { fadeOut: newFadeOut });
        } else if (drag.kind === "gain") {
          snapValue = null;
          const currentClip = clips.find((clip) => clip.id === drag.primaryId) ?? primaryOriginal;
          const sensitivity = drag.fineAdjust || e.ctrlKey ? 0.002 : 0.01;
          const newGain = Math.max(
            0,
            Math.min(2.0, (currentClip.gain ?? 1.0) - dy * sensitivity)
          );
          onUpdateClipProperties(currentClip.id, { gain: newGain });
        }

        setSnapIndicator(snapValue);
        return;
      }

      if (draggingSelection) {
        const xPx = e.clientX - rect.left + scrollX;
        const endSec = xPx / pixelsPerSecond;
        setSelection(draggingSelection.startSec, endSec);
      } else if (!drag) {
        setSnapIndicator(null);
      }
    },
    [
      boxSelection,
      clips,
      contentWidth,
      drag,
      draggingSelection,
      isViewportPanning,
      laneLayouts,
      onResizeTrack,
      onUpdateClipProperties,
      pixelsPerSecond,
      resizing,
      resizingHeader,
      scrollX,
      setBoxSelection,
      setClips,
      setScrollX,
      setSelection,
      setSnapIndicator,
      setTrackHeaderWidth,
      snapCandidates,
      snapContext,
      snapSettings,
      snapToGrid,
      trackLaneLookup,
      viewportWidth,
    ]
  );

  const onMouseUp = useCallback(() => {
    if (drag) {
      setClips((prev) => applyAutomaticCrossfades(prev));
      // Record edit event - calculate distance from drag start
      // Distance is approximate based on pixel movement
      const dragDistance = drag.startX !== undefined && drag.startY !== undefined 
        ? Math.sqrt(Math.pow((drag.startX || 0), 2) + Math.pow((drag.startY || 0), 2))
        : 0;
      recordEditEvent(dragDistance);
    }
    if (resizing) {
      recordEditEvent(0); // Resize is a precision edit
    }
    setDrag(null);
    setDraggingSelection(null);
    setSnapIndicator(null);
    setResizing(null);
    setResizingHeader(null);
    setBoxSelection(null);
    setViewportPanning(false);
    panOriginRef.current = null;
    if (scrubState.isScrubbing) {
      setScrubState({ isScrubbing: false, originX: 0, originTime: 0 });
    }
  }, [drag, resizing, scrubState.isScrubbing, setBoxSelection, setClips, setResizingHeader]);

  const onRulerDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    stopMomentum();
    followInterruptedRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const sec = Math.max(0, (xPx + scrollX) / pixelsPerSecond);
    onSeek(sec);
    broadcastArrange('timeline_seek', { time: sec });
    setScrubState({ isScrubbing: true, originX: e.clientX, originTime: sec });
  }, [onSeek, pixelsPerSecond, scrollX, stopMomentum, broadcastArrange]);
  
  const masterLevel = masterAnalysis?.level ?? 0;
  const glowIntensity = Math.min(1, masterLevel * 3.0);
  
  // Create a memoized map for faster track color lookup
  const trackColorMap = useMemo(() => {
    const map = new Map<string, { color: string, light: string }>();
    tracks.forEach(t => {
      switch (t.trackColor) {
        case 'cyan':    map.set(t.id, { color: '#06b6d4', light: '#67e8f9' }); break;
        case 'magenta': map.set(t.id, { color: '#d946ef', light: '#f0abfc' }); break;
        case 'blue':    map.set(t.id, { color: '#3b82f6', light: '#93c5fd' }); break;
        case 'green':   map.set(t.id, { color: '#22c55e', light: '#86efac' }); break;
        case 'crimson': map.set(t.id, { color: '#f43f5e', light: '#fb7185' }); break;
        case 'purple':  map.set(t.id, { color: '#8b5cf6', light: '#c4b5fd' }); break;
      }
    });
    return map;
  }, [tracks]);

  // Determine current playhead color contextually
  const playheadColor = useMemo(() => {
    const activeClip = clips.find(c => currentTime >= c.start && currentTime < c.start + c.duration);
    return activeClip ? trackColorMap.get(activeClip.trackId) : { color: '#06b6d4', light: '#67e8f9' };
  }, [currentTime, clips, trackColorMap]);

  const playheadStyle = {
    '--playhead-color': playheadColor?.color,
    '--playhead-color-light': playheadColor?.light,
  } as React.CSSProperties;

  useEffect(() => {
    if (!followPlayhead) {
      followInterruptedRef.current = false;
      return;
    }
    if (!isPlaying) {
      followInterruptedRef.current = false;
      return;
    }
    if (followInterruptedRef.current) {
      if (resumeFollowTimeoutRef.current !== null) {
        window.clearTimeout(resumeFollowTimeoutRef.current);
      }
      resumeFollowTimeoutRef.current = window.setTimeout(() => {
        followInterruptedRef.current = false;
      }, 1200);
      return;
    }
    const viewportNode = timelineViewportRef.current;
    if (!viewportNode) return;
    const viewportWidthPx = viewportNode.clientWidth;
    if (viewportWidthPx <= 0) return;
    const margin = viewportWidthPx * 0.25;
    const playheadPx = currentTime * pixelsPerSecond;
    const leftEdge = scrollX;
    const rightEdge = scrollX + viewportWidthPx;

    let targetScroll = scrollX;
    if (playheadPx > rightEdge - margin) {
      targetScroll = playheadPx - viewportWidthPx + margin;
    } else if (playheadPx < leftEdge + margin) {
      targetScroll = playheadPx - margin;
    }

    targetScroll = Math.max(0, targetScroll);
    if (Math.abs(targetScroll - scrollX) > 0.5) {
      smoothScrollTo(targetScroll);
    }
  }, [followPlayhead, isPlaying, currentTime, pixelsPerSecond, scrollX, smoothScrollTo]);

  useEffect(() => {
    if (resizing) {
      document.body.style.cursor = "row-resize";
      return () => {
        document.body.style.cursor = "";
      };
    }
    if (resizingHeader) {
      document.body.style.cursor = "col-resize";
      return () => {
        document.body.style.cursor = "";
      };
    }
    return undefined;
  }, [resizing, resizingHeader]);

  useEffect(() => {
    if (!resizing) return;
    const handleMouseUp = () => {
      setResizing(null);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  useEffect(() => {
    if (!resizingHeader) return;
    const handleMouseUp = () => {
      setResizingHeader(null);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingHeader]);

  useEffect(() => {
    return () => {
      if (resumeFollowTimeoutRef.current !== null) {
        window.clearTimeout(resumeFollowTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(
      TRACK_HEADER_WIDTH_STORAGE_KEY,
      trackHeaderWidth.toString()
    );
  }, [trackHeaderWidth]);

  const transientKey = masterAnalysis?.transient ? Date.now() : 0;
  const playheadX = currentTime * pixelsPerSecond - scrollX;
  const playheadVisible = playheadX > -80 && playheadX < contentWidth + 80;
  return (
    <div 
      className="relative w-full rounded-3xl border border-glass-border flex bg-glass-surface backdrop-blur-2xl shadow-[0_45px_95px_rgba(4,12,26,0.55)] text-ink"
      style={{ height, ...style }} // Merge the style prop here
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        className="absolute top-3 z-40 flex flex-wrap items-center gap-3 pointer-events-none"
        style={{ left: trackHeaderWidth + 24 }}
      >
        <div className="flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 pointer-events-auto shadow-lg shadow-black/60">
          {toolPalette.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleSetTool(tool.id)}
              className={`text-[11px] uppercase tracking-[0.28em] px-2 py-1 rounded-full transition ${
                tool.active ? "bg-cyan-300 text-black shadow-md" : "text-white/70 hover:text-white/90"
              }`}
              title={`Tool ${tool.label} (${tool.shortcut})`}
            >
              {tool.label}
              <span className="ml-1 text-white/40 text-[9px]">{tool.shortcut}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 pointer-events-auto shadow shadow-black/50">
          {[
            { key: "enableGrid", label: "Grid", shortcut: "G", active: snapSettings.enableGrid },
            { key: "enableClips", label: "Clips", shortcut: "S", active: snapSettings.enableClips },
            { key: "enableMarkers", label: "Markers", shortcut: "M", active: snapSettings.enableMarkers },
            { key: "enableZeroCrossings", label: "Zero", shortcut: "Z", active: snapSettings.enableZeroCrossings },
          ].map((snap) => (
            <button
              key={snap.key}
              type="button"
              onClick={() =>
                handleToggleSnap(snap.key as "enableGrid" | "enableClips" | "enableMarkers" | "enableZeroCrossings")
              }
              className={`px-2 py-1 text-[10px] tracking-[0.35em] uppercase rounded-full transition ${
                snap.active ? "bg-emerald-400 text-black" : "text-white/60 hover:text-white"
              }`}
              title={`${snap.label} snap (${snap.shortcut})`}
            >
              {snap.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 pointer-events-auto shadow shadow-black/50">
          <button
            type="button"
            onClick={handleCycleWaveformMode}
            className="px-2 py-1 text-[10px] uppercase tracking-[0.32em] rounded-full bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/35 transition"
            title="Cycle waveform display (Peak / RMS / Normalized)"
          >
            {waveformOptions.mode === "peak"
              ? "Peak"
              : waveformOptions.mode === "rms"
              ? "RMS"
              : "Norm"}
          </button>
          <div className="flex items-center gap-1 text-white/60">
            <button
              type="button"
              onClick={() => handleAdjustWaveformHeight(-0.1)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              title="Decrease waveform height"
            >
              <MinusIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAdjustWaveformHeight(0.1)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              title="Increase waveform height"
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
            <span className="mx-1 text-[9px] uppercase tracking-[0.3em]">
              {Math.round(waveformOptions.heightMultiplier * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1 text-white/60">
            <button
              type="button"
              onClick={() => handleAdjustWaveformZoom(-0.1)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              title="Zoom out waveform"
            >
              <ZoomOutIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAdjustWaveformZoom(0.1)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              title="Zoom in waveform"
            >
              <ZoomInIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 pointer-events-auto shadow shadow-black/50">
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white/70 text-sm"
            title="Zoom out (Cmd/Ctrl + -)"
          >
            <ZoomOutIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white/70 text-sm"
            title="Zoom in (Cmd/Ctrl + +)"
          >
            <ZoomInIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomSelection}
            className="px-2 py-1 text-[10px] uppercase tracking-[0.32em] rounded-full bg-white/10 hover:bg-white/20 transition text-white/70"
            title="Zoom to selection (Cmd/ Ctrl + Shift + Z)"
          >
            <FitSelectionIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomFit}
            className="px-2 py-1 text-[10px] uppercase tracking-[0.32em] rounded-full bg-white/10 hover:bg-white/20 transition text-white/70"
            title="Zoom to fit (Cmd/ Ctrl + 0)"
          >
            <FitIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="relative flex-shrink-0 bg-glass-surface-soft border-r border-glass-border backdrop-blur-xl" style={{ width: trackHeaderWidth }}>
        <div
          className="absolute top-0 right-0 z-20 h-full w-2 cursor-col-resize"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setResizingHeader({ startX: e.clientX, startWidth: trackHeaderWidth });
          }}
          style={{ background: 'linear-gradient(to left, rgba(56,189,248,0.4), rgba(15,23,42,0.05))' }}
        />
        <div className="h-[24px] border-b border-glass-border"></div>
        <div className="h-[calc(100%_-_24px)] overflow-y-auto">
          {laneLayouts.map(({ track, laneHeight, clipHeight, isAutomationVisible, uiState }) => {
            const trackFeedback = alsFeedbackByTrack.get(track.id);
            const alsIntensity = trackFeedback?.intensity ?? 0;
            return (
            <div key={track.id} style={{ height: laneHeight }} className="transition-[height] duration-300 ease-out relative">
              <ArrangeTrackHeader
                track={track}
                uiState={uiState}
                selectedTrackId={selectedTrackId}
                onSelectTrack={onSelectTrack}
                mixerSettings={mixerSettings[track.id]}
                isArmed={armedTracks.has(track.id)}
                isSoloed={soloedTracks.has(track.id)}
                alsIntensity={alsIntensity}
                onInvokeBloom={onInvokeTrackBloom}
                onToggleMute={onToggleMute}
                onToggleSolo={onToggleSolo}
                onToggleArm={onToggleArm}
              />
              {!uiState.collapsed && (
                <div
                  className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize rounded-b-lg transition-opacity duration-200 hover:opacity-80 opacity-0"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizing({
                      trackId: track.id,
                      startY: e.clientY,
                      startHeight: clipHeight,
                    });
                  }}
                  style={{
                    background: `linear-gradient(90deg, ${hexToRgba('#1f2937', 0)} 0%, ${hexToRgba('#38bdf8', 0.55)} 50%, ${hexToRgba('#1f2937', 0)} 100%)`,
                  }}
                />
              )}
            </div>
          )})}
        </div>
      </div>
        
      <div 
        ref={timelineViewportRef}
        className="relative flex-grow h-full overflow-hidden"
       >
        {/* Auto-Punch Ghost Region */}
        <AutoPunchGhost
          pixelsPerSecond={pixelsPerSecond}
          scrollX={scrollX}
          viewportWidth={viewportWidth}
          timelineHeight={height - RULER_H - TIMELINE_NAVIGATOR_H}
        />
        {/* Comp Ghost Region (Best Take) */}
        <CompGhost
          pixelsPerSecond={pixelsPerSecond}
          scrollX={scrollX}
          viewportWidth={viewportWidth}
          timelineHeight={height - RULER_H - TIMELINE_NAVIGATOR_H}
        />
        <div className="absolute left-0 right-0 top-0 h-[24px] bg-glass-surface-soft border-b border-glass-border select-none backdrop-blur-lg" onMouseDown={onRulerDown}>
            <div className="relative" style={{ width: contentWidth, transform: `translateX(-${scrollX}px)` }}>
              {microGuides.map(({ x }, i) => (
                <div
                  key={`micro-${i}`}
                  className="absolute bottom-0 h-1 border-l"
                  style={{
                    left: x,
                    borderColor: `rgba(255,255,255,${0.05 + (masterAnalysis?.level ?? 0) * 0.15})`,
                  }}
                />
              ))}
              {beats.map(({x}, i) => (<div key={`beat-${i}`} className="absolute bottom-0 h-2 border-l border-glass-border" style={{ left: x }} /> ))}
              {bars.map(({bar,x}) => (
                  <div key={`bar-${bar}`} className="absolute top-0 bottom-0 border-l border-glass-border/60" style={{ left: x }}>
                    <div className="absolute top-1 left-1 text-[10px] text-ink/80 font-mono">{bar}</div>
                  </div>
              ))}
              <div className="absolute inset-0 cursor-text" />
            </div>
        </div>

        {/* Flow Pulse Bar (Part B) - Heartbeat of Flow */}
        <div className="absolute left-0 right-0" style={{ top: RULER_H, height: 14 }}>
          <div style={{ transform: `translateX(${scrollX}px)` }}>
            <FlowPulseBar />
          </div>
        </div>
        
        <div className="absolute left-0 right-0" style={{ top: RULER_H + 14, bottom: TIMELINE_NAVIGATOR_H }} onMouseDown={onBgMouseDown}>
            <div className="relative" style={{ width: contentWidth, transform: `translateX(-${scrollX}px)` }}>
                {laneLayouts.map(({ track, top, laneHeight, clipHeight, isAutomationVisible, uiState, automationConfig }, index) => {
                  const automationPointsForLane = automationConfig
                    ? automationData[track.id]?.[automationConfig.fxId]?.[automationConfig.paramName] || []
                    : [];
                  const feedback = alsFeedbackByTrack.get(track.id);

                  // Compute stem heat for thermal glow (Part B)
                  // Find audio buffer from clips on this track
                  const trackClips = clips.filter(c => c.trackId === track.id);
                  const firstClip = trackClips[0];
                  const audioBuffer = firstClip ? (audioBuffers[firstClip.bufferId] || null) : null;
                  const stemEnergy = computeStemEnergy(audioBuffer);
                  const stemHeatColor = getStemHeatColor(stemEnergy);
                  const stemHeatState = getStemHeatState(stemEnergy);
                  
                  return (
                    <div 
                      key={track.id} 
                      className={`absolute left-0 right-0 stem-lane ${stemHeatState}`}
                      style={{ 
                        top, 
                        height: laneHeight,
                        ['--stem-heat' as any]: stemHeatColor,
                      }}
                    >
                      {feedback && (
                        <div
                          className="absolute left-0 right-0 top-0 h-[80px] pointer-events-none transition-opacity duration-200"
                          style={{
                            background: `linear-gradient(90deg, ${hexToRgba(feedback.glowColor, 0.18)} 0%, transparent 80%)`,
                            opacity: 0.25 + feedback.intensity * 0.45,
                            filter: "blur(24px)",
                          }}
                        />
                      )}
                      <div
                      className={`relative w-full border-b border-glass-border ${
                          index % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"
                        }`}
                        style={{ height: clipHeight }}
                      >
                        {feedback && (
                          <div
                            className="absolute inset-x-0 bottom-0 h-1 pointer-events-none"
                            style={{
                              background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(
                                feedback.glowColor,
                                0.45
                              )} 35%, transparent 100%)`,
                              opacity: 0.3 + feedback.pulse * 0.5,
                            }}
                          />
                        )}
                      </div>
                      {isAutomationVisible && automationConfig && !uiState.collapsed && (
                        <AutomationLane
                          trackId={track.id}
                          fxId={automationConfig.fxId}
                          paramName={automationConfig.paramName}
                          points={automationPointsForLane}
                          trackColor={track.trackColor}
                          height={AUTOMATION_LANE_H}
                          duration={projectDuration}
                          pixelsPerSecond={pixelsPerSecond}
                          onAddPoint={(point) =>
                            onAddAutomationPoint(track.id, automationConfig.fxId, automationConfig.paramName, point)
                          }
                          onUpdatePoint={(idx, point) =>
                            onUpdateAutomationPoint(track.id, automationConfig.fxId, automationConfig.paramName, idx, point)
                          }
                          onDeletePoint={(idx) =>
                            onDeleteAutomationPoint(track.id, automationConfig.fxId, automationConfig.paramName, idx)
                          }
                        />
                      )}
                    </div>
                  );
                })}
                
                {bars.map(({bar,x}) => ( <div key={`grid-bar-${bar}`} className="absolute top-0 bottom-0 border-l border-glass-border/70" style={{ height: totalLaneHeight, left: x }} /> ))}

                {selection && (
                    <div className="absolute top-0 bottom-0 bg-fuchsia-500/10 border-x-2 border-fuchsia-400"
                        style={{
                          left: selection.start * pixelsPerSecond,
                          width: (selection.end - selection.start) * pixelsPerSecond
                        }} />
                )}

                {clips.map((clipModel) => {
                  const laneMeta = trackLaneLookup.get(clipModel.trackId);
                  const laneTop = (laneMeta?.top ?? 0) + 2;
                  const clipHeight = laneMeta?.clipHeight ?? BASE_CLIP_LANE_H;
                  const clipFeedback = alsFeedbackByTrack.get(clipModel.trackId);
                  return (
                    <ArrangeClip
                      key={clipModel.id}
                      clip={clipModel}
                      laneTop={laneTop}
                      laneHeight={clipHeight - 4}
                      pps={pixelsPerSecond}
                      onOpenPianoRoll={() => onOpenPianoRoll(clipModel)}
                      audioBuffer={audioBuffers[clipModel.bufferId]}
                      feedback={clipFeedback}
                      isRecallTarget={highlightClipIdSet.has(clipModel.id)}
                      activeTool={activeTool}
                      waveformMode={waveformOptions.mode}
                      waveformZoom={waveformOptions.zoomLevel}
                      waveformHeightMultiplier={waveformOptions.heightMultiplier}
                      onSplitAt={handleClipSplit}
                      onBeginDrag={(kind, startClientX, startClientY, modifiers) => {
                        const clip = clips.find((x) => x.id === clipModel.id);
                        if (!clip) return;
                        if (!clip.selected) {
                          setClips((prev) =>
                            prev.map((x) => ({
                              ...x,
                              selected: x.id === clip.id,
                            }))
                          );
                        }
                        const activeClipIds = clip.selected
                          ? clips.filter((x) => x.selected).map((x) => x.id)
                          : [clip.id];
                        const originalClips = clips
                          .filter((x) => activeClipIds.includes(x.id))
                          .map((x) => ({ ...x }));
                        onSetTrackContext(clip.trackId, "edit");
                        setDrag({
                          kind,
                          primaryId: clip.id,
                          startX: startClientX,
                          startY: startClientY,
                          clipIds: activeClipIds,
                          originalClips,
                          ripple: Boolean(modifiers?.altKey),
                          duplicate: Boolean(modifiers?.metaKey),
                          disableZeroCrossing: Boolean(modifiers?.shiftKey),
                          fineAdjust: Boolean(modifiers?.ctrlKey),
                          hasSurpassedThreshold: false,
                        });
                      }}
                      onSelect={(append) => {
                        if (append) {
                          setClips((prev) =>
                            prev.map((x) =>
                              x.id === clipModel.id
                                ? { ...x, selected: !x.selected }
                                : x
                            )
                          );
                        } else {
                          setClips((prev) =>
                            prev.map((x) => ({
                              ...x,
                              selected: x.id === clipModel.id,
                            }))
                          );
                        }
                      }}
                    />
                  );
                })}
                {boxSelection && (
                  <div
                    className="absolute border border-cyan-300/60 bg-cyan-400/10 pointer-events-none rounded-sm"
                    style={{
                      left:
                        Math.min(boxSelection.startSec, boxSelection.endSec ?? boxSelection.startSec) *
                        pixelsPerSecond,
                      width: Math.max(
                        2,
                        Math.abs((boxSelection.endSec ?? boxSelection.startSec) - boxSelection.startSec) *
                          pixelsPerSecond
                      ),
                      top: clampNumber(Math.min(boxSelection.top, boxSelection.bottom), 0, totalLaneHeight),
                      height: Math.max(
                        4,
                        Math.abs(boxSelection.bottom - boxSelection.top)
                      ),
                    }}
                  />
                )}
                {snapIndicator !== null && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-20"
                    style={{ left: snapIndicator * pixelsPerSecond }}
                  >
                    <div
                      className="absolute top-0 bottom-0 w-px bg-cyan-300/70"
                      style={{ boxShadow: '0 0 12px rgba(45,212,191,0.35)' }}
                    />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.45em] text-cyan-100/80">
                      snap
                    </div>
                  </div>
                )}
                 {/* --- Living Playhead (Anchor-Safe) --- */}
                {playheadVisible && (
                  <div
                    className="absolute top-0 pointer-events-none z-30"
                    style={{ left: 0, height: totalLaneHeight, width: '100%' }}
                  >
                    {/* Breathing Playhead (Anchor-Safe Version) */}
                    <BreathingPlayhead 
                      x={playheadX} 
                      className={isPlaying ? 'active' : 'calm'}
                    />
                    
                    {/* Legacy glow effects (kept for visual continuity) */}
                    <div
                      className="absolute top-0 w-[120px] h-full transition-all duration-300"
                      style={{
                        left: playheadX - 60,
                        opacity: isPlaying ? 0.7 : 0.4,
                        background: isPlaying
                          ? `radial-gradient(circle, ${hexToRgba(playheadColor?.light ?? '#67e8f9', 0.55)} 0%, transparent 70%)`
                          : `radial-gradient(circle, ${hexToRgba(playheadColor?.color ?? '#06b6d4', 0.4)} 0%, transparent 70%)`,
                        filter: 'blur(14px)',
                      }}
                    />

                    {isPlaying && (
                      <div
                        className="absolute top-0 h-full animate-playhead-trail"
                        style={{
                          left: '-70px',
                          right: '100%',
                          background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(playheadColor?.light ?? '#67e8f9', 0.5)} 100%)`,
                          filter: 'blur(12px)',
                          opacity: 0.6 + glowIntensity * 0.3,
                        }}
                      />
                    )}

                    <div
                      className="absolute top-0 w-[3px] h-full rounded-sm"
                      style={{
                        left: '-1.5px',
                        background: `linear-gradient(180deg, ${playheadColor?.color ?? '#06b6d4'} 0%, ${hexToRgba(playheadColor?.light ?? '#67e8f9', 0.85)} 100%)`,
                        boxShadow: isPlaying
                          ? `0 0 18px ${hexToRgba(playheadColor?.light ?? '#67e8f9', 0.95)}, 0 0 ${42 + glowIntensity * 24}px ${hexToRgba(playheadColor?.color ?? '#06b6d4', 0.5)}`
                          : `0 0 14px ${hexToRgba(playheadColor?.color ?? '#06b6d4', 0.75)}`,
                      }}
                    />

                    <div
                      className="absolute -top-1 left-0 w-3 h-3 -translate-x-1/2 rounded-full"
                      style={{
                        background: playheadColor?.light ?? '#67e8f9',
                        boxShadow: `0 0 8px ${hexToRgba(playheadColor?.light ?? '#67e8f9', 0.9)}`,
                        opacity: isPlaying ? 1 : 0.75,
                      }}
                    />

                    {masterAnalysis?.transient && isPlaying && Array.from({ length: 5 }).map((_, i) => {
                      const angle = Math.random() * Math.PI * 2;
                      const distance = 24 + Math.random() * 32;
                      return (
                        <div
                          key={`${transientKey}-${i}`}
                          className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-white animate-spark-burst"
                          style={{
                            transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                            animationDelay: `${Math.random() * 0.12}s`,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
            </div>
        </div>
        <div
          className="absolute left-0 right-0"
          style={{ bottom: 0, height: TIMELINE_NAVIGATOR_H }}
        >
          <TimelineNavigator
            contentWidth={contentWidth}
            viewportWidth={viewportWidth}
            scrollX={scrollX}
            onScroll={handleNavigatorScroll}
            onZoomToRegion={handleNavigatorZoom}
            followPlayhead={followPlayhead}
          />
        </div>
      </div>
    </div>
  );
};
