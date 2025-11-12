
// src/hooks/useArrange.ts
import { useCallback, useMemo, useRef, useState } from "react";
import { GridUnit, quantizeSeconds } from "../utils/time";

export type ClipId = string;
export type TrackId = string;

export interface ArrangeClip {
  id: ClipId;
  trackId: TrackId;
  name: string;
  color: string;
  start: number;     // seconds
  duration: number;  // seconds
  sourceStart: number; // seconds, offset into the source audio buffer
  bufferId: string; // ID of the AudioBuffer to use
  selected?: boolean;
  // Smart tool properties
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  gain?: number; // linear gain value (1.0 = 0dB)
  warpAnchors?: number[]; // seconds relative to clip start
  // Prime Brain properties
  originalDuration?: number; // The duration of the clip before any time stretching
  timeStretchRate?: number; // 1.0 is normal, < 1 is slower, > 1 is faster
  // Grouping & ALS metadata
  groupId?: string | null;
  isGroupRoot?: boolean;
  alsEnergy?: number;
  sourceJobId?: string | null;
  sourceFileName?: string | null;
  sourceFingerprint?: string | null;
  lastIngestAt?: number | null;
}

export interface ArrangeState {
  clips: ArrangeClip[];
  selection: { start: number; end: number } | null; // seconds
  pixelsPerSecond: number;
  scrollX: number; // px
}

