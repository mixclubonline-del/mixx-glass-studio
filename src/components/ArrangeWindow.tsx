// src/components/ArrangeWindow.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrangeClip as ClipModel, useArrange, ClipId } from "../hooks/useArrange";
import { ArrangeClip } from "./ArrangeClip";
import { quantizeSeconds, secondsPerBar, secondsPerBeat } from "../utils/time";
import { TrackData, MixerSettings, AutomationPoint, FxWindowId, FxWindowConfig, TrackAnalysisData } from "../App";
import ArrangeTrackHeader from "./ArrangeTrackHeader";
import AutomationLane from "./AutomationLane";
import { deriveTrackALSFeedback, TrackALSFeedback, hexToRgba } from "../utils/ALS";
import {
  TrackUIState,
  TrackContextMode,
  DEFAULT_TRACK_LANE_HEIGHT,
  COLLAPSED_TRACK_LANE_HEIGHT,
} from "../types/tracks";

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
};

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
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  armedTracks: Set<string>;
  onToggleArm: (trackId: string) => void;
  mixerSettings: { [key: string]: MixerSettings };
  onMixerChange: (trackId: string, setting: keyof MixerSettings, value: number | boolean) => void;
  soloedTracks: Set<string>;
  onToggleSolo: (trackId: string) => void;
  masterAnalysis: { level: number; transient: boolean; waveform: Uint8Array };
  // Automation Props
  automationData: Record<string, Record<string, Record<string, AutomationPoint[]>>>; // trackId -> fxId -> paramName -> points
  visibleAutomationLanes: Record<string, { fxId: string, paramName: string } | null>; // trackId -> { fxId, paramName }
  onAddAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, point: AutomationPoint) => void;
  onUpdateAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number, point: AutomationPoint) => void;
  onDeleteAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number) => void;
  // Smart Clip Editing
  onUpdateClipProperties: (clipId: ClipId, props: Partial<Pick<ClipModel, 'fadeIn' | 'fadeOut' | 'gain'>>) => void;
  // Plugin Props for TrackHeader and PluginBrowser
  inserts: Record<string, FxWindowId[]>;
  fxWindows: FxWindowConfig[];
  onAddPlugin: (trackId: string, pluginId: FxWindowId) => void;
  onRemovePlugin: (trackId: string, index: number) => void;
  onMovePlugin: (trackId: string, fromIndex: number, toIndex: number) => void;
  onOpenPluginBrowser: (trackId: string) => void;
  onOpenPluginSettings: (fxId: FxWindowId) => void;
  automationParamMenu: { x: number; y: number; trackId: string; } | null;
  onOpenAutomationParamMenu: (x: number, y: number, trackId: string) => void;
  onCloseAutomationParamMenu: () => void;
  onToggleAutomationLaneWithParam: (trackId: string, fxId: string, paramName: string) => void;
  style?: React.CSSProperties; // New prop for dynamic styling from App.tsx
  trackAnalysis: Record<string, TrackAnalysisData>;
  highlightClipIds?: ClipId[];
  followPlayhead: boolean;
  onManualScroll?: () => void;
  trackUiState: Record<string, TrackUIState>;
  onToggleTrackCollapse: (trackId: string) => void;
  onResizeTrack: (trackId: string, height: number) => void;
  onRequestTrackCapsule: (trackId: string) => void;
  onSetTrackContext: (trackId: string, context: TrackContextMode) => void;
  onOpenPianoRoll: (clip: ClipModel) => void;
  audioBuffers: Record<string, AudioBuffer | undefined>;
};

