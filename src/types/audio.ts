/**
 * Shared audio types for Mixx Club Pro Studio
 */

export interface EQParams {
  low: { frequency: number; gain: number; type: 'shelf' | 'bell' };
  mid: { frequency: number; gain: number; q: number };
  high: { frequency: number; gain: number; type: 'shelf' | 'bell' };
}

export interface CompressorParams {
  threshold: number; // -60 to 0 dB
  ratio: number; // 1 to 20
  attack: number; // 0.001 to 0.1 seconds
  release: number; // 0.01 to 1 seconds
  makeupGain: number; // 0 to 24 dB
}

export interface SendConfig {
  busId: string;
  amount: number; // 0 to 1
  preFader: boolean;
}

export interface PeakLevel {
  left: number; // -60 to +6 dB
  right: number;
}

export interface AutomationPoint {
  time: number;
  value: number;
}

export type AutomationMode = 'off' | 'read' | 'write' | 'touch' | 'latch';

export interface TrackColor {
  hue: number; // 0-360
  saturation: number; // 0-100
  lightness: number; // 0-100
}
