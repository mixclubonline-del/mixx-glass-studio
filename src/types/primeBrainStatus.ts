import type {
  PrimeBrainALSChannel,
  PrimeBrainAIFlag,
  PrimeBrainBloomEvent,
  PrimeBrainMode,
} from '../ai/PrimeBrainSnapshot';
import type { FourAnchors } from '../types/sonic-architecture';

export interface PrimeBrainALSChannelState {
  channel: PrimeBrainALSChannel;
  value: number;
  descriptor: string;
  accent: string;
  aura: string;
}

export interface PrimeBrainHealthTone {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  color: string;
  glowColor: string;
  temperature: 'cold' | 'cool' | 'warm' | 'hot';
  pulse: number;
  flow: number;
  energy: number;
  caption: string;
}

export interface VelvetAnchorDescriptor {
  key: keyof FourAnchors;
  label: string;
  descriptor: string;
  accent: string;
}

export interface VelvetLensState {
  label: string;
  gradient: string;
  tagline: string;
  anchors: VelvetAnchorDescriptor[];
}

export interface PrimeBrainStatus {
  mode: PrimeBrainMode;
  modeCaption: string;
  health: PrimeBrainHealthTone;
  alsChannels: PrimeBrainALSChannelState[];
  velvet: VelvetLensState;
  lastAction?: string;
  lastBloom?: PrimeBrainBloomEvent | null;
  bloomSummary?: string;
  guidanceLine?: string;
  userMemoryAnchors: string[];
  aiFlags: PrimeBrainAIFlag[];
}