const BASE_CLIP_LANE_H = DEFAULT_TRACK_LANE_HEIGHT;
const AUTOMATION_LANE_H = 68;
const RULER_H = 24;
const TRACK_HEADER_WIDTH = 240;

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
    height = 540, tracks, clips, setClips, isPlaying, currentTime, onSeek, bpm, beatsPerBar,
    pixelsPerSecond, ppsAPI, scrollX, setScrollX, selection, setSelection, clearSelection,
    onSplitAt, 
    selectedTrackId, onSelectTrack, armedTracks, onToggleArm, mixerSettings, onMixerChange, soloedTracks, onToggleSolo,
    masterAnalysis, 
    automationData, visibleAutomationLanes, onAddAutomationPoint,
    onUpdateAutomationPoint, onDeleteAutomationPoint, onUpdateClipProperties,
    inserts, fxWindows, onAddPlugin, onRemovePlugin, onMovePlugin, onOpenPluginBrowser, onOpenPluginSettings,
    automationParamMenu, onOpenAutomationParamMenu, onCloseAutomationParamMenu, onToggleAutomationLaneWithParam,
    style, trackAnalysis, highlightClipIds, followPlayhead, onManualScroll,
    trackUiState = {}, onToggleTrackCollapse, onResizeTrack, onRequestTrackCapsule, onSetTrackContext,
    onOpenPianoRoll,
    audioBuffers = {},
  } = props;

  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const projectDuration = useMemo(() => clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 60), [clips]);
  const contentWidth = useMemo(() => Math.max((projectDuration + 60) * pixelsPerSecond, 4000), [projectDuration, pixelsPerSecond]);
  
  const [drag, setDrag] = useState<DragState | null>(null);
  const [draggingSelection, setDraggingSelection] = useState<null | { startSec: number }>(null);
  const [snapIndicator, setSnapIndicator] = useState<number | null>(null);
  const [resizing, setResizing] = useState<null | { trackId: string; startY: number; startHeight: number }>(null);

  const adaptiveDivision = useMemo(
    () => deriveAdaptiveDivision(pixelsPerSecond, bpm, masterAnalysis?.level ?? 0),
    [pixelsPerSecond, bpm, masterAnalysis?.level]
  );

  const snapToGrid = useCallback(
    (value: number) => quantizeSeconds(Math.max(0, value), bpm, beatsPerBar, "beats", adaptiveDivision),
    [adaptiveDivision, bpm, beatsPerBar]
  );

  const laneLayouts = useMemo(() => {
    let top = 0;
    return tracks.map((track) => {
      const ui = trackUiState[track.id] ?? {
        context: "playback" as TrackContextMode,
        laneHeight: BASE_CLIP_LANE_H,
        collapsed: false,
      };
      const collapsed = ui.collapsed;
      const clipHeight = collapsed ? COLLAPSED_TRACK_LANE_HEIGHT : ui.laneHeight ?? BASE_CLIP_LANE_H;
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
  }, [tracks, visibleAutomationLanes, trackUiState]);

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

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = timelineViewportRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const anchorSec = (scrollX + mouseX) / pixelsPerSecond;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        ppsAPI.zoomBy(factor, anchorSec);
    } else {
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        onManualScroll?.();
        setScrollX((s: number) => Math.max(0, s + delta));
      }
    }
  }, [scrollX, pixelsPerSecond, ppsAPI, setScrollX, onManualScroll]);

  const onBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    onManualScroll?.();
    clearSelection();
    const rect = timelineViewportRef.current!.getBoundingClientRect();
    const xPx = e.clientX - rect.left + scrollX;
    const startSec = xPx / pixelsPerSecond;
    setDraggingSelection({ startSec });
    setSelection(startSec, startSec);
    // FIX: Ensure 'selected' property is explicitly set to boolean false for all clips.
    setClips(prev => prev.map(c => ({...c, selected: false})));
    onSelectTrack(null);
  }, [scrollX, pixelsPerSecond, setSelection, setClips, onSelectTrack, clearSelection, onManualScroll]);
  
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = timelineViewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (resizing) {
      const deltaY = e.clientY - resizing.startY;
      onResizeTrack(resizing.trackId, resizing.startHeight + deltaY);
    onResizeTrack(resizing.trackId, resizing.startHeight + deltaY);
      return;
    }

    if (drag) {
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

      const dxPx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const dxSec = dxPx / pixelsPerSecond;
      const rippleActive = drag.ripple || e.altKey;
      const originalMap = new Map(drag.originalClips.map((clip) => [clip.id, clip]));
      const selectionSet = new Set(drag.clipIds);
      const primaryOriginal = originalMap.get(drag.primaryId);
      if (!primaryOriginal) return;

      let snapValue: number | null = null;

      if (drag.kind === "move") {
        const hoveredY = e.clientY - rect.top - RULER_H;
        let targetTrackId = primaryOriginal.trackId;
        for (const layout of laneLayouts) {
          if (hoveredY >= layout.top && hoveredY < layout.top + layout.laneHeight) {
            targetTrackId = layout.track.id;
            break;
          }
        }

        const snappedPrimary = snapToGrid(primaryOriginal.start + dxSec);
        const deltaSec = snappedPrimary - primaryOriginal.start;
        snapValue = snappedPrimary;

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
      } else if (drag.kind === "resize-left") {
        const reference = primaryOriginal;
        const newStart = snapToGrid(reference.start + dxSec);
        const originalEnd = reference.start + reference.duration;
        const newDuration = originalEnd - newStart;
        const startChange = newStart - reference.start;
        const newSourceStart = (reference.sourceStart ?? 0) + startChange;
        if (newDuration > 0.05 && newSourceStart >= 0) {
          snapValue = newStart;
          setClips((prev) =>
            prev.map((clip) =>
              clip.id === drag.primaryId
                ? {
                    ...clip,
                    start: newStart,
                    duration: newDuration,
                    sourceStart: newSourceStart,
                  }
                : clip
            )
          );
        }
      } else if (drag.kind === "resize-right") {
        const reference = primaryOriginal;
        const newEnd = snapToGrid(reference.start + reference.duration + dxSec);
        const newDuration = Math.max(0.05, newEnd - reference.start);
        snapValue = reference.start + newDuration;
        setClips((prev) =>
          prev.map((clip) =>
            clip.id === drag.primaryId ? { ...clip, duration: newDuration } : clip
          )
        );
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
        const newGain = Math.max(0, Math.min(2.0, (currentClip.gain ?? 1.0) - dy * 0.01));
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
  }, [drag, pixelsPerSecond, laneLayouts, snapToGrid, setClips, clips, draggingSelection, scrollX, setSelection, onUpdateClipProperties, resizing, onResizeTrack]);

  const onMouseUp = useCallback(() => {
    setDrag(null);
    setDraggingSelection(null);
    setSnapIndicator(null);
    setResizing(null);
  }, []);

  const onRulerDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const sec = Math.max(0, (xPx + scrollX) / pixelsPerSecond);
    onSeek(sec);
  }, [scrollX, pixelsPerSecond, onSeek]);
  
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
    if (!followPlayhead || !isPlaying) return;
    const viewportNode = timelineViewportRef.current;
    if (!viewportNode) return;
    const viewportWidth = viewportNode.clientWidth;
    if (viewportWidth <= 0) return;
    const margin = viewportWidth * 0.25;
    const playheadPx = currentTime * pixelsPerSecond;
    const leftEdge = scrollX;
    const rightEdge = scrollX + viewportWidth;

    let targetScroll = scrollX;
    if (playheadPx > rightEdge - margin) {
      targetScroll = playheadPx - viewportWidth + margin;
    } else if (playheadPx < leftEdge + margin) {
      targetScroll = playheadPx - margin;
    }

    targetScroll = Math.max(0, targetScroll);
    if (Math.abs(targetScroll - scrollX) > 1) {
      setScrollX((prev) => {
        const next = prev + (targetScroll - prev) * 0.4;
        return next < 0 ? 0 : next;
      });
    }
  }, [followPlayhead, isPlaying, currentTime, pixelsPerSecond, scrollX, setScrollX]);

  useEffect(() => {
    if (resizing) {
      document.body.style.cursor = "row-resize";
      return () => {
        document.body.style.cursor = "";
      };
    }
    return undefined;
  }, [resizing]);

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
      <div className="flex-shrink-0 bg-glass-surface-soft border-r border-glass-border backdrop-blur-xl" style={{ width: TRACK_HEADER_WIDTH }}>
        <div className="h-[24px] border-b border-glass-border"></div>
        <div className="h-[calc(100%_-_24px)] overflow-y-auto">
          {laneLayouts.map(({ track, laneHeight, clipHeight, isAutomationVisible, uiState }) => (
            <div key={track.id} style={{ height: laneHeight }} className="transition-[height] duration-300 ease-out relative">
              <ArrangeTrackHeader
                track={track}
                uiState={uiState}
                selectedTrackId={selectedTrackId}
                onSelectTrack={onSelectTrack}
                isArmed={armedTracks.has(track.id)}
                onToggleArm={onToggleArm}
                mixerSettings={mixerSettings[track.id]}
                onMixerChange={onMixerChange}
                isSoloed={soloedTracks.has(track.id)}
                onToggleSolo={onToggleSolo}
                isAutomationVisible={isAutomationVisible}
                inserts={inserts}
                trackColor={track.trackColor}
                fxWindows={fxWindows}
                onAddPlugin={onAddPlugin}
                onRemovePlugin={onRemovePlugin}
                onMovePlugin={onMovePlugin}
                onOpenPluginBrowser={onOpenPluginBrowser}
                onOpenPluginSettings={onOpenPluginSettings}
                automationParamMenu={automationParamMenu}
                onOpenAutomationParamMenu={onOpenAutomationParamMenu}
                onCloseAutomationParamMenu={onCloseAutomationParamMenu}
                onToggleAutomationLaneWithParam={onToggleAutomationLaneWithParam}
                onRequestCapsule={() => onRequestTrackCapsule(track.id)}
                onContextChange={onSetTrackContext}
                onToggleCollapse={() => onToggleTrackCollapse(track.id)}
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
          ))}
        </div>
      </div>
        
      <div 
        ref={timelineViewportRef}
        className="relative flex-grow h-full overflow-hidden"
        onWheel={onWheel}
       >
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

        <div className="absolute left-0 right-0" style={{ top: RULER_H, bottom: 0 }} onMouseDown={onBgMouseDown}>
            <div className="relative" style={{ width: contentWidth, transform: `translateX(-${scrollX}px)` }}>
                {laneLayouts.map(({ track, top, laneHeight, clipHeight, isAutomationVisible, uiState, automationConfig }, index) => {
                  const automationPointsForLane = automationConfig
                    ? automationData[track.id]?.[automationConfig.fxId]?.[automationConfig.paramName] || []
                    : [];
                  const feedback = alsFeedbackByTrack.get(track.id);

                  return (
                    <div key={track.id} className="absolute left-0 right-0" style={{ top, height: laneHeight }}>
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
                 {/* --- Living Playhead --- */}
                {playheadVisible && (
                  <div
                    className="absolute top-0 pointer-events-none z-30"
                    style={{ left: playheadX, height: totalLaneHeight, ...playheadStyle }}
                  >
                    <div
                      className="absolute top-0 w-[120px] h-full transition-all duration-300"
                      style={{
                        left: '-60px',
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
      </div>
    </div>
  );
};
