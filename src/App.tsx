import React, { useState, useRef, createRef, useCallback, useEffect, useMemo } from 'react';
import FXWindow from './components/FXWindow';
import FXRack from './components/FXRack';
import AdaptiveWaveformHeader from './components/AdaptiveWaveformHeader';
import AddTrackModal from './components/AddTrackModal';
import { getVelvetCurveEngine, initializeVelvetCurveEngine, VelvetCurveState } from './audio/VelvetCurveEngine';
import VelvetCurveVisualizer from './components/VelvetCurveVisualizer';
import { getHarmonicLattice, initializeHarmonicLattice, HarmonicLatticeState } from './audio/HarmonicLattice';
import HarmonicLatticeVisualizer from './components/HarmonicLatticeVisualizer';
import MixxFXVisualizer from './components/MixxFXVisualizer';
import { analyzeVelvetCurve, FourAnchors, MusicalContext, calculateVelvetScore, getVelvetColor, MASTERING_PROFILES } from './types/sonic-architecture';
import TrackContextMenu from './components/TrackContextMenu';
import RenameTrackModal from './components/RenameTrackModal';
import ChangeColorModal from './components/ChangeColorModal';
import { BloomDock } from './components/BloomHUD/BloomDock';
import { BloomFloatingHub, BloomFloatingMenu } from './components/BloomHUD/BloomFloatingHub';
import type { BloomFloatingMenuItem } from './components/BloomHUD/BloomFloatingHub';
import { SaveIcon, LoadIcon, SparklesIcon, SquaresPlusIcon, MixerIcon, PlusCircleIcon, StarIcon, SplitIcon, MergeIcon, RefreshIcon, BrainIcon, AutomationIcon, ChatIcon, ImageIcon, MicrophoneIcon, LoopIcon, CopyIcon, BulbIcon } from './components/icons';
import { useArrange, ArrangeClip, ClipId } from "./hooks/useArrange";
import { ArrangeWindow } from "./components/ArrangeWindow";
import { FlowTransitionEngine } from "./components/flow/FlowTransitionEngine";
import { WideGlassConsole } from "./components/mixer/WideGlassConsole";
import FlowWelcomeHub from './components/FlowWelcomeHub';
import ImportModal from './components/ImportModal';
import FlowConsole from './components/mixer/Mixer';
import TrapSamplerConsole from './components/sampler/TrapSamplerConsole';
import ViewDeck from './components/layout/ViewDeck';
import OverlayPortal from './components/layout/OverlayPortal';
import VelvetComplianceHUD from './components/ALS/VelvetComplianceHUD';
import PrimeBrainInterface from './components/PrimeBrainInterface';
import { ExternalPluginTestButton } from './components/dev/ExternalPluginTestButton';
import { getMixxFXEngine, initializeMixxFXEngine } from './audio/MixxFXEngine';
import { buildMasterChain } from './audio/masterChain';
import type { VelvetMasterChain } from './audio/masterChain';
import { VelvetLoudnessMeter, DEFAULT_VELVET_LOUDNESS_METRICS } from './audio/VelvetLoudnessMeter';
import type { VelvetLoudnessMetrics } from './audio/VelvetLoudnessMeter';
import { TranslationMatrix, type TranslationProfileKey } from './audio/TranslationMatrix';
import { evaluateCapture } from './audio/CaptureSanityCheck';
import { serializeAudioBuffers, deserializeAudioBuffers } from './audio/serialization';
import { VelvetProcessor } from './audio/VelvetProcessor';
import { PluginId, PluginConfig, getPluginRegistry, PlaceholderAudioEngine } from './audio/plugins';
import TimeWarpVisualizer from './components/TimeWarpVisualizer';
import PluginBrowser from './components/PluginBrowser';
import { IAudioEngine } from './types/audio-graph';
import { getHushSystem } from './audio/HushSystem';
import AIHub from './components/AIHub/AIHub'; // Import AIHub
import { useSessionProbe } from './hooks/useSessionProbe';
import { getSessionProbeSnapshot } from './state/sessionProbe';
import {
  PrimeBrainSnapshotInputs,
  PrimeBrainBloomEvent,
  PrimeBrainCommandLog,
  PrimeBrainGuidance,
  PrimeBrainAIFlag,
  PrimeBrainMode,
  PrimeBrainALSChannel,
  PrimeBrainConversationTurn,
  PrimeBrainModeHints,
  derivePrimeBrainMode,
} from './ai/PrimeBrainSnapshot';
import { usePrimeBrainExporter } from './ai/usePrimeBrainExporter';
import { useStemSeparationExporter } from './core/import/useStemSeparationExporter';
import { recordPrimeBrainEvent, subscribeToPrimeBrainEvents, type PrimeBrainEvent } from './ai/primeBrainEvents';
import { PrimeBrainDebugOverlay } from './components/dev/PrimeBrainDebugOverlay';
import { FlowLoopWrapper } from './core/loop/FlowLoopWrapper';
import { recordViewSwitch, updatePlaybackState, updateRecordState } from './core/loop/flowLoopEvents';
import { initThermalSync } from './core/als/thermalSync';
import { monitorHush } from './core/performance/hushMonitor';
import { recordPunchEvent, recordRecordTap, detectPunchType } from './core/performance/punchMode';
import { recordTakeMemory } from './core/performance/takeMemory';
import { analyzeTakeForComp } from './core/performance/compBrain';
import {
  TRACK_COLOR_SWATCH,
  derivePulsePalette,
  deriveTrackALSFeedback,
  deriveBusALSColors,
  deriveActionPulse,
} from './utils/ALS';
import type { PulsePalette, ALSActionPulse } from './utils/ALS';
import {
  loadPluginFavorites,
  loadPluginPresets,
  PluginPreset,
  removePluginPreset,
  savePluginFavorites,
  savePluginPresets,
  upsertPluginPreset,
} from './utils/pluginState';
import { appendHistoryNote } from './state/ingestHistory';
import IngestQueueManager, {
  IngestJobSnapshot,
  IngestJobControls,
  IngestRuntimeJob,
  IngestJobOutcome,
  PersistedIngestSnapshot,
} from './ingest/IngestQueueManager';
import StemSeparationIntegration from './audio/StemSeparationIntegration';
import { createSignalMatrix } from './audio/SignalMatrix';
import StemSeparationModal from './components/modals/StemSeparationModal';
import { FileInput } from './components/import/FileInput';
import { useTimelineStore } from './state/timelineStore';
import { runFlowStemPipeline } from './core/import/stemPipeline';
import TrackCapsule from './components/TrackCapsule';
import PianoRollPanel from './components/piano/PianoRollPanel';
import { ingestHistoryStore, IngestHistoryEntry } from './state/ingestHistory';
import { publishAlsSignal, publishBloomSignal, publishIngestSignal } from './state/flowSignals';
import { useFlowContext } from './state/flowContextService';
import {
  TrackUIState,
  TrackContextMode,
  DEFAULT_TRACK_CONTEXT,
  DEFAULT_TRACK_LANE_HEIGHT,
  COLLAPSED_TRACK_LANE_HEIGHT,
  MIN_TRACK_LANE_HEIGHT,
  MAX_TRACK_LANE_HEIGHT,
} from './types/tracks';
import { BloomActionMeta, BloomContext, BLOOM_CONTEXT_ACCENTS, BLOOM_CONTEXT_LABELS } from './types/bloom';
import type { MidiNote } from './types/midi';
import type { TrapPattern, TrapScale, GrooveTemplate } from "./types/pianoRoll";
import { usePianoRoll } from './hooks/usePianoRoll';
import type {
  PrimeBrainALSChannelState,
  PrimeBrainHealthTone,
  PrimeBrainStatus,
  VelvetAnchorDescriptor,
  VelvetLensState,
} from './types/primeBrainStatus';
import type { WaveformHeaderSettings } from './types/waveformHeaderSettings';
import { DEFAULT_WAVEFORM_HEADER_SETTINGS } from './types/waveformHeaderSettings';
import { WaveformHeaderSettingsPanel } from './components/WaveformHeaderSettingsPanel';


const DEFAULT_STEM_SELECTION = ['Vocals', 'Drums', 'Bass', 'Other Instruments'] as const;
const DEFAULT_CANONICAL_STEMS = ['vocals', 'drums', 'bass', 'other'] as const;

const STEM_NAME_TO_CANONICAL: Record<string, string> = {
  vocals: 'vocals',
  'lead vocals': 'vocals',
  'backing vocals': 'vocals',
  drums: 'drums',
  bass: 'bass',
  guitar: 'guitar',
  piano: 'piano',
  synths: 'other',
  strings: 'other',
  'other instruments': 'other',
  'sound fx': 'other',
  other: 'other',
};

const STEM_COLOR_BY_KEY: Record<string, TrackData['trackColor']> = {
  vocals: 'magenta',
  drums: 'blue',
  bass: 'green',
  guitar: 'purple',
  piano: 'purple',
  synths: 'cyan',
  strings: 'cyan',
  other: 'cyan',
};

const INSERT_COLOR_BY_PLUGIN: Record<string, TrackData['trackColor']> = {
  // Core processors removed - they're engine-level only
  'mixx-verb': 'cyan',
  'mixx-delay': 'blue',
  'mixx-limiter': 'green',
  'mixx-clip': 'magenta',
  'mixx-fx': 'cyan',
  'time-warp': 'purple',
};
const INITIAL_RECORDING_OPTIONS = {
  preRoll: true,
  countIn: true,
  inputMonitor: true,
  hushGate: true,
};
type RecordingOptionKey = keyof typeof INITIAL_RECORDING_OPTIONS;
// Core processors that should NOT appear in UI (engine-level only)
const CORE_PROCESSOR_IDS: FxWindowId[] = [
  'velvet-curve',
  'phase-weave',
  'velvet-floor',
  'harmonic-lattice',
];

const CURATED_INSERT_IDS: FxWindowId[] = [
  // Core processors removed - they're engine-level only
  'mixx-verb',
  'mixx-delay',
  'mixx-limiter',
  'mixx-clip',
  'mixx-fx',
];
const FALLBACK_PLUGIN_NAMES: Record<FxWindowId, string> = {
  // Core processors removed - they're engine-level only
  'mixx-verb': 'Mixx Verb',
  'mixx-delay': 'Mixx Delay',
  'mixx-limiter': 'Mixx Limiter',
  'mixx-clip': 'Mixx Clip',
  'mixx-fx': 'Mixx FX',
  'time-warp': 'Time Warp',
};

const VIEWPORT_PADDING = 32;
const DOCK_SIZE = { width: 420, height: 132 };
const HUB_SIZE = { width: 220, height: 220 };
const HUB_HORIZONTAL_GAP = 48;
const HUB_VERTICAL_GAP = 24;
const DOCK_STORAGE_KEY = 'mixxclub:bloom-dock:v2';
const HUB_STORAGE_KEY = 'mixxclub:bloom-floating:v2';
const FLOW_ENTRY_STORAGE_KEY = 'mixxclub:flow-entered:v1';

type Point = { x: number; y: number };

const PRIME_BRAIN_TELEMETRY_STORAGE_KEY = 'mixxclub:primebrain-telemetry-enabled';
const PRIME_BRAIN_EXPORT_URL_STORAGE_KEY = 'mixxclub:primebrain-export-url';
const STEM_SEPARATION_EXPORT_URL_STORAGE_KEY = 'mixxclub:stem-separation-export-url';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const ALS_CHANNEL_STYLES: Record<
  PrimeBrainALSChannel,
  { accent: string; aura: string; low: string; mid: string; high: string; peak: string }
> = {
  temperature: {
    accent: '#f472b6',
    aura: 'rgba(244,114,182,0.42)',
    low: 'Cooling',
    mid: 'Warming',
    high: 'Igniting',
    peak: 'Blazing',
  },
  momentum: {
    accent: '#38bdf8',
    aura: 'rgba(56,189,248,0.38)',
    low: 'Steady',
    mid: 'Rising',
    high: 'Charging',
    peak: 'Surging',
  },
  pressure: {
    accent: '#f59e0b',
    aura: 'rgba(245,158,11,0.36)',
    low: 'Relaxed',
    mid: 'Tightening',
    high: 'Pressing',
    peak: 'Peaking',
  },
  harmony: {
    accent: '#c084fc',
    aura: 'rgba(192,132,252,0.4)',
    low: 'Open',
    mid: 'Layering',
    high: 'Blending',
    peak: 'Weaving',
  },
};

const HEALTH_TONES: Record<
  PrimeBrainHealthTone['overall'],
  {
    color: string;
    glowColor: string;
    temperature: PrimeBrainHealthTone['temperature'];
    pulse: number;
    flow: number;
    energy: number;
    caption: string;
  }
> = {
  excellent: {
    color: '#10b981',
    glowColor: '#34d399',
    temperature: 'cool',
    pulse: 0.3,
    flow: 1,
    energy: 1,
    caption: 'Prime Brain humming in serenity.',
  },
  good: {
    color: '#06b6d4',
    glowColor: '#22d3ee',
    temperature: 'cool',
    pulse: 0.4,
    flow: 0.9,
    energy: 0.9,
    caption: 'Systems aligned and listening.',
  },
  fair: {
    color: '#fbbf24',
    glowColor: '#fcd34d',
    temperature: 'warm',
    pulse: 0.6,
    flow: 0.7,
    energy: 0.7,
    caption: 'Adjusting flow, hold the lane steady.',
  },
  poor: {
    color: '#f97316',
    glowColor: '#fb923c',
    temperature: 'warm',
    pulse: 0.7,
    flow: 0.5,
    energy: 0.5,
    caption: 'Prime Brain easing pressure back into range.',
  },
  critical: {
    color: '#ef4444',
    glowColor: '#f87171',
    temperature: 'hot',
    pulse: 0.9,
    flow: 0.3,
    energy: 0.3,
    caption: 'Critical load detected—shelter the mix.',
  },
};

const describeAlsChannel = (channel: PrimeBrainALSChannel, value: number): PrimeBrainALSChannelState => {
  const style = ALS_CHANNEL_STYLES[channel];
  const normalized = clamp01(value);
  let descriptor = style.low;
  if (normalized >= 0.85) {
    descriptor = style.peak;
  } else if (normalized >= 0.65) {
    descriptor = style.high;
  } else if (normalized >= 0.35) {
    descriptor = style.mid;
  }
  return {
    channel,
    value: normalized,
    descriptor,
    accent: style.accent,
    aura: style.aura,
  };
};

const derivePrimeBrainHealth = (
  metrics: PrimeBrainSnapshotInputs['audioMetrics'],
  flags: PrimeBrainAIFlag[],
): PrimeBrainHealthTone => {
  const cpuLoad = metrics.cpuLoad ?? 0;
  const dropouts = metrics.dropoutsPerMinute ?? 0;
  const hasCritical = flags.some((flag) => flag.severity === 'critical');
  const hasWarn = flags.some((flag) => flag.severity === 'warn');

  let overall: PrimeBrainHealthTone['overall'] = 'excellent';

  if (hasCritical || cpuLoad > 0.92 || dropouts > 3) {
    overall = 'critical';
  } else if (cpuLoad > 0.85 || dropouts > 2) {
    overall = 'poor';
  } else if (hasWarn || cpuLoad > 0.7 || dropouts > 1) {
    overall = 'fair';
  } else if (cpuLoad > 0.45) {
    overall = 'good';
  }

  const tone = HEALTH_TONES[overall];
  return {
    overall,
    color: tone.color,
    glowColor: tone.glowColor,
    temperature: tone.temperature,
    pulse: tone.pulse,
    flow: tone.flow,
    energy: tone.energy,
    caption: tone.caption,
  };
};

const ANCHOR_STYLES: Record<
  keyof FourAnchors,
  { label: string; accents: [string, string, string]; descriptors: [string, string, string] }
> = {
  body: {
    label: 'Body',
    accents: ['#2563eb', '#38bdf8', '#f97316'],
    descriptors: ['Featherlight', 'Grounded', 'Thunderous'],
  },
  soul: {
    label: 'Soul',
    accents: ['#7c3aed', '#c084fc', '#f472b6'],
    descriptors: ['Muted', 'Glowing', 'Radiant'],
  },
  air: {
    label: 'Air',
    accents: ['#0ea5e9', '#38bdf8', '#a855f7'],
    descriptors: ['Closed', 'Shining', 'Celestial'],
  },
  silk: {
    label: 'Silk',
    accents: ['#8b5cf6', '#c4b5fd', '#f9a8d4'],
    descriptors: ['Raw', 'Polished', 'Velvet'],
  },
};

const describeAnchor = (key: keyof FourAnchors, value: number): VelvetAnchorDescriptor => {
  const style = ANCHOR_STYLES[key];
  let index = 0;
  if (value >= 72) {
    index = 2;
  } else if (value >= 38) {
    index = 1;
  }
  return {
    key,
    label: style.label,
    descriptor: style.descriptors[index],
    accent: style.accents[index],
  };
};

const deriveVelvetLensState = (analysis: FourAnchors | null): VelvetLensState => {
  if (!analysis) {
    return {
      label: 'Listening',
      gradient: 'from-indigo-500 via-purple-500 to-cyan-500',
      tagline: 'Prime Brain awaiting anchors to settle.',
      anchors: (['body', 'soul', 'air', 'silk'] as Array<keyof FourAnchors>).map((key) =>
        describeAnchor(key, 0),
      ),
    };
  }

  const anchors = (['body', 'soul', 'air', 'silk'] as Array<keyof FourAnchors>).map((key) =>
    describeAnchor(key, analysis[key]),
  );
  const velvetScore = calculateVelvetScore(analysis);
  const velvetColor = getVelvetColor(velvetScore);

  let label = 'Anchors Aligning';
  let tagline = 'Mix fabric is settling into comfort.';

  if (analysis.silk > 72 && analysis.soul > 64) {
    label = 'Velvet Steady';
    tagline = 'Silk and soul are hugging the mix fabric.';
  } else if (analysis.body > 68) {
    label = 'Low Anchor Driving';
    tagline = 'Body is delivering club weight through the floor.';
  } else if (analysis.air > 70) {
    label = 'Air Drifting';
    tagline = 'Air anchor is lifting the scene into glow.';
  }

  return {
    label,
    gradient: velvetColor.gradient,
    tagline,
    anchors,
  };
};

const MODE_CAPTIONS: Record<PrimeBrainMode, string> = {
  passive: 'Prime Brain listening for cues.',
  active: 'Prime Brain guiding in real-time.',
  learning: 'Prime Brain memorizing creator moves.',
  optimizing: 'Prime Brain easing system load.',
};
const computeDockDefaultPosition = (): Point => {
  if (typeof window === 'undefined') {
    return { x: VIEWPORT_PADDING, y: 640 };
  }
  // Default: centered bottom (matches CSS default)
  const x = (window.innerWidth - DOCK_SIZE.width) / 2;
  const y = window.innerHeight - DOCK_SIZE.height - 130; // 130px from bottom (matches CSS)
  return { x, y };
};

const computeHubDefaultPosition = (dockPosition?: Point): Point => {
  if (typeof window === 'undefined') {
    // Default: top-right (matches CSS default)
    return { x: window.innerWidth - 220 - 90, y: 240 }; // 220 = HUB_SIZE.width, 90 = right offset
  }
  // Default: top-right (matches CSS: top: 240px, right: 90px)
  const x = window.innerWidth - HUB_SIZE.width - 90; // 90px from right (matches CSS)
  const y = 240; // 240px from top (matches CSS)
  return { x, y };
};

const clampDockPosition = (raw: Point): Point => {
  if (typeof window === 'undefined') {
    return raw;
  }
  const maxX = Math.max(
    VIEWPORT_PADDING,
    window.innerWidth - DOCK_SIZE.width - VIEWPORT_PADDING
  );
  const maxY = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - DOCK_SIZE.height - VIEWPORT_PADDING
  );
  return {
    x: Math.min(Math.max(VIEWPORT_PADDING, raw.x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING, raw.y), maxY),
  };
};

const clampHubPosition = (raw: Point): Point => {
  if (typeof window === 'undefined') {
    return raw;
  }
  const maxX = Math.max(
    VIEWPORT_PADDING,
    window.innerWidth - HUB_SIZE.width - VIEWPORT_PADDING
  );
  const maxY = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - HUB_SIZE.height - VIEWPORT_PADDING
  );
  return {
    x: Math.min(Math.max(VIEWPORT_PADDING, raw.x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING, raw.y), maxY),
  };
};

type StemKey = keyof typeof STEM_COLOR_BY_KEY;

const STEM_MESSAGE_MATCHERS: Array<{ key: StemKey; keywords: string[] }> = [
  { key: 'vocals', keywords: ['vocal', 'vox', 'singer', 'lead'] },
  { key: 'drums', keywords: ['drum', 'beat', 'percussion', 'kick', 'snare'] },
  { key: 'bass', keywords: ['bass', 'low end'] },
  { key: 'guitar', keywords: ['guitar', 'gtr'] },
  { key: 'piano', keywords: ['piano', 'keys', 'keyboard'] },
  { key: 'synths', keywords: ['synth', 'pad', 'lead', 'arp'] },
  { key: 'strings', keywords: ['string', 'violin', 'cello'] },
  {
    key: 'other',
    keywords: [
      'processing',
      'preparing',
      'separating',
      'generating',
      'import',
      'mixdown',
      'render',
      'fallback',
    ],
  },
];

type PendingStemRequest = {
  buffer: AudioBuffer;
  fileName: string;
  originalTrackId: string;
  jobId: string;
  resolve?: () => void;
  reject?: (error: Error) => void;
};

export type TrackRole = 'twoTrack' | 'hushRecord' | 'standard';

export interface TrackData {
  id: string;
  trackName: string;
  trackColor: 'cyan' | 'magenta' | 'blue' | 'green' | 'purple' | 'crimson';
  waveformType: 'dense' | 'sparse' | 'varied' | 'bass';
  group: 'Vocals' | 'Harmony' | 'Adlibs' | 'Bass' | 'Drums' | 'Instruments';
  isProcessing?: boolean;
  role: TrackRole;
  locked?: boolean;
}

export interface AutomationPoint {
    time: number; // in seconds
    value: number; // typically 0-1.2 for volume, -1 to 1 for pan, or parameter-specific
}

// --- Web Audio Node Management ---
interface AudioNodes {
  gain: GainNode; // Fader
  panner: StereoPannerNode;
  analyser: AnalyserNode; // Post-fader analyser (existing)
  preFaderMeter: AnalyserNode; // Pre-fader meter tap (NEW - Flow Meter Stack)
  input: GainNode; // Main input for the track chain
}
interface FxNode {
    input: GainNode; // Input to the FX Node wrapper
    output: GainNode; // Output from the FX Node wrapper
    engine?: IAudioEngine; // The actual IAudioEngine instance
    bypass: GainNode; // WET signal path gain
    direct: GainNode; // DRY signal path gain
}
export interface MixerSettings {
    volume: number;
    pan: number;
    isMuted: boolean;
}
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
type MasterNodes = VelvetMasterChain;


// --- Interactive FX Visualizer Components ---
export interface VisualizerProps<T = any> {
  connectedColor?: 'cyan' | 'magenta' | 'blue' | 'green' | 'purple' | 'crimson';
  params: T;
  onChange: (param: string, value: any) => void;
  isPlaying?: boolean;
  currentTime?: number;
  // Automation specific props
  trackId: string;
  fxId: FxWindowId;
  automationData: Record<string, Record<string, Record<string, AutomationPoint[]>>>; // trackId -> fxId -> paramName -> points
  onAddAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, point: AutomationPoint) => void;
  onUpdateAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number, point: AutomationPoint) => void;
  onDeleteAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number) => void;
}


// FIX: Corrected FxWindowConfig type to use Omit, resolving a type conflict on the 'engineInstance' property.
export type FxWindowConfig = Omit<PluginConfig, 'engineInstance'> & {
    params: any;
    onChange: (param: string, value: any) => void;
    engineInstance: IAudioEngine;
    color?: string;
};

export type FxWindowId = PluginId;

const TWO_TRACK_SIGNAL_CHAIN: FxWindowId[] = ['velvet-curve', 'mixx-glue', 'mixx-limiter'];
const HUSH_TRACK_SIGNAL_CHAIN: FxWindowId[] = [];


type TrackGroup = TrackData['group'];
type TrackColorKey = TrackData['trackColor'];

const GROUP_COLOR_DEFAULTS: Record<TrackGroup, TrackColorKey> = {
  Vocals: 'magenta',
  Harmony: 'purple',
  Adlibs: 'purple',
  Bass: 'green',
  Drums: 'blue',
  Instruments: 'cyan',
};

const GROUP_WAVEFORM_DEFAULTS: Record<TrackGroup, TrackData['waveformType']> = {
  Vocals: 'varied',
  Harmony: 'varied',
  Adlibs: 'varied',
  Bass: 'bass',
  Drums: 'dense',
  Instruments: 'varied',
};

interface ImportProfileKeyword {
  keywords: string[];
  group: TrackGroup;
  color?: TrackColorKey;
  label: string;
}

interface ImportProgressEntry {
  id: string;
  label: string;
  type: 'file' | 'stem';
  percent: number;
  color?: string;
  parentId?: string;
}

interface PersistedProjectState {
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

const IMPORT_KEYWORD_PROFILES: ImportProfileKeyword[] = [
  { keywords: ['vocal', 'vox', 'lead', 'singer'], group: 'Vocals', color: 'magenta', label: 'VOCALS' },
  { keywords: ['bgv', 'harm', 'choir', 'stack'], group: 'Harmony', color: 'purple', label: 'HARMONY' },
  { keywords: ['adlib', 'ad-lib', 'fx', 'shout'], group: 'Adlibs', color: 'purple', label: 'ADLIBS' },
  { keywords: ['drum', 'kick', 'snare', 'hat', 'percussion'], group: 'Drums', color: 'blue', label: 'DRUMS' },
  { keywords: ['bass', '808', 'sub'], group: 'Bass', color: 'green', label: 'BASS' },
  { keywords: ['gtr', 'guitar', 'keys', 'piano', 'synth', 'pad', 'string'], group: 'Instruments', color: 'cyan', label: 'INSTRUMENT' },
];

const TRAP_SCALES: TrapScale[] = [
  {
    name: "C Minor Pentatonic",
    root: 48,
    intervals: [0, 3, 5, 7, 10],
    type: "minor-pentatonic",
  },
  {
    name: "F Harmonic Minor",
    root: 53,
    intervals: [0, 2, 3, 6, 7, 10, 11],
    type: "harmonic-minor",
  },
  {
    name: "D Phrygian",
    root: 50,
    intervals: [0, 1, 3, 5, 7, 8, 10],
    type: "phrygian",
  },
];

const TRAP_PATTERNS: TrapPattern[] = [
  {
    id: "808-anchor",
    name: "808 Anchor",
    type: "808",
    pattern: [0, 4, 8, 12],
    velocity: 110,
    swing: 22,
    quantization: "1/16",
    genre: "trap",
    description: "Quarter-note 808 foundation with late swing.",
  },
  {
    id: "hihat-16",
    name: "Hi-Hat Skitter",
    type: "hihat",
    pattern: [0, 2, 4, 6, 8, 10, 12, 14],
    velocity: 84,
    swing: 28,
    quantization: "1/16",
    genre: "trap",
    description: "Sixteenth-note skitter with humanized swing.",
  },
  {
    id: "snare-off",
    name: "Snare Offbeat",
    type: "snare",
    pattern: [4, 12],
    velocity: 118,
    swing: 15,
    quantization: "1/8",
    genre: "trap",
    description: "Two-step snare emphasizing the backbeat.",
  },
];

const TRAP_GROOVES: GrooveTemplate[] = [
  {
    id: "atl-drip",
    name: "ATL Drip",
    swing: 32,
    humanize: 18,
    timingOffset: [0, 4, -2, 6, 0, 4, -3, 5],
    velocityVariation: [0, -6, 4, -2, 0, -5, 6, -3],
    genre: "trap",
  },
  {
    id: "drill-slip",
    name: "Drill Slip",
    swing: 14,
    humanize: 10,
    timingOffset: [0, -8, 6, -4, 0, -6, 5, -5],
    velocityVariation: [0, -12, 8, -10, 0, -8, 12, -6],
    genre: "drill",
  },
];

const stripFileExtension = (name: string) => name.replace(/\.[^/.]+$/, '');

const deriveTrackImportProfile = (
  fileName: string,
  existingTracks: TrackData[]
): {
  group: TrackGroup;
  color: TrackColorKey;
  trackName: string;
  waveformType: TrackData['waveformType'];
} => {
  const baseName = stripFileExtension(fileName).trim();
  const normalized = baseName.toLowerCase();

  const matchedProfile = IMPORT_KEYWORD_PROFILES.find((profile) =>
    profile.keywords.some((keyword) => normalized.includes(keyword))
  );

  const group = matchedProfile?.group ?? 'Instruments';
  const color = matchedProfile?.color ?? GROUP_COLOR_DEFAULTS[group];
  const waveformType = GROUP_WAVEFORM_DEFAULTS[group];

  const sameGroupCount = existingTracks.filter((track) => track.group === group).length;
  const label = matchedProfile?.label ?? baseName.toUpperCase();
  const suffix = sameGroupCount > 0 ? ` ${sameGroupCount + 1}` : '';
  const trackName = `${label}${suffix}`;

  return { group, color, trackName, waveformType };
};

const deriveWarpAnchorsFromNotes = (notes: MidiNote[], clipDuration: number): number[] => {
  if (!notes.length || clipDuration <= 0) {
    return [];
  }
  const threshold = 1e-3;
  const anchors = new Set<number>();
  notes.forEach((note) => {
    const start = typeof note.start === "number" ? note.start : NaN;
    if (Number.isNaN(start)) return;
    const clamped = Math.max(0, Math.min(clipDuration, start));
    if (clamped <= threshold || clamped >= clipDuration - threshold) {
      return;
    }
    anchors.add(Math.round(clamped * 1000) / 1000);
  });
  return Array.from(anchors).sort((a, b) => a - b);
};

export const TWO_TRACK_ID = 'track-two-track';
export const HUSH_TRACK_ID = 'track-hush-record';

const TWO_TRACK_TEMPLATE: TrackData = {
  id: TWO_TRACK_ID,
  trackName: 'TWO TRACK',
  trackColor: 'blue',
  waveformType: 'varied',
  group: 'Instruments',
  role: 'twoTrack',
  locked: true,
};

const HUSH_TRACK_TEMPLATE: TrackData = {
  id: HUSH_TRACK_ID,
  trackName: 'HUSH RECORD',
  trackColor: 'crimson',
  waveformType: 'varied',
  group: 'Vocals',
  role: 'hushRecord',
  locked: true,
};

const cloneTrack = (track: TrackData): TrackData => ({ ...track });

const BASE_TRACK_TEMPLATES: ReadonlyArray<TrackData> = [TWO_TRACK_TEMPLATE, HUSH_TRACK_TEMPLATE];
const buildInitialTracks = (): TrackData[] => BASE_TRACK_TEMPLATES.map(cloneTrack);
const TRACK_ROLE_TO_ID: Record<Exclude<TrackRole, 'standard'>, string> = {
  twoTrack: TWO_TRACK_ID,
  hushRecord: HUSH_TRACK_ID,
};

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

interface MixerBusDefinition {
  id: MixerBusId;
  name: string;
  shortLabel: string;
  colorKey: TrackColorKey;
  groups: TrackGroup[];
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
}

const MIXER_BUS_DEFINITIONS: MixerBusDefinition[] = [
  {
    id: 'velvet-curve',
    name: 'Velvet Curve',
    shortLabel: 'VC',
    colorKey: 'magenta',
    groups: ['Vocals', 'Harmony'],
  },
  {
    id: 'phase-weave',
    name: 'Phase Weave',
    shortLabel: 'PW',
    colorKey: 'blue',
    groups: ['Drums', 'Adlibs'],
  },
  {
    id: 'velvet-floor',
    name: 'Velvet Floor',
    shortLabel: 'VF',
    colorKey: 'green',
    groups: ['Bass', 'Drums'],
  },
  {
    id: 'harmonic-lattice',
    name: 'Harmonic Lattice',
    shortLabel: 'HL',
    colorKey: 'purple',
    groups: ['Instruments', 'Harmony'],
  },
];

const createDefaultSendLevels = (
  track: TrackData
): Record<MixerBusId, number> => {
  const levels = {} as Record<MixerBusId, number>;
  MIXER_BUS_DEFINITIONS.forEach((bus) => {
    levels[bus.id] = bus.groups.includes(track.group) ? 0.72 : 0;
  });
  return levels;
};

const createDefaultDynamicsSettings = (
  track: TrackData
): ChannelDynamicsSettings => {
  switch (track.group) {
    case 'Drums':
      return { drive: 0.68, release: 0.32, blend: 0.6 };
    case 'Bass':
      return { drive: 0.62, release: 0.48, blend: 0.52 };
    case 'Vocals':
      return { drive: 0.52, release: 0.4, blend: 0.48 };
    case 'Harmony':
    case 'Instruments':
      return { drive: 0.45, release: 0.46, blend: 0.5 };
    case 'Adlibs':
      return { drive: 0.5, release: 0.38, blend: 0.55 };
    default:
      return { drive: 0.5, release: 0.45, blend: 0.5 };
  }
};

const createDefaultEQSettings = (track: TrackData): ChannelEQSettings => {
  switch (track.group) {
    case 'Bass':
      return { low: 0.72, mid: 0.48, air: 0.38, tilt: 0.42 };
    case 'Drums':
      return { low: 0.62, mid: 0.55, air: 0.5, tilt: 0.48 };
    case 'Vocals':
      return { low: 0.42, mid: 0.54, air: 0.66, tilt: 0.6 };
    case 'Harmony':
      return { low: 0.48, mid: 0.5, air: 0.6, tilt: 0.56 };
    case 'Adlibs':
      return { low: 0.44, mid: 0.52, air: 0.62, tilt: 0.58 };
    case 'Instruments':
    default:
      return { low: 0.5, mid: 0.5, air: 0.55, tilt: 0.52 };
  }
};

const createInitialMixerSettings = (): Record<string, MixerSettings> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    const volume =
      track.role === 'twoTrack'
        ? 0.82
        : track.role === 'hushRecord'
        ? 0.78
        : 0.75;
    acc[track.id] = { volume, pan: 0, isMuted: false };
    return acc;
  }, {} as Record<string, MixerSettings>);

