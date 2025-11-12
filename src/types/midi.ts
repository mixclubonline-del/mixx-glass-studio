// src/types/midi.ts

export type QuantizationMode =
  | "1/1"
  | "1/2"
  | "1/4"
  | "1/8"
  | "1/16"
  | "1/32"
  | "1/64";

export interface MidiNote {
  id?: string;
  pitch: number; // MIDI note number (0-127)
  start: number; // seconds
  duration: number; // seconds
  velocity: number; // 0-127
  releaseVelocity?: number; // 0-127
  channel?: number; // MIDI channel (0-15)
}

export interface MidiCC {
  controller: number;
  value: number;
  timestamp: number;
}

export interface MidiEvent {
  type: "noteOn" | "noteOff" | "cc" | "pitchBend" | "aftertouch";
  channel: number;
  timestamp: number;
  data: number[];
}

export interface MidiClip {
  id: string;
  name: string;
  notes: MidiNote[];
  automation?: MidiCC[];
  length: number; // seconds
  loopLength?: number; // seconds
}