// FIX: Corrected the type for initial clips to be an array of objects where 'bufferId' is optional.
export function useArrange(initial: Partial<{ clips: (Omit<ArrangeClip, 'bufferId'> & { bufferId?: string })[] }> & Partial<ArrangeState> = {}) {
  // FIX: Ensure numeric properties are parsed as numbers during initial state setup for robustness
  const [clips, setClips] = useState<ArrangeClip[]>(initial.clips?.map(c => ({
    ...c, 
    bufferId: c.bufferId || 'default', 
    start: parseFloat(c.start?.toString() || '0') as number, // Ensure start is a number
    duration: parseFloat(c.duration?.toString() || '0') as number, // Ensure duration is a number
    sourceStart: parseFloat(c.sourceStart?.toString() || '0') as number, // Ensure sourceStart is a number
    gain: parseFloat(c.gain?.toString() || '1.0') as number, // Ensure gain is a number
    fadeIn: parseFloat(c.fadeIn?.toString() || '0') as number, // Ensure fadeIn is a number
    fadeOut: parseFloat(c.fadeOut?.toString() || '0') as number, // Ensure fadeOut is a number
    originalDuration: parseFloat(c.originalDuration?.toString() || c.duration?.toString() || '0') as number, // Ensure originalDuration is a number
    timeStretchRate: parseFloat(c.timeStretchRate?.toString() || '1.0') as number, // Ensure timeStretchRate is a number
    groupId: c.groupId ?? null,
    isGroupRoot: c.isGroupRoot ?? false,
    alsEnergy: typeof c.alsEnergy === 'number' ? c.alsEnergy : 0,
    sourceJobId: c.sourceJobId ?? null,
    sourceFileName: c.sourceFileName ?? null,
    sourceFingerprint: c.sourceFingerprint ?? null,
    lastIngestAt: c.lastIngestAt ?? null,
    warpAnchors: Array.isArray(c.warpAnchors)
      ? c.warpAnchors.map((anchor) => Number(anchor) || 0).filter((anchor) => anchor >= 0)
      : [],
  })) ?? []);
  // FIX: Added missing useState hooks for selection, pixelsPerSecond, and scrollX.
  const [selection, setSelectionState] = useState<ArrangeState['selection']>(initial.selection ?? null);
  const [pixelsPerSecond, setPps] = useState(initial.pixelsPerSecond ?? 60);
  const [scrollX, setScrollXState] = useState(initial.scrollX ?? 0);

  const draggingRef = useRef<{ id: ClipId; kind: "move" | "resize-left" | "resize-right"; startOffset: number; clipStart: number; clipDuration: number } | null>(null);

  const setClipsSelect = useCallback((ids: ClipId[], selected: boolean) => {
    setClips(prev => prev.map(c => ({
      ...c,
      selected: ids.includes(c.id) ? selected : (c.selected || false)
    })));
  }, [setClips]);

  const clearSelection = useCallback(() => {
    setSelectionState(null);
    setClips(prev => prev.map(c => ({ ...c, selected: false })));
  }, [setClips]);

  const setSelection = useCallback((start: number, end: number) => {
    setSelectionState({ start: Math.min(start, end), end: Math.max(start, end) });
  }, []);

  const moveClip = useCallback((id: ClipId, newStart: number, newTrackId: TrackId) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, start: newStart, trackId: newTrackId } : c));
  }, [setClips]);

  const resizeClip = useCallback((id: ClipId, newStart: number, newDuration: number, newSourceStart?: number) => {
    setClips(prev => prev.map(c => c.id === id ? {
      ...c,
      start: newStart,
      duration: newDuration,
      sourceStart: newSourceStart !== undefined ? newSourceStart : c.sourceStart // Update sourceStart if provided
    } : c));
  }, [setClips]);

  const updateClipProperties = useCallback((id: ClipId, props: Partial<ArrangeClip>) => {
    setClips(prev => prev.map(c => {
      if (c.id === id) {
        let updatedClip = { ...c, ...props };
        
        // If timeStretchRate is being updated, recalculate duration
        if (props.timeStretchRate !== undefined) {
          const originalDuration = c.originalDuration ?? c.duration;
          // Ensure originalDuration is stored if it's the first stretch
          if (!c.originalDuration) {
            updatedClip.originalDuration = c.duration;
          }
          updatedClip.duration = originalDuration / props.timeStretchRate;
        }

        return updatedClip;
      }
      return c;
    }));
  }, [setClips]);

  const onSplitAt = useCallback((clipId: ClipId, splitTime: number) => {
    setClips(prev => {
      const clipToSplit = prev.find(c => c.id === clipId);
      if (!clipToSplit) return prev;

      const splitPointInClip = splitTime - clipToSplit.start;
      if (splitPointInClip <= 0 || splitPointInClip >= clipToSplit.duration) return prev;

      const anchors = Array.isArray(clipToSplit.warpAnchors)
        ? clipToSplit.warpAnchors
        : [];
      const firstAnchors = anchors.filter((anchor) => anchor < splitPointInClip);
      const secondAnchors = anchors
        .filter((anchor) => anchor >= splitPointInClip)
        .map((anchor) => anchor - splitPointInClip);

      const firstPart: ArrangeClip = {
        ...clipToSplit,
        id: `clip-${Date.now()}-a`, // New unique ID
        duration: splitPointInClip,
        selected: true, // Select both new halves
        fadeOut: 0, // Reset fade on split edge
        warpAnchors: firstAnchors,
      };
      const secondPart: ArrangeClip = {
        ...clipToSplit,
        id: `clip-${Date.now()}-b`, // New unique ID
        start: splitTime,
        duration: clipToSplit.duration - splitPointInClip,
        sourceStart: clipToSplit.sourceStart + splitPointInClip,
        selected: true, // Select both new halves
        fadeIn: 0, // Reset fade on split edge
        warpAnchors: secondAnchors,
      };
      return [...prev.filter(c => c.id !== clipToSplit.id), firstPart, secondPart];
    });
  }, [setClips]);

  const splitSelection = useCallback(() => {
    console.warn("splitSelection not fully implemented without current time or specific clip context.");
  }, []);

  const duplicateClips = useCallback((idsToDuplicate: ClipId[]) => {
    setClips(prev => {
      const newClips: ArrangeClip[] = [];
      const selectedClips = prev.filter(c => idsToDuplicate.includes(c.id));
      if (!selectedClips.length) return prev;

      const maxEndTime = selectedClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
      const duplicateOffset = 1; // Offset new clips by 1 second

      selectedClips.forEach(c => {
        newClips.push({
          ...c,
          id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          start: maxEndTime + duplicateOffset + (c.start - selectedClips[0].start), // Maintain relative positioning
          selected: true,
        });
      });
      // Deselect old clips
      const finalClips = prev.map(c => idsToDuplicate.includes(c.id) ? { ...c, selected: false } : c);
      return [...finalClips, ...newClips];
    });
  }, [setClips]);

  const ppsAPI = useMemo(() => ({
    set: (pps: number) => setPps(pps),
    zoomBy: (factor: number, anchorSec: number) => {
      setPps(prevPps => {
        const newPps = Math.max(10, Math.min(500, prevPps * factor));
        const newScrollX = anchorSec * newPps - (anchorSec * prevPps - scrollX);
        setScrollXState(Math.max(0, newScrollX));
        return newPps;
      });
    },
    value: pixelsPerSecond
  }), [pixelsPerSecond, scrollX]);


  return {
    clips,
    setClips,
    selection,
    setSelection,
    clearSelection,
    ppsAPI,
    scrollX,
    setScrollX: setScrollXState,
    moveClip,
    resizeClip,
    updateClipProperties, // Expose the new updater
    onSplitAt, // FIX: Renamed splitAt to onSplitAt
    splitSelection,
    setClipsSelect,
    duplicateClips,
  };
}
