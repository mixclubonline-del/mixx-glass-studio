
// src/hooks/useArrange.ts
import { useCallback, useMemo, useRef, useState } from "react";
import { GridUnit, quantizeSeconds } from "../utils/time";
import { recordHistory, undoHistory, redoHistory, canUndo, canRedo, type HistoryOperation } from "../utils/history";

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
  zeroStart?: boolean;
  zeroEnd?: boolean;
  autoFade?: boolean;
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
    zeroStart: c.zeroStart ?? false,
    zeroEnd: c.zeroEnd ?? false,
    autoFade: c.autoFade ?? false,
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
    setClips(prev => {
      const clip = prev.find(c => c.id === id);
      if (!clip) return prev;
      
      // Record history before change
      recordHistory({
        type: 'clip-move',
        clipIds: [id],
        oldPositions: [{ id, start: clip.start, trackId: clip.trackId }],
        newPositions: [{ id, start: newStart, trackId: newTrackId }],
      });
      
      return prev.map(c => c.id === id ? { ...c, start: newStart, trackId: newTrackId } : c);
    });
  }, [setClips]);

  const resizeClip = useCallback((id: ClipId, newStart: number, newDuration: number, newSourceStart?: number) => {
    setClips(prev => {
      const clip = prev.find(c => c.id === id);
      if (!clip) return prev;
      
      // Record history before change
      recordHistory({
        type: 'clip-resize',
        clipIds: [id],
        oldDurations: [{ id, duration: clip.duration }],
        newDurations: [{ id, duration: newDuration }],
      });
      
      return prev.map(c => c.id === id ? {
        ...c,
        start: newStart,
        duration: newDuration,
        sourceStart: newSourceStart !== undefined ? newSourceStart : c.sourceStart
      } : c);
    });
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

      const firstId = `clip-${Date.now()}-a`;
      const secondId = `clip-${Date.now()}-b`;

      // Record history before change
      recordHistory({
        type: 'clip-split',
        clipId,
        splitTime,
        newClipIds: [firstId, secondId],
      });

      const firstPart: ArrangeClip = {
        ...clipToSplit,
        id: firstId,
        duration: splitPointInClip,
        selected: true,
        fadeOut: 0,
        warpAnchors: firstAnchors,
      };
      const secondPart: ArrangeClip = {
        ...clipToSplit,
        id: secondId,
        start: splitTime,
        duration: clipToSplit.duration - splitPointInClip,
        sourceStart: clipToSplit.sourceStart + splitPointInClip,
        selected: true,
        fadeIn: 0,
        warpAnchors: secondAnchors,
      };
      return [...prev.filter(c => c.id !== clipToSplit.id), firstPart, secondPart];
    });
  }, [setClips]);

  const splitSelection = useCallback((splitTime: number) => {
    setClips(prev => {
      const clipsToSplit = prev.filter(c => {
        if (!c.selected) return false;
        // Check if split time intersects with this clip
        return splitTime > c.start && splitTime < c.start + c.duration;
      });
      
      if (clipsToSplit.length === 0) return prev;
      
      const newClips: ArrangeClip[] = [];
      const updatedClips = prev.map(clip => {
        if (!clipsToSplit.some(c => c.id === clip.id)) {
          return clip;
        }
        
        const splitPointInClip = splitTime - clip.start;
        if (splitPointInClip <= 0 || splitPointInClip >= clip.duration) {
          return clip;
        }
        
        const anchors = Array.isArray(clip.warpAnchors) ? clip.warpAnchors : [];
        const firstAnchors = anchors.filter((anchor) => anchor < splitPointInClip);
        const secondAnchors = anchors
          .filter((anchor) => anchor >= splitPointInClip)
          .map((anchor) => anchor - splitPointInClip);
        
        const firstPart: ArrangeClip = {
          ...clip,
          id: `${clip.id}-split-1`,
          duration: splitPointInClip,
          fadeOut: 0,
          warpAnchors: firstAnchors,
        };
        
        const secondPart: ArrangeClip = {
          ...clip,
          id: `${clip.id}-split-2`,
          start: splitTime,
          duration: clip.duration - splitPointInClip,
          sourceStart: clip.sourceStart + splitPointInClip,
          fadeIn: 0,
          warpAnchors: secondAnchors,
          selected: true, // Keep selection on second part
        };
        
        newClips.push(secondPart);
        return firstPart;
      });
      
      return [...updatedClips, ...newClips];
    });
  }, [setClips]);

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


  // Undo/redo functions
  const handleUndo = useCallback(() => {
    const operation = undoHistory();
    if (!operation) return;
    
    setClips(prev => {
      switch (operation.type) {
        case 'clip-move':
          return prev.map(c => {
            const oldPos = operation.oldPositions.find(p => p.id === c.id);
            if (oldPos) {
              return { ...c, start: oldPos.start, trackId: oldPos.trackId };
            }
            return c;
          });
        case 'clip-resize':
          return prev.map(c => {
            const oldDur = operation.oldDurations.find(d => d.id === c.id);
            if (oldDur) {
              return { ...c, duration: oldDur.duration };
            }
            return c;
          });
        case 'clip-split': {
          // Merge split clips back together
          const newClipIds = operation.newClipIds;
          const clipsToMerge = prev.filter(c => newClipIds.includes(c.id));
          if (clipsToMerge.length === 2) {
            const [first, second] = clipsToMerge.sort((a, b) => a.start - b.start);
            const merged: ArrangeClip = {
              ...first,
              id: operation.clipId,
              duration: first.duration + second.duration,
              fadeOut: first.fadeOut || second.fadeOut || 0,
              fadeIn: 0,
              warpAnchors: [...(first.warpAnchors || []), ...(second.warpAnchors || []).map(a => a + first.duration)],
            };
            return [...prev.filter(c => !newClipIds.includes(c.id)), merged];
          }
          return prev;
        }
        default:
          return prev;
      }
    });
  }, [setClips]);

  const handleRedo = useCallback(() => {
    const operation = redoHistory();
    if (!operation) return;
    
    setClips(prev => {
      switch (operation.type) {
        case 'clip-move':
          return prev.map(c => {
            const newPos = operation.newPositions.find(p => p.id === c.id);
            if (newPos) {
              return { ...c, start: newPos.start, trackId: newPos.trackId };
            }
            return c;
          });
        case 'clip-resize':
          return prev.map(c => {
            const newDur = operation.newDurations.find(d => d.id === c.id);
            if (newDur) {
              return { ...c, duration: newDur.duration };
            }
            return c;
          });
        case 'clip-split': {
          // Re-split the clip
          const clipToSplit = prev.find(c => c.id === operation.clipId);
          if (clipToSplit) {
            const splitPointInClip = operation.splitTime - clipToSplit.start;
            if (splitPointInClip > 0 && splitPointInClip < clipToSplit.duration) {
              const anchors = Array.isArray(clipToSplit.warpAnchors) ? clipToSplit.warpAnchors : [];
              const firstAnchors = anchors.filter((anchor) => anchor < splitPointInClip);
              const secondAnchors = anchors
                .filter((anchor) => anchor >= splitPointInClip)
                .map((anchor) => anchor - splitPointInClip);
              
              const firstPart: ArrangeClip = {
                ...clipToSplit,
                id: operation.newClipIds[0],
                duration: splitPointInClip,
                selected: true,
                fadeOut: 0,
                warpAnchors: firstAnchors,
              };
              const secondPart: ArrangeClip = {
                ...clipToSplit,
                id: operation.newClipIds[1],
                start: operation.splitTime,
                duration: clipToSplit.duration - splitPointInClip,
                sourceStart: clipToSplit.sourceStart + splitPointInClip,
                selected: true,
                fadeIn: 0,
                warpAnchors: secondAnchors,
              };
              return [...prev.filter(c => c.id !== operation.clipId), firstPart, secondPart];
            }
          }
          return prev;
        }
        default:
          return prev;
      }
    });
  }, [setClips]);

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
    updateClipProperties,
    onSplitAt,
    splitSelection,
    setClipsSelect,
    duplicateClips,
    undo: handleUndo,
    redo: handleRedo,
    canUndo: () => canUndo(),
    canRedo: () => canRedo(),
  };
}
