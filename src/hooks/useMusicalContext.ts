/**
 * useMusicalContext Hook
 * Phase 33: Prime Brain Intelligence Integration
 * 
 * Provides musical context awareness for the Spectral Editor:
 * - Auto-detected key and scale from audio
 * - Manual key/scale override
 * - Scale note validation
 * - Snap-to-scale functionality
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { detectKey } from '../core/import/key';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type ScaleType = 
  | 'major'
  | 'minor'
  | 'pentatonic-major'
  | 'pentatonic-minor'
  | 'blues'
  | 'harmonic-minor'
  | 'dorian'
  | 'phrygian'
  | 'chromatic';

export interface MusicalContextState {
  key: string;           // Root note (C, C#, D, etc.)
  scale: ScaleType;      // Scale type
  isAutoDetected: boolean;
  confidence: number;    // 0-1, confidence in detection
}

export interface UseMusicalContextReturn {
  context: MusicalContextState;
  setKey: (key: string) => void;
  setScale: (scale: ScaleType) => void;
  detectFromBuffer: (buffer: AudioBuffer) => void;
  isInScale: (midiNote: number) => boolean;
  nearestInScale: (midiNote: number) => number;
  getScaleNotes: () => number[];
  resetToAuto: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Scale Definitions (intervals from root)
// ═══════════════════════════════════════════════════════════════════════════

const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  'major':            [0, 2, 4, 5, 7, 9, 11],
  'minor':            [0, 2, 3, 5, 7, 8, 10],
  'pentatonic-major': [0, 2, 4, 7, 9],
  'pentatonic-minor': [0, 3, 5, 7, 10],
  'blues':            [0, 3, 5, 6, 7, 10],
  'harmonic-minor':   [0, 2, 3, 5, 7, 8, 11],
  'dorian':           [0, 2, 3, 5, 7, 9, 10],
  'phrygian':         [0, 1, 3, 5, 7, 8, 10],
  'chromatic':        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const NOTE_TO_MIDI: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

const MIDI_TO_NOTE: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ═══════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONTEXT: MusicalContextState = {
  key: 'C',
  scale: 'minor', // Minor is common in modern music
  isAutoDetected: false,
  confidence: 0,
};

export function useMusicalContext(initialBuffer?: AudioBuffer): UseMusicalContextReturn {
  const [context, setContext] = useState<MusicalContextState>(DEFAULT_CONTEXT);
  const [autoDetectedKey, setAutoDetectedKey] = useState<string | null>(null);

  // Auto-detect from initial buffer
  useEffect(() => {
    if (initialBuffer && !context.isAutoDetected) {
      const detected = detectKey(initialBuffer);
      setAutoDetectedKey(detected);
      setContext(prev => ({
        ...prev,
        key: detected,
        isAutoDetected: true,
        confidence: 0.7, // Basic detection confidence
      }));
    }
  }, [initialBuffer]);

  // Set key manually
  const setKey = useCallback((key: string) => {
    setContext(prev => ({
      ...prev,
      key,
      isAutoDetected: false,
    }));
  }, []);

  // Set scale manually
  const setScale = useCallback((scale: ScaleType) => {
    setContext(prev => ({
      ...prev,
      scale,
    }));
  }, []);

  // Detect from audio buffer
  const detectFromBuffer = useCallback((buffer: AudioBuffer) => {
    const detected = detectKey(buffer);
    setAutoDetectedKey(detected);
    setContext(prev => ({
      ...prev,
      key: detected,
      isAutoDetected: true,
      confidence: 0.7,
    }));
  }, []);

  // Reset to auto-detected key
  const resetToAuto = useCallback(() => {
    if (autoDetectedKey) {
      setContext(prev => ({
        ...prev,
        key: autoDetectedKey,
        isAutoDetected: true,
      }));
    }
  }, [autoDetectedKey]);

  // Get all MIDI note numbers in the current scale (across all octaves)
  const scaleSet = useMemo(() => {
    const rootMidi = NOTE_TO_MIDI[context.key] ?? 0;
    const intervals = SCALE_INTERVALS[context.scale];
    const notes = new Set<number>();
    
    // Generate scale notes for all octaves (0-127)
    for (let octave = 0; octave < 11; octave++) {
      for (const interval of intervals) {
        const note = (octave * 12) + rootMidi + interval;
        if (note >= 0 && note <= 127) {
          notes.add(note);
        }
      }
    }
    
    return notes;
  }, [context.key, context.scale]);

  // Check if a MIDI note is in the current scale
  const isInScale = useCallback((midiNote: number): boolean => {
    return scaleSet.has(midiNote);
  }, [scaleSet]);

  // Find the nearest note in the scale
  const nearestInScale = useCallback((midiNote: number): number => {
    if (scaleSet.has(midiNote)) {
      return midiNote;
    }
    
    // Search outward from the note
    for (let offset = 1; offset <= 6; offset++) {
      if (scaleSet.has(midiNote + offset)) {
        return midiNote + offset;
      }
      if (scaleSet.has(midiNote - offset)) {
        return midiNote - offset;
      }
    }
    
    // Shouldn't happen with chromatic fallback, but return original
    return midiNote;
  }, [scaleSet]);

  // Get sorted array of scale notes
  const getScaleNotes = useCallback((): number[] => {
    return Array.from(scaleSet).sort((a, b) => a - b);
  }, [scaleSet]);

  return {
    context,
    setKey,
    setScale,
    detectFromBuffer,
    isInScale,
    nearestInScale,
    getScaleNotes,
    resetToAuto,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions (exported for external use)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert MIDI note to note name with octave
 */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = MIDI_TO_NOTE[midi % 12];
  return `${note}${octave}`;
}

/**
 * Get frequency (Hz) from MIDI note
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Get MIDI note from frequency (Hz)
 */
export function frequencyToMidi(freq: number): number {
  return 12 * Math.log2(freq / 440) + 69;
}

/**
 * Get all available scale types
 */
export function getAvailableScales(): { id: ScaleType; name: string }[] {
  return [
    { id: 'major', name: 'Major' },
    { id: 'minor', name: 'Minor' },
    { id: 'pentatonic-major', name: 'Pentatonic Major' },
    { id: 'pentatonic-minor', name: 'Pentatonic Minor' },
    { id: 'blues', name: 'Blues' },
    { id: 'harmonic-minor', name: 'Harmonic Minor' },
    { id: 'dorian', name: 'Dorian' },
    { id: 'phrygian', name: 'Phrygian' },
    { id: 'chromatic', name: 'Chromatic (No Snap)' },
  ];
}

/**
 * Get all note names
 */
export function getNoteNames(): string[] {
  return [...MIDI_TO_NOTE];
}
