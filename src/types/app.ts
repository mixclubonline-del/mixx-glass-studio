/**
 * App-Level Types
 * Phase 31: Extracted from App.tsx for domain migration
 * 
 * These types define the core data structures used across the Flow DAW.
 */

import type { IAudioEngine } from '../types/audio-graph';
import type { PluginConfig, PluginId } from '../audio/plugins';
import type { VelvetMasterChain } from '../audio/masterChain';
import type { MusicalContext } from '../types/sonic-architecture';
import type { MidiNote } from '../types/midi';
import type { PersistedIngestSnapshot } from '../ingest/IngestQueueManager';
import type { IngestHistoryEntry } from '../state/ingestHistory';

// ═══════════════════════════════════════════════════════════════════════════
// Track Types
// ═══════════════════════════════════════════════════════════════════════════

export type TrackRole = 'twoTrack' | 'hushRecord' | 'standard';
export type TrackGroup = 'Vocals' | 'Harmony' | 'Adlibs' | 'Bass' | 'Drums' | 'Instruments';
export type TrackColorKey = 'cyan' | 'magenta' | 'blue' | 'green' | 'purple' | 'crimson';
export type WaveformType = 'dense' | 'sparse' | 'varied' | 'bass';

export interface TrackData {
  id: string;
  trackName: string;
  trackColor: TrackColorKey;
  waveformType: WaveformType;
  group: TrackGroup;
  isProcessing?: boolean;
  role: TrackRole;
  locked?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Mixer Types
// ═══════════════════════════════════════════════════════════════════════════

export interface MixerSettings {
  volume: number;
  pan: number;
  isMuted: boolean;
}

export type MixerBusId =
  | 'velvet-curve'
  | 'phase-weave'
  | 'velvet-floor'
  | 'harmonic-lattice';

export interface ChannelDynamicsSettings {
  drive: number;
  release: number;
  blend: number;
}

export interface ChannelEQSettings {
  low: number;
  mid: number;
  air: number;
  tilt: number;
}

export interface MixerBusStripData {
  id: MixerBusId;
  name: string;
  members: string[];
  alsIntensity: number;
  alsPulse: number;
  alsColor: string;
  alsGlow: string;
  alsHaloColor?: string;
  alsGlowStrength?: number;
  busLevel?: number;
  busPeak?: number;
  busTransient?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FX/Plugin Types
// ═══════════════════════════════════════════════════════════════════════════

export type FxWindowId = PluginId;

export type FxWindowConfig = Omit<PluginConfig, 'engineInstance'> & {
  params: any;
  onChange: (param: string, value: any) => void;
  engineInstance: IAudioEngine;
  color?: string;
};

export interface AutomationPoint {
  time: number; // in seconds
  value: number; // typically 0-1.2 for volume, -1 to 1 for pan
}

export interface VisualizerProps<T = any> {
  connectedColor?: TrackColorKey;
  params: T;
  onChange: (param: string, value: any) => void;
  isPlaying?: boolean;
  currentTime?: number;
  trackId: string;
  fxId: FxWindowId;
  automationData: Record<string, Record<string, Record<string, AutomationPoint[]>>>;
  onAddAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, point: AutomationPoint) => void;
  onUpdateAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number, point: AutomationPoint) => void;
  onDeleteAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Audio Node Types
// ═══════════════════════════════════════════════════════════════════════════

export interface AudioNodes {
  gain: GainNode;
  panner: StereoPannerNode;
  analyser: AnalyserNode;
  preFaderMeter: AnalyserNode;
  input: GainNode;
}

export interface FxNode {
  input: GainNode;
  output: GainNode;
  engine?: IAudioEngine;
  bypass: GainNode;
  direct: GainNode;
}

export type MasterNodes = VelvetMasterChain;

export interface TrackAnalysisData {
  level: number;
  transient: boolean;
  rms?: number;
  peak?: number;
  crestFactor?: number;
  spectralTilt?: number;
  lowBandEnergy?: number;
  automationActive?: boolean;
  automationTargets?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Project Persistence Types
// ═══════════════════════════════════════════════════════════════════════════

export interface PersistedProjectState {
  tracks?: TrackData[];
  clips?: any[];
  mixerSettings?: Record<string, MixerSettings>;
  inserts?: Record<string, FxWindowId[]>;
  masterVolume?: number | string;
  masterBalance?: number | string;
  isLooping?: boolean;
  bpm?: number | string;
  ppsValue?: number | string;
  scrollX?: number | string;
  audioBuffers?: Record<string, any>;
  automationData?: Record<string, any>;
  visibleAutomationLanes?: Record<string, any>;
  musicalContext?: MusicalContext;
  fxBypassState?: Record<string, boolean>;
  bloomPosition?: { x: number; y: number };
  floatingBloomPosition?: { x: number; y: number };
  ingestSnapshot?: PersistedIngestSnapshot;
  ingestHistoryEntries?: IngestHistoryEntry[];
  followPlayhead?: boolean;
  pianoRollSketches?: Record<string, MidiNote[]>;
  pianoRollZoom?: { scrollX: number; zoomX: number; zoomY: number };
}

// ═══════════════════════════════════════════════════════════════════════════
// Import Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ImportProfileKeyword {
  keywords: string[];
  group: TrackGroup;
  color?: TrackColorKey;
  label: string;
}

export interface ImportProgressEntry {
  id: string;
  label: string;
  type: 'file' | 'stem';
  percent: number;
  color?: string;
  parentId?: string;
}
