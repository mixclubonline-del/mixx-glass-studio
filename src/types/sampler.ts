import type { TrackColorKey } from "../utils/ALS";

export type TrapPadId =
  | "pad-1"
  | "pad-2"
  | "pad-3"
  | "pad-4"
  | "pad-5"
  | "pad-6"
  | "pad-7"
  | "pad-8"
  | "pad-9"
  | "pad-10"
  | "pad-11"
  | "pad-12"
  | "pad-13"
  | "pad-14"
  | "pad-15"
  | "pad-16";

export const TRAP_PAD_IDS: TrapPadId[] = [
  "pad-1",
  "pad-2",
  "pad-3",
  "pad-4",
  "pad-5",
  "pad-6",
  "pad-7",
  "pad-8",
  "pad-9",
  "pad-10",
  "pad-11",
  "pad-12",
  "pad-13",
  "pad-14",
  "pad-15",
  "pad-16",
];

export type TrapSamplerLayerId = "sub" | "body" | "attack";

export interface TrapPadLayerState {
  id: TrapSamplerLayerId;
  label: string;
  sampleName: string;
  color: TrackColorKey;
  drive: number; // 0-1, controls harmonic grit
  decay: number; // 0-1, envelope tail
  volume: number; // 0-1, per-layer blend
  pitch: number; // -12 to +12 semitones
}

export interface TrapPadState {
  id: TrapPadId;
  label: string;
  bank: "Pit" | "Radiant" | "Slick" | "Sculpt";
  layers: Record<TrapSamplerLayerId, TrapPadLayerState>;
}

export interface TrapSampleWaveform {
  padId: TrapPadId;
  samples: Float32Array;
  sampleRate: number;
}

export interface TrapSamplerSnapshot {
  pads: TrapPadState[];
  focusedPadId: TrapPadId;
  activePadId: TrapPadId | null;
  lastVelocity: number;
  chopSensitivity: number; // 0-1
  phaseOffset: number; // 0-1
  waveform: TrapSampleWaveform | null;
}