const createInitialTrackSendLevels = (): Record<string, Record<MixerBusId, number>> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    acc[track.id] = createDefaultSendLevels(track);
    return acc;
  }, {} as Record<string, Record<MixerBusId, number>>);

const createInitialDynamicsSettings = (): Record<string, ChannelDynamicsSettings> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    acc[track.id] = createDefaultDynamicsSettings(track);
    return acc;
  }, {} as Record<string, ChannelDynamicsSettings>);

const createInitialEQSettings = (): Record<string, ChannelEQSettings> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    acc[track.id] = createDefaultEQSettings(track);
    return acc;
  }, {} as Record<string, ChannelEQSettings>);

const createInitialInserts = (): Record<string, FxWindowId[]> =>
  BASE_TRACK_TEMPLATES.reduce((acc, track) => {
    if (track.role === 'twoTrack') {
      acc[track.id] = [...TWO_TRACK_SIGNAL_CHAIN];
    } else if (track.role === 'hushRecord') {
      acc[track.id] = [...HUSH_TRACK_SIGNAL_CHAIN];
    } else {
      acc[track.id] = [];
    }
    return acc;
  }, {} as Record<string, FxWindowId[]>);

interface TrackMeterBuffers {
  timeDomain: Float32Array;
  freqDomain: Uint8Array;
  lastPeak: number;
  smoothedLevel: number;
}

interface MasterMeterBuffers extends TrackMeterBuffers {
  waveform: Uint8Array;
}

const TRACK_ANALYSER_FFT = 2048;
const TRACK_ANALYSER_SMOOTHING = 0.64;
const MASTER_ANALYSER_SMOOTHING = 0.68;
const MIN_DECIBELS = -100;
const MAX_DECIBELS = -6;

const createTrackMeterBuffers = (analyser: AnalyserNode): TrackMeterBuffers => ({
  timeDomain: new Float32Array(analyser.fftSize),
  freqDomain: new Uint8Array(analyser.frequencyBinCount),
  lastPeak: 0,
  smoothedLevel: 0,
});

const createMasterMeterBuffers = (analyser: AnalyserNode): MasterMeterBuffers => ({
  ...createTrackMeterBuffers(analyser),
  waveform: new Uint8Array(analyser.fftSize),
});

const ensureTrackMeterBuffers = (
  store: Record<string, TrackMeterBuffers>,
  trackId: string,
  analyser: AnalyserNode
): TrackMeterBuffers => {
  const existing = store[trackId];
  if (
    !existing ||
    existing.timeDomain.length !== analyser.fftSize ||
    existing.freqDomain.length !== analyser.frequencyBinCount
  ) {
    store[trackId] = createTrackMeterBuffers(analyser);
    return store[trackId];
  }
  if (existing.freqDomain.length !== analyser.frequencyBinCount) {
    existing.freqDomain = new Uint8Array(analyser.frequencyBinCount);
  }
  return existing;
};

const ensureMasterMeterBuffers = (
  current: MasterMeterBuffers | null,
  analyser: AnalyserNode
): MasterMeterBuffers => {
  if (
    !current ||
    current.timeDomain.length !== analyser.fftSize ||
    current.freqDomain.length !== analyser.frequencyBinCount ||
    current.waveform.length !== analyser.fftSize
  ) {
    return createMasterMeterBuffers(analyser);
  }
  if (current.freqDomain.length !== analyser.frequencyBinCount) {
    current.freqDomain = new Uint8Array(analyser.frequencyBinCount);
  }
  if (current.waveform.length !== analyser.fftSize) {
    current.waveform = new Uint8Array(analyser.fftSize);
  }
  return current;
};

const computeSpectralTilt = (freqDomain: Uint8Array): number => {
  const bins = freqDomain.length;
  if (bins === 0) {
    return 0;
  }
  const split = Math.max(1, Math.floor(bins * 0.32));
  let lowSum = 0;
  let highSum = 0;
  for (let i = 0; i < split; i++) {
    lowSum += freqDomain[i];
  }
  for (let i = bins - split; i < bins; i++) {
    highSum += freqDomain[i];
  }
  const lowAvg = (lowSum / split) / 255;
  const highAvg = (highSum / split) / 255;
  const delta = highAvg - lowAvg;
  return Math.max(-1, Math.min(1, delta));
};

const measureAnalyser = (
  analyser: AnalyserNode,
  buffers: TrackMeterBuffers
): {
  rms: number;
  level: number;
  peak: number;
  crestFactor: number;
  spectralTilt: number;
  transient: boolean;
  lowBandEnergy: number;
} => {
  if (typeof analyser.getFloatTimeDomainData === 'function') {
    analyser.getFloatTimeDomainData(
      buffers.timeDomain as Float32Array<ArrayBuffer>
    );
  } else {
    const byteSamples = new Uint8Array(buffers.timeDomain.length);
    analyser.getByteTimeDomainData(byteSamples);
    for (let i = 0; i < buffers.timeDomain.length; i++) {
      buffers.timeDomain[i] = (byteSamples[i] - 128) / 128;
    }
  }
  analyser.getByteFrequencyData(
    buffers.freqDomain as Uint8Array<ArrayBuffer>
  );

  let peak = 0;
  let sumSquares = 0;
  const { timeDomain } = buffers;
  for (let i = 0; i < timeDomain.length; i++) {
    const sample = timeDomain[i];
    const absolute = Math.abs(sample);
    if (absolute > peak) {
      peak = absolute;
    }
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / timeDomain.length);
  const normalizedRms = clamp01(rms * 2.35);
  const smoothedLevel =
    buffers.smoothedLevel * 0.68 + normalizedRms * 0.32;
  buffers.smoothedLevel = smoothedLevel;

  const normalizedPeak = clamp01(peak);
  const crestFactor = normalizedPeak / Math.max(rms, 1e-5);
  const spectralTilt = computeSpectralTilt(buffers.freqDomain);
  const transient =
    normalizedPeak > buffers.lastPeak * 1.12 &&
    normalizedPeak - smoothedLevel > 0.12;

  const lowBandBins = Math.max(4, Math.floor(buffers.freqDomain.length * 0.12));
  let lowBandSum = 0;
  for (let i = 0; i < lowBandBins; i += 1) {
    lowBandSum += buffers.freqDomain[i];
  }
  const lowBandEnergy = clamp01((lowBandSum / lowBandBins) / 255);

  buffers.lastPeak = normalizedPeak * 0.6 + buffers.lastPeak * 0.4;

  return {
    rms: normalizedRms,
    level: smoothedLevel,
    peak: normalizedPeak,
    crestFactor,
    spectralTilt,
    transient,
    lowBandEnergy,
  };
};

interface FlowRuntimeProps {
  arrangeFocusToken: number;
}

