// src/components/ArrangeWindow.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrangeClip as ClipModel, useArrange, ClipId } from "../hooks/useArrange";
import { ArrangeClip } from "./ArrangeClip";
import { secondsPerBar, secondsPerBeat } from "../utils/time";
import { TrackData, MixerSettings, AutomationPoint, FxWindowId, FxWindowConfig } from "../App";
import ArrangeTrackHeader from "./ArrangeTrackHeader";
import AutomationLane from "./AutomationLane";

type DragKind = "move" | "resize-left" | "resize-right" | "fade-in" | "fade-out" | "gain";

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
};

const CLIP_LANE_H = 80;
const AUTOMATION_LANE_H = 60;
const RULER_H = 24;
const TRACK_HEADER_WIDTH = 200;

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
    style // Destructure the new style prop
  } = props;

  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const projectDuration = useMemo(() => clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 60), [clips]);
  const contentWidth = useMemo(() => Math.max((projectDuration + 60) * pixelsPerSecond, 4000), [projectDuration, pixelsPerSecond]);
  
  const [drag, setDrag] = useState<null | { id: string; kind: DragKind; startX: number; startY: number; clip: ClipModel; }>(null);
  const [draggingSelection, setDraggingSelection] = useState<null | { startSec: number }>(null);

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
      setScrollX((s: number) => Math.max(0, s + delta));
    }
  }, [scrollX, pixelsPerSecond, ppsAPI, setScrollX]);

  const onBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    clearSelection();
    const rect = timelineViewportRef.current!.getBoundingClientRect();
    const xPx = e.clientX - rect.left + scrollX;
    const startSec = xPx / pixelsPerSecond;
    setDraggingSelection({ startSec });
    setSelection(startSec, startSec);
    // FIX: Ensure 'selected' property is explicitly set to boolean false for all clips.
    setClips(prev => prev.map(c => ({...c, selected: false})));
    onSelectTrack(null);
  }, [scrollX, pixelsPerSecond, setSelection, setClips, onSelectTrack, clearSelection]);
  
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = timelineViewportRef.current!.getBoundingClientRect();
    
    if (drag) {
        const dxPx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const dxSec = dxPx / pixelsPerSecond;
        const { clip } = drag;
        
        const snap = (time: number) => {
            const beatSec = 60 / bpm;
            const subBeatSec = beatSec / 4; // 16th note snapping
            return Math.round(time / subBeatSec) * subBeatSec;
        };

        if (drag.kind === "move") {
            let yPos = e.clientY - rect.top - RULER_H;
            let cumulativeHeight = 0;
            let newTrackIndex = -1;
            for (let i = 0; i < tracks.length; i++) {
                const trackHeight = visibleAutomationLanes[tracks[i].id] ? CLIP_LANE_H + AUTOMATION_LANE_H : CLIP_LANE_H;
                if (yPos >= cumulativeHeight && yPos < cumulativeHeight + trackHeight) {
                    newTrackIndex = i;
                    break;
                }
                cumulativeHeight += trackHeight;
            }
            const targetTrackId = tracks[newTrackIndex]?.id;
            const newStart = snap(Math.max(0, Number(clip.start) + dxSec));
            setClips(prev => prev.map(c => c.id === drag.id ? { ...c, start: newStart, trackId: targetTrackId || c.trackId } : c));
        } else if (drag.kind === "resize-left") {
// FIX: Explicitly parse clip properties that might be strings at runtime to ensure numeric operations.
            const newStart = snap(Math.max(0, Number(clip.start) + dxSec));
            const originalEnd = Number(clip.start) + Number(clip.duration);
            const newDur = originalEnd - newStart;
            const startChange = newStart - Number(clip.start);
            const newSourceStart = Number(clip.sourceStart) + startChange;
            if (newDur > 0.05 && newSourceStart >= 0) {
                 setClips(prev => prev.map(c => c.id === drag.id ? { ...c, start: newStart, duration: newDur, sourceStart: newSourceStart } : c));
            }
        } else if (drag.kind === "resize-right") {
            const newDur = snap(Math.max(0.05, Number(clip.duration) + dxSec));
            setClips(prev => prev.map(c => c.id === drag.id ? { ...c, duration: newDur } : c));
        } else if (drag.kind === "fade-in") {
            const newFadeIn = Math.max(0, Math.min(Number(clip.duration) / 2, (Number(clip.fadeIn) || 0) + dxSec));
            onUpdateClipProperties(clip.id, { fadeIn: newFadeIn });
        } else if (drag.kind === 'fade-out') {
            const newFadeOut = Math.max(0, Math.min(Number(clip.duration) / 2, (Number(clip.fadeOut) || 0) - dxSec)); // Dragging left increases fade
            onUpdateClipProperties(clip.id, { fadeOut: newFadeOut });
        } else if (drag.kind === 'gain') {
            const newGain = Math.max(0, Math.min(2.0, (clip.gain ?? 1.0) - dy * 0.01));
            onUpdateClipProperties(clip.id, { gain: newGain });
        }
        return;
    }
    if (draggingSelection) {
      const xPx = e.clientX - rect.left + scrollX;
      const endSec = xPx / pixelsPerSecond;
      setSelection(draggingSelection.startSec, endSec);
    }
  }, [drag, draggingSelection, scrollX, pixelsPerSecond, setSelection, setClips, tracks, visibleAutomationLanes, bpm, onUpdateClipProperties]);

  const onMouseUp = useCallback(() => {
    setDrag(null);
    setDraggingSelection(null);
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

  const transientKey = masterAnalysis?.transient ? Date.now() : 0;
  
  let trackTop = 0;

  return (
    <div 
      className="relative w-full rounded-xl border flex bg-black/20"
      style={{ height, ...style }} // Merge the style prop here
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="flex-shrink-0 bg-gray-900/30 border-r border-white/10" style={{ width: TRACK_HEADER_WIDTH }}>
        <div className="h-[24px] border-b border-white/10"></div>
        <div className="h-[calc(100%_-_24px)] overflow-y-auto">
            {tracks.map((track) => {
                const laneHeight = visibleAutomationLanes[track.id] ? CLIP_LANE_H + AUTOMATION_LANE_H : CLIP_LANE_H;
                return (
                    <div key={track.id} style={{ height: laneHeight }}>
                        <ArrangeTrackHeader 
                            track={track}
                            selectedTrackId={selectedTrackId}
                            onSelectTrack={onSelectTrack}
                            isArmed={armedTracks.has(track.id)}
                            onToggleArm={onToggleArm}
                            mixerSettings={mixerSettings[track.id]}
                            onMixerChange={onMixerChange}
                            isSoloed={soloedTracks.has(track.id)}
                            onToggleSolo={onToggleSolo}
                            isAutomationVisible={!!visibleAutomationLanes[track.id]}
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
                            onToggleAutomationLaneWithParam={onToggleAutomationLaneWithParam} // Pass specific handler
                        />
                    </div>
                );
            })}
        </div>
      </div>
        
      <div 
        ref={timelineViewportRef}
        className="relative flex-grow h-full overflow-hidden"
        onWheel={onWheel}
       >
        <div className="absolute left-0 right-0 top-0 h-[24px] bg-gray-900/50 border-b border-white/10 select-none" onMouseDown={onRulerDown}>
            <div className="relative" style={{ width: contentWidth, transform: `translateX(-${scrollX}px)` }}>
              {beats.map(({x}, i) => (<div key={`beat-${i}`} className="absolute bottom-0 h-2 border-l border-white/10" style={{ left: x }} /> ))}
              {bars.map(({bar,x}) => (
                  <div key={`bar-${bar}`} className="absolute top-0 bottom-0 border-l border-white/20" style={{ left: x }}>
                    <div className="absolute top-1 left-1 text-[10px] text-white/70 font-mono">{bar}</div>
                  </div>
              ))}
              <div className="absolute inset-0 cursor-text" />
            </div>
        </div>

        <div className="absolute left-0 right-0" style={{ top: RULER_H, bottom: 0 }} onMouseDown={onBgMouseDown}>
            <div className="relative" style={{ width: contentWidth, transform: `translateX(-${scrollX}px)` }}>
                {tracks.map((t, i) => {
                    const visibleLaneConfig = visibleAutomationLanes[t.id];
                    const isAutomationVisible = !!visibleLaneConfig;
                    const laneHeight = isAutomationVisible ? CLIP_LANE_H + AUTOMATION_LANE_H : CLIP_LANE_H;
                    const top = trackTop;
                    trackTop += laneHeight;

                    const automationPointsForLane = visibleLaneConfig ? (automationData[t.id]?.[visibleLaneConfig.fxId]?.[visibleLaneConfig.paramName] || []) : [];

                    return (
                        <div key={t.id} className="absolute left-0 right-0" style={{ top, height: laneHeight }}>
                            <div className={`w-full border-b border-white/10 ${i % 2 === 0 ? 'bg-white/[0.03]' : 'bg-transparent'}`} style={{ height: CLIP_LANE_H }} />
                            {isAutomationVisible && (
                                <AutomationLane
                                    trackId={t.id}
                                    fxId={visibleLaneConfig!.fxId}
                                    paramName={visibleLaneConfig!.paramName}
                                    points={automationPointsForLane}
                                    trackColor={t.trackColor}
                                    height={AUTOMATION_LANE_H}
                                    duration={projectDuration}
                                    pixelsPerSecond={pixelsPerSecond}
                                    onAddPoint={(point) => onAddAutomationPoint(t.id, visibleLaneConfig!.fxId, visibleLaneConfig!.paramName, point)}
                                    onUpdatePoint={(idx, point) => onUpdateAutomationPoint(t.id, visibleLaneConfig!.fxId, visibleLaneConfig!.paramName, idx, point)}
                                    onDeletePoint={(idx) => onDeleteAutomationPoint(t.id, visibleLaneConfig!.fxId, visibleLaneConfig!.paramName, idx)}
                                />
                            )}
                        </div>
                    );
                })}
                
                {bars.map(({bar,x}) => ( <div key={`grid-bar-${bar}`} className="absolute top-0 bottom-0 border-l border-white/10" style={{ height: trackTop, left: x }} /> ))}

                {selection && (
                    <div className="absolute top-0 bottom-0 bg-fuchsia-500/10 border-x-2 border-fuchsia-400"
                        style={{
                          left: selection.start * pixelsPerSecond,
                          width: (selection.end - selection.start) * pixelsPerSecond
                        }} />
                )}

                {clips.map((c) => {
                    const laneIndex = Math.max(0, tracks.findIndex(t => t.id === c.trackId));
                    let topOffset = 0;
                    for(let i=0; i < laneIndex; i++) {
                        const trackHeight = visibleAutomationLanes[tracks[i].id] ? CLIP_LANE_H + AUTOMATION_LANE_H : CLIP_LANE_H;
                        topOffset += trackHeight;
                    }
                    return (
                    <ArrangeClip
                        key={c.id}
                        clip={c}
                        laneTop={topOffset + 2} laneHeight={CLIP_LANE_H - 4}
                        pps={pixelsPerSecond}
                        onBeginDrag={(kind, startClientX, startClientY) => {
                            const clip = clips.find(x => x.id === c.id);
                            if (clip) setDrag({ id: c.id, kind, startX: startClientX, startY: startClientY, clip });
                        }}
                        onSelect={(append) => {
                            // FIX: Ensure 'selected' property is explicitly set to boolean.
                            if (append) setClips(prev => prev.map(x => x.id === c.id ? { ...x, selected: Boolean(!x.selected) } : x));
                            else setClips(prev => prev.map(x => ({ ...x, selected: Boolean(x.id === c.id) })));
                        }}
                    />
                    );
                })}
                 {/* --- Living Playhead --- */}
                <div className="absolute top-0 bottom-0 pointer-events-none z-20" style={{ left: currentTime * pixelsPerSecond, ...playheadStyle }}>
                    {/* Aura */}
                    <div className="absolute top-0 h-full left-1/2 -translate-x-1/2 bg-[var(--playhead-color)] transition-all duration-200" style={{ width: `${10 + glowIntensity * 60}px`, opacity: isPlaying ? 0.2 + glowIntensity * 0.5 : 0, filter: 'blur(15px)' }} />
                    
                    {/* Top Marker */}
                    <div className="absolute top-0 -mt-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" style={{ borderTopColor: playheadColor?.light, filter: 'drop-shadow(0 0 5px var(--playhead-color))'}}/>
                    
                    {/* Main Line */}
                    <div className={`w-0.5 h-full bg-[var(--playhead-color)] animate-playhead-breathing`} />

                    {/* Transient Sparks */}
                    {masterAnalysis?.transient && isPlaying && Array.from({length: 5}).map((_, i) => {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 20 + Math.random() * 30;
                        return (
                           <div 
                                key={`${transientKey}-${i}`}
                                className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-white animate-spark-burst"
                                style={{
                                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                                    animationDelay: `${Math.random() * 0.1}s`,
                                }}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
