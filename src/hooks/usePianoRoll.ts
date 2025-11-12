import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PianoRollState,
  TrapPattern,
  PianoRollNote,
  GrooveTemplate,
  TrapScale,
} from "../types/pianoRoll";
import { quantizeSeconds, secondsPerBeat } from "../utils/time";
import type { MidiNote, QuantizationMode } from "../types/midi";

interface UsePianoRollOptions {
  initialState?: Partial<PianoRollState>;
  patterns?: TrapPattern[];
  scales?: TrapScale[];
  grooveTemplates?: GrooveTemplate[];
  bpm?: number;
  beatsPerBar?: number;
}

type StoredNote = PianoRollNote;

export function usePianoRoll({
  initialState = {},
  patterns = [],
  scales = [],
  grooveTemplates = [],
  bpm = 140,
  beatsPerBar = 4,
}: UsePianoRollOptions = {}) {
  const [notes, setNotes] = useState<Map<string, StoredNote>>(
    () => new Map<string, StoredNote>()
  );
  const [state, setState] = useState<PianoRollState>({
    scrollX: initialState.scrollX ?? 0,
    scrollY: initialState.scrollY ?? 48, // middle C
    zoomX: initialState.zoomX ?? 120,
    zoomY: initialState.zoomY ?? 18,
    selectedNoteIds: initialState.selectedNoteIds ?? new Set<string>(),
    selectionStart: initialState.selectionStart,
    selectionEnd: initialState.selectionEnd,
    tool: initialState.tool ?? "select",
    quantization: initialState.quantization ?? "1/16",
    swing: initialState.swing ?? 0,
    snapToGrid: initialState.snapToGrid ?? true,
    showVelocity: initialState.showVelocity ?? false,
    showCC: initialState.showCC ?? false,
    showPianoKeys: initialState.showPianoKeys ?? true,
    showGrid: initialState.showGrid ?? true,
    playheadPosition: initialState.playheadPosition ?? 0,
    loopStart: initialState.loopStart,
    loopEnd: initialState.loopEnd,
  });

  const addNote = useCallback(
    (note: MidiNote, color: string): string => {
      const id = note.id ?? `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const payload: StoredNote = {
        ...note,
        id,
        x: note.start * state.zoomX,
        y: (state.scrollY + 48 - note.pitch) * state.zoomY,
        width: note.duration * state.zoomX,
        height: state.zoomY,
        color,
      };
      setNotes((prev) => new Map(prev).set(id, payload));
      return id;
    },
    [state.scrollY, state.zoomX, state.zoomY]
  );

  const updateNote = useCallback((id: string, patch: Partial<PianoRollNote>) => {
    setNotes((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.set(id, { ...next.get(id)!, ...patch });
      return next;
    });
  }, []);

  const deleteNotes = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setNotes((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const setTool = useCallback((tool: PianoRollState["tool"]) => {
    setState((prev) => ({ ...prev, tool }));
  }, []);

  const setQuantization = useCallback((quantization: PianoRollState["quantization"]) => {
    setState((prev) => ({ ...prev, quantization }));
  }, []);

  const setSwing = useCallback((swing: number) => {
    setState((prev) => ({ ...prev, swing }));
  }, []);

  const toggleGridOption = useCallback((key: "showVelocity" | "showCC" | "showGrid") => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const selectNotes = useCallback((ids: string[], additive = false) => {
    setState((prev) => {
      const selected = additive ? new Set(prev.selectedNoteIds) : new Set<string>();
      ids.forEach((id) => selected.add(id));
      return { ...prev, selectedNoteIds: selected };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedNoteIds: new Set<string>(), selectionStart: undefined, selectionEnd: undefined }));
  }, []);

  const setSelectionBounds = useCallback((start: { time: number; pitch: number }, end: { time: number; pitch: number }) => {
    setState((prev) => ({
      ...prev,
      selectionStart: start,
      selectionEnd: end,
    }));
  }, []);

  const applyTrapPattern = useCallback(
    (patternId: string, trackColor: string, baseTime: number, basePitch: number) => {
      const pattern = patterns.find((item) => item.id === patternId);
      if (!pattern) return;

      const denominator = extractQuantizationDenominator(pattern.quantization);
      const stepDurationBeats = 1 / (denominator / 4); // relative to quarter note grid
      const stepDurationSeconds = secondsPerBeat(bpm) * stepDurationBeats;

      pattern.pattern.forEach((step, index) => {
        const time = baseTime + step * stepDurationSeconds;
        const note: MidiNote = {
          id: `trap-${patternId}-${Date.now()}-${index}`,
          pitch: basePitch,
          start: quantizeSeconds(
            time,
            bpm,
            beatsPerBar,
            "beats",
            denominator
          ),
          duration: stepDurationSeconds,
          velocity: pattern.velocity,
        };
        addNote(note, trackColor);
      });
    },
    [addNote, patterns, bpm, beatsPerBar]
  );

  const getActiveScale = useCallback(
    (scaleName?: string) => {
      if (!scaleName) return scales[0];
      return scales.find((entry) => entry.name === scaleName) ?? scales[0];
    },
    [scales]
  );

  const loadNotes = useCallback(
    (entries: MidiNote[], color: string) => {
      setNotes(() => {
        const payload = new Map<string, StoredNote>();
        entries.forEach((entry, index) => {
          const id =
            entry.id ??
            `seed-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
          payload.set(id, {
            ...entry,
            id,
            x: entry.start * state.zoomX,
            y: (state.scrollY + 48 - entry.pitch) * state.zoomY,
            width: entry.duration * state.zoomX,
            height: state.zoomY,
            color,
          });
        });
        return payload;
      });
      setState((prev) => ({ ...prev, selectedNoteIds: new Set(), selectionStart: undefined, selectionEnd: undefined }));
    },
    [state.scrollY, state.zoomX, state.zoomY]
  );

  const exportNotes = useCallback((): MidiNote[] => {
    return Array.from(notes.values()).map((note) => ({
      id: note.id,
      pitch: note.pitch,
      start: note.start,
      duration: note.duration,
      velocity: note.velocity,
      channel: note.channel,
      releaseVelocity: note.releaseVelocity,
    }));
  }, [notes]);

  const zoomAPI = useMemo(() => ({
    setHorizontal: (pixelsPerSecond: number) =>
      setState((prev) => ({ ...prev, zoomX: Math.max(20, Math.min(400, pixelsPerSecond)) })),
    setVertical: (pixelsPerNote: number) =>
      setState((prev) => ({ ...prev, zoomY: Math.max(8, Math.min(32, pixelsPerNote)) })),
    zoomBy: (factor: number, anchorTime: number) => {
      setState((prev) => {
        const nextZoomX = Math.max(20, Math.min(400, prev.zoomX * factor));
        const nextScrollX = anchorTime * nextZoomX - (anchorTime * prev.zoomX - prev.scrollX);
        return {
          ...prev,
          zoomX: nextZoomX,
          scrollX: Math.max(0, nextScrollX),
        };
      });
    },
  }), []);

  const getNotesArray = useCallback(() => Array.from(notes.values()), [notes]);

  useEffect(() => {
    setNotes((prev) => {
      const next = new Map<string, StoredNote>();
      prev.forEach((note, id) => {
        next.set(id, {
          ...note,
          x: note.start * state.zoomX,
          y: (state.scrollY + 48 - note.pitch) * state.zoomY,
          width: note.duration * state.zoomX,
          height: state.zoomY,
        });
      });
      return next;
    });
  }, [state.zoomX, state.zoomY, state.scrollY]);

  return {
    state,
    setState,
    notes,
    addNote,
    updateNote,
    deleteNotes,
    selectNotes,
    clearSelection,
    setSelectionBounds,
    setTool,
    setQuantization,
    setSwing,
    toggleGridOption,
    applyTrapPattern,
    getActiveScale,
    zoomAPI,
    grooveTemplates,
    getNotesArray,
    loadNotes,
    exportNotes,
    patterns,
    scales,
  };
}

export type PianoRollBinding = ReturnType<typeof usePianoRoll>;

export function extractQuantizationDenominator(mode: QuantizationMode) {
  const [, raw] = mode.split("/");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
}