const FlowRuntime: React.FC<FlowRuntimeProps> = ({ arrangeFocusToken }) => {
  // --- STATE MANAGEMENT ---
  const [tracks, setTracks] = useState<TrackData[]>(() => buildInitialTracks());
  const stemIntegrationRef = useRef<StemSeparationIntegration | null>(null);
  const tracksRef = useRef<TrackData[]>(tracks);
  const clipsRef = useRef<ArrangeClip[]>([]);
  const [isStemModalOpen, setIsStemModalOpen] = useState(false);
  const [pendingStemRequest, setPendingStemRequest] = useState<PendingStemRequest | null>(null);
  const [lastStemSelection, setLastStemSelection] = useState<string[]>([...DEFAULT_STEM_SELECTION]);
  const [audioBuffers, setAudioBuffers] = useState<Record<string, AudioBuffer>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [bpm, setBpm] = useState(120);
  const audioContextRef = useRef<AudioContext | null>(null);
  const trackNodesRef = useRef<{ [key: string]: AudioNodes }>({});
  
  // Master Ready Gate - prevents routing until master chain is fully initialized
  // MUST be declared before any useEffect that uses it
  const [masterReady, setMasterReady] = useState(false);
  const queuedRoutesRef = useRef<Array<{ trackId: string; outputNode: AudioNode }>>([]);
  const signalMatrixRef = useRef<ReturnType<typeof createSignalMatrix> | null>(null);
  
  // Initialize Thermal Sync (Part A) - Global thermal color filters
  useEffect(() => {
    const cleanup = initThermalSync(100); // Update every 100ms
    return cleanup;
  }, []);
  
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);
  
  // Flush queued routes the moment master becomes ready
  useEffect(() => {
    if (masterReady && queuedRoutesRef.current.length > 0 && masterNodesRef.current) {
      console.log('[MIXER] Flushing queued routes:', queuedRoutesRef.current.length);
      const matrix = signalMatrixRef.current;
      if (matrix) {
        queuedRoutesRef.current.forEach(({ trackId, outputNode }) => {
          try {
            const bus = matrix.routeTrack(trackId, tracksRef.current.find(t => t.id === trackId)?.role as any);
            outputNode.connect(bus);
            console.log('[MIXER] Route flushed for:', trackId);
          } catch (err) {
            console.error('[MIXER] Failed to flush route:', trackId, err);
          }
        });
        queuedRoutesRef.current = [];
      } else {
        console.error('[MIXER] Cannot flush routes - signal matrix not available');
      }
    }
  }, [masterReady]);

  useEffect(() => {
    setTrackSendLevels((prev) => {
      let changed = false;
      const next: Record<string, Record<MixerBusId, number>> = {};
      tracks.forEach((track) => {
        if (prev[track.id]) {
          next[track.id] = prev[track.id];
        } else {
          next[track.id] = createDefaultSendLevels(track);
          changed = true;
        }
      });
      if (Object.keys(prev).length !== tracks.length) {
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [tracks]);

  useEffect(() => {
    setChannelDynamicsSettings((prev) => {
      let changed = false;
      const next: Record<string, ChannelDynamicsSettings> = {};
      tracks.forEach((track) => {
        if (prev[track.id]) {
          next[track.id] = prev[track.id];
        } else {
          next[track.id] = createDefaultDynamicsSettings(track);
          changed = true;
        }
      });
      if (Object.keys(prev).length !== tracks.length) {
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [tracks]);

  useEffect(() => {
    setChannelEQSettings((prev) => {
      let changed = false;
      const next: Record<string, ChannelEQSettings> = {};
      tracks.forEach((track) => {
        if (prev[track.id]) {
          next[track.id] = prev[track.id];
        } else {
          next[track.id] = createDefaultEQSettings(track);
          changed = true;
        }
      });
      if (Object.keys(prev).length !== tracks.length) {
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [tracks]);

  const fxNodesRef = useRef<{[key: string]: FxNode}>({}); // This will manage instances of ALL plugins
  const masterNodesRef = useRef<MasterNodes | null>(null);
  const translationMatrixRef = useRef<TranslationMatrix | null>(null);
  const velvetLoudnessMeterRef = useRef<VelvetLoudnessMeter | null>(null);
  const loudnessListenerRef = useRef<((event: Event) => void) | null>(null);
  const translationProfileRef = useRef<TranslationProfileKey>('flat');
  const animationFrameRef = useRef<number | null>(null);
  const activeSourcesRef = useRef<{ source: AudioBufferSourceNode, gain: GainNode }[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const trackMeterBuffersRef = useRef<Record<string, TrackMeterBuffers>>({});
  const masterMeterBufferRef = useRef<MasterMeterBuffers | null>(null);
  
  const [isAddTrackModalOpen, setIsAddTrackModalModalOpen] = useState(false);
  const [mixerSettings, setMixerSettings] = useState<{ [key: string]: MixerSettings }>(() => createInitialMixerSettings());
  const [soloedTracks, setSoloedTracks] = useState(new Set<string>());
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [masterBalance, setMasterBalance] = useState(0);
  const [translationProfile, setTranslationProfile] = useState<TranslationProfileKey>('flat');
  const [recordingOptions, setRecordingOptions] = useState(() => ({ ...INITIAL_RECORDING_OPTIONS }));
  const [trackAnalysis, setTrackAnalysis] = useState<{ [key: string]: TrackAnalysisData }>({});
  const [waveformHeaderSettings, setWaveformHeaderSettings] = useState<WaveformHeaderSettings>(() => ({ ...DEFAULT_WAVEFORM_HEADER_SETTINGS }));
  const [isWaveformSettingsOpen, setIsWaveformSettingsOpen] = useState(false);
  const [masterAnalysis, setMasterAnalysis] = useState({ level: 0, transient: false, waveform: new Uint8Array(128) });
  const [loudnessMetrics, setLoudnessMetrics] = useState(DEFAULT_VELVET_LOUDNESS_METRICS);
  const masterLevelAvg = useRef(0.01);
  const [analysisResult, setAnalysisResult] = useState<FourAnchors | null>(null);
  const [trackSendLevels, setTrackSendLevels] = useState<Record<string, Record<MixerBusId, number>>>(() => createInitialTrackSendLevels());
  const [channelDynamicsSettings, setChannelDynamicsSettings] = useState<Record<string, ChannelDynamicsSettings>>(() => createInitialDynamicsSettings());
  const [channelEQSettings, setChannelEQSettings] = useState<Record<string, ChannelEQSettings>>(() => createInitialEQSettings());
  const [selectedBusId, setSelectedBusId] = useState<MixerBusId | null>(null);
  const [armedTracks, setArmedTracks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [fileInputContext, setFileInputContext] = useState<'import' | 'load' | 'reingest'>('import');
  const [importProgress, setImportProgress] = useState<ImportProgressEntry[]>([]);
  const [mixerActionPulse, setMixerActionPulse] = useState<{
    trackId: string;
    pulse: ALSActionPulse;
    message: string;
  } | null>(null);
  const activeStemJobRef = useRef<string | null>(null);
  const ingestQueueRef = useRef<IngestQueueManager | null>(null);
  const pendingQueueHydrationRef = useRef<PersistedIngestSnapshot | null>(null);
  const processImportJobRef = useRef<
    ((job: IngestRuntimeJob, controls: IngestJobControls) => Promise<void | IngestJobOutcome>) | null
  >(null);
  const [ingestSnapshot, setIngestSnapshot] = useState<IngestJobSnapshot>({
    jobs: [],
    activeJobId: null,
    lastUpdated: Date.now(),
  });
  useEffect(() => {
    publishIngestSignal({
      source: "ingest-queue",
      snapshot: ingestSnapshot,
    });
  }, [ingestSnapshot]);
  const [ingestHistoryEntries, setIngestHistoryEntries] = useState<IngestHistoryEntry[]>([]);
  const [recallHighlightClipIds, setRecallHighlightClipIds] = useState<ClipId[]>([]);
  const recallHighlightTimeoutRef = useRef<number | null>(null);
  const [pendingReingest, setPendingReingest] = useState<{ clipId: ClipId } | null>(null);
  const [primeBrainTick, setPrimeBrainTick] = useState(0);
  const primeBrainSessionIdRef = useRef<string>('');
  const primeBrainBloomTraceRef = useRef<PrimeBrainBloomEvent[]>([]);
  const primeBrainRecentActionsRef = useRef<Array<{ action: string; timestamp: string }>>([]);
  const primeBrainCommandLogRef = useRef<PrimeBrainCommandLog[]>([]);
  const primeBrainGuidanceRef = useRef<PrimeBrainGuidance>({});

  // Define bumpPrimeBrainTick early so it can be used in useEffect hooks
  const bumpPrimeBrainTick = useCallback(() => {
    setPrimeBrainTick((prev) => prev + 1);
  }, []);

  // Subscribe to Prime Brain events to feed into userMemory
  useEffect(() => {
    const unsubscribe = subscribeToPrimeBrainEvents((event: PrimeBrainEvent) => {
      // Convert event to userMemory action format
      const actionLabel = `${event.type}${event.outcome ? ` • ${event.outcome}` : ''}`;
      const entry = { action: actionLabel, timestamp: event.timestamp };
      primeBrainRecentActionsRef.current = [
        entry,
        ...primeBrainRecentActionsRef.current.slice(0, 9), // Keep last 10
      ];
      bumpPrimeBrainTick();
    });
    return unsubscribe;
  }, [bumpPrimeBrainTick]);
  const primeBrainAudioMetricsRef = useRef<{
    latencyMs?: number;
    cpuLoad: number;
    dropoutsPerMinute: number;
    bufferSize?: number;
    sampleRate?: number;
    startedAt: number;
    dropoutCount: number;
  }>({
    latencyMs: undefined,
    cpuLoad: 0,
    dropoutsPerMinute: 0,
    bufferSize: undefined,
    sampleRate: undefined,
    startedAt: Date.now(),
    dropoutCount: 0,
  });
  const [primeBrainTelemetryEnabled, setPrimeBrainTelemetryEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const stored = window.localStorage.getItem(PRIME_BRAIN_TELEMETRY_STORAGE_KEY);
    return stored !== 'disabled';
  });
  const [primeBrainExportUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.localStorage.getItem(PRIME_BRAIN_EXPORT_URL_STORAGE_KEY) ??
        // @ts-expect-error optional runtime hook
        (window.__MIXX_PRIME_BRAIN_EXPORT_URL ?? null)
      );
    }
    if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
      return (
        (process.env.PRIME_BRAIN_EXPORT_URL as string | undefined) ??
        (process.env.NEXT_PUBLIC_PRIME_BRAIN_EXPORT_URL as string | undefined) ??
        (process.env.REACT_APP_PRIME_BRAIN_EXPORT_URL as string | undefined) ??
        null
      );
    }
    return null;
  });
  const flowContext = useFlowContext();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      PRIME_BRAIN_TELEMETRY_STORAGE_KEY,
      primeBrainTelemetryEnabled ? 'enabled' : 'disabled',
    );
  }, [primeBrainTelemetryEnabled]);

  const [musicalContext, setMusicalContext] = useState<MusicalContext>({ genre: 'Streaming', mood: 'Balanced' });
  const [isHushActive, setIsHushActive] = useState(false);
  const [hushFeedback, setHushFeedback] = useState({ color: '#1a1030', intensity: 0.0, isEngaged: false, noiseCount: 0 });
  const [headerHeight, setHeaderHeight] = useState(() =>
    typeof window !== "undefined" ? Math.min(180, window.innerHeight * 0.2) : 140
  );
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 900
  );
  const hushSystem = useMemo(() => getHushSystem(), []);
  const hushProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const skipAudioSetupWarmupRef = useRef<boolean>(import.meta.env.DEV);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!mixerActionPulse || typeof window === 'undefined') return;
    const timeout = window.setTimeout(
      () => setMixerActionPulse(null),
      mixerActionPulse.pulse.decayMs
    );
    return () => window.clearTimeout(timeout);
  }, [mixerActionPulse]);
  if (!primeBrainSessionIdRef.current && typeof window !== 'undefined') {
    const storedSession =
      window.sessionStorage.getItem('mixxclub:primebrain-session') ??
      window.localStorage.getItem('mixxclub:primebrain-session');
    if (storedSession) {
      primeBrainSessionIdRef.current = storedSession;
    } else {
      const generated =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `primebrain-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      primeBrainSessionIdRef.current = generated;
      try {
        window.sessionStorage.setItem('mixxclub:primebrain-session', generated);
      } catch {
        // ignore storage errors
      }
      try {
        window.localStorage.setItem('mixxclub:primebrain-session', generated);
      } catch {
        // ignore storage errors
      }
    }
  }

  useEffect(() => {
    return () => {
      const meter = velvetLoudnessMeterRef.current;
      const listener = loudnessListenerRef.current;
      if (meter && listener) {
        meter.removeEventListener('metrics', listener as EventListener);
      }
    };
  }, []);

  useEffect(() => {
    translationProfileRef.current = translationProfile;
    const matrix = translationMatrixRef.current;
    if (matrix) {
      matrix.activate(translationProfile);
    }
  }, [translationProfile]);

  const handleToggleRecordingOption = useCallback((option: RecordingOptionKey) => {
    setRecordingOptions((prev) => {
      const nextState = { ...prev, [option]: !prev[option] };
      publishAlsSignal({
        source: 'recording-option',
        option,
        active: nextState[option],
      });
      return nextState;
    });
  }, [publishAlsSignal]);

  const handleDropTakeMarker = useCallback(() => {
    const timestamp = new Date().toISOString();
    const report = evaluateCapture(loudnessMetrics, masterAnalysis.waveform);
    const summary = `Take marker • Δ${(report.integratedLUFS - (masterNodesRef.current?.getProfile()?.targetLUFS ?? -14)).toFixed(1)} LUFS • Crest ${report.crestFactor.toFixed(1)} dB`;
    appendHistoryNote({
      id: `take-marker-${timestamp}`,
      timestamp: Date.now(),
      scope: 'recording',
      message: `${summary} • ${report.notes[0] ?? 'Monitor engaged.'}`,
      accent: '#f97316',
    });
    publishAlsSignal({
      source: 'recording',
      marker: { timestamp, report },
    });
  }, [appendHistoryNote, loudnessMetrics, masterAnalysis.waveform, publishAlsSignal]);

  const logPrimeBrainAction = useCallback(
    (label: string) => {
      const entry = { action: label, timestamp: new Date().toISOString() };
      primeBrainRecentActionsRef.current = [
        entry,
        ...primeBrainRecentActionsRef.current.slice(0, 9),
      ];
      bumpPrimeBrainTick();
    },
    [bumpPrimeBrainTick],
  );

  const logPrimeBrainBloomEvent = useCallback(
    (intent: string, name: string, outcome: 'accepted' | 'dismissed' | 'ignored' = 'accepted') => {
      const event: PrimeBrainBloomEvent = {
        actionId:
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `pbloom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name,
        intent,
        confidence: 0.6,
        outcome,
        triggeredAt: new Date().toISOString(),
      };
      primeBrainBloomTraceRef.current = [
        ...primeBrainBloomTraceRef.current.slice(-23),
        event,
      ];
      bumpPrimeBrainTick();
    },
    [bumpPrimeBrainTick],
  );

  const logPrimeBrainCommand = useCallback(
    (commandType: string, payload: Record<string, unknown>, accepted = true) => {
      const command: PrimeBrainCommandLog = {
        id:
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `pcmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        commandType,
        payload,
        issuedAt: new Date().toISOString(),
        accepted,
      };
      primeBrainCommandLogRef.current = [
        ...primeBrainCommandLogRef.current.slice(-19),
        command,
      ];
      primeBrainGuidanceRef.current = {
        ...primeBrainGuidanceRef.current,
        lastCommand: command,
      };
      bumpPrimeBrainTick();
    },
    [bumpPrimeBrainTick],
  );

  const captureReport = useMemo(
    () => evaluateCapture(loudnessMetrics, masterAnalysis.waveform),
    [loudnessMetrics, masterAnalysis.waveform],
  );

  const handleTogglePrimeBrainTelemetry = useCallback(() => {
    setPrimeBrainTelemetryEnabled((prev) => {
      const next = !prev;
      logPrimeBrainAction(next ? 'Prime Brain telemetry armed' : 'Prime Brain telemetry muted');
      publishBloomSignal({
        source: 'prime-brain',
        action: next ? 'primeBrain.telemetry.enable' : 'primeBrain.telemetry.disable',
      });
      return next;
    });
  }, [logPrimeBrainAction, publishBloomSignal]);

  const primeBrainSnapshotInputs = useMemo<PrimeBrainSnapshotInputs | null>(() => {
    try {
      const sessionId = primeBrainSessionIdRef.current;
      if (!sessionId) {
        return null;
      }

    const captureTimestamp = new Date().toISOString();
    const bloomTrace = [...primeBrainBloomTraceRef.current];
    const issuedCommands = [...primeBrainCommandLogRef.current];
    const guidance = { ...primeBrainGuidanceRef.current };
    const recentActions = [...primeBrainRecentActionsRef.current];
    const audioMetricsState = primeBrainAudioMetricsRef.current;

    // Get Session Probe context for richer snapshot data
    const sessionProbeState = getSessionProbeSnapshot();
    const sessionProbeContext = sessionProbeState?.context ?? null;

    // Enhanced ALS channel calculation with Flow Context integration
    // Contextual check: Only compute if there's actual audio
    const hasAudio = masterAnalysis.level > 0.001;
    const alsTemperature = hasAudio ? clamp01(masterAnalysis.level) : 0;
    let momentum = hasAudio 
      ? Math.max(flowContext.momentum, isPlaying ? 0.45 + masterAnalysis.level * 0.4 : 0.18)
      : 0; // No audio = zero momentum
    if (mixerActionPulse) {
      momentum = Math.min(
        1,
        Math.max(momentum, flowContext.momentum + mixerActionPulse.pulse.intensity * 0.3)
      );
    }
    const pressureBase =
      (masterAnalysis.transient ? 0.55 + masterAnalysis.level * 0.4 : masterAnalysis.level * 0.6) +
      flowContext.momentumTrend * 0.35;
    const pressure = clamp01(importMessage ? Math.max(pressureBase, 0.65) : pressureBase);
    // Contextual harmony: Only compute if there's actual audio
    const harmony = hasAudio && analysisResult
      ? clamp01((analysisResult.soul / 100) * 0.6 + (analysisResult.silk / 100) * 0.4)
      : 0; // No audio = zero harmony
    const harmonyWithFlow = hasAudio
      ? clamp01(
          harmony +
            (flowContext.intensity === 'immersed'
              ? 0.08
              : flowContext.intensity === 'charged'
              ? 0.04
              : 0)
        )
      : 0; // No audio = zero harmony

    // Incorporate Flow Context activity level into momentum calculation
    // But only if there's actual audio
    if (hasAudio) {
      if (flowContext.sessionContext?.activityLevel === 'intense') {
        momentum = Math.min(1, momentum + 0.15);
      } else if (flowContext.sessionContext?.activityLevel === 'active') {
        momentum = Math.min(1, momentum + 0.08);
      }
    }

    const alsChannels: PrimeBrainSnapshotInputs['alsChannels'] = [
      { channel: 'temperature', value: alsTemperature },
      { channel: 'momentum', value: momentum },
      { channel: 'pressure', value: pressure },
      { channel: 'harmony', value: harmonyWithFlow },
    ];

    const aiAnalysisFlags: PrimeBrainAIFlag[] = captureReport.notes.map((note) => {
      const severity: PrimeBrainAIFlag['severity'] = note.includes('⚠️')
        ? note.toLowerCase().includes('clipping') || note.toLowerCase().includes('critical')
          ? 'critical'
          : 'warn'
        : 'info';
      const message = note.replace(/^[⚠️✅]\s*/, '');
      return {
        category: 'capture',
        severity,
        message,
      };
    });

    if (importMessage) {
      aiAnalysisFlags.push({
        category: 'ingest',
        severity: 'info',
        message: importMessage,
      });
    }

    if (isHushActive && hushFeedback.isEngaged) {
      aiAnalysisFlags.push({
        category: 'hush',
        severity: 'info',
        message: 'Hush guard absorbing noise.',
      });
    }

    // Add Flow Context-derived flags
    if (flowContext.sessionContext?.activityLevel === 'intense' && !isPlaying) {
      aiAnalysisFlags.push({
        category: 'flow',
        severity: 'info',
        message: 'High activity detected.',
      });
    }

    const audioMetrics: PrimeBrainSnapshotInputs['audioMetrics'] = {
      latencyMs: audioMetricsState.latencyMs,
      cpuLoad: audioMetricsState.cpuLoad,
      dropoutsPerMinute: audioMetricsState.dropoutsPerMinute,
      bufferSize: audioMetricsState.bufferSize,
      sampleRate: audioMetricsState.sampleRate,
    };

    const harmonicState: PrimeBrainSnapshotInputs['harmonicState'] = {
      key: musicalContext.genre.toLowerCase(),
      scale: musicalContext.mood.toLowerCase(),
      consonance: analysisResult
        ? clamp01((analysisResult.silk + analysisResult.soul) / 200)
        : 0.42,
      tension: analysisResult
        ? clamp01((analysisResult.body + analysisResult.air) / 200)
        : 0.33,
      velocityEnergy: analysisResult ? clamp01(analysisResult.air / 100) : undefined,
    };

    const bloomActiveWindowMs = 16000;
    const now = Date.now();
    const activeBloomActions = bloomTrace.reduce((count, event) => {
      const eventTime = Date.parse(event.triggeredAt);
      if (Number.isFinite(eventTime) && now - eventTime < bloomActiveWindowMs) {
        return count + 1;
      }
      return count;
    }, 0);

    // Enhanced mode hints with Flow Context activity level
    const modeHints: PrimeBrainModeHints = {
      isPlaying,
      armedTrackCount: armedTracks.size,
      activeBloomActions,
      cpuLoad: audioMetrics.cpuLoad,
      dropoutsPerMinute: audioMetrics.dropoutsPerMinute,
    };

    // Mode derivation considers Flow Context activity
    let mode: PrimeBrainMode = 'passive';
    if (aiAnalysisFlags.some((flag) => flag.severity === 'critical')) {
      mode = 'optimizing';
    } else if (modeHints.armedTrackCount > 0) {
      mode = 'learning';
    } else if (modeHints.isPlaying || modeHints.activeBloomActions > 0 || Boolean(importMessage)) {
      mode = 'active';
    } else if (flowContext.sessionContext?.activityLevel === 'intense') {
      mode = 'active';
    }

    // Enhanced user memory with Session Probe context
    const userMemory: PrimeBrainSnapshotInputs['userMemory'] = {
      recentActions,
      recallAnchors: recallHighlightClipIds.map((id) => `clip:${id}`),
    };

    // Add Session Probe context to user memory if available
    if (sessionProbeContext) {
      const clipCount = sessionProbeContext.selectedClips.length;
      if (clipCount > 0) {
        userMemory.recentActions.unshift({
          action: `Selected ${clipCount} clip${clipCount > 1 ? 's' : ''}`,
          timestamp: new Date(sessionProbeContext.timestamp).toISOString(),
        });
        // Keep only last 10 actions
        userMemory.recentActions = userMemory.recentActions.slice(0, 10);
      }
    }

    const transport: PrimeBrainSnapshotInputs['transport'] = {
      isPlaying,
      playheadSeconds: currentTime,
      tempo: bpm,
      isLooping,
      cycle: isLooping ? { startSeconds: 0, endSeconds: currentTime } : null,
    };

    const conversationTurns: PrimeBrainConversationTurn[] = [];

    const snapshot = {
      sessionId,
      captureTimestamp,
      transport,
      alsChannels,
      audioMetrics,
      harmonicState,
      aiAnalysisFlags,
      bloomTrace,
      userMemory,
      issuedCommands,
      conversationTurns,
      mode,
      modeHints,
      guidance,
    };

    // Dev-only snapshot logging for validation
    if (import.meta.env.DEV && primeBrainTick % 10 === 0) {
      console.debug('[PrimeBrain] Snapshot preview:', {
        mode: snapshot.mode,
        alsChannels: snapshot.alsChannels.map((c) => `${c.channel}:${c.value.toFixed(2)}`),
        activityLevel: flowContext.sessionContext?.activityLevel,
        adaptiveSuggestions: flowContext.adaptiveSuggestions,
        sessionContext: sessionProbeContext ? {
          viewMode: sessionProbeContext.viewMode,
          isPlaying: sessionProbeContext.isPlaying,
          clipCount: sessionProbeContext.selectedClips.length,
        } : null,
      });
    }

      return snapshot;
    } catch (error) {
      // Ensure Prime Brain failures never block core DAW operation
      console.warn('[PrimeBrain] Snapshot build failed, using fallback', error);
      return null;
    }
  }, [
    primeBrainTick,
    masterAnalysis.level,
    masterAnalysis.transient,
    isPlaying,
    mixerActionPulse,
    importMessage,
    analysisResult,
    captureReport,
    armedTracks,
    recallHighlightClipIds,
    currentTime,
    bpm,
    isLooping,
    musicalContext,
    hushFeedback,
    isHushActive,
    flowContext.intensity,
    flowContext.momentum,
    flowContext.momentumTrend,
    flowContext.sessionContext,
    flowContext.adaptiveSuggestions,
  ]);

  const primeBrainStatus = useMemo<PrimeBrainStatus>(() => {
    try {
      const velvet = deriveVelvetLensState(analysisResult);
      if (!primeBrainSnapshotInputs) {
      const health = derivePrimeBrainHealth(
        {} as PrimeBrainSnapshotInputs['audioMetrics'],
        [],
      );
      const alsChannels = (['temperature', 'momentum', 'pressure', 'harmony'] as PrimeBrainALSChannel[]).map(
        (channel) => describeAlsChannel(channel, 0),
      );
      return {
        mode: 'passive',
        modeCaption: MODE_CAPTIONS.passive,
        health,
        alsChannels,
        velvet,
        aiFlags: [],
        userMemoryAnchors: [],
      };
    }

    const mode = derivePrimeBrainMode(primeBrainSnapshotInputs);
    const health = derivePrimeBrainHealth(
      primeBrainSnapshotInputs.audioMetrics,
      primeBrainSnapshotInputs.aiAnalysisFlags,
    );
    const alsChannels = primeBrainSnapshotInputs.alsChannels.map((entry) =>
      describeAlsChannel(entry.channel, entry.value),
    );
    const bloomTrace = primeBrainSnapshotInputs.bloomTrace;
    const lastBloom = bloomTrace.length ? bloomTrace[bloomTrace.length - 1] : null;
    const lastAction = primeBrainSnapshotInputs.userMemory.recentActions[0]?.action;
    // Enhanced guidance line with Flow Context suggestions
    let guidanceLine =
      primeBrainSnapshotInputs.guidance?.lastSuggestion ??
      primeBrainSnapshotInputs.guidance?.lastCommand?.commandType?.replace(/([A-Z])/g, ' $1')?.trim();
    
    // Incorporate Flow Context adaptive suggestions into guidance
    if (!guidanceLine && flowContext.adaptiveSuggestions.suggestViewSwitch) {
      guidanceLine = `Consider switching to ${flowContext.adaptiveSuggestions.suggestViewSwitch} view.`;
    }
    
    // Add activity-based guidance hints
    if (!guidanceLine && flowContext.sessionContext?.activityLevel === 'intense') {
      guidanceLine = 'High activity detected. Flow is intense.';
    } else if (!guidanceLine && flowContext.sessionContext?.activityLevel === 'active') {
      guidanceLine = 'Flow is active.';
    }
    
    // Fallback to default if still empty
    if (!guidanceLine) {
      guidanceLine = 'Flow is standing by.';
    }
    
    const bloomSummary = lastBloom
      ? `${lastBloom.intent} • ${
          lastBloom.outcome === 'accepted' ? 'Bloom honored' : 'Bloom deferred'
        }`
      : undefined;

    return {
      mode,
      modeCaption: MODE_CAPTIONS[mode],
      health,
      alsChannels,
      velvet,
      lastAction,
      lastBloom,
      bloomSummary,
      guidanceLine,
      userMemoryAnchors: primeBrainSnapshotInputs.userMemory.recallAnchors,
      aiFlags: primeBrainSnapshotInputs.aiAnalysisFlags,
    };
    } catch (error) {
      // Ensure Prime Brain failures never block core DAW operation
      console.warn('[PrimeBrain] Status derivation failed, using fallback', error);
      const health = derivePrimeBrainHealth(
        {} as PrimeBrainSnapshotInputs['audioMetrics'],
        [],
      );
      const alsChannels = (['temperature', 'momentum', 'pressure', 'harmony'] as PrimeBrainALSChannel[]).map(
        (channel) => describeAlsChannel(channel, 0),
      );
      return {
        mode: 'passive',
        modeCaption: MODE_CAPTIONS.passive,
        health,
        alsChannels,
        velvet: deriveVelvetLensState(analysisResult),
        aiFlags: [],
        userMemoryAnchors: [],
        guidanceLine: 'Flow is standing by.',
      };
    }
  }, [analysisResult, primeBrainSnapshotInputs, flowContext.adaptiveSuggestions, flowContext.sessionContext]);

  usePrimeBrainExporter({
    enabled: primeBrainTelemetryEnabled && Boolean(primeBrainExportUrl),
    exportUrl: primeBrainExportUrl,
    snapshotInputs: primeBrainSnapshotInputs,
    intervalMs: 4000,
    debug: import.meta.env.DEV && import.meta.env.VITE_PRIME_BRAIN_EXPORT_DEBUG === '1',
  });

  // Stem Separation Export URL
  const [stemSeparationExportUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.localStorage.getItem(STEM_SEPARATION_EXPORT_URL_STORAGE_KEY) ??
        // @ts-expect-error optional runtime hook
        (window.__MIXX_STEM_SEPARATION_EXPORT_URL ?? null) ??
        (import.meta.env?.VITE_STEM_SEPARATION_EXPORT_URL as string | undefined) ??
        null
      );
    }
    return null;
  });

  const [stemSeparationTelemetryEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const stored = window.localStorage.getItem('mixxclub:stem-separation-telemetry-enabled');
    return stored !== 'disabled' && Boolean(stemSeparationExportUrl);
  });

  // Stem Separation Exporter - initialized for snapshot export callback
  const { exportSnapshot: exportStemSeparationSnapshot } = useStemSeparationExporter({
    enabled: stemSeparationTelemetryEnabled && Boolean(stemSeparationExportUrl),
    exportUrl: stemSeparationExportUrl,
    debug: import.meta.env.DEV && import.meta.env.VITE_STEM_SEPARATION_EXPORT_DEBUG === '1',
  });

  // Expose exporter to window for pipeline callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__mixx_stem_separation_exporter = {
        exportSnapshot: exportStemSeparationSnapshot,
        enabled: stemSeparationTelemetryEnabled && Boolean(stemSeparationExportUrl),
      };
    }
  }, [exportStemSeparationSnapshot, stemSeparationTelemetryEnabled, stemSeparationExportUrl]);

  const normalizeCommandPayload = useCallback((value: unknown): Record<string, unknown> => {
    if (value === null || value === undefined) return {};
    if (Array.isArray(value)) {
      return { items: value };
    }
    if (typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return { value };
  }, []);
  const availableSendPalette = useMemo(
    () =>
      // Filter out core processors from send palette (engine-level only)
      MIXER_BUS_DEFINITIONS
        .filter(bus => !CORE_PROCESSOR_IDS.includes(bus.id))
        .map((bus) => {
          const swatch = TRACK_COLOR_SWATCH[bus.colorKey];
          return {
            id: bus.id,
            name: bus.name,
            shortLabel: bus.shortLabel,
            color: swatch.base,
            glow: swatch.glow,
          };
        }),
    []
  );

  const busStrips = useMemo<MixerBusStripData[]>(() => {
    // Filter out core processors from bus strips display (engine-level only)
    return MIXER_BUS_DEFINITIONS
      .filter(bus => !CORE_PROCESSOR_IDS.includes(bus.id))
      .map((bus) => {
      let summedIntensity = 0;
      let summedPulse = 0;
      let totalWeight = 0;
      const members: string[] = [];

      tracks.forEach((track) => {
        const sendAmount = trackSendLevels[track.id]?.[bus.id] ?? 0;
        if (sendAmount > 0.01) {
          members.push(track.trackName);
          totalWeight += sendAmount;
          const analysis = trackAnalysis[track.id];
          const settings = mixerSettings[track.id];
          const feedback = deriveTrackALSFeedback({
            level: analysis?.level ?? 0,
            transient: analysis?.transient ?? false,
            volume: settings?.volume ?? 0.75,
            color: track.trackColor,
          });
          summedIntensity += feedback.intensity * sendAmount;
          summedPulse += feedback.pulse * sendAmount;
        }
      });

      const intensity = totalWeight > 0 ? summedIntensity / totalWeight : 0;
      const pulse = totalWeight > 0 ? summedPulse / totalWeight : 0;
      const swatch = TRACK_COLOR_SWATCH[bus.colorKey];
      const colors = deriveBusALSColors(swatch.base, swatch.glow, intensity);

      return {
        id: bus.id,
        name: bus.name,
        members,
        alsIntensity: intensity,
        alsPulse: pulse,
        alsColor: colors.base,
        alsGlow: colors.glow,
        alsHaloColor: colors.halo,
        alsGlowStrength: clamp01(intensity * 0.85 + pulse * 0.4),
      };
    });
  }, [tracks, trackSendLevels, trackAnalysis, mixerSettings]);
  
  const upsertImportProgress = useCallback((entry: ImportProgressEntry) => {
    setImportProgress((prev) => {
      const index = prev.findIndex((existing) => existing.id === entry.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...entry };
        return updated;
      }
      return [...prev, entry];
    });
  }, [appendHistoryNote]);

  const removeImportProgressByPrefix = useCallback((prefix: string) => {
    setImportProgress((prev) => prev.filter((entry) => !entry.id.startsWith(prefix)));
  }, []);

  const removeImportProgressById = useCallback((id: string) => {
    setImportProgress((prev) => prev.filter((entry) => entry.id !== id));
  }, []);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; trackId: string } | null>(null);
  const [renameModal, setRenameModal] = useState<string | null>(null);
  const [changeColorModal, setChangeColorModal] = useState<string | null>(null);
  const contextMenuTrack = useMemo(
    () => (contextMenu ? tracks.find((track) => track.id === contextMenu.trackId) ?? null : null),
    [contextMenu, tracks]
  );


  const [viewMode, setViewMode] = useState<'arrange' | 'sampler' | 'mixer' | 'piano'>('arrange');
  // Wide Glass Console positioning
  const [consolePosition, setConsolePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (arrangeFocusToken > 0) {
      setViewMode('arrange');
    }
  }, [arrangeFocusToken]);

  // Center console when mix view is activated
  useEffect(() => {
    if (viewMode === 'mix' && typeof window !== 'undefined') {
      // Center console: (viewport width - console width) / 2, (viewport height - console height) / 2
      const consoleWidth = window.innerWidth * 0.88; // 88vw
      const consoleHeight = window.innerHeight * 0.52; // 52vh
      const x = (window.innerWidth - consoleWidth) / 2;
      const y = (window.innerHeight - consoleHeight) / 2;
      setConsolePosition({ x, y });
    }
  }, [viewMode]);
  
  // Wrap setViewMode to record Prime Brain events
  const handleViewModeChange = useCallback((mode: 'arrange' | 'sampler' | 'mixer' | 'piano') => {
    setViewMode(mode);
    recordViewSwitch(mode);
    recordPrimeBrainEvent('view-switch', { viewMode: mode }, 'success');
  }, []);
  const [activePrimeBrainClipId, setActivePrimeBrainClipId] = useState<ClipId | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [trackUiState, setTrackUiState] = useState<Record<string, TrackUIState>>({});
  const pianoRollBinding = usePianoRoll({
    bpm,
    beatsPerBar: 4,
    patterns: TRAP_PATTERNS,
    scales: TRAP_SCALES,
    grooveTemplates: TRAP_GROOVES,
  });
  const pianoRollState = pianoRollBinding.state;
  const setPianoRollState = pianoRollBinding.setState;
  const loadPianoNotes = pianoRollBinding.loadNotes;
  const exportPianoNotes = pianoRollBinding.exportNotes;
  const [pianoRollStore, setPianoRollStore] = useState<Record<string, MidiNote[]>>({});
  const [isPianoRollOpen, setIsPianoRollOpen] = useState(false);
  const [pianoRollClipId, setPianoRollClipId] = useState<ClipId | null>(null);
  const [pianoRollTrackId, setPianoRollTrackId] = useState<string | null>(null);
  const [activeCapsuleTrackId, setActiveCapsuleTrackId] = useState<string | null>(null);
  const [followPlayhead, setFollowPlayhead] = useState(true);

  useEffect(() => {
    setTrackUiState((prev) => {
      let changed = false;
      const next: Record<string, TrackUIState> = {};
      tracks.forEach((track) => {
        const existing =
          prev[track.id] ??
          {
            context: DEFAULT_TRACK_CONTEXT,
            laneHeight: DEFAULT_TRACK_LANE_HEIGHT,
            collapsed: false,
          };
        next[track.id] = existing;
        if (prev[track.id] !== existing) {
          changed = true;
        }
      });
      if (Object.keys(prev).length !== tracks.length) {
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [tracks]);

  useEffect(() => {
    setTrackUiState((prev) => {
      let changed = false;
      const next = { ...prev };
      tracks.forEach((track) => {
        const current = next[track.id];
        if (!current) return;
        const armed = armedTracks.has(track.id);
        if (armed && current.context !== "record") {
          next[track.id] = { ...current, context: "record" };
          changed = true;
        } else if (!armed && current.context === "record") {
          next[track.id] = { ...current, context: DEFAULT_TRACK_CONTEXT };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [armedTracks, tracks]);

  useEffect(() => {
    if (
      activeCapsuleTrackId &&
      !tracks.some((track) => track.id === activeCapsuleTrackId)
    ) {
      setActiveCapsuleTrackId(null);
    }
  }, [activeCapsuleTrackId, tracks]);

  const dockDefaultPosition = useMemo(() => computeDockDefaultPosition(), []);

  const initialDockPlacement = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(DOCK_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return { position: clampDockPosition(parsed), custom: true };
          }
        } catch (error) {
          console.warn('[BLOOM] Failed to parse stored dock position:', error);
        }
      }
    }
    const defaultPosition = clampDockPosition(dockDefaultPosition);
    return { position: defaultPosition, custom: false };
  }, [dockDefaultPosition]);

  const initialHubPlacement = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(HUB_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return { position: clampHubPosition(parsed), custom: true };
          }
        } catch (error) {
          console.warn('[BLOOM] Failed to parse stored floating position:', error);
        }
      }
    }
    return {
      position: clampHubPosition(
        computeHubDefaultPosition(initialDockPlacement.position)
      ),
      custom: false,
    };
  }, [initialDockPlacement.position]);

  const [bloomPosition, setBloomPosition] = useState<Point>(initialDockPlacement.position);
  const [floatingBloomPosition, setFloatingBloomPosition] = useState<Point>(initialHubPlacement.position);
  const [hasCustomDockPosition, setHasCustomDockPosition] = useState(initialDockPlacement.custom);
  const [hasCustomHubPosition, setHasCustomHubPosition] = useState(initialHubPlacement.custom);

  const bloomPositionRef = useRef<Point>(bloomPosition);
  useEffect(() => {
    bloomPositionRef.current = bloomPosition;
  }, [bloomPosition]);

  const floatingBloomPositionRef = useRef<Point>(floatingBloomPosition);
  useEffect(() => {
    floatingBloomPositionRef.current = floatingBloomPosition;
  }, [floatingBloomPosition]);

  const hasCustomDockRef = useRef(hasCustomDockPosition);
  useEffect(() => {
    hasCustomDockRef.current = hasCustomDockPosition;
  }, [hasCustomDockPosition]);

  const hasCustomHubRef = useRef(hasCustomHubPosition);
  useEffect(() => {
    hasCustomHubRef.current = hasCustomHubPosition;
  }, [hasCustomHubPosition]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(bloomPosition));
    } catch (error) {
      console.warn('[BLOOM] Failed to persist dock position:', error);
    }
  }, [bloomPosition]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        HUB_STORAGE_KEY,
        JSON.stringify(floatingBloomPosition)
      );
    } catch (error) {
      console.warn('[BLOOM] Failed to persist floating position:', error);
    }
  }, [floatingBloomPosition]);

  const handleManualTimelineScroll = useCallback(() => {
    setFollowPlayhead((prev) => {
      if (!prev) return prev;
      appendHistoryNote({
        id: `timeline-follow-${Date.now()}`,
        timestamp: Date.now(),
        scope: "timeline",
        message: "Follow paused from manual scroll",
        accent: TRACK_COLOR_SWATCH.cyan.glow,
      });
      return false;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const dockCustom = hasCustomDockRef.current;
      const hubCustom = hasCustomHubRef.current;

      const nextDock = dockCustom
        ? clampDockPosition(bloomPositionRef.current)
        : computeDockDefaultPosition();

      if (
        nextDock.x !== bloomPositionRef.current.x ||
        nextDock.y !== bloomPositionRef.current.y
      ) {
        bloomPositionRef.current = nextDock;
        setBloomPosition(nextDock);
      }

      const nextHub = hubCustom
        ? clampHubPosition(floatingBloomPositionRef.current)
        : computeHubDefaultPosition(nextDock);

      if (
        nextHub.x !== floatingBloomPositionRef.current.x ||
        nextHub.y !== floatingBloomPositionRef.current.y
      ) {
        floatingBloomPositionRef.current = nextHub;
        setFloatingBloomPosition(nextHub);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Dynamic Inserts (Replaces useConnections for routing) ---
  const [inserts, setInserts] = useState<Record<string, FxWindowId[]>>(() => createInitialInserts()); // trackId -> [pluginId1, pluginId2, ...]
  const insertsRef = useRef<Record<string, FxWindowId[]>>(inserts);
  useEffect(() => {
    insertsRef.current = inserts;
  }, [inserts]);
  const [isPluginBrowserOpen, setIsPluginBrowserOpen] = useState(false);
  const [trackIdForPluginBrowser, setTrackIdForPluginBrowser] = useState<string | null>(null);
  
  const [fxBypassState, setFxBypassState] = useState<Record<FxWindowId, boolean>>({});
  const [pluginFavorites, setPluginFavorites] = useState<Record<FxWindowId, boolean>>(
    () => loadPluginFavorites() as Record<FxWindowId, boolean>
  );
  const [pluginPresets, setPluginPresets] = useState<Record<FxWindowId, PluginPreset[]>>(
    () => loadPluginPresets() as Record<FxWindowId, PluginPreset[]>
  );
  useEffect(() => {
    savePluginFavorites(pluginFavorites);
  }, [pluginFavorites]);

  useEffect(() => {
    savePluginPresets(pluginPresets);
  }, [pluginPresets]);

  // --- Automation State ---
  // automationData: { [trackId]: { [fxId | 'track']: { [paramName]: AutomationPoint[] } } }
  const [automationData, setAutomationData] = useState<Record<string, Record<string, Record<string, AutomationPoint[]>>>>({});
  // visibleAutomationLanes: { [trackId]: { fxId: string, paramName: string } | null }
  const [visibleAutomationLanes, setVisibleAutomationLanes] = useState<Record<string, { fxId: string, paramName: string } | null>>({});
  const [automationParamMenu, setAutomationParamMenu] = useState<{ x: number; y: number; trackId: string; } | null>(null);

  // --- CONTEXTUAL ENGINE STATE ---
  // --- AI Hub State ---
  const [isAIHubOpen, setIsAIHubOpen] = useState(false);

  const { clips, setClips, selection, setSelection, clearSelection, ppsAPI, scrollX, setScrollX, moveClip, resizeClip, onSplitAt, setClipsSelect, duplicateClips, updateClipProperties, undo, redo, canUndo, canRedo } = useArrange({
    clips: []
  });

  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  // FIX: Corrected initialization to null for MediaStream ref
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  
  const recordingStartRef = useRef<number>(0);
  const recordedChunksRef = useRef<Record<string, Blob[]>>({});
  const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
  
  const projectDuration = useMemo(() => {
    if (!clips.length) return 60; // Default to 60 seconds if no clips
    let maxDuration = 0;
    clips.forEach(clip => {
      const clipEndTime = clip.start + clip.duration;
      if (clipEndTime > maxDuration) {
        maxDuration = clipEndTime;
      }
    });
    return Math.max(maxDuration + 5, 60); // Add some buffer time, min 60s
  }, [clips]);

  const getVelvetCurveState = useCallback(() => getVelvetCurveEngine().getState(), []);
  const [velvetCurveState, setVelvetCurveState] = useState<VelvetCurveState>(getVelvetCurveState);

  const handleVelvetCurveChange = useCallback((param: string, value: any) => {
    const engine = getVelvetCurveEngine();
    engine.setParameter(param, value); // Use generic setParameter
    setVelvetCurveState(engine.getState());
  }, [setVelvetCurveState]);
  
  const handleTimeWarpChange = useCallback((param: string, value: any) => {
    // Placeholder for TimeWarp FX parameter changes
    // In a real scenario, this would interact with a TimeWarpEngine instance
    // console.log(`TimeWarp: ${param} changed to ${value}`);
    // For now, update the fxWindows state directly for visualization if it's a fixed instance
  }, []);

  const getHarmonicLatticeState = useCallback(() => getHarmonicLattice().getHarmonicLatticeState(), []);
  const [harmonicLatticeState, setHarmonicLatticeState] = useState<HarmonicLatticeState>(getHarmonicLatticeState);

  // For HarmonicLattice, its state changes internally, so we need to poll/update.
  useEffect(() => {
    const engine = getHarmonicLattice();
    if (engine.isActive()) {
      const interval = setInterval(() => {
        setHarmonicLatticeState(engine.getHarmonicLatticeState());
      }, 100); // Update UI every 100ms
      return () => clearInterval(interval);
    }
  }, [getHarmonicLatticeState]);


  const handleMixxFXChange = useCallback((param: string, value: any) => {
    getMixxFXEngine().setParameter(param, value);
    // MixxFXEngine's internal state is simpler, so direct interaction is fine
  }, []);


  const handleContextChange = useCallback((newContext: MusicalContext) => {
    setMusicalContext(newContext);
    const engine = getVelvetCurveEngine();
    engine.setContext(newContext);
    // Crucially, update the React state to reflect the engine's new internal state
    setVelvetCurveState(engine.getState());
  }, [setVelvetCurveState]);

  // Lazy initialization of pluginRegistry
  const [pluginRegistry, setPluginRegistry] = useState<PluginConfig[]>([]);
  const engineInstancesRef = useRef<Map<PluginId, IAudioEngine>>(new Map());

  const pluginPaletteMap = useMemo<
    Record<
      FxWindowId,
      { colorKey: TrackColorKey; base: string; glow: string }
    >
  >(() => {
    return pluginRegistry.reduce((acc, plugin) => {
      const colorKey = INSERT_COLOR_BY_PLUGIN[plugin.id] ?? 'purple';
      const swatch = TRACK_COLOR_SWATCH[colorKey];
      acc[plugin.id] = { colorKey, base: swatch.base, glow: swatch.glow };
      return acc;
    }, {} as Record<FxWindowId, { colorKey: TrackColorKey; base: string; glow: string }>);
  }, [pluginRegistry]);


  // All FX Window configurations based on the registry (excluding core processors from UI)
  const fxWindows: FxWindowConfig[] = useMemo(() => {
    if (!audioContextRef.current) return [];
    
    return pluginRegistry
      .filter(plugin => !CORE_PROCESSOR_IDS.includes(plugin.id))
      .map(plugin => {
      const engineInstance = engineInstancesRef.current.get(plugin.id);
      if (!engineInstance) {
          console.error(`Engine instance not found for plugin: ${plugin.id}`);
          // This should still conform to the structure to avoid further errors down the line
          const { engineInstance: _factory, ...pluginWithoutFactory } = plugin;
          return { ...pluginWithoutFactory, params: {}, onChange: () => {}, engineInstance: null as any };
      }

      let params: any;
      let onChange: (param: string, value: any) => void;
      
      switch (plugin.id) {
        case 'velvet-curve':
          params = velvetCurveState;
          onChange = handleVelvetCurveChange;
          break;
        case 'harmonic-lattice':
          params = harmonicLatticeState;
          onChange = () => {}; // HarmonicLattice updates internally
          break;
        case 'mixx-fx':
          params = { drive: engineInstance.getParameter('drive'), tone: engineInstance.getParameter('tone'), depth: engineInstance.getParameter('depth'), mix: engineInstance.getParameter('mix') };
          onChange = handleMixxFXChange;
          break;
        case 'time-warp':
          params = { warp: engineInstance.getParameter('warp'), intensity: engineInstance.getParameter('intensity') }; // Assuming TimeWarp has these params
          onChange = handleTimeWarpChange;
          break;
        default:
          // For external plugins, get initial params from engine and sync changes
          params = engineInstance.getParameterNames().reduce((acc: any, paramName: string) => {
            acc[paramName] = engineInstance.getParameter(paramName);
            return acc;
          }, {});
          onChange = (param: string, value: any) => {
              // Update engine parameter
              engineInstance.setParameter(param, value);
              // Sync to external plugin system via adapter if needed
              // The wrapper component handles the conversion automatically
          };
      }
      const { engineInstance: _factory, ...pluginWithoutFactory } = plugin;
      return { ...pluginWithoutFactory, params, onChange, engineInstance, trackId: '', fxId: plugin.id };
    });
  }, [velvetCurveState, harmonicLatticeState, handleVelvetCurveChange, handleMixxFXChange, handleTimeWarpChange, pluginRegistry]);

  // Insert catalog snapshot: what -> expose plugin palette, why -> drive Bloom picker curation, how -> merge registry metadata with ALS colors. (Reduction / Flow / Recall)
  // Core processors are filtered out - they're engine-level only
  const pluginInventory = useMemo(() => {
    const paletteFor = (pluginId: FxWindowId) => {
      const cached = pluginPaletteMap[pluginId];
      if (cached) {
        return cached;
      }
      const colorKey = INSERT_COLOR_BY_PLUGIN[pluginId] ?? ('purple' as TrackColorKey);
      const swatch = TRACK_COLOR_SWATCH[colorKey];
      return { colorKey, base: swatch.base, glow: swatch.glow };
    };

    const source =
      pluginRegistry.length > 0
        ? pluginRegistry
            .filter(plugin => !CORE_PROCESSOR_IDS.includes(plugin.id))
            .map((plugin) => ({ id: plugin.id, name: plugin.name }))
        : Object.entries(FALLBACK_PLUGIN_NAMES)
            .filter(([id]) => !CORE_PROCESSOR_IDS.includes(id as FxWindowId))
            .map(([id, name]) => ({
                id: id as FxWindowId,
                name,
              }));

    return source.map(({ id, name }) => {
      const palette = paletteFor(id);
      return {
        id,
        name,
        colorKey: palette.colorKey,
        base: palette.base,
        glow: palette.glow,
        isFavorite: !!pluginFavorites[id],
        isCurated: CURATED_INSERT_IDS.includes(id),
      };
    });
  }, [pluginFavorites, pluginPaletteMap, pluginRegistry]);


  const [fxVisibility, setFxVisibility] = useState<Record<FxWindowId, boolean>>(() => {
    const initialVisibility: Record<FxWindowId, boolean> = {};
    return initialVisibility;
  });

  const handleToggleFxVisibility = useCallback((fxId: FxWindowId) => {
      setFxVisibility(prev => ({ ...prev, [fxId]: !prev[fxId] }));
  }, []);

  // Handler to open specific FX Window when clicked from insert badge
  const handleOpenPluginSettings = useCallback((fxId: FxWindowId) => {
    setFxVisibility(prev => ({ ...prev, [fxId]: true }));
  }, []);

  const handleSeek = (time: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) handlePlayPause(); // Stop first
    setCurrentTime(time);
    if (wasPlaying) handlePlayPause(); // Then restart at new time
  };

  const deriveAllowedStemKeys = useCallback((selection: string[]) => {
    const normalized = new Set<string>();
    selection.forEach((label) => {
      const canonical = STEM_NAME_TO_CANONICAL[label.toLowerCase()] ?? null;
      if (canonical) {
        normalized.add(canonical);
      }
    });
    if (!normalized.size) {
      DEFAULT_CANONICAL_STEMS.forEach((stem) => normalized.add(stem));
    }
    return Array.from(normalized);
  }, []);

  const executeStemSeparation = useCallback(
    async (
      request: PendingStemRequest,
      allowedStemKeys: string[],
      jobIdOverride?: string
    ) => {
       const integration = stemIntegrationRef.current;
       if (!integration) {
         console.warn('[STEMS] Integration not ready, skipping stem separation.');
         setImportMessage(null);
         setTracks((prev) =>
           prev.map((track) =>
             track.id === request.originalTrackId ? { ...track, isProcessing: false } : track
           )
         );
         return;
       }
 
       const canonicalAllowed = allowedStemKeys.length ? allowedStemKeys : Array.from(DEFAULT_CANONICAL_STEMS);
       const jobId = jobIdOverride ?? request.jobId ?? activeStemJobRef.current ?? '';
       if (jobId) {
         activeStemJobRef.current = jobId;
         upsertImportProgress({ id: jobId, label: `${request.fileName} • Stems`, percent: 60, type: 'file' });
        ingestQueueRef.current?.reportProgress(jobId, {
          percent: 60,
          message: 'Preparing stem lanes…',
        });
         canonicalAllowed.forEach((stemKey) => {
           const colorKey = STEM_COLOR_BY_KEY[stemKey] ?? 'cyan';
           const accent = TRACK_COLOR_SWATCH[colorKey].glow;
           upsertImportProgress({
             id: `${jobId}::${stemKey}`,
             parentId: jobId,
             label: `${stemKey.toUpperCase()} LANE`,
             percent: 5,
             type: 'stem',
             color: accent,
           });
         });
       }
       try {
         const originalIndex = tracksRef.current.findIndex((track) => track.id === request.originalTrackId);
         setImportMessage('Prime Brain is analyzing stems...');
         const separationResult = await integration.importAudioWithStemSeparation(
           request.buffer,
           request.fileName,
           Math.max(0, originalIndex) + 1,
           0,
           true,
           canonicalAllowed
         );
 
         if (!separationResult.success) {
           setTracks((prev) =>
             prev.map((track) =>
               track.id === request.originalTrackId ? { ...track, isProcessing: false } : track
             )
           );
           if (jobId) {
             upsertImportProgress({ id: jobId, label: `${request.fileName} • Stems unavailable`, percent: 100, type: 'file', color: '#f87171' });
             setTimeout(() => {
               removeImportProgressByPrefix(`${jobId}::`);
               removeImportProgressById(jobId);
             }, 1200);
            ingestQueueRef.current?.reportProgress(jobId, {
              percent: 100,
              message: `${request.fileName} • Stems unavailable`,
              metadata: { stemsCreated: 0 },
            });
           }
          request.resolve?.();
           return;
         }
 
         setAudioBuffers((prev) => ({
           ...prev,
           ...separationResult.newBuffers,
         }));
 
         setTracks((prev) => {
           const index = prev.findIndex((track) => track.id === request.originalTrackId);
           if (index === -1) return prev;
           const updated = [...prev];
           updated[index] = { ...updated[index], isProcessing: false };
           updated.splice(index + 1, 0, ...separationResult.newTracks);
           tracksRef.current = updated;
           return updated;
         });
 
         setMixerSettings((prev) => {
           const next = { ...prev, ...separationResult.mixerSettings };
           next[request.originalTrackId] = {
             ...(next[request.originalTrackId] ?? { volume: 0.75, pan: 0, isMuted: false }),
             isMuted: true,
           };
           return next;
         });
 
        setInserts((prev) => {
          const updated = { ...prev };
          separationResult.newTracks.forEach((track) => {
            if (!updated[track.id]) {
              updated[track.id] = [];
            }
          });
          return updated;
        });

        // Initialize send levels for all new stem tracks
        setTrackSendLevels((prev) => {
          const updated = { ...prev };
          separationResult.newTracks.forEach((track) => {
            if (!updated[track.id]) {
              updated[track.id] = createDefaultSendLevels(track);
            }
          });
          return updated;
        });

        // Initialize dynamics settings for all new stem tracks
        setChannelDynamicsSettings((prev) => {
          const updated = { ...prev };
          separationResult.newTracks.forEach((track) => {
            if (!updated[track.id]) {
              updated[track.id] = createDefaultDynamicsSettings(track);
            }
          });
          return updated;
        });

        // Initialize EQ settings for all new stem tracks
        setChannelEQSettings((prev) => {
          const updated = { ...prev };
          separationResult.newTracks.forEach((track) => {
            if (!updated[track.id]) {
              updated[track.id] = createDefaultEQSettings(track);
            }
          });
          return updated;
        });

        setClips((prev) => [...prev, ...separationResult.newClips]);
 
         console.log(`[STEMS] Created ${separationResult.newTracks.length} stem tracks from ${request.fileName}.`);
         setTimeout(() => setImportMessage(null), 1200);
         if (jobId) {
           canonicalAllowed.forEach((stemKey) => {
             upsertImportProgress({
               id: `${jobId}::${stemKey}`,
               percent: 100,
               type: 'stem',
               label: `${stemKey.toUpperCase()} COMPLETE`,
             });
           });
           upsertImportProgress({ id: jobId, label: `${request.fileName} • Complete`, percent: 100, type: 'file' });
           setTimeout(() => {
             removeImportProgressByPrefix(`${jobId}::`);
             removeImportProgressById(jobId);
           }, 1500);
          ingestQueueRef.current?.reportProgress(jobId, {
            percent: 100,
            message: `${request.fileName} • Complete`,
            metadata: { stemsCreated: separationResult.newTracks.length },
          });
           activeStemJobRef.current = null;
         }
        request.resolve?.();
       } catch (error) {
         console.error('[STEMS] separation error:', error);
         setTracks((prev) =>
           prev.map((track) =>
             track.id === request.originalTrackId ? { ...track, isProcessing: false } : track
           )
         );
         setImportMessage('Stem separation failed');
         setTimeout(() => setImportMessage(null), 3000);
         if (jobId) {
           upsertImportProgress({ id: jobId, label: `${request.fileName} • Failed`, percent: 100, type: 'file', color: '#f87171' });
           setTimeout(() => {
             removeImportProgressByPrefix(`${jobId}::`);
             removeImportProgressById(jobId);
           }, 2000);
          ingestQueueRef.current?.reportProgress(jobId, {
            percent: 100,
            message: `${request.fileName} • Failed`,
            metadata: { error: error instanceof Error ? error.message : 'Stem separation failed' },
          });
           activeStemJobRef.current = null;
         }
        request.reject?.(error instanceof Error ? error : new Error('Stem separation failed'));
       }
     },
     [removeImportProgressById, removeImportProgressByPrefix, setAudioBuffers, setClips, setImportMessage, setInserts, setMixerSettings, setTracks, upsertImportProgress]
   );

  const handleStemModalConfirm = useCallback(
    (selection: string[]) => {
      setIsStemModalOpen(false);
      const request = pendingStemRequest;
      setPendingStemRequest(null);
      if (!request) {
        return;
      }
      setLastStemSelection(selection);
      const allowedKeys = deriveAllowedStemKeys(selection);
      ingestQueueRef.current?.resume(request.jobId);
      void executeStemSeparation(request, allowedKeys, request.jobId);
    },
    [deriveAllowedStemKeys, executeStemSeparation, pendingStemRequest]
  );

  const handleStemModalCancel = useCallback(() => {
    setIsStemModalOpen(false);
    const request = pendingStemRequest;
    if (!request) {
      return;
    }
    setPendingStemRequest(null);
    setImportMessage(null);
    ingestQueueRef.current?.cancel(request.jobId);
    request.reject?.(new Error('Stem separation cancelled by user'));
    removeImportProgressByPrefix(request.jobId);
    if (activeStemJobRef.current === request.jobId) {
      activeStemJobRef.current = null;
    }
    setTracks((prev) =>
      prev.map((track) =>
        track.id === request.originalTrackId ? { ...track, isProcessing: false } : track
      )
    );
  }, [pendingStemRequest, removeImportProgressByPrefix, setImportMessage, setTracks]);

  const handleToggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const newValue = !prev;
      // Update playback state for Flow Loop
      updatePlaybackState({ looping: newValue });
      recordPrimeBrainEvent('transport-loop-toggle', { isLooping: newValue }, 'success');
      return newValue;
    });
  }, []);

  const startBackgroundStemSeparation = useCallback(
    (
      originalTrackId: string,
      buffer: AudioBuffer,
      fileName: string,
      jobId: string,
      deferred?: { resolve: () => void; reject: (error: Error) => void }
    ) => {
      activeStemJobRef.current = jobId;
      upsertImportProgress({ id: jobId, label: `${fileName} • Stem prep`, percent: 55, type: 'file' });
      ingestQueueRef.current?.markAwaiting(jobId, 'stem-selection');
      setPendingStemRequest({
        buffer,
        fileName,
        originalTrackId,
        jobId,
        resolve: deferred?.resolve ?? (() => {}),
        reject: deferred?.reject ?? (() => {}),
      });
      setIsStemModalOpen(true);
      setImportMessage(null);
    },
    [upsertImportProgress]
  );


  const handleFileImport = async (
    jobId: string,
    buffer: AudioBuffer,
    fileName: string,
    options: { resetSession?: boolean; reingestClipId?: ClipId } = {}
  ) => {
    if (!audioContextRef.current) return;
    const { resetSession = false, reingestClipId } = options;

    const displayName = stripFileExtension(fileName);
    setImportMessage(`Applying Velvet Sonics: ${displayName}`);
    upsertImportProgress({ id: jobId, label: displayName, percent: 10, type: 'file' });

    const velvetProcessor = new VelvetProcessor(audioContextRef.current);
    const processedBuffer = await velvetProcessor.processAudioBuffer(buffer, {
      profile: {
        name: 'Streaming Standard',
        targetLUFS: -14,
        velvetFloor: { depth: 70, translation: 'deep', warmth: 60 },
        harmonicLattice: { character: 'warm', presence: 75, airiness: 70 },
        phaseWeave: { width: 80, monoCompatibility: 90 },
      },
    });

    const timestamp = Date.now();
    const newBufferId = `buffer-import-${timestamp}`;
    const existingTracks = resetSession ? [] : tracksRef.current;
    const profile = deriveTrackImportProfile(displayName, existingTracks);
    upsertImportProgress({ id: jobId, label: `${displayName} • Buffering`, percent: 25, type: 'file' });

    if (reingestClipId) {
      const targetClip = clipsRef.current.find((clip) => clip.id === reingestClipId);
      if (!targetClip) {
        throw new Error('Clip not found for re-ingest');
      }

      const reingestBufferId = `buffer-reingest-${timestamp}`;
      setAudioBuffers((prev) => ({ ...prev, [reingestBufferId]: processedBuffer }));

      const updatedClip: ArrangeClip = {
        ...targetClip,
        bufferId: reingestBufferId,
        duration: processedBuffer.duration,
        originalDuration: processedBuffer.duration,
        timeStretchRate: 1.0,
        sourceStart: 0,
        sourceJobId: jobId,
        sourceFileName: fileName,
        sourceFingerprint: `${jobId}:${timestamp}`,
        lastIngestAt: timestamp,
        selected: true,
      };

      setClips((prev) =>
        prev.map((clip) => (clip.id === targetClip.id ? { ...clip, ...updatedClip } : clip))
      );
      setTracks((prev) =>
        prev.map((track) =>
          track.id === targetClip.trackId ? { ...track, isProcessing: true } : track
        )
      );
      setSelectedTrackId(targetClip.trackId);
      setRecallHighlightClipIds([targetClip.id]);
      if (recallHighlightTimeoutRef.current !== null) {
        window.clearTimeout(recallHighlightTimeoutRef.current);
      }
      recallHighlightTimeoutRef.current = window.setTimeout(() => {
        setRecallHighlightClipIds([]);
        recallHighlightTimeoutRef.current = null;
      }, 1800);
      ingestHistoryStore.record({
        jobId,
        clipIds: [targetClip.id],
        trackIds: [targetClip.trackId],
        fileName,
        completedAt: Date.now(),
        context: 'reingest',
      });
      startBackgroundStemSeparation(targetClip.trackId, processedBuffer, fileName, jobId);
      return;
    }

    let targetTrackId: string;
    let targetTrackMeta: TrackData | undefined;

    if (resetSession) {
      console.log(
        '%c[DAW CORE] New audio batch detected. Resetting project and starting ingestion.',
        'color: orange; font-weight: bold;'
      );
      const seededTracks = buildInitialTracks();
      const seededWithProcessing = seededTracks.map((track) =>
        track.id === TRACK_ROLE_TO_ID.twoTrack ? { ...track, isProcessing: true } : track
      );
      setTracks(seededWithProcessing);
      tracksRef.current = seededWithProcessing;
      setMixerSettings(createInitialMixerSettings());
      setTrackSendLevels(createInitialTrackSendLevels());
      setChannelDynamicsSettings(createInitialDynamicsSettings());
      setChannelEQSettings(createInitialEQSettings());
      const initialInserts = createInitialInserts();
      setInserts(initialInserts);
      insertsRef.current = initialInserts;
      setAutomationData({});
      setVisibleAutomationLanes({});
      setFxBypassState({});
      setSoloedTracks(new Set<string>());
      setArmedTracks(new Set<string>());
      setClips([]);
      targetTrackId = TRACK_ROLE_TO_ID.twoTrack;
      targetTrackMeta = seededWithProcessing.find((track) => track.id === targetTrackId);
      setAudioBuffers({ [newBufferId]: processedBuffer });
    } else {
      setAudioBuffers((prev) => ({ ...prev, [newBufferId]: processedBuffer }));

      const newTrackId = `track-import-${timestamp}`;
      const newTrack: TrackData = {
        id: newTrackId,
        trackName: profile.trackName,
        trackColor: profile.color,
        waveformType: profile.waveformType,
        group: profile.group,
        isProcessing: true,
        role: 'standard',
        locked: false,
      };

      const newInsertsForTrack: FxWindowId[] = [];

      setTracks((prev) => {
        const updated = [...prev, newTrack];
        tracksRef.current = updated;
        return updated;
      });
      targetTrackId = newTrackId;
      targetTrackMeta = newTrack;
      setMixerSettings((prev) => ({
        ...prev,
        [newTrackId]: { volume: 0.75, pan: 0, isMuted: false },
      }));
      setInserts((prev) => {
        const next = { ...prev, [newTrackId]: newInsertsForTrack };
        insertsRef.current = next;
        return next;
      });
      setTrackSendLevels((prev) => ({
        ...prev,
        [newTrackId]: createDefaultSendLevels(newTrack),
      }));
      setChannelDynamicsSettings((prev) => ({
        ...prev,
        [newTrackId]: createDefaultDynamicsSettings(newTrack),
      }));
      setChannelEQSettings((prev) => ({
        ...prev,
        [newTrackId]: createDefaultEQSettings(newTrack),
      }));
    }

    const assignedTrackId = targetTrackId;
    const trackBaseline = targetTrackMeta ?? tracksRef.current.find((t) => t.id === assignedTrackId);

    const newClip: ArrangeClip = {
      id: `clip-import-${timestamp}`,
      trackId: assignedTrackId,
      name: 'FULL MIX',
      color: TRACK_COLOR_SWATCH[(trackBaseline?.trackColor ?? profile.color) as TrackColorKey].base,
      start: 0,
      duration: processedBuffer.duration,
      originalDuration: processedBuffer.duration,
      timeStretchRate: 1.0,
      sourceStart: 0,
      bufferId: newBufferId,
      sourceJobId: jobId,
      sourceFileName: fileName,
      sourceFingerprint: `${jobId}:${timestamp}`,
      lastIngestAt: timestamp,
      groupId: null,
      isGroupRoot: false,
      alsEnergy: masterAnalysis?.level ?? 0,
    };

    if (resetSession) {
      setClips([newClip]);
    } else {
      setClips((prev) => [...prev, newClip]);
    }

    ingestHistoryStore.record({
      jobId,
      clipIds: [newClip.id],
      trackIds: [assignedTrackId],
      fileName,
      completedAt: Date.now(),
      context: 'import',
    });

    setSelectedTrackId(assignedTrackId);
    upsertImportProgress({ id: jobId, label: `${displayName} • Track seeded`, percent: 45, type: 'file' });

    setImportMessage('Prime Brain is analyzing stems...');
    await new Promise<void>((resolve, reject) => {
      startBackgroundStemSeparation(assignedTrackId, processedBuffer, displayName, jobId, { resolve, reject });
    });
  };
  
  const handleSaveProject = async () => {
      const serializedBuffers = await serializeAudioBuffers(audioBuffers);
      const queueSnapshot = ingestQueueRef.current
        ? ingestQueueRef.current.getSnapshot()
        : ingestSnapshot;
      const historySnapshot = ingestHistoryStore.exportAll();
      const projectState = {
          tracks,
          clips,
          mixerSettings,
          inserts, // Save the new inserts state
          masterVolume,
          masterBalance,
          isLooping,
          bpm, // Save BPM
          ppsValue: ppsAPI.value,
          scrollX,
          audioBuffers: serializedBuffers,
          automationData,
          visibleAutomationLanes,
          musicalContext,
          fxBypassState, // Save FX bypass state
          bloomPosition,
          floatingBloomPosition,
          ingestSnapshot: queueSnapshot,
          ingestHistoryEntries: historySnapshot,
          followPlayhead,
          pianoRollSketches: pianoRollStore,
          pianoRollZoom: {
            scrollX: pianoRollState.scrollX,
            zoomX: pianoRollState.zoomX,
            zoomY: pianoRollState.zoomY,
          },
      };

      const jsonString = JSON.stringify(projectState, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow-project-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log("Project saved.");
  };

  const processImportJob = async (
    job: IngestRuntimeJob,
    controls: IngestJobControls
  ): Promise<void | IngestJobOutcome> => {
    const ctx = audioContextRef.current;
    if (!ctx) {
      controls.markFailed('Audio engine not initialized');
      return { status: 'failed', summary: { error: 'Audio engine not initialized' } };
    }

    const displayName = stripFileExtension(job.fileName);

    try {
      if (!job.file) {
        controls.reportProgress({ message: `Waiting for ${displayName} source file…` });
        controls.markAwaitingUser('Source file missing after reload. Drop the original file to resume.');
        upsertImportProgress({
          id: job.id,
          label: `${displayName} • Waiting`,
          percent: 0,
          type: 'file',
          color: '#fbbf24',
        });
        return;
      }

      // Check if this is a re-ingest (clip replacement)
      const reingestClipId = job.metadata?.reingestClipId as ClipId | undefined;
      if (reingestClipId) {
        // Re-ingest: use legacy path for now (replaces existing clip buffer)
        controls.reportProgress({ percent: 5, message: `Decoding ${displayName}` });
        upsertImportProgress({ id: job.id, label: displayName, percent: 5, type: 'file' });
        setImportMessage(`Decoding ${displayName}…`);

        const arrayBuffer = await job.file.arrayBuffer();
        if (controls.isCancelled()) {
          controls.markCancelled('User cancelled import');
          removeImportProgressByPrefix(job.id);
          setImportMessage(null);
          return { status: 'cancelled' };
        }

        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (controls.isCancelled()) {
          controls.markCancelled('User cancelled import');
          removeImportProgressByPrefix(job.id);
          setImportMessage(null);
          return { status: 'cancelled' };
        }

        controls.reportProgress({ percent: 20, message: `Priming ${displayName}` });
        await handleFileImport(job.id, decodedBuffer, job.fileName, {
          resetSession: job.resetSession,
          reingestClipId,
        });
        controls.reportProgress({ percent: 100, message: `${displayName} • Complete` });
        setImportMessage(null);
        return;
      }

      // NEW PATH: Immediate stem separation for all audio imports
      // Audio files are immediately stem-separated and placed on individual tracks
      controls.reportProgress({ percent: 5, message: `Stem separating ${displayName}…` });
      upsertImportProgress({ id: job.id, label: displayName, percent: 5, type: 'file' });
      setImportMessage(`Stem separating ${displayName}…`);

      // If resetSession is true, clear existing tracks/clips first
      if (job.resetSession) {
        setTracks([]);
        setClips([]);
        setAudioBuffers({});
        tracksRef.current = [];
        clipsRef.current = [];
        // Clear Zustand store as well
        const { getTracks, getClips, getAudioBuffers } = useTimelineStore.getState();
        const existingTracks = getTracks();
        const existingClips = getClips();
        existingTracks.forEach(track => {
          useTimelineStore.getState().removeTrack(track.id);
        });
        existingClips.forEach(clip => {
          useTimelineStore.getState().removeClip(clip.id);
        });
      }

      // Run stem pipeline - this immediately stem-separates and places stems on tracks
      const result = await runFlowStemPipeline(job.file, ctx);

      if (controls.isCancelled()) {
        controls.markCancelled('User cancelled import');
        removeImportProgressByPrefix(job.id);
        setImportMessage(null);
        return { status: 'cancelled' };
      }

      // Sync Zustand to React state (same as FileInput does)
      const zustandState = useTimelineStore.getState();
      const zustandTracks = zustandState.getTracks();
      const zustandClips = zustandState.getClips();
      const zustandBuffers = zustandState.getAudioBuffers();

      // Check if stems were actually created
      const stemsCreated = Object.keys(result.stems).filter(k => result.stems[k] !== null).length;
      if (stemsCreated === 0) {
        controls.reportProgress({ percent: 100, message: `${displayName} • No stems detected` });
        setImportMessage(`${displayName} • No stems detected`);
        setTimeout(() => setImportMessage(null), 3000);
        return {
          status: 'completed',
          summary: {
            tracksCreated: 0,
            clipsCreated: 0,
            stemsCreated: 0,
            fileName: job.fileName,
            warning: 'No stems were detected in the audio file',
          },
        };
      }

      if (zustandTracks.length > 0 || zustandClips.length > 0) {
        // MERGE tracks
        setTracks(prev => {
          const existingById = new Map(prev.map(t => [t.id, t]));
          const merged: TrackData[] = [...prev];
          
          zustandTracks.forEach(zTrack => {
            if (!existingById.has(zTrack.id)) {
              merged.push(zTrack);
              existingById.set(zTrack.id, zTrack);
            } else {
              const index = merged.findIndex(t => t.id === zTrack.id);
              if (index !== -1) {
                merged[index] = { ...merged[index], ...zTrack };
              }
            }
          });
          
          return merged;
        });

        // MERGE clips
        setClips(prev => {
          const existingById = new Map(prev.map(c => [c.id, c]));
          const merged: ArrangeClip[] = [...prev];
          
          zustandClips.forEach(zClip => {
            if (!existingById.has(zClip.id)) {
              merged.push(zClip as ArrangeClip);
              existingById.set(zClip.id, zClip);
            } else {
              const index = merged.findIndex(c => c.id === zClip.id);
              if (index !== -1) {
                merged[index] = { ...merged[index], ...zClip } as ArrangeClip;
              }
            }
          });
          
          return merged;
        });

        // MERGE buffers
        setAudioBuffers(prev => ({ ...prev, ...zustandBuffers }));

        // Initialize all track state for imported tracks
        setMixerSettings(prev => {
          const next = { ...prev };
          zustandTracks.forEach(track => {
            if (!next[track.id]) {
              const volume = track.role === 'two-track' ? 0.82 : 
                           track.role === 'hushRecord' ? 0.78 : 0.75;
              next[track.id] = { volume, pan: 0, isMuted: false };
            }
          });
          return next;
        });

        setInserts(prev => {
          const updated = { ...prev };
          zustandTracks.forEach(track => {
            if (!updated[track.id]) {
              updated[track.id] = [];
            }
          });
          return updated;
        });

        setTrackSendLevels(prev => {
          const updated = { ...prev };
          zustandTracks.forEach(track => {
            if (!updated[track.id]) {
              updated[track.id] = createDefaultSendLevels(track);
            }
          });
          return updated;
        });

        setChannelDynamicsSettings(prev => {
          const updated = { ...prev };
          zustandTracks.forEach(track => {
            if (!updated[track.id]) {
              updated[track.id] = createDefaultDynamicsSettings(track);
            }
          });
          return updated;
        });

        setChannelEQSettings(prev => {
          const updated = { ...prev };
          zustandTracks.forEach(track => {
            if (!updated[track.id]) {
              updated[track.id] = createDefaultEQSettings(track);
            }
          });
          return updated;
        });

        // Update refs
        tracksRef.current = zustandTracks;
        clipsRef.current = zustandClips;

        console.log(`[INGEST] Imported ${zustandTracks.length} stem tracks from ${displayName}`);
      }

      controls.reportProgress({ percent: 100, message: `${displayName} • Complete` });
      setImportMessage(null);
      return {
        status: 'completed',
        summary: {
          tracksCreated: zustandTracks.length,
          clipsCreated: zustandClips.length,
          stemsCreated: Object.keys(result.stems).filter(k => result.stems[k] !== null).length,
          fileName: job.fileName,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to import audio';
      if (controls.isCancelled()) {
        controls.markCancelled(message);
        removeImportProgressByPrefix(job.id);
        setImportMessage(null);
        return { status: 'cancelled', summary: { error: message } };
      }
      controls.markFailed(message);
      removeImportProgressByPrefix(job.id);
      setImportMessage(message);
      setTimeout(() => setImportMessage(null), 3000);
      return { status: 'failed', summary: { error: message } };
    }
  };

  processImportJobRef.current = processImportJob;

  useEffect(() => {
    if (ingestQueueRef.current) {
      return;
    }
    const manager = new IngestQueueManager({
      onProcessJob: async (job, controls) => {
        if (!processImportJobRef.current) {
          return { status: 'failed', summary: { error: 'Ingest processor not ready' } };
        }
        return await processImportJobRef.current(job as IngestRuntimeJob, controls);
      },
    });
    ingestQueueRef.current = manager;
    const unsubscribe = manager.subscribe(setIngestSnapshot);
    if (pendingQueueHydrationRef.current) {
      manager.hydrateFromPersisted(pendingQueueHydrationRef.current);
      pendingQueueHydrationRef.current = null;
    }
    return () => {
      unsubscribe();
    };
  }, [setIngestSnapshot]);

  useEffect(() => {
    const unsubscribe = ingestHistoryStore.subscribe(setIngestHistoryEntries);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recallHighlightTimeoutRef.current !== null) {
        window.clearTimeout(recallHighlightTimeoutRef.current);
      }
    };
  }, []);

  const handleProjectLoad = async (projectState: PersistedProjectState) => {
      if (!audioContextRef.current) return;
      stopPlayback();
      setIsPlaying(false);

      const serializedBuffers = projectState.audioBuffers ?? {};
      const deserializedBuffers = await deserializeAudioBuffers(serializedBuffers, audioContextRef.current);

      setTracks(projectState.tracks || []);
      // FIX: Ensure numeric properties of clips are correctly parsed as numbers during load
      setClips(projectState.clips?.map((c: any) => ({
          ...c,
          start: parseFloat(c.start || 0), // Use parseFloat and provide default if undefined
          duration: parseFloat(c.duration || 0),
          sourceStart: parseFloat(c.sourceStart || 0),
          originalDuration: parseFloat(c.originalDuration || c.duration || 0),
          timeStretchRate: parseFloat(c.timeStretchRate || 1.0),
          fadeIn: parseFloat(c.fadeIn || 0),
          fadeOut: parseFloat(c.fadeOut || 0),
          gain: parseFloat(c.gain || 1.0),
          warpAnchors: Array.isArray(c.warpAnchors)
            ? c.warpAnchors
                .map((anchor: unknown) => parseFloat(`${anchor || 0}`))
                .filter((anchor: number) => Number.isFinite(anchor) && anchor >= 0)
            : [],
      })) || []);
      setMixerSettings(projectState.mixerSettings || {});
      setInserts(projectState.inserts || {}); // Load the inserts state
      // FIX: Ensure masterVolume is parsed as a number
      setMasterVolume(parseFloat(`${projectState.masterVolume ?? 0.8}`));
      // FIX: Ensure masterBalance is parsed as a number
      setMasterBalance(parseFloat(`${projectState.masterBalance ?? 0}`));
      setIsLooping(projectState.isLooping || false);
      // FIX: Ensure bpm is parsed as a number
      setBpm(parseFloat(`${projectState.bpm ?? 120}`)); // Load BPM
      // FIX: Ensure ppsValue is parsed as a number
      ppsAPI.set(parseFloat(`${projectState.ppsValue ?? 60}`));
      // FIX: Ensure scrollX is parsed as a number
      setScrollX(parseFloat(`${projectState.scrollX ?? 0}`));
      setAudioBuffers(deserializedBuffers);
      setAutomationData(projectState.automationData || {});
      setVisibleAutomationLanes(projectState.visibleAutomationLanes || {});
      setMusicalContext(projectState.musicalContext || { genre: 'Streaming', mood: 'Balanced' });
      setFxBypassState(projectState.fxBypassState || {}); // Load FX bypass state
      setFollowPlayhead(
        projectState.followPlayhead === undefined ? true : Boolean(projectState.followPlayhead)
      );
      setPianoRollStore(
        projectState.pianoRollSketches
          ? Object.fromEntries(
              Object.entries(projectState.pianoRollSketches).map(([clipId, notes]) => [
                clipId,
                Array.isArray(notes)
                  ? notes.map((note) => ({
                      ...note,
                      start: parseFloat(`${note.start ?? 0}`),
                      duration: parseFloat(`${note.duration ?? 0}`),
                      pitch: Number(note.pitch ?? 60),
                      velocity: Number(note.velocity ?? 96),
                    })) as MidiNote[]
                  : [],
              ])
            )
          : {}
      );
      if (projectState.pianoRollZoom) {
        setPianoRollState((prev) => ({
          ...prev,
          scrollX: parseFloat(`${projectState.pianoRollZoom?.scrollX ?? prev.scrollX}`),
          zoomX: parseFloat(`${projectState.pianoRollZoom?.zoomX ?? prev.zoomX}`),
          zoomY: parseFloat(`${projectState.pianoRollZoom?.zoomY ?? prev.zoomY}`),
        }));
      }
      if (
        projectState.bloomPosition &&
        typeof projectState.bloomPosition.x === 'number' &&
        typeof projectState.bloomPosition.y === 'number'
      ) {
        setBloomPosition(projectState.bloomPosition);
      }
      if (
        projectState.floatingBloomPosition &&
        typeof projectState.floatingBloomPosition.x === 'number' &&
        typeof projectState.floatingBloomPosition.y === 'number'
      ) {
        setFloatingBloomPosition(projectState.floatingBloomPosition);
      }
      if (Array.isArray(projectState.ingestHistoryEntries)) {
        ingestHistoryStore.hydrate(projectState.ingestHistoryEntries);
      }
      if (projectState.ingestSnapshot) {
        setIngestSnapshot(projectState.ingestSnapshot);
        if (ingestQueueRef.current) {
          ingestQueueRef.current.hydrateFromPersisted(projectState.ingestSnapshot);
        } else {
          pendingQueueHydrationRef.current = projectState.ingestSnapshot;
        }
      }
      
      console.log("Project loaded.");
  };

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !audioContextRef.current) return;

    try {
      if (fileInputContext === 'import') {
        const fileArray = Array.from(files);
        const audioPattern = /\.(wav|aiff|aif|mp3|flac|ogg|m4a|aac)$/i;
        const audioFiles = fileArray.filter((file) => {
          const isAudioFile = file.type.startsWith('audio') || audioPattern.test(file.name);
          if (!isAudioFile) {
            console.warn(`[INGESTION] Skipping non-audio file: ${file.name}`);
          }
          return isAudioFile;
        });

        if (audioFiles.length === 0) {
          setImportMessage('No audio files were imported.');
          setTimeout(() => setImportMessage(null), 3000);
          return;
        }

        const manager = ingestQueueRef.current;
        if (!manager) {
          throw new Error('Ingest queue manager is not available.');
        }

        const resumableJobs = new Map<string, string>();
        manager.getSnapshot().jobs.forEach((job) => {
          const metadata = job.metadata as { resumeRequired?: boolean } | undefined;
          if (metadata?.resumeRequired && job.status === 'awaiting-user') {
            resumableJobs.set(job.fileName, job.id);
          }
        });

        let resetSessionForNext = true;
        let resumedCount = 0;
        let enqueuedCount = 0;

        audioFiles.forEach((file, index) => {
          const resumableId = resumableJobs.get(file.name);
          if (resumableId) {
            const resumed = manager.supplyFile(resumableId, file);
            if (resumed) {
              resumedCount += 1;
              resumableJobs.delete(file.name);
            } else {
              console.warn(`[INGESTION] Failed to resume job ${resumableId} for ${file.name}.`);
            }
            return;
          }

          manager.enqueue({
            file,
            fileName: file.name,
            resetSession: resetSessionForNext,
            metadata: { order: index + 1, total: audioFiles.length },
          });
          resetSessionForNext = false;
          enqueuedCount += 1;
        });

        const statusMessages: string[] = [];
        if (enqueuedCount > 0) {
          statusMessages.push(
            enqueuedCount === 1 ? 'Queued 1 file for import.' : `Queued ${enqueuedCount} files for import.`
          );
        }
        if (resumedCount > 0) {
          statusMessages.push(
            resumedCount === 1
              ? 'Resumed 1 paused ingest job.'
              : `Resumed ${resumedCount} paused ingest jobs.`
          );
        }
        if (statusMessages.length > 0) {
          setImportMessage(statusMessages.join(' '));
          setTimeout(() => setImportMessage(null), 2500);
        }
      } else if (fileInputContext === 'load') {
        const file = files[0];
        if (!file.name.toLowerCase().endsWith('.json')) {
          throw new Error('Invalid file type: Please select a .json project file.');
        }
        setImportMessage('Loading Project...');
        const fileContent = await file.text();
        const projectState = JSON.parse(fileContent);
        handleProjectLoad(projectState as PersistedProjectState);
        setImportMessage(null);
      } else if (fileInputContext === 'reingest') {
        const file = files[0];
        const manager = ingestQueueRef.current;
        if (!manager) {
          throw new Error('Ingest queue manager is not available.');
        }
        if (!pendingReingest) {
          setImportMessage('No clip selected for re-ingest.');
          setTimeout(() => setImportMessage(null), 2500);
          return;
        }
        manager.enqueue({
          file,
          fileName: file.name,
          resetSession: false,
          metadata: { reingestClipId: pendingReingest.clipId },
        });
        setPendingReingest(null);
        setFileInputContext('import');
        setImportMessage(`Queued re-ingest for ${file.name}`);
        setTimeout(() => setImportMessage(null), 2000);
      }
    } catch (error) {
      console.error('Error handling file:', error);
      let errorMessage = 'Error processing file.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setImportMessage(errorMessage);
      setTimeout(() => setImportMessage(null), 3000);
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  const handlePlayPause = useCallback(async () => {
    // Record record button tap for double-tap detection (if armed)
    if (armedTracks.size > 0) {
      recordRecordTap();
    }
    
    const isTauri = typeof window !== 'undefined' && typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined';
    
    setIsPlaying((prevIsPlaying) => {
      const newIsPlaying = !prevIsPlaying;
      const ctx = audioContextRef.current;
      if (ctx && (ctx.state as string) !== 'closed') {
        if (newIsPlaying) {
          ctx.resume().catch((error) => {
            console.warn('[AUDIO] Failed to resume context:', error);
          });
        } else {
          ctx.suspend().catch((error) => {
            console.warn('[AUDIO] Failed to suspend context:', error);
          });
        }
      }
      
      // Initialize and control Tauri Flow Engine
      if (isTauri) {
        const tauriInvoke = (window as unknown as { __TAURI__: { invoke: <T>(cmd: string, args?: unknown) => Promise<T> } }).__TAURI__.invoke;
        
        if (newIsPlaying) {
          // Initialize engine if not already done, then start playback
          tauriInvoke('initialize_flow_engine')
            .then(() => {
              console.log('✅ Flow Engine initialized');
              return tauriInvoke('flow_play');
            })
            .then(() => {
              console.log('▶️ Flow Engine: PLAY');
            })
            .catch((error) => {
              console.warn('[FLOW] Failed to start engine:', error);
            });
        } else {
          // Pause the engine
          tauriInvoke('flow_pause')
            .then(() => {
              console.log('⏸️ Flow Engine: PAUSE');
            })
            .catch((error) => {
              console.warn('[FLOW] Failed to pause engine:', error);
            });
        }
      }
      
      // Update playback state for Flow Loop
      const currentPlayCount = window.__mixx_playbackState?.playCount || 0;
      updatePlaybackState({
        playing: newIsPlaying,
        playCount: newIsPlaying ? currentPlayCount + 1 : currentPlayCount,
      });
      
      // Record Prime Brain event
      if (newIsPlaying) {
        recordPrimeBrainEvent('transport-play', { isTauri }, 'success');
      } else {
        recordPrimeBrainEvent('transport-pause', { isTauri }, 'success');
      }
      
      return newIsPlaying;
    });
  }, []);

  const splitAutomationAt = useCallback(
    (clipId: ClipId, time: number) => {
      setAutomationData((prev) => {
        const updated = { ...prev };
        const clipToSplit = clips.find((clip) => clip.id === clipId);
        if (clipToSplit && updated[clipToSplit.trackId]) {
          for (const fxId in updated[clipToSplit.trackId]) {
            for (const paramName in updated[clipToSplit.trackId][fxId]) {
              const points = updated[clipToSplit.trackId][fxId][paramName];
              if (points) {
                const newPoints: AutomationPoint[] = [];
                let splitValue = 0;
                const nextPointIndex = points.findIndex((p) => p.time > time);
                if (nextPointIndex === 0) {
                  splitValue = points[0].value;
                } else if (nextPointIndex === -1) {
                  splitValue = points[points.length - 1].value;
                } else {
                  const prevPoint = points[nextPointIndex - 1];
                  const nextPoint = points[nextPointIndex];
                  const timeDiff = nextPoint.time - prevPoint.time;
                  const factor = timeDiff !== 0 ? (time - prevPoint.time) / timeDiff : 0;
                  splitValue = prevPoint.value + factor * (nextPoint.value - prevPoint.value);
                }

                const firstPartPoints = points.filter((p) => p.time < time);
                const secondPartPoints = points.filter((p) => p.time > time);

                if (firstPartPoints.length > 0 || secondPartPoints.length > 0) {
                  newPoints.push(
                    ...firstPartPoints,
                    { time, value: splitValue },
                    { time, value: splitValue },
                    ...secondPartPoints
                  );
                }
                updated[clipToSplit.trackId][fxId][paramName] = newPoints.sort(
                  (a, b) => a.time - b.time
                );
              }
            }
          }
        }
        return updated;
      });
    },
    [clips]
  );

  const handleSplitSelectionAt = useCallback(
    (time?: number) => {
      const splitTime = time ?? currentTime;
      const targets = clips.filter(
        (clip) =>
          clip.selected && splitTime > clip.start && splitTime < clip.start + clip.duration
      );
      if (!targets.length) {
        console.log('[ARRANGE] No clips intersect playhead for split.');
        return;
      }
      targets.forEach((clip) => {
        onSplitAt(clip.id, splitTime);
        splitAutomationAt(clip.id, splitTime);
      });
    },
    [clips, currentTime, onSplitAt, splitAutomationAt]
  );

  const handleConsolidateSelection = useCallback(() => {
    setClips((prev) => {
      const selected = prev.filter((clip) => clip.selected);
      if (selected.length < 2) return prev;

      const grouped = new Map<string, ArrangeClip[]>();
      selected.forEach((clip) => {
        const bucket = grouped.get(clip.trackId) ?? [];
        bucket.push(clip);
        grouped.set(clip.trackId, bucket);
      });

      if (grouped.size === 0) return prev;

      let updated = prev.filter((clip) => !clip.selected);
      const now = Date.now();

      grouped.forEach((groupClips, trackId) => {
        const sorted = groupClips.slice().sort((a, b) => a.start - b.start);
        const start = sorted[0].start;
        const end = sorted.reduce((max, clip) => Math.max(max, clip.start + clip.duration), start);
        const reference = sorted[0];
        updated.push({
          ...reference,
          id: `clip-consolidated-${now}-${Math.random().toString(36).slice(2, 9)}`,
          start,
          duration: end - start,
          originalDuration: end - start,
          timeStretchRate: 1.0,
          sourceStart: reference.sourceStart,
          bufferId: reference.bufferId,
          fadeIn: reference.fadeIn ?? 0,
          fadeOut: reference.fadeOut ?? 0,
          selected: true,
          groupId: reference.groupId ?? `group-${now.toString(36)}`,
          isGroupRoot: true,
          lastIngestAt: reference.lastIngestAt ?? null,
          sourceJobId: reference.sourceJobId ?? null,
          sourceFileName: reference.sourceFileName ?? null,
          sourceFingerprint: reference.sourceFingerprint ?? null,
        });
      });

      return updated.sort((a, b) => a.start - b.start);
    });
  }, [setClips]);

  const handleRecallLastImport = useCallback(() => {
    const latest = ingestHistoryEntries[0];
    if (!latest) {
      setImportMessage('No ingest history yet.');
      setTimeout(() => setImportMessage(null), 2000);
      return;
    }
    const targetClipIds = latest.clipIds;
    if (!targetClipIds.length) return;

    setClips((prev) =>
      prev.map((clip) => ({
        ...clip,
        selected: targetClipIds.includes(clip.id),
      }))
    );
    setRecallHighlightClipIds(targetClipIds);
    if (recallHighlightTimeoutRef.current !== null) {
      window.clearTimeout(recallHighlightTimeoutRef.current);
    }
    recallHighlightTimeoutRef.current = window.setTimeout(() => {
      setRecallHighlightClipIds([]);
      recallHighlightTimeoutRef.current = null;
    }, 1800);
    setImportMessage(`Recalled ${latest.fileName}`);
    setTimeout(() => setImportMessage(null), 2000);
  }, [ingestHistoryEntries, setClips, setImportMessage]);

  const handleReingestClip = useCallback(
    (clipId?: ClipId) => {
      if (!clipId) return;
      const clip = clips.find((entry) => entry.id === clipId);
      if (!clip) {
        setImportMessage('Clip not found for re-ingest.');
        setTimeout(() => setImportMessage(null), 2000);
        return;
      }
      setPendingReingest({ clipId });
      setFileInputContext('reingest');
      setImportMessage(`Select new audio for ${clip.name}.`);
      setTimeout(() => setImportMessage(null), 2500);
      fileInputRef.current?.click();
    },
    [clips, setFileInputContext, setImportMessage]
  );

  const isAnyTrackArmed = armedTracks.size > 0; // Define isAnyTrackArmed here
  const selectedClips = useMemo(() => clips.filter((clip) => clip.selected), [clips]);
  const selectedClipSummaries = useMemo(
    () =>
      selectedClips.map((clip) => ({
        id: clip.id,
        name: clip.name,
        trackId: clip.trackId,
        start: clip.start,
        duration: clip.duration,
      })),
    [selectedClips]
  );
  const selectedClipIds = useMemo(() => selectedClips.map((clip) => clip.id), [selectedClips]);
  const handleBloomPositionChange = useCallback((position: { x: number; y: number }) => {
    const clamped = clampDockPosition(position);
    bloomPositionRef.current = clamped;
    setBloomPosition(clamped);
    if (!hasCustomDockRef.current) {
      setHasCustomDockPosition(true);
      hasCustomDockRef.current = true;
    }
    if (!hasCustomHubRef.current) {
      const linkedHub = computeHubDefaultPosition(clamped);
      floatingBloomPositionRef.current = linkedHub;
      setFloatingBloomPosition(linkedHub);
    }
  }, []);

  const canSplitSelection = selectedClips.some(
    (clip) => currentTime > clip.start && currentTime < clip.start + clip.duration
  );
  const canConsolidateSelection = selectedClips.length > 1;
  const canReingestSelection = selectedClips.length === 1 && Boolean(selectedClips[0].sourceJobId);
  const canRecallLastImport = ingestHistoryEntries.length > 0;

  type BloomActionMeta = {
    source?: "bloom-dock" | "bloom-floating" | "prime-brain" | "system";
    context?: Record<string, unknown>;
  };

  const handleBloomAction = (
    action: string,
    payload?: any,
    meta?: BloomActionMeta
  ) => {
      publishBloomSignal({
        source: meta?.source ?? "system",
        action,
        payload: meta?.context ? { data: payload, context: meta.context } : payload,
      });
      
      // Record Prime Brain event for Bloom actions
      recordPrimeBrainEvent('bloom-action', { action, source: meta?.source }, 'success');
      
      switch (action) {
          case 'addTrack':
              setIsAddTrackModalModalOpen(true);
              break;
          case 'importAudio':
              setFileInputContext('import');
              fileInputRef.current?.click();
              break;
          case 'saveProject':
              handleSaveProject();
              break;
          case 'loadProject':
              setFileInputContext('load');
              fileInputRef.current?.click();
              break;
          case 'toggleHush':
              if (isAnyTrackArmed) { // Use the defined isAnyTrackArmed
                  setIsHushActive(prev => !prev);
              }
              break;
        case 'setTranslationProfile':
            if (typeof payload === 'string') {
                const profile = payload as TranslationProfileKey;
                setTranslationProfile(profile);
                publishAlsSignal({
                    source: 'translation-matrix',
                    profile,
                });
              }
              break;
          case 'resetMix':
              setMixerSettings(prev => {
                  const newSettings = { ...prev };
                  tracks.forEach(t => {
                      newSettings[t.id] = { ...newSettings[t.id], volume: 0.75, pan: 0 };
                  });
                  return newSettings;
              });
              setMasterVolume(0.8);
              setMasterBalance(0);
              console.log("Mix settings reset.");
              break;
          case 'analyzeMaster':
              (async () => {
                  const firstClip = clips[0];
                  if (!firstClip || !audioBuffers[firstClip.bufferId]) {
                      console.warn("Prime Brain: No audio on timeline to analyze.");
                      setImportMessage(null);
                      return;
                  }
                  const bufferToAnalyze = audioBuffers[firstClip.bufferId];

                  console.log("%c[PRIME BRAIN] Analyzing sonic DNA...", "color: #f59e0b; font-weight: bold;");
                  setImportMessage("Prime Brain Analyzing...");

                  const analysis = await analyzeVelvetCurve(bufferToAnalyze);
                  
                  console.log("[PRIME BRAIN] Analysis complete:", analysis);
                  setAnalysisResult(analysis);
                  
                  const velvetEngine = getVelvetCurveEngine();
                  velvetEngine.adaptToAnchors(analysis);
                  
                  setVelvetCurveState(velvetEngine.getState());

                  // FIX: Corrected typo from getHarmaticLattice to getHarmonicLattice
                  const harmonicLatticeEngine = getHarmonicLattice();
                  // Example: Map 'soul' and 'silk' anchors to emotional bias for HarmonicLattice
                  const emotionalBias = (analysis.soul / 100 + analysis.silk / 100) / 2;
                  harmonicLatticeEngine.setEmotionalBias(emotionalBias);

                  setImportMessage(null);
              })();
              break;
          case 'manageFx':
              // Handled by BloomHUD directly for now, no global action needed
              break;
          case 'engagePrimeBrain':
              setActivePrimeBrainClipId(payload as ClipId);
              break;
          case 'splitClipAtPlayhead':
              onSplitAt(payload as ClipId, currentTime);
              splitAutomationAt(payload as ClipId, currentTime);
              break;
          case 'duplicateClips':
              duplicateClips(payload as ClipId[]);
              // Also duplicate automation data for selected clips
              setAutomationData(prev => {
                const updated = { ...prev };
                const selectedClips = clips.filter(c => (payload as ClipId[]).includes(c.id));
                if (!selectedClips.length) return prev;

                const maxEndTime = selectedClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
                const duplicateOffset = 1; // Offset new clips by 1 second

                selectedClips.forEach(originalClip => {
                  const originalTrackAutomation = prev[originalClip.trackId];
                  if (originalTrackAutomation) {
                    // Create new automation data for the duplicated clip's track and associated FX
                    const newTrackId = tracks.find(t => t.id === originalClip.trackId)?.id; // Assuming tracks state is updated
                    if (newTrackId) {
                      for (const fxId in originalTrackAutomation) {
                        for (const paramName in originalTrackAutomation[fxId]) {
                          const originalPoints = originalTrackAutomation[fxId][paramName];
                          const newPoints = originalPoints.map(p => ({
                            ...p,
                            time: p.time + (maxEndTime + duplicateOffset - originalClip.start), // Offset by the same amount as clips
                          }));
                          
                          if (!updated[newTrackId]) updated[newTrackId] = {};
                          if (!updated[newTrackId][fxId]) updated[newTrackId][fxId] = {};
                          updated[newTrackId][fxId][paramName] = newPoints;
                        }
                      }
                    }
                  }
                });
                return updated;
              });
              break;
          case 'openAIHub':
              setIsAIHubOpen(true);
              break;
          case 'toggleFollowPlayhead':
              setFollowPlayhead((prev) => {
                const next = !prev;
                appendHistoryNote({
                  id: `timeline-follow-${Date.now()}`,
                  timestamp: Date.now(),
                  scope: "timeline",
                  message: next ? 'Follow playhead enabled' : 'Follow playhead paused',
                  accent: TRACK_COLOR_SWATCH.cyan.glow,
                });
                return next;
              });
              break;
          case 'splitSelection':
              handleSplitSelectionAt((payload as { time?: number } | undefined)?.time);
              break;
          case 'consolidateSelection':
              handleConsolidateSelection();
              break;
          case 'recallLastImport':
              handleRecallLastImport();
              break;
          case 'reingestClip':
              handleReingestClip(payload as ClipId | undefined);
              break;
          default:
              console.warn(`Unknown Bloom HUD action: ${action}`);
      }
  };
  
  const handleAddTrack = useCallback((newTrack: Pick<TrackData, 'trackName' | 'trackColor' | 'waveformType' | 'group'>) => {
    const newTrackData: TrackData = {
        ...newTrack,
        id: `track-${Math.random().toString(36).substring(2, 9)}`,
        role: 'standard',
        locked: false,
    };
    setTracks(prev => [...prev, newTrackData]);
    setMixerSettings(prev => ({
        ...prev,
        [newTrackData.id]: { volume: 0.75, pan: 0, isMuted: false }
    }));
    setInserts(prev => ({ // Initialize inserts for new track
      ...prev,
      [newTrackData.id]: []
    }));
    setTrackSendLevels(prev => ({
      ...prev,
      [newTrackData.id]: createDefaultSendLevels(newTrackData),
    }));
    setChannelDynamicsSettings(prev => ({
      ...prev,
      [newTrackData.id]: createDefaultDynamicsSettings(newTrackData),
    }));
    setChannelEQSettings(prev => ({
      ...prev,
      [newTrackData.id]: createDefaultEQSettings(newTrackData),
    }));
    setSelectedBusId((prev) => {
      if (prev) return prev;
      const defaultBus = MIXER_BUS_DEFINITIONS.find((bus) =>
        bus.groups.includes(newTrackData.group)
      );
      return defaultBus?.id ?? null;
    });
    setSelectedTrackId(newTrackData.id); // UX improvement: select the new track
    setIsAddTrackModalModalOpen(false);
    recordPrimeBrainEvent('track-create', { trackId: newTrackData.id, group: newTrackData.group }, 'success');
  }, []);

  const handleMixerChange = useCallback((trackId: string, setting: keyof MixerSettings, value: number | boolean) => {
    setMixerSettings(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [setting]: value
      }
    }));
  }, []);

  const isMixerSettingKey = (setting: string | number | symbol): setting is keyof MixerSettings => {
    return typeof setting === 'string' && (setting === 'volume' || setting === 'pan' || setting === 'isMuted');
  };

  const handleMixerChangeForMixer = useCallback(
    (trackId: string, setting: string | number | symbol, value: number | boolean) => {
      if (isMixerSettingKey(setting)) {
        handleMixerChange(trackId, setting, value);
      }
    },
    [handleMixerChange]
  );

  const resolveTrackDefaults = useCallback(
    (trackId: string): TrackData =>
      tracksRef.current.find((track) => track.id === trackId) ?? TWO_TRACK_TEMPLATE,
    []
  );

  const handleSendLevelChange = useCallback(
    (trackId: string, busId: string, value: number) => {
      const typedBus = busId as MixerBusId;
      setTrackSendLevels((prev) => {
        const existing = prev[trackId] ?? createDefaultSendLevels(resolveTrackDefaults(trackId));
        return {
          ...prev,
          [trackId]: {
            ...existing,
            [typedBus]: clamp01(value),
          },
        };
      });
    },
    [resolveTrackDefaults]
  );

  const handleDynamicsSettingsChange = useCallback(
    (trackId: string, patch: Partial<ChannelDynamicsSettings>) => {
      setChannelDynamicsSettings((prev) => {
        const current = prev[trackId] ?? createDefaultDynamicsSettings(resolveTrackDefaults(trackId));
        const sanitized = Object.entries(patch).reduce(
          (acc, [key, val]) => {
            if (typeof val === 'number') {
              acc[key as keyof ChannelDynamicsSettings] = clamp01(val);
            }
            return acc;
          },
          {} as Partial<ChannelDynamicsSettings>
        );
        return {
          ...prev,
          [trackId]: { ...current, ...sanitized },
        };
      });
    },
    [resolveTrackDefaults]
  );

  const handleEQSettingsChange = useCallback(
    (trackId: string, patch: Partial<ChannelEQSettings>) => {
      setChannelEQSettings((prev) => {
        const current = prev[trackId] ?? createDefaultEQSettings(resolveTrackDefaults(trackId));
        const sanitized = Object.entries(patch).reduce(
          (acc, [key, val]) => {
            if (typeof val === 'number') {
              acc[key as keyof ChannelEQSettings] = clamp01(val);
            }
            return acc;
          },
          {} as Partial<ChannelEQSettings>
        );
        return {
          ...prev,
          [trackId]: { ...current, ...sanitized },
        };
      });
    },
    [resolveTrackDefaults]
  );

  const handleToggleMute = useCallback((trackId: string) => {
    setMixerSettings(prev => {
      const current = prev[trackId] || { volume: 0.75, pan: 0, isMuted: false };
      return {
        ...prev,
        [trackId]: {
          ...current,
          isMuted: !current.isMuted,
        },
      };
    });
  }, []);

  const handleToggleSolo = (trackId: string) => {
    setSoloedTracks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(trackId)) {
            newSet.delete(trackId);
        } else {
            newSet.add(trackId);
        }
        return newSet;
    });
  };

  const handleToggleArm = useCallback((trackId: string) => {
      const trackMeta = tracksRef.current.find((track) => track.id === trackId);
      setArmedTracks(prev => {
        const newSet = new Set(prev);
        const wasArmed = newSet.has(trackId);
        if (wasArmed) {
            newSet.delete(trackId);
            recordPrimeBrainEvent('track-disarm', { trackId }, 'success');
        } else {
            newSet.add(trackId);
            recordPrimeBrainEvent('track-arm', { trackId }, 'success');
        }
        if (trackMeta?.role === 'hushRecord') {
          setIsHushActive(!wasArmed);
          recordPrimeBrainEvent('hush-toggle', { isActive: !wasArmed }, 'success');
        }
        
        // Update recording state for Flow Loop
        updateRecordState({
          armedTrack: newSet.size > 0,
        });
        
        return newSet;
    });
  }, []);

  const handleTrackContextChange = useCallback(
    (trackId: string, nextContext: TrackContextMode) => {
      let didUpdate = false;
      setTrackUiState((prev) => {
        const current =
          prev[trackId] ??
          {
            context: DEFAULT_TRACK_CONTEXT,
            laneHeight: DEFAULT_TRACK_LANE_HEIGHT,
            collapsed: false,
          };
        if (current.context === nextContext) {
          return prev;
        }
        didUpdate = true;
        return {
          ...prev,
          [trackId]: { ...current, context: nextContext },
        };
      });
      if (didUpdate) {
        publishAlsSignal({
          source: "arrange",
          meta: { trackId, context: nextContext },
        });
      }
    },
    []
  );

  const handleToggleTrackCollapse = useCallback((trackId: string) => {
    setTrackUiState((prev) => {
      const current = prev[trackId];
      if (!current) return prev;
      const collapsed = !current.collapsed;
      return {
        ...prev,
        [trackId]: { ...current, collapsed },
      };
    });
  }, []);

  const persistCurrentPianoRoll = useCallback((): MidiNote[] => {
    if (!pianoRollClipId) return [];
    const exported = exportPianoNotes();
    setPianoRollStore((prev) => {
      if (!exported.length) {
        if (!prev[pianoRollClipId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[pianoRollClipId];
        return next;
      }
      return {
        ...prev,
        [pianoRollClipId]: exported,
      };
    });
    return exported;
  }, [exportPianoNotes, pianoRollClipId]);

  const applyWarpAnchorsToClip = useCallback(
    (
      clipId: ClipId | null,
      notes: MidiNote[],
      origin: "commit" | "warp" | "export"
    ) => {
      if (!clipId) {
        return { anchors: [] as number[], clip: null as ArrangeClip | null };
      }
      const clip = clipsRef.current.find((entry) => entry.id === clipId) ?? null;
      if (!clip) {
        return { anchors: [] as number[], clip: null };
      }
      const anchors = deriveWarpAnchorsFromNotes(notes, clip.duration);
      setClips((prev) =>
        prev.map((entry) =>
          entry.id === clipId ? { ...entry, warpAnchors: anchors } : entry
        )
      );
      const track = resolveTrackDefaults(clip.trackId);
      const swatch = TRACK_COLOR_SWATCH[track.trackColor];
      const anchorCount = anchors.length;
      const noteCount = notes.length;
      let message: string;
      switch (origin) {
        case "warp":
          message = anchorCount
            ? `Warp anchors refreshed (${anchorCount})`
            : "Warp anchors cleared";
          break;
        case "export":
          message = noteCount
            ? `MIDI blueprint exported (${noteCount} notes)`
            : "No MIDI notes to export from this clip";
          break;
        default:
          message = anchorCount
            ? `Piano Roll locked • ${noteCount} notes, ${anchorCount} warp pins`
            : `Piano Roll locked • ${noteCount} notes`;
      }
      appendHistoryNote({
        id: `piano-roll-${origin}-${Date.now()}`,
        timestamp: Date.now(),
        scope: "timeline",
        message,
        accent: swatch.glow,
      });
      const bloomAction =
        origin === "warp"
          ? "pianoRollWarpAnchors"
          : origin === "export"
          ? "pianoRollExportMidi"
          : "pianoRollCommit";
      publishBloomSignal({
        source: "system",
        action: bloomAction,
        payload: {
          clipId,
          trackId: clip.trackId,
          origin,
          noteCount,
          warpAnchorCount: anchorCount,
        },
      });
      publishAlsSignal({
        source: "arrange",
        meta: {
          trackId: clip.trackId,
          clipId,
          origin,
          pianoRoll: {
            noteCount,
            warpAnchors: anchors,
          },
        },
      });
      return { anchors, clip };
    },
    [appendHistoryNote, publishAlsSignal, publishBloomSignal, resolveTrackDefaults, setClips]
  );

  const handleOpenPianoRoll = useCallback(
    (targetClip: ArrangeClip) => {
      persistCurrentPianoRoll();
      const trackMatch =
        tracks.find((entry) => entry.id === targetClip.trackId) ?? null;
      const swatch = TRACK_COLOR_SWATCH[trackMatch?.trackColor ?? "cyan"];
      const storedNotes = pianoRollStore[targetClip.id] ?? [];
      loadPianoNotes(storedNotes, swatch.base);
      setPianoRollState((prev) => ({
        ...prev,
        playheadPosition: 0,
        scrollX: 0,
      }));
      setSelectedTrackId(targetClip.trackId);
      handleTrackContextChange(targetClip.trackId, "edit");
      appendHistoryNote({
        id: `timeline-pr-${Date.now()}`,
        timestamp: Date.now(),
        scope: "timeline",
        message: `Piano Roll view engaged for ${targetClip.name}`,
        accent: swatch.glow,
      });
      publishBloomSignal({
        source: "system",
        action: "openPianoRoll",
        payload: { clipId: targetClip.id, trackId: targetClip.trackId },
      });
      setPianoRollTrackId(targetClip.trackId);
      setPianoRollClipId(targetClip.id);
      setIsPianoRollOpen(true);
    },
    [
      appendHistoryNote,
      handleTrackContextChange,
      loadPianoNotes,
      persistCurrentPianoRoll,
      pianoRollStore,
      publishBloomSignal,
      setPianoRollState,
      tracks,
    ]
  );

  const handleClosePianoRoll = useCallback(() => {
    persistCurrentPianoRoll();
    if (pianoRollTrackId) {
      handleTrackContextChange(pianoRollTrackId, DEFAULT_TRACK_CONTEXT);
    }
    setIsPianoRollOpen(false);
    setPianoRollClipId(null);
    setPianoRollTrackId(null);
  }, [handleTrackContextChange, persistCurrentPianoRoll, pianoRollTrackId]);

  const handleCommitPianoRoll = useCallback(() => {
    const notes = persistCurrentPianoRoll();
    applyWarpAnchorsToClip(pianoRollClipId, notes, "commit");
  }, [applyWarpAnchorsToClip, persistCurrentPianoRoll, pianoRollClipId]);

  const handleApplyWarpAnchors = useCallback(() => {
    const notes = persistCurrentPianoRoll();
    applyWarpAnchorsToClip(pianoRollClipId, notes, "warp");
  }, [applyWarpAnchorsToClip, persistCurrentPianoRoll, pianoRollClipId]);

  const handleExportPianoRollMidi = useCallback(() => {
    const notes = persistCurrentPianoRoll();
    const { clip } = applyWarpAnchorsToClip(pianoRollClipId, notes, "export");
    if (!clip || !notes.length) {
      return;
    }
    try {
      const payload = {
        clipId: clip.id,
        trackId: clip.trackId,
        trackName: resolveTrackDefaults(clip.trackId).trackName,
        notes,
      };
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${clip.name.replace(/\s+/g, "_")}-piano-roll.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn("[PIANO ROLL] Failed to export MIDI sketch:", error);
    }
  }, [applyWarpAnchorsToClip, persistCurrentPianoRoll, pianoRollClipId, resolveTrackDefaults]);

  const activePianoClip = useMemo(
    () =>
      pianoRollClipId
        ? clips.find((clip) => clip.id === pianoRollClipId) ?? null
        : null,
    [clips, pianoRollClipId]
  );

  const activePianoTrack = useMemo(
    () =>
      pianoRollTrackId
        ? tracks.find((track) => track.id === pianoRollTrackId) ?? null
        : null,
    [tracks, pianoRollTrackId]
  );

  useEffect(() => {
    if (viewMode !== "arrange" && isPianoRollOpen) {
      handleClosePianoRoll();
    }
  }, [handleClosePianoRoll, isPianoRollOpen, viewMode]);

  const handleResizeTrack = useCallback((trackId: string, height: number) => {
    const clamped = Math.max(
      MIN_TRACK_LANE_HEIGHT,
      Math.min(MAX_TRACK_LANE_HEIGHT, height)
    );
    setTrackUiState((prev) => {
      const current = prev[trackId];
      if (!current) return prev;
      if (Math.abs(current.laneHeight - clamped) < 1) {
        return prev;
      }
      return {
        ...prev,
        [trackId]: { ...current, laneHeight: clamped, collapsed: false },
      };
    });
  }, []);

  const handleOpenTrackCapsule = useCallback((trackId: string) => {
    setActiveCapsuleTrackId(trackId);
    publishAlsSignal({
      source: "arrange",
      meta: { trackId, capsule: "open" },
    });
  }, []);

  const handleCloseTrackCapsule = useCallback(() => {
    setActiveCapsuleTrackId(null);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, trackId });
  };

  const handleDeleteTrack = (trackId: string) => {
    const targetTrack = tracksRef.current.find((track) => track.id === trackId);
    if (targetTrack?.locked) {
      console.warn(`[FLOW] Attempted to delete locked track ${targetTrack.trackName}. Ignored.`);
      setContextMenu(null);
      return;
    }
    const removedClipIds = clipsRef.current
      .filter((clip) => clip.trackId === trackId)
      .map((clip) => clip.id);
    if (removedClipIds.length) {
      setPianoRollStore((prev) => {
        const next = { ...prev };
        removedClipIds.forEach((clipId) => {
          delete next[clipId];
        });
        return next;
      });
    }
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setClips(prev => prev.filter(c => c.trackId !== trackId));
    setMixerSettings(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setInserts(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setTrackSendLevels(prev => {
      const { [trackId]: _, ...rest } = prev;
      return rest;
    });
    setChannelDynamicsSettings(prev => {
      const { [trackId]: _, ...rest } = prev;
      return rest;
    });
    setChannelEQSettings(prev => {
      const { [trackId]: _, ...rest } = prev;
      return rest;
    });
    setAutomationData(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setVisibleAutomationLanes(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setSoloedTracks(prev => { const newSet = new Set(prev); newSet.delete(trackId); return newSet; });
    setArmedTracks(prev => { const newSet = new Set(prev); newSet.delete(trackId); return newSet; });
    setContextMenu(null);
    if (selectedTrackId === trackId) setSelectedTrackId(null);
  };
  
  const handleRenameTrack = (trackId: string, newName: string) => {
    const targetTrack = tracksRef.current.find((track) => track.id === trackId);
    if (targetTrack?.locked) {
      console.warn(`[FLOW] Attempted to rename locked track ${targetTrack.trackName}. Ignored.`);
      setRenameModal(null);
      return;
    }
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, trackName: newName.toUpperCase() } : t));
    setRenameModal(null);
  };

  const handleChangeColor = (trackId: string, newColor: TrackData['trackColor']) => {
    const targetTrack = tracksRef.current.find((track) => track.id === trackId);
    if (targetTrack?.locked) {
      console.warn(`[FLOW] Attempted to recolor locked track ${targetTrack.trackName}. Ignored.`);
      setChangeColorModal(null);
      return;
    }
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, trackColor: newColor } : t));
    setChangeColorModal(null);
  };
  
  const rebuildTrackRouting = useCallback((trackId: string) => {
    const ctx = audioContextRef.current;
    const master = masterNodesRef.current;
    if (!ctx || !master) return;

    const trackNodes = trackNodesRef.current[trackId];
    if (!trackNodes) return;

    try {
      trackNodes.input.disconnect();
      trackNodes.gain.disconnect();
      trackNodes.panner.disconnect();
      trackNodes.analyser.disconnect();
    } catch (error) {
      console.warn(`[AUDIO] Failed to disconnect nodes for track ${trackId}`, error);
    }

    trackNodes.input.connect(trackNodes.gain);
    trackNodes.gain.connect(trackNodes.panner);

    let currentOutput: AudioNode = trackNodes.panner;
    const trackInserts = insertsRef.current[trackId] || [];
    trackInserts.forEach((fxId) => {
      const fxNode = fxNodesRef.current[fxId];
      if (fxNode) {
        try {
          currentOutput.connect(fxNode.input);
          currentOutput = fxNode.output;
        } catch (error) {
          console.warn(`[AUDIO] Failed to connect FX ${fxId} for track ${trackId}`, error);
        }
      }
    });

    currentOutput.connect(trackNodes.analyser);
    const bus = signalMatrixRef.current?.routeTrack(trackId, tracksRef.current.find(t => t.id === trackId)?.role as any);
    if (bus) {
      currentOutput.connect(bus);
    } else {
      currentOutput.connect(master.input);
    }
  }, []);

  const resolvePluginMeta = useCallback(
    (pluginId: FxWindowId) => {
      const registryEntry = pluginRegistry.find((plugin) => plugin.id === pluginId);
      const palette = pluginPaletteMap[pluginId];
      return {
        name: registryEntry?.name ?? pluginId,
        palette:
          palette ?? {
            colorKey: 'purple' as TrackColorKey,
            base: TRACK_COLOR_SWATCH.purple.base,
            glow: TRACK_COLOR_SWATCH.purple.glow,
          },
      };
    },
    [pluginPaletteMap, pluginRegistry]
  );

  const emitMixerAction = useCallback(
    (trackId: string | null, action: string, pluginId: FxWindowId, energy = 0.6) => {
      const meta = resolvePluginMeta(pluginId);
      const palette = derivePulsePalette(meta.palette.colorKey, energy, energy * 0.75);
      const pulse = deriveActionPulse(palette, energy);
      if (trackId) {
        setMixerActionPulse({
          trackId,
          pulse,
          message: `${action} • ${meta.name}`,
        });
      }
      appendHistoryNote({
        id: `mixer-${pluginId}-${Date.now()}`,
        timestamp: Date.now(),
        scope: 'mixer',
        message: `${action} • ${meta.name}`,
        accent: palette.accent,
      });
    },
    [resolvePluginMeta]
  );

  const snapshotPluginParams = useCallback(
    (pluginId: FxWindowId): Record<string, number> => {
      const engine = engineInstancesRef.current.get(pluginId);
      if (!engine) return {};
      const names = engine.getParameterNames();
      if (!names || names.length === 0) {
        const windowConfig = fxWindows.find((fx) => fx.id === pluginId);
        if (windowConfig && windowConfig.params && typeof windowConfig.params === 'object') {
          return Object.entries(windowConfig.params).reduce<Record<string, number>>(
            (acc, [key, value]) => {
              if (typeof value === 'number') acc[key] = value;
              return acc;
            },
            {}
          );
        }
        return {};
      }

      return names.reduce<Record<string, number>>((acc, paramName) => {
        acc[paramName] = engine.getParameter(paramName);
        return acc;
      }, {});
    },
    [fxWindows]
  );

  const applyPluginParams = useCallback(
    (pluginId: FxWindowId, params: Record<string, number>) => {
      const engine = engineInstancesRef.current.get(pluginId);
      if (!engine) return;
      Object.entries(params).forEach(([param, value]) => {
        engine.setParameter(param, value);
      });

      switch (pluginId) {
        case 'velvet-curve':
          setVelvetCurveState(getVelvetCurveEngine().getState());
          break;
        case 'harmonic-lattice':
          setHarmonicLatticeState(getHarmonicLattice().getHarmonicLatticeState());
          break;
        case 'mixx-fx':
          // Mixx FX updates directly via engine; nothing additional needed
          break;
        default:
          break;
      }
    },
    []
  );

  const handleTogglePluginFavorite = useCallback((pluginId: FxWindowId) => {
    setPluginFavorites((prev) => {
      const next = { ...prev, [pluginId]: !prev[pluginId] };
      if (!next[pluginId]) {
        delete next[pluginId];
      }
      return { ...next };
    });
  }, []);

  const handleSavePluginPreset = useCallback(
    (pluginId: FxWindowId, label: string, trackContext?: string) => {
      const params = snapshotPluginParams(pluginId);
      if (!Object.keys(params).length) {
        console.warn(`[PRESET] No parameters captured for plugin ${pluginId}.`);
        return;
      }
      const preset: PluginPreset = {
        id: `${pluginId}-${Date.now()}`,
        label,
        params,
        savedAt: new Date().toISOString(),
        trackContext,
      };
      setPluginPresets((prev) => upsertPluginPreset(prev, pluginId, preset));
    },
    [snapshotPluginParams]
  );

  const handleLoadPluginPreset = useCallback(
    (pluginId: FxWindowId, presetId: string) => {
      const bank = pluginPresets[pluginId] ?? [];
      const preset = bank.find((entry) => entry.id === presetId);
      if (!preset) return;
      applyPluginParams(pluginId, preset.params);
    },
    [applyPluginParams, pluginPresets]
  );

  const handleDeletePluginPreset = useCallback((pluginId: FxWindowId, presetId: string) => {
    setPluginPresets((prev) => removePluginPreset(prev, pluginId, presetId));
  }, []);

  // --- Dynamic Plugin Management ---
  const handleAddPlugin = useCallback((trackId: string, pluginId: FxWindowId) => {
    setInserts(prev => {
      const currentInserts = prev[trackId] || [];
      return {
        ...prev,
        [trackId]: [...currentInserts, pluginId],
      };
    });
    // Initialize bypass state for the new plugin if it doesn't exist
    setFxBypassState(prev => ({
      ...prev,
      [pluginId]: prev[pluginId] ?? false, // Default to not bypassed
    }));
    setIsPluginBrowserOpen(false);
    setTrackIdForPluginBrowser(null);
    emitMixerAction(trackId, 'Insert Added', pluginId, 0.72);
  }, [emitMixerAction]);

  const handleRemovePlugin = useCallback((trackId: string, index: number) => {
    let removedPluginId: FxWindowId | undefined;
    setInserts(prev => {
      const currentInserts = prev[trackId] || [];
      removedPluginId = currentInserts[index];
      if (!removedPluginId) {
        return prev;
      }
      const updatedInserts = currentInserts.filter((_, i) => i !== index);
      return {
        ...prev,
        [trackId]: updatedInserts,
      };
    });

    if (!removedPluginId) {
      return;
    }

    setAutomationData(autoPrev => {
      const updatedAutomation = { ...autoPrev };
      if (updatedAutomation[trackId]) {
        const { [removedPluginId!]: _, ...restFxAutomation } = updatedAutomation[trackId];
        updatedAutomation[trackId] = restFxAutomation;
      }
      return updatedAutomation;
    });

    setVisibleAutomationLanes(visiblePrev => {
      const updatedVisible = { ...visiblePrev };
      if (updatedVisible[trackId]?.fxId === removedPluginId) {
        updatedVisible[trackId] = null;
      }
      return updatedVisible;
    });

    setFxBypassState(bypassPrev => {
      const updatedBypass = { ...bypassPrev };
      const { [removedPluginId!]: _, ...restBypassState } = updatedBypass;
      return restBypassState;
    });

    emitMixerAction(trackId, 'Insert Removed', removedPluginId, 0.55);
  }, [emitMixerAction]);

  const handleMovePlugin = useCallback((trackId: string, fromIndex: number, toIndex: number) => {
    let movedPluginId: FxWindowId | undefined;
    setInserts(prev => {
      const currentInserts = prev[trackId] || [];
      if (fromIndex < 0 || fromIndex >= currentInserts.length) {
        return prev;
      }
      const updated = [...currentInserts];
      const [moved] = updated.splice(fromIndex, 1);
      if (!moved) {
        return prev;
      }
      movedPluginId = moved;
      updated.splice(toIndex, 0, moved);
      return {
        ...prev,
        [trackId]: updated,
      };
    });

    if (movedPluginId) {
      emitMixerAction(trackId, 'Insert Moved', movedPluginId, 0.48);
    }
  }, [emitMixerAction]);

  useEffect(() => {
    tracks.forEach(track => rebuildTrackRouting(track.id));
  }, [inserts, tracks, rebuildTrackRouting]);

    // --- Automation Handlers ---
  const handleToggleAutomationLane = useCallback((trackId: string, fxId: string, paramName: string) => {
    setVisibleAutomationLanes(prev => {
      const current = prev[trackId];
      if (current && current.fxId === fxId && current.paramName === paramName) {
        return { ...prev, [trackId]: null }; // Hide if already visible
      }
      return { ...prev, [trackId]: { fxId, paramName } }; // Show new lane
    });
    setAutomationParamMenu(null); // Close menu after selection
  }, []);


  const handleAddAutomationPoint = useCallback((trackId: string, fxId: string, paramName: string, point: AutomationPoint) => {
    // Record history
    import('./utils/history').then(({ recordHistory }) => {
      recordHistory({
        type: 'automation-point',
        trackId,
        parameter: `${fxId}:${paramName}`,
        time: point.time,
        oldValue: null,
        newValue: point.value,
      });
    });
    
    setAutomationData(prev => {
        const trackAutomation = prev[trackId] || {};
        const fxAutomation = trackAutomation[fxId] || {};
        const paramPoints = [...(fxAutomation[paramName] || []), point];
        paramPoints.sort((a, b) => a.time - b.time);
        return { 
          ...prev, 
          [trackId]: {
            ...trackAutomation,
            [fxId]: {
              ...fxAutomation,
              [paramName]: paramPoints
            }
          }
        };
    });
  }, []);
  
  const handleUpdateAutomationPoint = useCallback((trackId: string, fxId: string, paramName: string, index: number, newPoint: AutomationPoint) => {
    // Record history
    setAutomationData(prev => {
        const trackAutomation = prev[trackId];
        if (!trackAutomation) return prev;
        const fxAutomation = trackAutomation[fxId];
        if (!fxAutomation) return prev;
        const paramPoints = [...fxAutomation[paramName]];
        const oldPoint = paramPoints[index];
        
        // Record history before update
        if (oldPoint) {
          import('./utils/history').then(({ recordHistory }) => {
            recordHistory({
              type: 'automation-point',
              trackId,
              parameter: `${fxId}:${paramName}`,
              time: newPoint.time,
              oldValue: oldPoint.value,
              newValue: newPoint.value,
            });
          });
        }
        
        paramPoints[index] = newPoint;
        paramPoints.sort((a, b) => a.time - b.time); // Re-sort if time changed
        return { 
          ...prev, 
          [trackId]: {
            ...trackAutomation,
            [fxId]: {
              ...fxAutomation,
              [paramName]: paramPoints
            }
          }
        };
    });
  }, []);
  
  const handleDeleteAutomationPoint = useCallback((trackId: string, fxId: string, paramName: string, index: number) => {
    // Record history
    setAutomationData(prev => {
        const trackAutomation = prev[trackId];
        if (!trackAutomation) return prev;
        const fxAutomation = trackAutomation[fxId];
        if (!fxAutomation) return prev;
        const paramPoints = fxAutomation[paramName];
        const deletedPoint = paramPoints[index];
        
        // Record history before deletion
        if (deletedPoint) {
          import('./utils/history').then(({ recordHistory }) => {
            recordHistory({
              type: 'automation-point',
              trackId,
              parameter: `${fxId}:${paramName}`,
              time: deletedPoint.time,
              oldValue: deletedPoint.value,
              newValue: null,
            });
          });
        }
        
        const filteredPoints = paramPoints.filter((_, i) => i !== index);
        return { 
          ...prev, 
          [trackId]: {
            ...trackAutomation,
            [fxId]: {
              ...fxAutomation,
              [paramName]: filteredPoints
            }
          }
        };
    });
  }, []);

  // Audio setup effect
  useEffect(() => {
    if (skipAudioSetupWarmupRef.current) {
      skipAudioSetupWarmupRef.current = false;
      return;
    }
    let isCancelled = false;
    let ctx: AudioContext | null = null;

    const setupAudio = async () => {
        console.log("Setting up AudioContext and FX engines...");
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const createdCtx = new AudioCtx();

        if (isCancelled) {
            await createdCtx.close().catch(() => {});
            return;
        }

        // Reset graph containers before wiring up the new context
        trackNodesRef.current = {};
        fxNodesRef.current = {};
        engineInstancesRef.current.clear();
        masterNodesRef.current = null;
        trackMeterBuffersRef.current = {};
        masterMeterBufferRef.current = null;
        setMasterReady(false); // Reset master ready gate
        queuedRoutesRef.current = []; // Clear queued routes
        audioContextRef.current = createdCtx;
        ctx = createdCtx;

        const duration = 1;
        const sampleRate = createdCtx.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = createdCtx.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.2; // A4 tone
        }
        if (isCancelled) {
            await createdCtx.close().catch(() => {});
            return;
        }
        setAudioBuffers({ 'default': buffer });
        console.log("Default audio buffer created.");

        masterNodesRef.current = await buildMasterChain(createdCtx);
        if (isCancelled || createdCtx.state === "closed") {
          return;
        }
        // Initialize Mixx Club Signal Matrix (buses -> master)
        try {
          signalMatrixRef.current = createSignalMatrix(createdCtx, masterNodesRef.current.input);
        } catch (err) {
          console.warn('[AUDIO] Failed to initialize Mixx Signal Matrix', err);
        }

        // Apply initial master volume calibration (trim on top of LUFS gain)
        masterNodesRef.current.setMasterTrim(masterVolume);

        // Expose master chain state to Prime Brain (via window global)
        const profile = masterNodesRef.current.getProfile();
        if (typeof window !== 'undefined') {
          window.__mixx_masterChain = {
            targetLUFS: profile.targetLUFS,
            profile: profile.name.toLowerCase().replace(/\s+/g, '-'),
            calibrated: true, // Master chain is calibrated on build
            masterVolume: masterVolume,
          };
        }
        const translationMatrix = new TranslationMatrix(createdCtx);
        translationMatrix.attach(masterNodesRef.current.output, createdCtx.destination);
        translationMatrix.activate(translationProfileRef.current);
        translationMatrixRef.current = translationMatrix;
        const masterAnalyser = masterNodesRef.current.analyser;
        masterAnalyser.fftSize = TRACK_ANALYSER_FFT;
        masterAnalyser.smoothingTimeConstant = MASTER_ANALYSER_SMOOTHING;
        masterAnalyser.minDecibels = MIN_DECIBELS;
        masterAnalyser.maxDecibels = MAX_DECIBELS;
        
        // Expose master analyser to flow loop for contextual audio detection
        // This is the "listening" part - flow loop can check for actual audio
        if (typeof window !== 'undefined') {
          (window as any).__mixx_masterAnalyser = masterAnalyser;
        }
        masterMeterBufferRef.current = ensureMasterMeterBuffers(
          masterMeterBufferRef.current,
          masterAnalyser
        );
        if (velvetLoudnessMeterRef.current && loudnessListenerRef.current) {
          velvetLoudnessMeterRef.current.removeEventListener(
            "metrics",
            loudnessListenerRef.current as EventListener
          );
          loudnessListenerRef.current = null;
        }
        velvetLoudnessMeterRef.current = new VelvetLoudnessMeter();
        const meter = velvetLoudnessMeterRef.current;
        if (meter) {
          if (loudnessListenerRef.current) {
            meter.removeEventListener('metrics', loudnessListenerRef.current as EventListener);
          }
          if (isCancelled || createdCtx.state === "closed") {
            return;
          }
          await meter.initialize(createdCtx);
          if (isCancelled || createdCtx.state === "closed") {
            return;
          }
          meter.reset();
          setLoudnessMetrics(DEFAULT_VELVET_LOUDNESS_METRICS);
          const handler = (event: Event) => {
            if (isCancelled) return;
            const metricsEvent = event as CustomEvent<VelvetLoudnessMetrics>;
            if (metricsEvent.detail) {
              setLoudnessMetrics(metricsEvent.detail);
            }
          };
          meter.addEventListener('metrics', handler as EventListener);
          loudnessListenerRef.current = handler;

          if (isCancelled || createdCtx.state === "closed" || !masterNodesRef.current) {
            return;
          }
          const complianceTap = masterNodesRef.current.complianceTap;
          const softLimiterNode = masterNodesRef.current.softLimiter;
          const meterNode = meter.getNode();
          try {
            complianceTap.disconnect();
          } catch (err) {
            console.warn('[AUDIO] Compliance tap disconnect issue', err);
          }
          if (meterNode) {
            try {
              meterNode.disconnect();
            } catch (err) {
              // Ignore stale disconnect attempts
            }
            complianceTap.connect(meterNode as AudioNode);
            (meterNode as AudioNode).connect(softLimiterNode);
          } else {
            complianceTap.connect(softLimiterNode);
          }
        }

        console.log("[MIXER] Master Chain built and connected to destination.");
        setMasterReady(true);
        
        if (isCancelled || createdCtx.state === "closed") {
          return;
        }
        const initialPluginRegistry = getPluginRegistry(createdCtx);
        if (isCancelled) {
            await createdCtx.close().catch(() => {});
            return;
        }
        setPluginRegistry(initialPluginRegistry);
        console.log("Plugin Registry loaded.");

        engineInstancesRef.current.clear();
        for (const plugin of initialPluginRegistry) {
            if (isCancelled) break;
            if (createdCtx.state === "closed") {
              break;
            }
            const engine = plugin.engineInstance(createdCtx);
            engineInstancesRef.current.set(plugin.id, engine);
            if (typeof engine.initialize === 'function' && !engine.getIsInitialized()) {
                if (isCancelled || createdCtx.state === "closed") {
                  break;
                }
                await engine.initialize(createdCtx);
                console.log(`Plugin engine for ${plugin.name} initialized.`);
            }
        }
        if (isCancelled) {
            return;
        }
        console.log("All plugin engines initialized and stored.");

        setFxBypassState(() => {
          const initialState: Record<FxWindowId, boolean> = {};
          initialPluginRegistry.forEach(plugin => (initialState[plugin.id] = false));
          return initialState;
        });
        if (!stemIntegrationRef.current) {
          const integration = new StemSeparationIntegration(createdCtx);
          integration.onProgress((message, percent) => {
            const suffix = typeof percent === 'number' ? ` (${Math.round(percent)}%)` : '';
            setImportMessage(`${message}${suffix}`);
            const jobId = activeStemJobRef.current;
            if (!jobId) {
              return;
            }
            ingestQueueRef.current?.reportProgress(jobId, {
              percent: typeof percent === 'number' ? percent : undefined,
              message,
            });
            const normalizedMessage = message.toLowerCase();
            const match = STEM_MESSAGE_MATCHERS.find((matcher) =>
              matcher.keywords.some((keyword) => normalizedMessage.includes(keyword))
            );
            if (match) {
              const colorKey = STEM_COLOR_BY_KEY[match.key] ?? 'cyan';
              const accent = TRACK_COLOR_SWATCH[colorKey].glow;
              upsertImportProgress({
                id: `${jobId}::${match.key}`,
                parentId: jobId,
                label: `${match.key.toUpperCase()} LANE`,
                percent: typeof percent === 'number' ? percent : 0,
                type: 'stem',
                color: accent,
              });
            } else {
              upsertImportProgress({
                id: jobId,
                label: message,
                percent: typeof percent === 'number' ? percent : 0,
                type: 'file',
              });
            }
          });
          stemIntegrationRef.current = integration;
          // Pre-warm stem model worker immediately
          try {
            integration.prewarm();
          } catch (err) {
            console.warn('[STEMS] prewarm not available', err);
          }
        }
    };
    setupAudio();

    return () => {
        isCancelled = true;
        console.log("Closing AudioContext.");

        // Disconnect track nodes
        Object.values(trackNodesRef.current).forEach(nodes => {
            try {
                nodes.input.disconnect();
                nodes.gain.disconnect();
                nodes.panner.disconnect();
                nodes.analyser.disconnect();
                nodes.preFaderMeter.disconnect(); // Flow Meter Stack cleanup
            } catch (err) {
                console.warn("Error disconnecting track nodes during cleanup:", err);
            }
        });
        trackNodesRef.current = {};

        // Disconnect FX nodes
        Object.values(fxNodesRef.current).forEach(fxNode => {
            try {
                fxNode.input.disconnect();
                fxNode.output.disconnect();
                fxNode.bypass.disconnect();
                fxNode.direct.disconnect();
                fxNode.engine?.dispose?.();
            } catch (err) {
                console.warn("Error disconnecting FX nodes during cleanup:", err);
            }
        });
        fxNodesRef.current = {};

        engineInstancesRef.current.forEach(engine => {
            if (engine && typeof engine.dispose === 'function') {
                try {
                    engine.dispose();
                } catch (err) {
                    console.warn("Error disposing engine during cleanup:", err);
                }
            }
        });
        engineInstancesRef.current.clear();

        masterNodesRef.current = null;
        masterMeterBufferRef.current = null;
        trackMeterBuffersRef.current = {};
        translationMatrixRef.current?.dispose();
        translationMatrixRef.current = null;
        hushProcessorNodeRef.current = null;
        micSourceNodeRef.current = null;

        const contextToClose = ctx ?? audioContextRef.current;
        audioContextRef.current = null;
        if (contextToClose) {
            contextToClose.close().catch(() => {});
        }
    };
  }, [upsertImportProgress]);


  // Set clock for beat-locked LFOs
  useEffect(() => {
    if (!audioContextRef.current || pluginRegistry.length === 0) return;

    const getBeatPhase = () => {
      if (!isPlaying) return 0;
      const beatDuration = 60 / bpm;
      return (currentTime % beatDuration) / beatDuration;
    };

    engineInstancesRef.current.forEach(engine => {
        if (engine && typeof engine.setClock === 'function') {
            engine.setClock(getBeatPhase);
        }
    });

  }, [isPlaying, currentTime, pluginRegistry, bpm]);


  // Create/Destroy track audio nodes when tracks change
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const currentTrackIds = new Set(tracks.map(t => t.id));
    const existingNodeIds = new Set(Object.keys(trackNodesRef.current));

    // Create nodes for new tracks
    tracks.forEach(track => {
        if (!existingNodeIds.has(track.id)) {
            // Pre-fader meter node (STEP 1 - Flow Meter Stack)
            const preFaderMeter = ctx.createAnalyser();
            preFaderMeter.fftSize = 2048;
            preFaderMeter.smoothingTimeConstant = 0.85;
            preFaderMeter.minDecibels = MIN_DECIBELS;
            preFaderMeter.maxDecibels = MAX_DECIBELS;

            trackNodesRef.current[track.id] = {
                input: ctx.createGain(), // Main input for signal chain
                gain: ctx.createGain(),
                panner: ctx.createStereoPanner(),
                analyser: ctx.createAnalyser(), // Post-fader analyser
                preFaderMeter, // Pre-fader meter tap
            };
            // Initial connection will be handled by the main routing useEffect
            // Nodes are created, but connections established later
        }

        const analyser = trackNodesRef.current[track.id]?.analyser;
        if (analyser) {
          analyser.fftSize = TRACK_ANALYSER_FFT;
          analyser.smoothingTimeConstant = TRACK_ANALYSER_SMOOTHING;
          analyser.minDecibels = MIN_DECIBELS;
          analyser.maxDecibels = MAX_DECIBELS;
          trackMeterBuffersRef.current[track.id] = ensureTrackMeterBuffers(
            trackMeterBuffersRef.current,
            track.id,
            analyser
          );
        }
    });

    // Destroy nodes for removed tracks
    existingNodeIds.forEach(id => {
        if (!currentTrackIds.has(id)) {
            const nodes = trackNodesRef.current[id];
            // Disconnect all nodes in the chain
            try {
              nodes.input.disconnect();
              nodes.gain.disconnect();
              nodes.panner.disconnect();
              nodes.analyser.disconnect();
              nodes.preFaderMeter.disconnect(); // Flow Meter Stack cleanup
            } catch (e) { console.warn(`Error disconnecting nodes for track ${id}:`, e); }
            delete trackNodesRef.current[id];
            delete trackMeterBuffersRef.current[id];
            console.log(`%c[AUDIO] Disposed nodes for track: ${id}`, "color: grey");
        }
    });
  }, [tracks]);

    // Update audio graph based on mixer settings (pan only) - automation overrides gain
    useEffect(() => {
        tracks.forEach(track => {
            const nodes = trackNodesRef.current[track.id];
            const settings = mixerSettings[track.id];
            if (nodes && settings && audioContextRef.current) {
                // Volume automation handles nodes.gain.gain.value
                // Pan is still controlled by mixer settings if not automated
                nodes.panner.pan.setTargetAtTime(settings.pan, audioContextRef.current.currentTime, 0.01);
            }
        });
    }, [mixerSettings, tracks]);

    // Connect master volume and pan controls to the audio engine
    // Master volume is a trim on top of calibrated LUFS gain (via setMasterTrim)
    useEffect(() => {
        if (masterNodesRef.current && audioContextRef.current) {
            const now = audioContextRef.current.currentTime;
            // Use setMasterTrim to apply volume as trim on calibrated gain
            masterNodesRef.current.setMasterTrim(masterVolume);
            if (masterNodesRef.current.panner) {
                masterNodesRef.current.panner.pan.setTargetAtTime(masterBalance, now, 0.01);
            }
            
            // Update Prime Brain with current master chain state
            if (typeof window !== 'undefined' && window.__mixx_masterChain) {
                const profile = masterNodesRef.current.getProfile();
                window.__mixx_masterChain.masterVolume = masterVolume;
                window.__mixx_masterChain.targetLUFS = profile.targetLUFS;
                window.__mixx_masterChain.calibrated = true;
            }
        }
    }, [masterVolume, masterBalance]);


    // Create/Update FX nodes for ALL plugins in registry with proper bypass circuit
    useEffect(() => {
      const ctx = audioContextRef.current;
      if (!ctx || pluginRegistry.length === 0) return;
      
      // Guard: Only run if context state is running or suspended (not closed)
      if (ctx.state === 'closed') return;
      
      pluginRegistry.forEach(plugin => {
        const id = plugin.id;
        if (!fxNodesRef.current[id]) {
          try {
            const input = ctx.createGain(); // Main input for this FX node wrapper
            const bypass = ctx.createGain(); // WET path gain (signal goes through engine)
            const direct = ctx.createGain(); // DRY path gain (signal bypasses engine)
            const output = ctx.createGain(); // Output from this FX node wrapper
            
            const engine = engineInstancesRef.current.get(id);

            // Connect dry path
            input.connect(direct);
            direct.connect(output);

            // Connect wet path
            input.connect(bypass); 
            if (engine && engine.input && engine.output) {
              // Guard: Ensure engine nodes belong to the same context
              if (engine.input.context === ctx && engine.output.context === ctx) {
                // If an IAudioEngine is available, connect it into the wet path
                // FIX: Ensure engine.makeup is used in the wet path
                bypass.connect(engine.input); // Audio from input wrapper goes to engine's input
                engine.output.connect(engine.makeup); // Engine's actual output to its makeup gain
                engine.makeup.connect(output); // Engine's makeup gain to wrapper's output
                console.log(`%c[FX] Initialized engine for plugin: ${id}`, "color: lightgreen");
              } else {
                console.warn(`%c[FX] Plugin '${id}' engine nodes belong to different context, skipping connection.`, "color: orange");
                bypass.connect(output);
              }
            } else {
               // If no engine or no proper input/output, wet path is still there but passes directly
               bypass.connect(output);
               console.warn(`%c[FX] Plugin '${id}' has no IAudioEngine, or engine missing input/output. Wet path will be direct.`, "color: yellow");
            }
            
            fxNodesRef.current[id] = { input, output, bypass, direct, engine };
          } catch (error) {
            console.error(`[FX] Failed to initialize plugin '${id}':`, error);
          }
        }
      });
    }, [pluginRegistry]); // Removed audioContextRef.current from deps - refs don't trigger re-renders

    // Update FX bypass state
    const handleToggleBypass = useCallback((fxId: FxWindowId, trackId?: string) => {
      let nextBypassState = false;
      setFxBypassState(prev => {
        const previous = prev[fxId] ?? false;
        nextBypassState = !previous;
        return { ...prev, [fxId]: nextBypassState };
      });

      emitMixerAction(
        trackId ?? null,
        nextBypassState ? 'Insert Bypassed' : 'Insert Engaged',
        fxId,
        nextBypassState ? 0.4 : 0.6
      );
    }, [emitMixerAction]);

    useEffect(() => {
        Object.entries(fxBypassState).forEach(([id, isBypassed]) => {
            const fxNode = fxNodesRef.current[id as FxWindowId];
            if (fxNode && audioContextRef.current) {
                const now = audioContextRef.current.currentTime;
                // Crossfade between direct (dry) and bypass (wet)
                fxNode.direct.gain.setTargetAtTime(isBypassed ? 1.0 : 0.0, now, 0.015);
                fxNode.bypass.gain.setTargetAtTime(isBypassed ? 0.0 : 1.0, now, 0.015);
            }
        });
    }, [fxBypassState]);

    // --- Dynamic Audio Routing (Inserts based, Including Mic Input) ---
    useEffect(() => {
        const ctx = audioContextRef.current;
        if (!ctx) {
          // Audio context not yet initialized - expected during startup
          return;
        }
        
        if (!masterNodesRef.current) {
          // Master chain not yet initialized - expected during startup
          return;
        }
        
        if (!masterReady) {
          // Master not ready yet - queue routing for when it becomes ready
          // Queue all tracks for routing when master becomes ready
          tracks.forEach(track => {
            const trackNodes = trackNodesRef.current[track.id];
            if (trackNodes) {
              // Build the output chain to get the final output node
              let currentOutput: AudioNode = trackNodes.panner;
              const trackInserts = insertsRef.current[track.id] || [];
              trackInserts.forEach(fxId => {
                const fxNode = fxNodesRef.current[fxId];
                if (fxNode) {
                  currentOutput = fxNode.output;
                }
              });
              queuedRoutesRef.current.push({
                trackId: track.id,
                outputNode: currentOutput,
              });
            }
          });
          return;
        }

        console.log(">>> Rebuilding audio routing graph (Inserts-based)...");
        const masterInput = masterNodesRef.current.input;
        
        if (!masterInput) {
          console.error('[MIXER] Master input node not found in master chain');
          return;
        }

        // Clear ALL existing connections to prevent doubling or stale paths
        Object.values(trackNodesRef.current).forEach(node => { 
          try { 
            node.input.disconnect(); 
            node.gain.disconnect();
            node.panner.disconnect();
            node.analyser.disconnect(); 
          } catch (e) {} 
        });
        Object.values(fxNodesRef.current).forEach(fxNode => { 
          try { 
            fxNode.input.disconnect(); 
            fxNode.output.disconnect();
          } catch (e) {} 
        });
        if (micSourceNodeRef.current) { 
            try { micSourceNodeRef.current.disconnect(); } catch(e) {} 
        }
        if (hushProcessorNodeRef.current) {
            try { hushProcessorNodeRef.current.disconnect(); } catch(e) {}
        }
        
        // Connect mic input to armed tracks' inputs via HUSH processor
        if (micSourceNodeRef.current && hushProcessorNodeRef.current && armedTracks.size > 0) {
            micSourceNodeRef.current.connect(hushProcessorNodeRef.current);
            armedTracks.forEach(trackId => {
                const trackNodes = trackNodesRef.current[trackId];
                if (trackNodes?.input) { 
                    hushProcessorNodeRef.current!.connect(trackNodes.input);
                }
            });
        }

    // Route each track's signal
    tracks.forEach(track => {
        const trackNodes = trackNodesRef.current[track.id];
        if (!trackNodes) return;

        // Internal chain: Input -> Pre-fader Meter -> Gain -> Panner
        // Pre-fader meter tap (STEP 1 - Flow Meter Stack)
        trackNodes.input.connect(trackNodes.preFaderMeter);
        trackNodes.input.connect(trackNodes.gain);
        trackNodes.gain.connect(trackNodes.panner);

        let currentOutput: AudioNode = trackNodes.panner;
        const trackInserts = insertsRef.current[track.id] || [];

        // Inserts chain
        trackInserts.forEach(fxId => {
            const fxNode = fxNodesRef.current[fxId];
            if (fxNode) {
                currentOutput.connect(fxNode.input);
                currentOutput = fxNode.output;
            }
        });

        // Post-inserts: connect to analyser for monitoring and then to master
        currentOutput.connect(trackNodes.analyser);
        
        // Connect to master input (masterReady gate ensures this only happens when stable)
        if (masterInput && masterReady) {
          try {
            currentOutput.connect(masterInput);
            if ((import.meta as any).env?.DEV && track.id === tracks[0]?.id) {
              console.log('[MIXER] Track connected to master:', {
                trackId: track.id,
                trackName: track.trackName,
                masterInputExists: !!masterInput,
                insertsCount: trackInserts.length,
              });
            }
          } catch (err) {
            console.error('[MIXER] Failed to connect track to master:', track.id, err);
          }
        } else if (!masterReady) {
          // Queue this track for routing when master becomes ready
          queuedRoutesRef.current.push({
            trackId: track.id,
            outputNode: currentOutput,
          });
          console.warn('[MIXER] Master not ready – queuing routing for track:', track.id);
        } else {
          console.warn('[MIXER] Master input not available, track not connected:', track.id);
        }
    });

}, [tracks, armedTracks, pluginRegistry, masterReady]);

    // Manage Microphone Stream
    useEffect(() => {
        const manageStream = async () => {
            const ctx = audioContextRef.current;
            if (armedTracks.size > 0 && !microphoneStreamRef.current && ctx) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    microphoneStreamRef.current = stream;
                    micSourceNodeRef.current = ctx.createMediaStreamSource(stream);

                    // Create Hush processor
                    const processor = ctx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        // Pass a copy to prevent modification issues if any
                        const outputData = hushSystem.process(new Float32Array(inputData)); 
                        audioProcessingEvent.outputBuffer.getChannelData(0).set(outputData);
                    };
                    hushProcessorNodeRef.current = processor;

                    console.log("Microphone stream acquired and Hush processor created.");
                } catch (err) {
                    console.error("Error acquiring microphone stream:", err);
                    setArmedTracks(new Set()); // Disarm tracks if permission is denied
                }
            } else if (armedTracks.size === 0 && microphoneStreamRef.current) {
                microphoneStreamRef.current.getTracks().forEach(track => track.stop());
                microphoneStreamRef.current = null;
                micSourceNodeRef.current = null;
                hushProcessorNodeRef.current = null; // Will be disconnected by routing effect
                console.log("Microphone stream released.");
            }
        };
        manageStream();
    }, [armedTracks, hushSystem]);

    // Effect to control HushSystem active state
    useEffect(() => {
        hushSystem.setActive(isHushActive);
    }, [isHushActive, hushSystem]);

    useEffect(() => {
        const hushTrackId = TRACK_ROLE_TO_ID.hushRecord;
        setArmedTracks(prev => {
          const hasHush = prev.has(hushTrackId);
          if (isHushActive && !hasHush) {
            const next = new Set(prev);
            next.add(hushTrackId);
            return next;
          }
          if (!isHushActive && hasHush) {
            const next = new Set(prev);
            next.delete(hushTrackId);
            return next;
          }
          return prev;
        });
    }, [isHushActive]);

    // Effect to get feedback from HushSystem
    useEffect(() => {
        let animationFrameId: number;
        if (isHushActive) {
            const updateFeedback = () => {
                const feedback = hushSystem.getALSFeedback();
                setHushFeedback(feedback);
                
                // Monitor HUSH noise floor and update recording state
                const threshold = 0.22; // Default threshold
                const hushDetected = monitorHush(feedback.intensity, threshold);
                
                // Update recording state with noise floor for Flow Loop
                updateRecordState({
                    noiseFloor: feedback.intensity,
                    threshold,
                    hush: hushDetected,
                });
                
                animationFrameId = requestAnimationFrame(updateFeedback);
            };
            updateFeedback();
        } else {
            setHushFeedback({ color: '#1a1030', intensity: 0.0, isEngaged: false, noiseCount: 0 });
            updateRecordState({ noiseFloor: 0, hush: false });
        }
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isHushActive, hushSystem]);

    useEffect(() => {
      setRecordingOptions((prev) =>
        prev.hushGate === isHushActive ? prev : { ...prev, hushGate: isHushActive }
      );
    }, [isHushActive]);


    const stopPlayback = useCallback(() => {
        activeSourcesRef.current.forEach(item => {
            try { item.source.stop(); item.source.disconnect(); item.gain.disconnect(); } catch(e) {}
        });
        activeSourcesRef.current = [];
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        const ctx = audioContextRef.current;
        if (ctx && (ctx.state as string) !== 'closed') {
            ctx.suspend().catch((error) => {
                console.warn('[AUDIO] Failed to suspend context:', error);
            });
        }
    }, []);

    const scheduleClips = useCallback((transportTime: number) => {
        const ctx = audioContextRef.current;
        if (!ctx || Object.keys(audioBuffers).length === 0) return;
    
        // Stop all previously scheduled sources
        activeSourcesRef.current.forEach(item => {
            try { item.source.stop(); item.source.disconnect(); item.gain.disconnect(); } catch (e) {}
        });
        activeSourcesRef.current = [];
    
        const playbackStartTime = ctx.currentTime;
    
        clips.forEach(clip => {
            const trackNodes = trackNodesRef.current[clip.trackId];
            const audioBuffer = audioBuffers[clip.bufferId];
            if (!trackNodes || !audioBuffer) {
                console.warn(`[AUDIO] Skipping clip ${clip.id}: missing nodes or buffer.`);
                return;
            }
    
            const clipAbsoluteEnd = clip.start + clip.duration;
            if (clipAbsoluteEnd <= transportTime) return; // Clip is entirely in the past
    
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = clip.timeStretchRate ?? 1.0;
    
            // Create a dedicated gain node for this clip instance for fades and gain control
            const clipGainNode = ctx.createGain();
            clipGainNode.gain.value = clip.gain ?? 1.0;
            source.connect(clipGainNode);
            clipGainNode.connect(trackNodes.input);
    
            // Calculate when this clip should start playing relative to ctx.currentTime
            const timeUntilClipStarts = Math.max(0, clip.start - transportTime);
            const scheduledStart = playbackStartTime + timeUntilClipStarts;
    
            // Calculate the offset into the audioBuffer
            const offsetIntoSource = (clip.sourceStart ?? 0) + Math.max(0, transportTime - clip.start);
    
            // Determine how long the source should play
            const actualDurationToPlay = clip.duration - Math.max(0, transportTime - clip.start);
    
            if (actualDurationToPlay > 0) {
                source.start(scheduledStart, offsetIntoSource, actualDurationToPlay);
                activeSourcesRef.current.push({ source, gain: clipGainNode });
    
                // Schedule Fade In
                const fadeInDuration = clip.fadeIn ?? 0;
                if (fadeInDuration > 0 && transportTime < clip.start + fadeInDuration) {
                    const timeIntoFadeIn = Math.max(0, transportTime - clip.start);
                    const remainingFadeIn = fadeInDuration - timeIntoFadeIn;
                    const startValue = (clip.gain ?? 1.0) * (timeIntoFadeIn / fadeInDuration);
                    
                    clipGainNode.gain.setValueAtTime(startValue, scheduledStart);
                    clipGainNode.gain.linearRampToValueAtTime(clip.gain ?? 1.0, scheduledStart + remainingFadeIn);
                }
    
                // Schedule Fade Out
                const fadeOutDuration = clip.fadeOut ?? 0;
                if (fadeOutDuration > 0 && transportTime < clipAbsoluteEnd) {
                    const fadeOutStartTime = clipAbsoluteEnd - fadeOutDuration;
                    if (transportTime < fadeOutStartTime) {
                         const scheduledFadeOutStart = playbackStartTime + (fadeOutStartTime - transportTime);
                         clipGainNode.gain.setValueAtTime(clip.gain ?? 1.0, scheduledFadeOutStart);
                         clipGainNode.gain.linearRampToValueAtTime(0, scheduledFadeOutStart + fadeOutDuration);
                    } else { // Handle starting playback inside a fade out
                        const timeIntoFadeOut = transportTime - fadeOutStartTime;
                        const startValue = (clip.gain ?? 1.0) * (1 - (timeIntoFadeOut / fadeOutDuration));
                        clipGainNode.gain.setValueAtTime(startValue, scheduledStart);
                        clipGainNode.gain.linearRampToValueAtTime(0, scheduledStart + (fadeOutDuration - timeIntoFadeOut));
                    }
                }
            }
        });
    }, [audioBuffers, clips]);

    // Refs to track state inside callbacks to avoid stale closures
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    const isLoopingRef = useRef(isLooping);
    useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
    const projectDurationRef = useRef(projectDuration);
    useEffect(() => { projectDurationRef.current = projectDuration; }, [projectDuration]);
    const currentTimeRef = useRef(currentTime);
    useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
    const soloedTracksRef = useRef(soloedTracks);
    useEffect(() => { soloedTracksRef.current = soloedTracks; }, [soloedTracks]);
    const mixerSettingsRef = useRef(mixerSettings);
    useEffect(() => { mixerSettingsRef.current = mixerSettings; }, [mixerSettings]);
    const automationDataRef = useRef(automationData);
    useEffect(() => { automationDataRef.current = automationData; }, [automationData]);


    const getAutomationValue = useCallback((trackId: string, fxId: string, paramName: string, time: number): number | null => {
      const paramAutomation = automationDataRef.current[trackId]?.[fxId]?.[paramName];
      if (!paramAutomation || paramAutomation.length === 0) return null;

      // Find the two points that bracket the current time
      const nextPointIndex = paramAutomation.findIndex(p => p.time > time);

      // If time is before the first point, use the first point's value
      if (nextPointIndex === 0) return paramAutomation[0].value;
      // If time is after the last point, use the last point's value
      if (nextPointIndex === -1) return paramAutomation[paramAutomation.length - 1].value;
      
      const prevPoint = paramAutomation[nextPointIndex - 1];
      const nextPoint = paramAutomation[nextPointIndex];

      // Linear interpolation between the two points
      const timeDiff = nextPoint.time - prevPoint.time;
      if (timeDiff === 0) return prevPoint.value; // Avoid division by zero

      const factor = (time - prevPoint.time) / timeDiff;
      return prevPoint.value + factor * (nextPoint.value - prevPoint.value);
    }, []);

    useEffect(() => {
        const ctx = audioContextRef.current;
        if (!ctx || ctx.state === 'closed') return;

        const analysisLoop = () => {
            if (!isPlayingRef.current) {
                animationFrameRef.current = null;
                return;
            }

            const now = ctx.currentTime;
            const delta = now - lastUpdateTimeRef.current;
            lastUpdateTimeRef.current = now;

            let newTime = currentTimeRef.current + delta;

            if (newTime >= projectDurationRef.current) {
                if (isLoopingRef.current) {
                    const timeOver = newTime - projectDurationRef.current;
                    newTime = timeOver % projectDurationRef.current;

                    console.log(`%c[DAW CORE] Project Loop Wrap. New Time: ${newTime.toFixed(2)}`, "color: cyan; font-weight: bold;");

                    lastUpdateTimeRef.current = now - timeOver;
                    scheduleClips(newTime); // Reschedule clips for gapless loop
                } else {
                    setIsPlaying(false);
                    setCurrentTime(projectDurationRef.current);
                    return;
                }
            }
            setCurrentTime(newTime);

            const nextTrackAnalysis: { [key: string]: TrackAnalysisData } = {};

            tracksRef.current.forEach((track) => {
                const analyser = trackNodesRef.current[track.id]?.analyser;
                const automationDescriptor = automationDataRef.current[track.id];
                const automationTargets = automationDescriptor
                    ? Object.entries(automationDescriptor).flatMap(([scope, params]) =>
                        Object.keys(params).map((paramName) => `${scope}:${paramName}`)
                      )
                    : [];

                if (analyser) {
                    const buffers = ensureTrackMeterBuffers(trackMeterBuffersRef.current, track.id, analyser);
                    const metrics = measureAnalyser(analyser, buffers);

                    nextTrackAnalysis[track.id] = {
                        level: metrics.level,
                        transient: metrics.transient,
                        rms: metrics.rms,
                        peak: metrics.peak,
                        crestFactor: metrics.crestFactor,
                        spectralTilt: metrics.spectralTilt,
                        lowBandEnergy: metrics.lowBandEnergy,
                        automationActive: automationTargets.length > 0,
                        automationTargets,
                    };
                } else {
                    nextTrackAnalysis[track.id] = {
                        level: 0,
                        transient: false,
                        rms: 0,
                        peak: 0,
                        crestFactor: 1,
                        spectralTilt: 0,
                        lowBandEnergy: 0,
                        automationActive: automationTargets.length > 0,
                        automationTargets,
                    };
                }

                const nodes = trackNodesRef.current[track.id];
                const settings = mixerSettingsRef.current[track.id];
                if (!nodes || !settings) {
                    return;
                }

                const hasSolo = soloedTracksRef.current.size > 0;
                const isSoloed = soloedTracksRef.current.has(track.id);
                const isMuted = settings.isMuted || (hasSolo && !isSoloed);

                let targetVolume = 0;
                if (!isMuted) {
                    const automationValue = getAutomationValue(track.id, 'track', 'volume', newTime);
                    targetVolume = automationValue !== null ? automationValue : settings.volume;
                }
                nodes.gain.gain.setTargetAtTime(targetVolume, ctx.currentTime, 0.01);

                const panAutomationValue = getAutomationValue(track.id, 'track', 'pan', newTime);
                const targetPan = panAutomationValue !== null ? panAutomationValue : settings.pan;
                nodes.panner.pan.setTargetAtTime(targetPan, ctx.currentTime, 0.01);

                const trackInserts = insertsRef.current[track.id] || [];
                trackInserts.forEach((fxId) => {
                    const engineInstance = engineInstancesRef.current.get(fxId);
                    if (engineInstance && automationDataRef.current[track.id]?.[fxId]) {
                        const fxAutomation = automationDataRef.current[track.id][fxId];
                        for (const paramName in fxAutomation) {
                            const paramValue = getAutomationValue(track.id, fxId, paramName, newTime);
                            if (paramValue !== null && engineInstance.setParameter) {
                                engineInstance.setParameter(paramName, paramValue);
                            }
                        }
                    }
                });
            });

            const masterAnalyser = masterNodesRef.current?.analyser ?? null;
            if (masterAnalyser) {
                const masterBuffers = ensureMasterMeterBuffers(masterMeterBufferRef.current, masterAnalyser);
                masterMeterBufferRef.current = masterBuffers;
                const masterMetrics = measureAnalyser(masterAnalyser, masterBuffers);
                masterAnalyser.getByteTimeDomainData(
                  masterBuffers.waveform as Uint8Array<ArrayBuffer>
                );
                const waveformData = Uint8Array.from(masterBuffers.waveform);

                masterLevelAvg.current = clamp01(
                  masterLevelAvg.current * 0.75 + masterMetrics.level * 0.25
                );

                setMasterAnalysis({
                    level: masterLevelAvg.current,
                    transient: masterMetrics.transient,
                    waveform: waveformData,
                });
            }

            setTrackAnalysis(nextTrackAnalysis);

            animationFrameRef.current = requestAnimationFrame(analysisLoop);
        };

        if (isPlaying) {
            lastUpdateTimeRef.current = ctx.currentTime;
            scheduleClips(currentTime); // Schedule clips at current time
            if (!animationFrameRef.current) {
                if (ctx.state === 'suspended') {
                    ctx.resume().catch((error) => {
                        console.warn('[AUDIO] Failed to resume context:', error);
                    });
                }
                animationFrameRef.current = requestAnimationFrame(analysisLoop);
            }
        } else {
            stopPlayback();
            if ((ctx.state as string) !== 'closed') {
                ctx.suspend().catch((error) => {
                    console.warn('[AUDIO] Failed to suspend context:', error);
                });
            }
        }

        return () => {
            stopPlayback();
            if ((ctx.state as string) !== 'closed') {
                ctx.suspend().catch((error) => {
                    console.warn('[AUDIO] Failed to suspend context:', error);
                });
            }
        };
    }, [isPlaying, scheduleClips, stopPlayback, getAutomationValue, armedTracks]);

    const seekWithoutRestart = useCallback(
      (time: number) => {
        const upper = projectDurationRef.current ?? 0;
        const clamped = Math.max(0, Math.min(upper, time));
        setCurrentTime(clamped);
        if (isPlayingRef.current) {
          scheduleClips(clamped);
          const ctx = audioContextRef.current;
          if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        }
      },
      [scheduleClips]
    );

    const jumpTransport = useCallback(
      (direction: 'back' | 'forward') => {
        const epsilon = 1e-3;
        const boundaries = new Set<number>();
        if (selectedClips.length > 0) {
          selectedClips.forEach((clip) => {
            boundaries.add(clip.start);
            boundaries.add(clip.start + clip.duration);
          });
        } else {
          const barSeconds = (60 / bpm) * 4;
          const totalBars = Math.max(1, Math.ceil(projectDuration / barSeconds));
          for (let i = 0; i <= totalBars; i++) {
            boundaries.add(Math.min(projectDuration, i * barSeconds));
          }
        }
        boundaries.add(0);
        boundaries.add(projectDuration);
        const sorted = Array.from(boundaries).sort((a, b) => a - b);
        let target = direction === 'back' ? 0 : projectDuration;
        if (direction === 'back') {
          for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i] < currentTime - epsilon) {
              target = sorted[i];
              break;
            }
          }
        } else {
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] > currentTime + epsilon) {
              target = sorted[i];
              break;
            }
          }
        }
        handleSeek(target);
      },
      [selectedClips, bpm, projectDuration, currentTime, handleSeek]
    );

    const nudgeTransport = useCallback(
      (direction: 'back' | 'forward') => {
        const secondsPerBeat = 60 / bpm;
        const step = Math.max(0.25, secondsPerBeat / 2);
        const delta = direction === 'forward' ? step : -step;
        seekWithoutRestart(currentTime + delta);
      },
      [bpm, currentTime, seekWithoutRestart]
    );


  const renderFxWindows = useMemo(() => {
    return fxWindows.map(fw => {
      // Find which track this FX is "primarily" connected to for color and context
      let connectedColor: TrackData['trackColor'] | undefined;
      let connectedTrackId: string | undefined;
      for (const trackId in inserts) {
        if (inserts[trackId].includes(fw.id)) {
          connectedColor = tracks.find(t => t.id === trackId)?.trackColor;
          connectedTrackId = trackId;
          break;
        }
      }

      return fxVisibility[fw.id] ? (
        <FXWindow
          key={fw.id}
          id={fw.id}
          title={fw.name}
          initialPosition={{ x: 250 + (fxWindows.indexOf(fw) * 50), y: 150 + (fxWindows.indexOf(fw) * 50) }}
          isPlaying={isPlaying}
          currentTime={currentTime}
          onClose={() => setFxVisibility(prev => ({ ...prev, [fw.id]: false }))}
          isBypassed={fxBypassState[fw.id]}
          onToggleBypass={(fxId) => handleToggleBypass(fxId, connectedTrackId)}
          connectedColor={connectedColor}
          onOpenPluginSettings={handleOpenPluginSettings}
        >
          <fw.component
            params={fw.params as any}
            onChange={fw.onChange}
            isPlaying={isPlaying}
            currentTime={currentTime}
            connectedColor={connectedColor}
            // Pass automation specific props for FX Visualizers
            trackId={connectedTrackId || selectedTrackId || ''}
            fxId={fw.id}
            automationData={automationData}
            onAddAutomationPoint={handleAddAutomationPoint}
            onUpdateAutomationPoint={handleUpdateAutomationPoint}
            onDeleteAutomationPoint={handleDeleteAutomationPoint}
            engineInstance={fw.engineInstance}
          />
        </FXWindow>
      ) : null;
    });
  }, [fxWindows, fxVisibility, isPlaying, currentTime, fxBypassState, inserts, tracks, automationData, handleAddAutomationPoint, handleUpdateAutomationPoint, handleDeleteAutomationPoint, selectedTrackId, setFxVisibility, handleToggleBypass, handleOpenPluginSettings]);

    const activeClip = useMemo(() => {
        if (!activePrimeBrainClipId) return null;
        return clips.find(c => c.id === activePrimeBrainClipId) || null;
    }, [activePrimeBrainClipId, clips]);

  const backgroundGlowStyle = useMemo(() => {
      const level = isPlaying ? masterAnalysis.level : 0;
      const intensity = Math.min(1, level * 2.5);
      const hue = 220 + intensity * 60; // From blue (220) to magenta (280)
      const saturation = 60 + intensity * 20;
      const lightness = 70 + intensity * 8;
      return {
          '--bg-glow-color': `hsl(${hue}, ${saturation}%, ${lightness}%)`
      } as React.CSSProperties;
  }, [masterAnalysis.level, isPlaying]);

  const arrangeBorderGlowStyle = useMemo(() => {
    const level = isPlaying ? masterAnalysis.level : 0;
    const intensity = Math.min(1, level * 2.5); // 0 to 1 based on master level
    const velvetScore = analysisResult ? calculateVelvetScore(analysisResult) : 0;
    const { color: velvetGlowColorName } = getVelvetColor(velvetScore ?? 0); // e.g., 'emerald'
    
    // Define some direct hex colors for the glow based on the velvet score
    const glowColors: Record<string, string> = {
        emerald: '#10b981', // emerald-500
        lime: '#84cc16',    // lime-500
        amber: '#f59e0b',   // amber-500
        red: '#ef4444',     // red-500
        rose: '#e11d48',    // rose-500
        default: '#374151' // gray-700
    };
    const primaryGlowColor = glowColors[velvetGlowColorName] || glowColors.default;

    return {
        '--arrange-border-color': primaryGlowColor,
        '--arrange-border-opacity': intensity,
        border: `1px solid rgba(${parseInt(primaryGlowColor.slice(1,3), 16)}, ${parseInt(primaryGlowColor.slice(3,5), 16)}, ${parseInt(primaryGlowColor.slice(5,7), 16)}, ${0.1 + intensity * 0.3})`, // Base border, intensifies with music
        boxShadow: isPlaying && intensity > 0.1
            ? `0 0 ${10 + intensity * 20}px ${primaryGlowColor}, inset 0 0 ${5 + intensity * 10}px ${primaryGlowColor}44`
            : `none`, // Only show box shadow when playing and enough energy
        transition: 'all 0.3s ease-out'
    } as React.CSSProperties;
}, [masterAnalysis.level, isPlaying, analysisResult]);

  const mixerPulseAgent = useMemo<PulsePalette | null>(() => {
    if (!tracks.length) {
      return null;
    }

    let dominantColor: TrackColorKey = 'cyan';
    let dominantIntensity = 0;
    let pulseTotal = 0;
    let counted = 0;

    tracks.forEach((track) => {
      const analysis = trackAnalysis[track.id];
      const settings = mixerSettings[track.id];
      if (!analysis && !settings) {
        return;
      }

      const feedback = deriveTrackALSFeedback({
        level: analysis?.level ?? 0,
        transient: analysis?.transient ?? false,
        volume: settings?.volume ?? 0.75,
        color: track.trackColor,
      });

      const weightedIntensity = feedback.intensity * ((settings?.isMuted ?? false) ? 0.25 : 1);
      if (weightedIntensity > dominantIntensity) {
        dominantIntensity = weightedIntensity;
        dominantColor = track.trackColor;
      }

      pulseTotal += feedback.pulse;
      counted += 1;
    });

    if (!counted) {
      return null;
    }

    const averagePulse = pulseTotal / counted;
    return derivePulsePalette(dominantColor, dominantIntensity, averagePulse);
  }, [mixerSettings, trackAnalysis, tracks]);

  const bloomPulseAgent = useMemo<PulsePalette>(() => {
    if (importMessage) {
      return derivePulsePalette('magenta', 0.85, clamp01(0.55 + flowContext.momentum * 0.25));
    }

    if (isHushActive) {
      return derivePulsePalette('green', 0.7, clamp01(0.62 + flowContext.momentumTrend * 0.25));
    }

    if (mixerPulseAgent) {
      const baseStrength = Math.max(mixerPulseAgent.pulseStrength, isPlaying ? 0.45 : 0.25);
      const boostedStrength = clamp01(
        baseStrength +
          (flowContext.intensity === 'immersed'
            ? 0.18
            : flowContext.intensity === 'charged'
            ? 0.1
            : 0.02) +
          flowContext.momentum * 0.22 +
          flowContext.momentumTrend * 0.3
      );
      return {
        ...mixerPulseAgent,
        pulseStrength: boostedStrength,
      };
    }

    const fallbackColor: TrackColorKey = isPlaying ? 'cyan' : 'purple';
    const fallbackIntensity = isPlaying ? 0.55 : 0.3;
    const fallbackPulseBase = isPlaying ? 0.48 : 0.22;
    const fallbackPulse = clamp01(
      fallbackPulseBase +
        (flowContext.intensity === 'immersed'
          ? 0.18
          : flowContext.intensity === 'charged'
          ? 0.08
          : 0) +
        flowContext.momentum * 0.18 +
        flowContext.momentumTrend * 0.25
    );
    return derivePulsePalette(fallbackColor, fallbackIntensity, fallbackPulse);
  }, [
    flowContext.intensity,
    flowContext.momentum,
    flowContext.momentumTrend,
    importMessage,
    isHushActive,
    isPlaying,
    mixerPulseAgent,
  ]);

  const ingestJobs = ingestSnapshot.jobs;

  const bloomContext = useMemo<BloomContext>(() => {
    const ingestActive =
      importProgress.length > 0 ||
      ingestJobs.some((job) => ['processing', 'awaiting-user', 'pending'].includes(job.status));

    if (ingestActive) return 'ingest';
    if (isAIHubOpen) return 'ai';
    if (isAnyTrackArmed || isHushActive) return 'record';
    if (viewMode === 'mixer') return 'mix';
    if (viewMode === 'sampler') return 'sampler';
    if (analysisResult) return 'master';
    if (viewMode === 'arrange') return 'arrange';
    return 'idle';
  }, [
    analysisResult,
    importProgress,
    ingestJobs,
    isAIHubOpen,
    isAnyTrackArmed,
    isHushActive,
    viewMode,
  ]);

  const pixelsPerSecond = ppsAPI.value;
  const sessionProbeContext = useMemo(
    () => ({
      currentTime,
      isPlaying,
      isLooping,
      selection,
      pixelsPerSecond,
      scrollX,
      followPlayhead,
      viewMode,
      bloomContext,
      selectedClips: selectedClipSummaries,
    }),
    [
      currentTime,
      isPlaying,
      isLooping,
      selection,
      pixelsPerSecond,
      scrollX,
      followPlayhead,
      viewMode,
      bloomContext,
      selectedClipSummaries,
    ]
  );
  const sessionProbeEnabled = useSessionProbe(sessionProbeContext);

  const bloomLabel = useMemo(() => {
    const baseLabel = BLOOM_CONTEXT_LABELS[bloomContext];
    const flowDescriptor =
      flowContext.intensity === 'immersed'
        ? 'Immersed'
        : flowContext.intensity === 'charged'
        ? 'Charged'
        : 'Calm';
    return `${baseLabel} • ${flowDescriptor}`;
  }, [bloomContext, flowContext.intensity]);
  const bloomAccent = useMemo(() => BLOOM_CONTEXT_ACCENTS[bloomContext], [bloomContext]);

  const bloomFloatingMenu = useMemo<Record<string, BloomFloatingMenu>>(() => {
    const accent = BLOOM_CONTEXT_ACCENTS[bloomContext];
    const meta = { source: 'bloom-floating' as const, context: { bloomContext } };

    // Apply Prime Brain suggestions to menu items
    const applyPrimeBrainGuidance = (items: BloomFloatingMenuItem[]): BloomFloatingMenuItem[] => {
      const suggestions = flowContext.adaptiveSuggestions;
      const primeMode = primeBrainStatus.mode;
      
      return items.map((item) => {
        let enhanced = { ...item };
        
        // Subtle highlighting based on Prime Brain mode and suggestions
        // Only show hints when mode is active or learning (not passive)
        if (primeMode !== 'passive') {
          // Highlight items that match suggested view switch
          if (suggestions.suggestViewSwitch && item.name.toLowerCase().includes(suggestions.suggestViewSwitch.toLowerCase())) {
            enhanced = {
              ...enhanced,
              accentColor: enhanced.accentColor ?? accent,
              // Add subtle glow effect via description
              description: enhanced.description ? `${enhanced.description} • Suggested` : 'Suggested',
            };
          }
          
          // Reorder items based on Prime Brain guidance (subtle, only in active mode)
          if (primeMode === 'active' && suggestions.showBloomMenu && item.name.toLowerCase().includes('analyze')) {
            // Boost "Analyze" items when tension is high
            if (primeBrainSnapshotInputs?.harmonicState.tension > 0.6) {
              enhanced = {
                ...enhanced,
                description: enhanced.description ? `${enhanced.description} • High tension detected` : 'High tension detected',
              };
            }
          }
        }
        
        return enhanced;
      });
    };

    const attachAccent = (items: BloomFloatingMenuItem[]): BloomFloatingMenuItem[] => {
      const accented = items.map((item) => ({
        ...item,
        accentColor: item.accentColor ?? accent,
      }));
      // Apply Prime Brain guidance after accenting
      return applyPrimeBrainGuidance(accented);
    };

    const buildSimpleMenu = (items: BloomFloatingMenuItem[]): Record<string, BloomFloatingMenu> => ({
      main: { items: attachAccent(items) },
    });

    const buildIngestMenus = (): Record<string, BloomFloatingMenu> => {
      const fileEntries = importProgress.filter((entry) => entry.type === 'file');
      const stemEntries = importProgress.filter((entry) => entry.type === 'stem');
      const activeQueueJobs = ingestJobs.filter((job) =>
        ['processing', 'awaiting-user', 'pending'].includes(job.status)
      );
      const queuePercent =
        activeQueueJobs.length > 0
          ? activeQueueJobs.reduce((sum, job) => sum + (job.progressPercent ?? 0), 0) /
            activeQueueJobs.length
          : null;

      const threads = fileEntries.map((entry) => {
        const segments = entry.label.split('•').map((segment) => segment.trim()).filter(Boolean);
        const displayLabel = segments[0] ?? entry.label;
        const phaseDescriptor =
          segments.length > 1 ? segments.slice(1).join(' • ') : 'Pipeline shaping through ALS.';
        const stems = stemEntries.filter((stem) => stem.parentId === entry.id);
        const threadAccent =
          entry.color ??
          stems[stems.length - 1]?.color ??
          bloomPulseAgent.glow ??
          BLOOM_CONTEXT_ACCENTS.ingest;
        return { entry, stems, displayLabel, phaseDescriptor, accentColor: threadAccent };
      });

      const ingestAccent =
        threads.length > 0
          ? threads[threads.length - 1].accentColor
          : bloomPulseAgent.glow ?? BLOOM_CONTEXT_ACCENTS.ingest;

      const pipelineItems: BloomFloatingMenuItem[] = [
        ...threads.map((thread) => ({
          name: thread.displayLabel,
          subMenu: `ingest/thread/${thread.entry.id}`,
          description: thread.phaseDescriptor,
          accentColor: thread.accentColor,
          progressPercent: thread.entry.percent,
        })),
        ...activeQueueJobs.map((job) => ({
          name: `Queue • ${stripFileExtension(job.fileName)}`,
          description:
            job.status === 'awaiting-user'
              ? 'Awaiting stem selection.'
              : job.progressMessage ?? `Status: ${job.status}`,
          disabled: true,
          accentColor: ingestAccent,
          progressPercent: job.progressPercent ?? undefined,
        })),
      ];

      if (!pipelineItems.length) {
        pipelineItems.push({
          name: 'Pipeline Idle',
          description: 'No active imports or stem passes.',
          disabled: true,
          accentColor: ingestAccent,
        });
      }

      const dynamicThreadMenus: Record<string, BloomFloatingMenu> = {};
      threads.forEach((thread) => {
        const submenuKey = `ingest/thread/${thread.entry.id}`;
        const items =
          thread.stems.length > 0
            ? thread.stems.map((stem) => ({
                name: stem.label,
                description: 'Stem lane energy pulsing in ALS.',
                disabled: true,
                accentColor: stem.color ?? thread.accentColor,
                progressPercent: stem.percent,
              }))
            : [
                {
                  name: 'Awaiting stem lanes',
                  description: thread.phaseDescriptor,
                  disabled: true,
                  accentColor: thread.accentColor,
                },
              ];
        dynamicThreadMenus[submenuKey] = {
          parent: 'ingest/pipeline',
          items,
        };
      });

      const mainItems = attachAccent([
        {
          name: 'Pipeline',
          subMenu: 'ingest/pipeline',
          description: 'Active import threads and queue load.',
          accentColor: ingestAccent,
          progressPercent: queuePercent ?? undefined,
        },
        {
          name: 'Add Sources',
          description: 'Ingest more stems or references.',
          action: () => handleBloomAction('importAudio', undefined, meta),
        },
        {
          name: 'Recall Last Import',
          description: 'Jump to the previous ingest pass.',
          action: () => handleBloomAction('recallLastImport', undefined, meta),
          disabled: !canRecallLastImport,
        },
        {
          name: 'Prime Assist',
          description: 'Send the mix to Prime Brain for guidance.',
          accentColor: BLOOM_CONTEXT_ACCENTS.ai,
          action: () => handleBloomAction('openAIHub', undefined, meta),
        },
      ]);

      return {
        main: { items: mainItems },
        'ingest/pipeline': {
          parent: 'main',
          items: attachAccent(pipelineItems),
        },
        ...dynamicThreadMenus,
      };
    };

    const attachSettingsMenu = (menus: Record<string, BloomFloatingMenu>) => {
      const main = menus.main ?? { items: [] };
      const filteredItems = main.items.filter((item) => 
        item.subMenu !== 'prime/settings' && item.subMenu !== 'waveform/settings'
      );
      const settingsAccent = primeBrainTelemetryEnabled ? '#c084fc' : '#475569';
      const settingsDescriptor = primeBrainTelemetryEnabled
        ? 'Telemetry flowing to Prime Fabric.'
        : 'Telemetry sealed inside Studio.';
      const settingsItem: BloomFloatingMenuItem = {
        name: 'Prime Brain Settings',
        description: settingsDescriptor,
        subMenu: 'prime/settings',
        accentColor: settingsAccent,
      };
      const waveformSettingsItem: BloomFloatingMenuItem = {
        name: 'Waveform Header',
        description: 'Adjust waveform visual parameters.',
        subMenu: 'waveform/settings',
        accentColor: '#22d3ee',
      };

      return {
        ...menus,
        main: { ...main, items: [...filteredItems, settingsItem, waveformSettingsItem] },
        'prime/settings': {
          parent: 'main',
          items: [
            {
              name: primeBrainTelemetryEnabled ? 'Telemetry Flowing' : 'Telemetry Resting',
              description: primeBrainTelemetryEnabled
                ? 'Prime Brain exports ALS orbitals to Fabric.'
                : 'Guidance stays local; no exports leave Studio.',
              action: handleTogglePrimeBrainTelemetry,
              accentColor: settingsAccent,
            },
            {
              name: 'Health Pulse',
              description: primeBrainStatus.health.caption,
              disabled: true,
              accentColor: primeBrainStatus.health.color,
            },
          ],
        },
        'waveform/settings': {
          parent: 'main',
          items: [
            {
              name: 'Open Settings Panel',
              description: 'Adjust amplitude, thickness, and visual effects.',
              action: () => setIsWaveformSettingsOpen(true),
              accentColor: '#22d3ee',
            },
          ],
        },
      };
    };

    switch (bloomContext) {
      case 'arrange': {
        const arrangeItems: BloomFloatingMenuItem[] = [
          {
            name: 'Add Track',
            description: 'Drop a fresh lane into the timeline.',
            action: () => handleBloomAction('addTrack', undefined, meta),
          },
          {
            name: 'Duplicate Clips',
            description: 'Echo the current selection forward.',
            action: () => handleBloomAction('duplicateClips', selectedClipIds, meta),
            disabled: selectedClipIds.length === 0,
            accentColor: '#f6cfff',
          },
          {
            name: 'Split at Playhead',
            description: 'Slice the selection along the playhead.',
            action: () => handleBloomAction('splitSelection', { time: currentTime }, meta),
            disabled: !canSplitSelection,
            progressPercent: canSplitSelection ? 72 : 18,
            accentColor: '#9dd6ff',
          },
          {
            name: 'Consolidate',
            description: 'Fuse highlighted clips into a single flow.',
            action: () => handleBloomAction('consolidateSelection', undefined, meta),
            disabled: !canConsolidateSelection,
            accentColor: '#c6a2ff',
          },
          {
            name: followPlayhead ? 'Follow On' : 'Follow Off',
            description: followPlayhead
              ? 'Timeline glides with the playhead.'
              : 'Manual navigation engaged.',
            action: () => handleBloomAction('toggleFollowPlayhead', undefined, meta),
            progressPercent: followPlayhead ? 95 : 24,
            accentColor: '#8be4ff',
          },
          {
            name: 'Recall Last Import',
            description: 'Highlight the most recent ingest clip.',
            action: () => handleBloomAction('recallLastImport', undefined, meta),
            disabled: !canRecallLastImport,
            accentColor: '#7fffd4',
          },
        ];
        return attachSettingsMenu(buildSimpleMenu(arrangeItems));
      }
      case 'sampler': {
        const samplerItems: BloomFloatingMenuItem[] = [
          {
            name: 'Arm Pads',
            description: 'Ready the Trap Pad Matrix for a take.',
            action: () => handleBloomAction('armSamplerPads', undefined, meta),
            accentColor: '#6ad5ff',
          },
          {
            name: 'Note Repeat',
            description: 'Toggle triplet and burst rolls.',
            action: () => handleBloomAction('triggerSamplerNoteRepeat', { mode: 'triplet' }, meta),
            accentColor: '#8dd4ff',
          },
          {
            name: 'Flip Sample',
            description: 'Jump into Instant Sample Flip.',
            action: () => handleBloomAction('openSamplerMacros', undefined, meta),
            accentColor: '#c0a8ff',
          },
          {
            name: 'Capture Pattern',
            description: 'Commit this pad take to Mixx Recall.',
            action: () => handleBloomAction('captureSamplerPattern', undefined, meta),
            accentColor: '#ffa7d1',
          },
        ];
        return attachSettingsMenu(buildSimpleMenu(samplerItems));
      }
      case 'record': {
        const recordItems: BloomFloatingMenuItem[] = [
          {
            name: isHushActive ? 'HUSH Active' : 'Arm HUSH',
            description: isHushActive
              ? 'Noise gate guarding every armed lane.'
              : 'Enable HUSH before the next take.',
            action: () => handleBloomAction('toggleHush', undefined, meta),
            disabled: !isAnyTrackArmed,
            progressPercent: isHushActive ? 88 : 20,
            accentColor: '#ff9fbf',
          },
          {
            name: 'New Take Lane',
            description: 'Spin up a dedicated track for this pass.',
            action: () => handleBloomAction('addTrack', undefined, meta),
            accentColor: '#ffb86b',
          },
          {
            name: followPlayhead ? 'Follow On' : 'Follow Off',
            description: followPlayhead
              ? 'Transport is synced to the playhead.'
              : 'Manual ride—tap again to follow.',
            action: () => handleBloomAction('toggleFollowPlayhead', undefined, meta),
            progressPercent: followPlayhead ? 90 : 30,
            accentColor: '#ffd478',
          },
          {
            name: 'Save Session',
            description: 'Commit this performance to memory.',
            action: () => handleBloomAction('saveProject', undefined, meta),
            accentColor: '#ffa9ec',
          },
          {
            name: 'Prime Brain Assist',
            description: 'Run a quick master analysis while recording.',
            action: () => handleBloomAction('analyzeMaster', undefined, meta),
            accentColor: BLOOM_CONTEXT_ACCENTS.ai,
          },
        ];
        return attachSettingsMenu(buildSimpleMenu(recordItems));
      }
      case 'mix': {
        const mixItems: BloomFloatingMenuItem[] = [
          {
            name: 'Reset Mix',
            description: 'Return faders and pans to neutral.',
            action: () => handleBloomAction('resetMix', undefined, meta),
            accentColor: '#7ad0ff',
          },
          {
            name: 'Analyze Master',
            description: 'Prime Brain listens to the bus.',
            action: () => handleBloomAction('analyzeMaster', undefined, meta),
            accentColor: '#9cd3ff',
          },
          {
            name: 'Save Snapshot',
            description: 'Capture this mix state.',
            action: () => handleBloomAction('saveProject', undefined, meta),
            accentColor: '#68f2c8',
          },
          {
            name: 'Import Reference',
            description: 'Drop in a new reference stem.',
            action: () => handleBloomAction('importAudio', undefined, meta),
            accentColor: '#59e6ff',
          },
        ];
        return attachSettingsMenu(buildSimpleMenu(mixItems));
      }
      case 'master': {
        const masterItems: BloomFloatingMenuItem[] = [
          {
            name: 'Prime Brain',
            description: 'Deep dive Velvet anchors.',
            action: () => handleBloomAction('analyzeMaster', undefined, meta),
            accentColor: '#f5a34c',
          },
          {
            name: 'Recall Last Import',
            description: 'Spot the latest reference on the timeline.',
            action: () => handleBloomAction('recallLastImport', undefined, meta),
            disabled: !canRecallLastImport,
            accentColor: '#ffd27f',
          },
          {
            name: 'Open AI Hub',
            description: 'Dial up Prime Brain guidance.',
            action: () => handleBloomAction('openAIHub', undefined, meta),
            accentColor: BLOOM_CONTEXT_ACCENTS.ai,
          },
          {
            name: 'Save Master State',
            description: 'Freeze this mastering stage.',
            action: () => handleBloomAction('saveProject', undefined, meta),
            accentColor: '#f7b973',
          },
        ];
        return attachSettingsMenu(buildSimpleMenu(masterItems));
      }
      case 'ai': {
        const aiItems: BloomFloatingMenuItem[] = [
          {
            name: 'Launch Prime Brain',
            description: 'Open the AI Hub sidecar.',
            action: () => handleBloomAction('openAIHub', undefined, meta),
            accentColor: BLOOM_CONTEXT_ACCENTS.ai,
          },
          {
            name: 'Stem Intake',
            description: 'Feed a mix for stem separation.',
            action: () => handleBloomAction('importAudio', undefined, meta),
            accentColor: '#ff9ecd',
          },
          {
            name: 'Analyze Master',
            description: 'Request instant anchor analysis.',
            action: () => handleBloomAction('analyzeMaster', undefined, meta),
            accentColor: '#c2a3ff',
          },
          {
            name: 'Save Session',
            description: 'Store current AI-enhanced state.',
            action: () => handleBloomAction('saveProject', undefined, meta),
            accentColor: '#9af2ff',
          },
        ];
        return attachSettingsMenu(buildSimpleMenu(aiItems));
      }
      case 'ingest':
        return attachSettingsMenu(buildIngestMenus());
      default: {
        const idleItems: BloomFloatingMenuItem[] = [
          {
            name: 'Add Track',
            description: 'Start arranging with a new lane.',
            action: () => handleBloomAction('addTrack', undefined, meta),
          },
          {
            name: 'Import Source',
            description: 'Bring new audio into the flow.',
            action: () => handleBloomAction('importAudio', undefined, meta),
          },
          {
            name: 'Open AI Hub',
            description: 'Consult Prime Brain.',
            action: () => handleBloomAction('openAIHub', undefined, meta),
            accentColor: BLOOM_CONTEXT_ACCENTS.ai,
          },
          {
            name: 'Reset Mix',
            description: 'Neutralize mixers and buses.',
            action: () => handleBloomAction('resetMix', undefined, meta),
            accentColor: '#82d0ff',
          },
        ];
        return attachSettingsMenu(buildSimpleMenu(idleItems));
      }
    }
  }, [
    bloomContext,
    bloomPulseAgent,
    handleBloomAction,
    handleTogglePrimeBrainTelemetry,
    importProgress,
    ingestJobs,
    isAIHubOpen,
    isAnyTrackArmed,
    isHushActive,
    selectedClipIds,
    canSplitSelection,
    canConsolidateSelection,
    canRecallLastImport,
    currentTime,
    followPlayhead,
    primeBrainStatus,
    primeBrainTelemetryEnabled,
    flowContext.adaptiveSuggestions,
    primeBrainSnapshotInputs,
  ]);

  const handleFloatingBloomPositionChange = useCallback((position: { x: number; y: number }) => {
    const clamped = clampHubPosition(position);
    floatingBloomPositionRef.current = clamped;
    setFloatingBloomPosition(clamped);
    if (!hasCustomHubRef.current) {
      setHasCustomHubPosition(true);
      hasCustomHubRef.current = true;
    }
  }, []);

  const currentMasterProfile =
    masterNodesRef.current?.getProfile() ?? MASTERING_PROFILES.streaming;
  const contentHeight = Math.max(420, viewportHeight - headerHeight);

  // Initialize window globals for flow loop
  useEffect(() => {
    // Initialize window globals if they don't exist
    if (typeof window !== 'undefined') {
      if (!window.__mixx_editEvents) window.__mixx_editEvents = [];
      if (!window.__mixx_toolSwitches) window.__mixx_toolSwitches = [];
      if (!window.__mixx_zoomEvents) window.__mixx_zoomEvents = [];
      if (!window.__mixx_playbackState) window.__mixx_playbackState = { playing: false, looping: false };
      if (!window.__mixx_recordState) window.__mixx_recordState = { recording: false, armedTrack: false, noiseFloor: 0 };
      if (!window.__mixx_viewSwitches) window.__mixx_viewSwitches = [];
    }
  }, []);

  // Update window globals with current state (for Flow Loop)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Update playback state
    updatePlaybackState({
      playing: isPlaying,
      looping: isLooping,
      playCount: isLooping ? Math.floor(currentTime / (60 / bpm)) : 0,
      cursor: currentTime,
      regionLength: isLooping ? (60 / bpm) * 4 : undefined, // Assume 4-bar loop
      cursorLock: isLooping && isPlaying, // Cursor locked when looping
    });
    
    // Update recording state
    const isRecording = isPlaying && armedTracks.size > 0;
    const wasRecording = window.__mixx_recordState?.recording || false;
    
    updateRecordState({
      recording: isRecording,
      armedTrack: armedTracks.size > 0,
      noiseFloor: hushFeedback.intensity,
      threshold: 0.2,
    });
    
    // Record punch events and take memory when recording starts/stops
    if (isRecording && !wasRecording) {
      // Recording started - record punch event and set record start time
      recordRecordTap(); // Record tap for double-tap detection
      recordPunchEvent(currentTime, undefined, undefined); // Record punch start
      
      // Set record start time for take memory
      if (!window.__mixx_recordState) {
        window.__mixx_recordState = { recording: false, armedTrack: false, noiseFloor: 0 };
      }
      window.__mixx_recordState.recordStart = performance.now();
    } else if (!isRecording && wasRecording) {
      // Recording stopped - record punch end with duration and take memory
      const punchHistory = window.__mixx_punchHistory || [];
      if (punchHistory.length > 0) {
        const lastPunch = punchHistory[punchHistory.length - 1];
        const duration = (performance.now() - lastPunch.ts) / 1000; // Convert to seconds
        // Update last punch with duration
        lastPunch.duration = duration;
        // Detect punch type
        const punchType = detectPunchType(punchHistory);
        if (punchType) {
          lastPunch.type = punchType;
        }
      }
      
      // Record take memory (crown jewel of Punch Mode)
      const takeMemory = recordTakeMemory();
      if (takeMemory) {
        // Analyze take for comping (Comping Brain)
        const compData = analyzeTakeForComp(takeMemory);
        
        if (import.meta.env.DEV) {
          console.log('[TAKE MEMORY] Take recorded:', {
            duration: `${(takeMemory.duration / 1000).toFixed(2)}s`,
            barPosition: takeMemory.barPosition.toFixed(1),
            flow: (takeMemory.flowDuringTake * 100).toFixed(0) + '%',
            hushEvents: takeMemory.hushEvents,
          });
          console.log('[COMPING BRAIN] Take scored:', {
            score: (compData.score * 100).toFixed(0) + '%',
            timing: (compData.timingAccuracy * 100).toFixed(0) + '%',
            noise: (compData.noiseScore * 100).toFixed(0) + '%',
            energy: (compData.energySlope * 100).toFixed(0) + '%',
          });
        }
      }
    }
  }, [isPlaying, isLooping, currentTime, bpm, armedTracks, hushFeedback.intensity]);

  return (
    <FlowLoopWrapper primeBrainStatus={primeBrainStatus}>
    <div className="relative w-screen h-screen text-ink overflow-hidden" style={backgroundGlowStyle}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(48,92,178,0.45)] via-[rgba(19,37,74,0.4)] to-transparent blur-[110px] opacity-80"></div>
        <AdaptiveWaveformHeader
          primeBrainStatus={primeBrainStatus}
          hushFeedback={hushFeedback}
          isPlaying={isPlaying}
          onHeightChange={setHeaderHeight}
          settings={waveformHeaderSettings}
        />
        <main
          className="absolute left-0 right-0 overflow-hidden"
          style={{ top: headerHeight, bottom: 0 }}
        >
          <FlowTransitionEngine activeView={viewMode}>
            {(currentView) => (
              <>
                <ViewDeck
                  viewMode={currentView}
                  className="h-full w-full"
                  slots={[
              {
                id: "arrange",
                label: "Arrange View",
                content: (
                  <ArrangeWindow
                    height={contentHeight}
                    tracks={tracks}
                    clips={clips}
                    setClips={setClips}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                    bpm={bpm}
                    beatsPerBar={4}
                    pixelsPerSecond={ppsAPI.value}
                    ppsAPI={ppsAPI}
                    scrollX={scrollX}
                    setScrollX={setScrollX}
                    selection={selection}
                    setSelection={setSelection}
                    clearSelection={clearSelection}
                    onSplitAt={onSplitAt}
                    undo={undo}
                    redo={redo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    selectedTrackId={selectedTrackId}
                    onSelectTrack={setSelectedTrackId}
                    armedTracks={armedTracks}
                    onToggleArm={handleToggleArm}
                    mixerSettings={mixerSettings}
                    onMixerChange={handleMixerChange}
                    soloedTracks={soloedTracks}
                    onToggleSolo={handleToggleSolo}
                    onToggleMute={handleToggleMute}
                    masterAnalysis={masterAnalysis}
                    automationData={automationData}
                    visibleAutomationLanes={visibleAutomationLanes}
                    onAddAutomationPoint={handleAddAutomationPoint}
                    onUpdateAutomationPoint={handleUpdateAutomationPoint}
                    onDeleteAutomationPoint={handleDeleteAutomationPoint}
                    onUpdateClipProperties={updateClipProperties}
                    inserts={inserts}
                    trackSendLevels={trackSendLevels}
                    fxWindows={fxWindows}
                    onAddPlugin={handleAddPlugin}
                    onRemovePlugin={handleRemovePlugin}
                    onMovePlugin={handleMovePlugin}
                    onOpenPluginBrowser={(trackId: string) => {
                      setTrackIdForPluginBrowser(trackId);
                      setIsPluginBrowserOpen(true);
                    }}
                    onOpenPluginSettings={handleOpenPluginSettings}
                    automationParamMenu={automationParamMenu}
                    onOpenAutomationParamMenu={(x, y, trackId) =>
                      setAutomationParamMenu({ x, y, trackId })
                    }
                    onCloseAutomationParamMenu={() => setAutomationParamMenu(null)}
                    onToggleAutomationLaneWithParam={handleToggleAutomationLane}
                    style={arrangeBorderGlowStyle}
                    trackAnalysis={trackAnalysis}
                    highlightClipIds={recallHighlightClipIds}
                    followPlayhead={followPlayhead}
                    onManualScroll={handleManualTimelineScroll}
                    trackUiState={trackUiState}
                    onToggleTrackCollapse={handleToggleTrackCollapse}
                    onResizeTrack={handleResizeTrack}
                    onRequestTrackCapsule={handleOpenTrackCapsule}
                    onSetTrackContext={handleTrackContextChange}
                    onOpenPianoRoll={handleOpenPianoRoll}
                    audioBuffers={audioBuffers}
                  />
                ),
              },
              {
                id: "sampler",
                label: "Trap Sampler Console",
                content: (
                  <div className="flex h-full w-full items-center justify-center px-8">
                    <TrapSamplerConsole tempoBpm={bpm} />
                  </div>
                ),
              },
              {
                id: "mixer",
                label: "Flow Mixer",
                content: (
                  <FlowConsole
                    tracks={tracks}
                    mixerSettings={mixerSettings}
                    trackAnalysis={trackAnalysis}
                    onMixerChange={handleMixerChangeForMixer}
                    soloedTracks={soloedTracks}
                    onToggleSolo={handleToggleSolo}
                    masterVolume={masterVolume}
                    onMasterVolumeChange={setMasterVolume}
                    masterBalance={masterBalance}
                    onBalanceChange={setMasterBalance}
                    masterAnalysis={masterAnalysis}
                    selectedTrackId={selectedTrackId}
                    onSelectTrack={setSelectedTrackId}
                    armedTracks={armedTracks}
                    onToggleArm={handleToggleArm}
                    onRenameTrack={handleRenameTrack}
                    inserts={inserts}
                    fxWindows={fxWindows}
                    onAddPlugin={handleAddPlugin}
                    onRemovePlugin={handleRemovePlugin}
                    onMovePlugin={handleMovePlugin}
                    onOpenPluginBrowser={(trackId: string) => {
                      setTrackIdForPluginBrowser(trackId);
                      setIsPluginBrowserOpen(true);
                    }}
                    onOpenPluginSettings={handleOpenPluginSettings}
                    fxBypassState={fxBypassState}
                    onToggleBypass={handleToggleBypass}
                    availableSends={availableSendPalette}
                    trackSendLevels={trackSendLevels}
                    onSendLevelChange={handleSendLevelChange}
                    buses={busStrips}
                    selectedBusId={selectedBusId}
                    onSelectBus={(busId) =>
                      setSelectedBusId((prev) => {
                        const typed = busId as MixerBusId;
                        return prev === typed ? null : typed;
                      })
                    }
                    dynamicsSettings={channelDynamicsSettings}
                    eqSettings={channelEQSettings}
                    onDynamicsChange={handleDynamicsSettingsChange}
                    onEQChange={handleEQSettingsChange}
                    pluginInventory={pluginInventory}
                    pluginFavorites={pluginFavorites}
                    onTogglePluginFavorite={handleTogglePluginFavorite}
                    pluginPresets={pluginPresets}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    followPlayhead={followPlayhead}
                    onSavePluginPreset={handleSavePluginPreset}
                    onLoadPluginPreset={handleLoadPluginPreset}
                    onDeletePluginPreset={handleDeletePluginPreset}
                    mixerActionPulse={mixerActionPulse}
                  />
                ),
              },
            ]}
          />
                {/* Wide Glass Console for Mix View */}
                {currentView === "mix" && (
                  <>
                    {/* Dimmed ArrangeWindow overlay */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none">
                      <ViewDeck
                        viewMode="arrange"
                        className="h-full w-full"
                        slots={[
                          {
                            id: "arrange",
                            label: "Arrange View",
                            content: (
                              <ArrangeWindow
                                height={contentHeight}
                                tracks={tracks}
                                clips={clips}
                                setClips={setClips}
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                                onSeek={handleSeek}
                                bpm={bpm}
                                beatsPerBar={4}
                                pixelsPerSecond={ppsAPI.value}
                                ppsAPI={ppsAPI}
                                scrollX={scrollX}
                                setScrollX={setScrollX}
                                selection={selection}
                                setSelection={setSelection}
                                clearSelection={clearSelection}
                                onSplitAt={onSplitAt}
                                undo={undo}
                                redo={redo}
                                canUndo={canUndo}
                                canRedo={canRedo}
                                selectedTrackId={selectedTrackId}
                                onSelectTrack={setSelectedTrackId}
                                armedTracks={armedTracks}
                                onToggleArm={handleToggleArm}
                                mixerSettings={mixerSettings}
                                onMixerChange={handleMixerChange}
                                soloedTracks={soloedTracks}
                                onToggleSolo={handleToggleSolo}
                                onToggleMute={handleToggleMute}
                                masterAnalysis={masterAnalysis}
                                automationData={automationData}
                                visibleAutomationLanes={visibleAutomationLanes}
                                onAddAutomationPoint={handleAddAutomationPoint}
                                onUpdateAutomationPoint={handleUpdateAutomationPoint}
                                onDeleteAutomationPoint={handleDeleteAutomationPoint}
                                onUpdateClipProperties={updateClipProperties}
                                inserts={inserts}
                                fxWindows={fxWindows}
                                onAddPlugin={handleAddPlugin}
                                onRemovePlugin={handleRemovePlugin}
                                onMovePlugin={handleMovePlugin}
                                onOpenPluginBrowser={(trackId: string) => {
                                  setTrackIdForPluginBrowser(trackId);
                                  setIsPluginBrowserOpen(true);
                                }}
                                onOpenPluginSettings={handleOpenPluginSettings}
                                automationParamMenu={automationParamMenu}
                                onOpenAutomationParamMenu={(x, y, trackId) =>
                                  setAutomationParamMenu({ x, y, trackId })
                                }
                                onCloseAutomationParamMenu={() => setAutomationParamMenu(null)}
                                onToggleAutomationLaneWithParam={handleToggleAutomationLane}
                                style={arrangeBorderGlowStyle}
                                trackAnalysis={trackAnalysis}
                                highlightClipIds={recallHighlightClipIds}
                                followPlayhead={followPlayhead}
                                onManualScroll={handleManualTimelineScroll}
                                trackUiState={trackUiState}
                                onToggleTrackCollapse={handleToggleTrackCollapse}
                                onResizeTrack={handleResizeTrack}
                                onRequestTrackCapsule={handleOpenTrackCapsule}
                                onSetTrackContext={handleTrackContextChange}
                                onOpenPianoRoll={handleOpenPianoRoll}
                                audioBuffers={audioBuffers}
                              />
                            ),
                          },
                        ]}
                      />
                    </div>
                    {/* Wide Glass Console */}
                    <WideGlassConsole
                      visible={true}
                      x={consolePosition.x}
                      y={consolePosition.y}
                    >
                      {/* Mixer content will be rendered inside console */}
                    </WideGlassConsole>
                  </>
                )}
              </>
            )}
          </FlowTransitionEngine>
        </main>

        <VelvetComplianceHUD metrics={loudnessMetrics} profile={currentMasterProfile} />

        <OverlayPortal
          containerId="mixx-fx-portal"
          className="mixx-overlay mixx-overlay--fx fixed inset-0 z-30 pointer-events-none"
        >
          <FXRack
            onOpenPluginSettings={handleOpenPluginSettings}
            fxBypassState={fxBypassState}
            onToggleBypass={(fxId) => handleToggleBypass(fxId)}
          >
            {renderFxWindows}
          </FXRack>
        </OverlayPortal>

        <OverlayPortal containerId="mixx-bloom-floating-portal">
          <BloomFloatingHub
            menuConfig={bloomFloatingMenu}
            alsPulseAgent={bloomPulseAgent}
            position={floatingBloomPosition}
            onPositionChange={handleFloatingBloomPositionChange}
          />
        </OverlayPortal>

        <OverlayPortal containerId="mixx-bloom-dock-portal">
          <BloomDock
            position={bloomPosition}
            onPositionChange={handleBloomPositionChange}
            alsPulseAgent={bloomPulseAgent}
            isPlaying={isPlaying}
            isLooping={isLooping}
            onPlayPause={handlePlayPause}
            onTransportJump={jumpTransport}
            onTransportNudge={nudgeTransport}
            onToggleLoop={handleToggleLoop}
            masterAnalysis={masterAnalysis}
            selectedClips={selectedClips}
            onAction={handleBloomAction}
            isAnyTrackArmed={isAnyTrackArmed}
            isHushActive={isHushActive}
            fxWindows={fxWindows}
            fxVisibility={fxVisibility}
            onToggleFxVisibility={handleToggleFxVisibility}
            selectedTrackId={selectedTrackId}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onOpenAIHub={() => setIsAIHubOpen(true)}
            currentTime={currentTime}
            canRecallLastImport={ingestHistoryEntries.length > 0}
            followPlayhead={followPlayhead}
            contextLabel={bloomLabel}
            contextAccent={bloomAccent}
            recordingOptions={recordingOptions}
            onToggleRecordingOption={handleToggleRecordingOption}
            onDropTakeMarker={handleDropTakeMarker}
          />
        </OverlayPortal>

        {/* Waveform Header Settings Modal */}
        {isWaveformSettingsOpen && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md"
            onClick={() => setIsWaveformSettingsOpen(false)}
          >
            <div 
              className="relative w-[600px] max-h-[80vh] rounded-2xl bg-gradient-to-br from-slate-900/95 to-indigo-900/50 border border-cyan-400/30 flex flex-col shadow-2xl shadow-cyan-500/20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
                  Waveform Header Settings
                </h2>
                <button
                  onClick={() => setIsWaveformSettingsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <WaveformHeaderSettingsPanel
                  settings={waveformHeaderSettings}
                  onSettingsChange={setWaveformHeaderSettings}
                  onReset={() => setWaveformHeaderSettings({ ...DEFAULT_WAVEFORM_HEADER_SETTINGS })}
                />
              </div>
            </div>
          </div>
        )}

        {isAddTrackModalOpen && (
            <AddTrackModal
                onClose={() => setIsAddTrackModalModalOpen(false)}
                onAddTrack={handleAddTrack}
            />
        )}
        {isStemModalOpen && pendingStemRequest && (
            <StemSeparationModal
                initialSelection={lastStemSelection}
                onClose={handleStemModalCancel}
                onSeparate={handleStemModalConfirm}
            />
        )}
        {importMessage && <ImportModal message={importMessage} />}
        {contextMenu && (
            <TrackContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onDelete={() => handleDeleteTrack(contextMenu.trackId)}
                onRename={() => { setRenameModal(contextMenu.trackId); setContextMenu(null); }}
                onChangeColor={() => { setChangeColorModal(contextMenu.trackId); setContextMenu(null); }}
                canDelete={!contextMenuTrack?.locked}
                canRename={!contextMenuTrack?.locked}
                canChangeColor={!contextMenuTrack?.locked}
            />
        )}
        {renameModal && (
            <RenameTrackModal 
                currentName={tracks.find(t => t.id === renameModal)?.trackName || ''}
                onClose={() => setRenameModal(null)}
                onRename={(newName) => handleRenameTrack(renameModal, newName)}
            />
        )}
        {changeColorModal && (
            <ChangeColorModal
                currentColor={tracks.find(t => t.id === changeColorModal)?.trackColor || 'cyan'}
                onClose={() => setChangeColorModal(null)}
                onChangeColor={(newColor) => handleChangeColor(changeColorModal, newColor)}
            />
        )}
        {activeClip && (
            <PrimeBrainInterface
                clip={activeClip}
                onClose={() => setActivePrimeBrainClipId(null)}
                onUpdateClip={updateClipProperties}
            />
        )}

        {/* Plugin Browser Modal */}
        {isPluginBrowserOpen && trackIdForPluginBrowser && (
          <div className="fixed inset-0 z-[200]">
            <SuitePluginSurface
              trackId={trackIdForPluginBrowser}
              trackName={
                tracks.find((track) => track.id === trackIdForPluginBrowser)?.trackName
              }
              existingPluginIds={inserts[trackIdForPluginBrowser] ?? []}
              onAddPlugin={(pluginId) => {
                handleAddPlugin(trackIdForPluginBrowser, pluginId as FxWindowId);
                setIsPluginBrowserOpen(false);
                setTrackIdForPluginBrowser(null);
              }}
              onClose={handleClosePluginBrowser}
            />
          </div>
        )}
        
        {/* Prime Brain Debug Overlay (dev only) */}
        <PrimeBrainDebugOverlay
          primeBrainStatus={primeBrainStatus}
          flowContext={flowContext}
          snapshotInputs={primeBrainSnapshotInputs}
        />
        
        <FileInput
          ref={fileInputRef}
          className="hidden"
          accept=".json,.wav,.aiff,.aif,.mp3,.flac,.ogg,.m4a,.aac,audio/*"
          multiple
          onImportComplete={async (result) => {
            // Flow import complete - sync Zustand state to React state
            try {
              // FLOW GOLDEN PATH: Read from Zustand store (source of truth)
              const zustandState = useTimelineStore.getState();
              const zustandTracks = zustandState.getTracks();
              const zustandClips = zustandState.getClips();
              const zustandBuffers = zustandState.getAudioBuffers();
              
              // Sync Zustand tracks/clips to React state (MERGE, not replace)
              if (zustandTracks.length > 0 || zustandClips.length > 0) {
                console.log('[FLOW IMPORT] Syncing Zustand to React state:', {
                  tracks: zustandTracks.length,
                  clips: zustandClips.length,
                  buffers: Object.keys(zustandBuffers).length,
                  existingTracks: tracks.length,
                  existingClips: clips.length,
                });
                
                // MERGE tracks: Keep existing tracks, add/update new ones from Zustand
                setTracks(prev => {
                  const existingById = new Map(prev.map(t => [t.id, t]));
                  const merged: TrackData[] = [...prev];
                  
                  zustandTracks.forEach(zTrack => {
                    if (!existingById.has(zTrack.id)) {
                      // New track from Zustand - add it
                      merged.push(zTrack);
                      existingById.set(zTrack.id, zTrack);
                    } else {
                      // Update existing track with Zustand data
                      const index = merged.findIndex(t => t.id === zTrack.id);
                      if (index !== -1) {
                        merged[index] = { ...merged[index], ...zTrack };
                      }
                    }
                  });
                  
                  console.log('[FLOW IMPORT] Merged tracks:', {
                    before: prev.length,
                    after: merged.length,
                    added: merged.length - prev.length,
                  });
                  
                  return merged;
                });
                
                // MERGE clips: Keep existing clips, add/update new ones from Zustand
                setClips(prev => {
                  const existingById = new Map(prev.map(c => [c.id, c]));
                  const merged: ArrangeClip[] = [...prev];
                  
                  zustandClips.forEach(zClip => {
                    if (!existingById.has(zClip.id)) {
                      // New clip from Zustand - add it
                      merged.push(zClip as ArrangeClip);
                      existingById.set(zClip.id, zClip);
                    } else {
                      // Update existing clip with Zustand data
                      const index = merged.findIndex(c => c.id === zClip.id);
                      if (index !== -1) {
                        merged[index] = { ...merged[index], ...zClip } as ArrangeClip;
                      }
                    }
                  });
                  
                  console.log('[FLOW IMPORT] Merged clips:', {
                    before: prev.length,
                    after: merged.length,
                    added: merged.length - prev.length,
                  });
                  
                  return merged;
                });
                
                // MERGE buffers: Add new buffers from Zustand
                setAudioBuffers(prev => {
                  return { ...prev, ...zustandBuffers };
                });
                
                // Initialize mixer settings for all Zustand tracks (merge with existing)
                setMixerSettings(prev => {
                  const next = { ...prev };
                  zustandTracks.forEach(track => {
                    if (!next[track.id]) {
                      // Default volume based on track role
                      const volume = track.role === 'two-track' ? 0.82 : 
                                   track.role === 'hushRecord' ? 0.78 : 0.75;
                      next[track.id] = { volume, pan: 0, isMuted: false };
                    }
                  });
                  return next;
                });
                
                // Initialize inserts for all Zustand tracks (merge with existing)
                setInserts(prev => {
                  const updated = { ...prev };
                  zustandTracks.forEach(track => {
                    if (!updated[track.id]) {
                      updated[track.id] = [];
                    }
                  });
                  return updated;
                });
                
                // Initialize send levels for all Zustand tracks (merge with existing)
                setTrackSendLevels(prev => {
                  const updated = { ...prev };
                  zustandTracks.forEach(track => {
                    if (!updated[track.id]) {
                      updated[track.id] = createDefaultSendLevels(track);
                    }
                  });
                  return updated;
                });
                
                // Initialize dynamics settings for all Zustand tracks (merge with existing)
                setChannelDynamicsSettings(prev => {
                  const updated = { ...prev };
                  zustandTracks.forEach(track => {
                    if (!updated[track.id]) {
                      updated[track.id] = createDefaultDynamicsSettings(track);
                    }
                  });
                  return updated;
                });
                
                // Initialize EQ settings for all Zustand tracks (merge with existing)
                setChannelEQSettings(prev => {
                  const updated = { ...prev };
                  zustandTracks.forEach(track => {
                    if (!updated[track.id]) {
                      updated[track.id] = createDefaultEQSettings(track);
                    }
                  });
                  return updated;
                });
                
                // Update refs to keep everything in sync
                tracksRef.current = useTimelineStore.getState().getTracks();
                clipsRef.current = useTimelineStore.getState().getClips();
                
                console.log('[FLOW IMPORT] React state synced from Zustand (merged)');
                return; // Early return - Zustand is source of truth
              }
              
              // Fallback: Convert TrackConfig to TrackData (legacy path)
              const newTracks: TrackData[] = [];
              const newClips: ArrangeClip[] = [];
              const newBuffers: Record<string, AudioBuffer> = {};
              
              const baseTimestamp = Date.now();
              result.tracks.forEach((trackConfig, index) => {
                // Generate unique track ID with timestamp + index + random
                const trackId = `track-${baseTimestamp}-${index}-${Math.random().toString(36).substring(2, 7)}`;
                const bufferId = `buffer-${baseTimestamp}-${index}-${Math.random().toString(36).substring(2, 7)}`;
                
                // Map TrackConfig color to TrackData color
                const colorMap: Record<string, TrackData['trackColor']> = {
                  '#A78BFA': 'purple', // VOCAL_MAIN
                  '#C084FC': 'purple', // VOCAL_ADLIB
                  '#D8B4FE': 'purple', // VOCAL_HARMONY
                  '#60A5FA': 'blue',   // DRUMS
                  '#38BDF8': 'cyan',    // BASS_808
                  '#34D399': 'green',   // MUSIC
                  '#FBBF24': 'crimson', // PERC
                  '#F472B6': 'magenta', // FX
                  '#94A3B8': 'cyan',    // MISC
                };
                
                const trackColor = trackConfig.color 
                  ? (colorMap[trackConfig.color] || 'cyan')
                  : 'cyan';
                
                // Map group from trackConfig.group or autoRole
                const groupMap: Record<string, TrackData['group']> = {
                  'vocals': 'Vocals',
                  'rhythm': 'Drums',
                  'bass': 'Bass',
                  'music': 'Instruments',
                  'fx': 'Instruments',
                  'other': 'Instruments',
                };
                
                // Determine group from autoRole if available
                let group: TrackData['group'] = 'Instruments';
                if (trackConfig.autoRole) {
                  if (trackConfig.autoRole.startsWith('VOCAL_')) {
                    group = 'Vocals';
                  } else if (trackConfig.autoRole === 'DRUMS' || trackConfig.autoRole === 'PERC') {
                    group = 'Drums';
                  } else if (trackConfig.autoRole === 'BASS_808') {
                    group = 'Bass';
                  } else if (trackConfig.autoRole === 'MUSIC') {
                    group = 'Instruments';
                  }
                } else if (trackConfig.group) {
                  group = groupMap[trackConfig.group] || 'Instruments';
                }
                
                // Determine waveform type from track type
                const waveformTypeMap: Record<string, TrackData['waveformType']> = {
                  'vocal': 'varied',
                  'drums': 'dense',
                  'bass': 'bass',
                  'sub': 'bass',
                  'music': 'sparse',
                  'perc': 'dense',
                  'harmonic': 'sparse',
                  'other': 'varied',
                };
                
                const waveformType = waveformTypeMap[trackConfig.type] || 'varied';
                
                // Create TrackData
                const trackData: TrackData = {
                  id: trackId,
                  trackName: trackConfig.name,
                  trackColor,
                  waveformType,
                  group,
                  role: 'standard', // TrackRole is 'standard' | 'hushRecord', no 'master'
                  locked: false,
                };
                
                newTracks.push(trackData);
                
                // Store audio buffer
                newBuffers[bufferId] = trackConfig.buffer;
                
                // Create clip for this track
                const clip: ArrangeClip = {
                  id: `clip-${baseTimestamp}-${index}-${Math.random().toString(36).substring(2, 7)}`,
                  trackId,
                  name: trackConfig.name,
                  color: trackConfig.color || '#60A5FA',
                  start: 0,
                  duration: trackConfig.buffer.duration,
                  sourceStart: 0,
                  bufferId,
                  selected: false,
                  gain: 1.0,
                };
                
                newClips.push(clip);
              });
              
              // CRITICAL: Batch all state updates together to ensure React sees the changes
              // This ensures ArrangeWindow re-renders with all new data at once
              
              console.log('[FLOW IMPORT] Before state update:', {
                currentTracksCount: tracks.length,
                currentClipsCount: clips.length,
                newTracksCount: newTracks.length,
                newClipsCount: newClips.length,
                newTrackIds: newTracks.map(t => t.id),
                newClipTrackIds: newClips.map(c => c.trackId),
                newClipIds: newClips.map(c => c.id),
                bufferIds: Object.keys(newBuffers),
              });
              
              // CRITICAL: Initialize mixer settings FIRST before adding tracks
              // This prevents ArrangeTrackHeader from receiving undefined mixerSettings
              setMixerSettings(prev => {
                const next = { ...prev };
                newTracks.forEach(track => {
                  if (!next[track.id]) {
                    next[track.id] = { volume: 0.75, pan: 0, isMuted: false };
                  }
                });
                console.log('[FLOW IMPORT] Mixer settings initialized for tracks:', {
                  trackIds: newTracks.map(t => t.id),
                });
                return next;
              });
              
              // React 18+ automatically batches these, but we ensure immutability
              // Add tracks to state (immutable update - new array reference)
              setTracks(prev => {
                const updated = [...prev, ...newTracks];
                console.log('[FLOW IMPORT] setTracks called:', {
                  prevCount: prev.length,
                  newCount: updated.length,
                  allTrackIds: updated.map(t => t.id),
                });
                return updated;
              });
              
              // Add clips to state (immutable update - new array reference)
              setClips(prev => {
                const updated = [...prev, ...newClips];
                console.log('[FLOW IMPORT] setClips called:', {
                  prevCount: prev.length,
                  newCount: updated.length,
                  allClipIds: updated.map(c => c.id),
                  allClipTrackIds: updated.map(c => c.trackId),
                });
                return updated;
              });
              
              // Store audio buffers (immutable update - new object reference)
              setAudioBuffers(prev => {
                const updated = { ...prev, ...newBuffers };
                console.log('[FLOW IMPORT] setAudioBuffers called:', {
                  prevCount: Object.keys(prev).length,
                  newCount: Object.keys(updated).length,
                  bufferIds: Object.keys(newBuffers),
                });
                return updated;
              });
              
              // Log for debugging - this confirms state updates are firing
              console.log('[FLOW IMPORT] State hydration complete - all updates queued');
              
              // Force a microtask delay to ensure React has processed state updates
              // This guarantees ArrangeWindow receives the new props
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Verify state was actually updated
              console.log('[FLOW IMPORT] After state update delay:', {
                tracksState: tracks.length,
                clipsState: clips.length,
                note: 'These may still show old values due to closure - check ArrangeWindow props',
              });
              
              // Initialize inserts for new tracks
              setInserts(prev => {
                const updated = { ...prev };
                newTracks.forEach(track => {
                  if (!updated[track.id]) {
                    updated[track.id] = [];
                  }
                });
                return updated;
              });
              
              // Initialize send levels for new tracks
              setTrackSendLevels(prev => {
                const updated = { ...prev };
                newTracks.forEach(track => {
                  if (!updated[track.id]) {
                    updated[track.id] = createDefaultSendLevels(track);
                  }
                });
                return updated;
              });
              
              // Initialize dynamics settings for new tracks
              setChannelDynamicsSettings(prev => {
                const updated = { ...prev };
                newTracks.forEach(track => {
                  if (!updated[track.id]) {
                    updated[track.id] = createDefaultDynamicsSettings(track);
                  }
                });
                return updated;
              });
              
              // Initialize EQ settings for new tracks
              setChannelEQSettings(prev => {
                const updated = { ...prev };
                newTracks.forEach(track => {
                  if (!updated[track.id]) {
                    updated[track.id] = createDefaultEQSettings(track);
                  }
                });
                return updated;
              });
              
              // Wake ALS + Prime Brain
              if (typeof window !== 'undefined') {
                const brain = window.__primeBrainInstance as any;
                if (brain?.updateFromImport) {
                  brain.updateFromImport(result.metadata);
                }
                
                const als = window.__als as any;
                if (als) {
                  als.flow = 65;
                  als.temperature = 'warming';
                  als.guidance = 'Preparing arrangement...';
                }
                
                // Trigger Bloom HUD ready state
                window.__bloom_ready = true;
              }
              
              // Log completion
              if ((import.meta as any).env?.DEV) {
                console.log('[FLOW IMPORT] Complete', {
                  tracks: newTracks.length,
                  clips: newClips.length,
                  buffers: Object.keys(newBuffers).length,
                  metadata: result.metadata,
                });
              }
            } catch (error) {
              console.error('[FLOW IMPORT] Error adding tracks to timeline:', error);
              if (typeof window !== 'undefined' && window.alert) {
                window.alert(`Failed to add tracks to timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }}
          aria-label="Load audio or project file"
        />

        {isAIHubOpen && (
            <AIHub
                onClose={() => setIsAIHubOpen(false)}
                audioContext={audioContextRef.current}
                clips={clips} 
                tracks={tracks}
                selectedTrackId={selectedTrackId}
            />
        )}
        <PianoRollPanel
          isOpen={isPianoRollOpen}
          clip={activePianoClip}
          track={activePianoTrack}
          binding={pianoRollBinding}
          bpm={bpm}
          beatsPerBar={4}
          onClose={handleClosePianoRoll}
          onCommit={handleCommitPianoRoll}
          currentTime={currentTime}
          followPlayhead={followPlayhead}
          analysis={
            activePianoTrack ? trackAnalysis[activePianoTrack.id] : undefined
          }
          onWarpAnchors={handleApplyWarpAnchors}
          onExportMidi={handleExportPianoRollMidi}
        />
        
        {/* External Plugin Test Button (Dev Only) */}
        <ExternalPluginTestButton audioContext={audioContextRef.current} />
    </div>
    </FlowLoopWrapper>
  );
};

const App: React.FC = () => {
  const [hasEnteredFlow, setHasEnteredFlow] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      return window.sessionStorage.getItem(FLOW_ENTRY_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [arrangeFocusToken, setArrangeFocusToken] = useState(0);

  const handleEnterFlow = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(FLOW_ENTRY_STORAGE_KEY, "1");
      } catch {
        // ignore storage write errors to preserve flow
      }
    }
    setHasEnteredFlow(true);
    setArrangeFocusToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!hasEnteredFlow) {
      return;
    }
    publishBloomSignal({
      source: "system",
      action: "flowSessionOpened",
      payload: { origin: "welcome-hub" },
    });
    publishAlsSignal({
      source: "system",
      meta: {
        surface: "flow-welcome",
        stage: "complete",
      },
    });
  }, [hasEnteredFlow]);

  if (!hasEnteredFlow) {
    return <FlowWelcomeHub onEnterFlow={handleEnterFlow} />;
  }

  return <FlowRuntime arrangeFocusToken={arrangeFocusToken} />;
};

export default App;

