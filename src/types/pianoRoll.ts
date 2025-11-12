// src/types/pianoRoll.ts

import type { MidiNote, QuantizationMode } from "./midi";

export interface TrapPattern {
  id: string;
  name: string;
  type: "808" | "hihat" | "snare" | "kick" | "melody" | "percussion";
  pattern: number[]; // Step positions (0-15 for 16 steps, or 0-31 for 32 steps)
  velocity: number; // Default velocity (0-127)
  swing: number; // 0-100% swing
  quantization: QuantizationMode;
  genre?: "trap" | "drill" | "bounce" | "afrobeat" | "generic";
  bpm?: number; // Suggested BPM
  description?: string;
}

export interface PianoRollState {
  scrollX: number; // Horizontal scroll (seconds)
  scrollY: number; // Vertical scroll (MIDI note number)
  zoomX: number; // Horizontal zoom (pixels per second)
  zoomY: number; // Vertical zoom (pixels per MIDI note)

  selectedNoteIds: Set<string>;
  selectionStart?: { time: number; pitch: number };
  selectionEnd?: { time: number; pitch: number };

  tool: "select" | "draw" | "erase" | "velocity";
  quantization: QuantizationMode;
  swing: number; // 0-100%
  snapToGrid: boolean;

  showVelocity: boolean;
  showCC: boolean;
  showPianoKeys: boolean;
  showGrid: boolean;

  playheadPosition: number; // seconds
  loopStart?: number;
  loopEnd?: number;
}

export interface PianoRollNote extends MidiNote {
  x: number; // Pixel X position
  y: number; // Pixel Y position
  width: number; // Pixel width
  height: number; // Pixel height
  color: string; // Visual color based on velocity/track
}

export interface GrooveTemplate {
  id: string;
  name: string;
  swing: number; // 0-100%
  humanize: number; // 0-100%
  timingOffset: number[]; // Per-step timing offset in milliseconds
  velocityVariation: number[]; // Per-step velocity variation (0-127)
  genre: "trap" | "drill" | "bounce" | "afrobeat" | "generic";
}

export interface TrapScale {
  name: string;
  root: number; // MIDI note number (0-127)
  intervals: number[]; // Semitone intervals from root
  type: "minor-pentatonic" | "minor" | "harmonic-minor" | "phrygian" | "custom";
}

