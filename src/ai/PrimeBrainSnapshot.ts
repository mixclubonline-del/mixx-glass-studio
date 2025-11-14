import { v4 as uuid } from 'uuid';

/**
 * Prime Brain Orchestration Contract
 * 
 * Prime Brain consumes unified Studio state snapshots and orchestrates subtle Flow behaviors.
 * 
 * **Inputs (per tick):**
 * - `alsChannels`: Temperature, momentum, pressure, harmony (0-1 normalized)
 * - `modeHints`: Transport state, armed tracks, active Bloom actions, CPU/performance
 * - `bloomTrace`: Recent Bloom action outcomes (max 24)
 * - `userMemory`: Recent workflow actions and recall anchors (max 10 actions)
 * - `audioMetrics`: Latency, CPU load, dropouts, buffer size
 * - `harmonicState`: Key, scale, consonance, tension, velocity energy
 * - `aiAnalysisFlags`: Mix warnings, performance issues, ingest status
 * - `transport`: Playback state, tempo, playhead, loop range
 * 
 * **Outputs (authoritative vs advisory):**
 * - **Authoritative:**
 *   - ALS bar mode, health, channels, guidance text (via `PrimeBrainStatus`)
 *   - Mode derivation (`passive` | `active` | `learning` | `optimizing`)
 * 
 * - **Advisory (never forced):**
 *   - Bloom menu item highlighting/reordering (via `flowContext.adaptiveSuggestions`)
 *   - Timeline tool highlighting (via `adaptiveSuggestions.highlightTools`)
 *   - View switch suggestions (via `adaptiveSuggestions.suggestViewSwitch`)
 *   - UI density hints (`minimal` | `normal` | `rich`)
 * 
 * **Mode Behavior:**
 * - `passive`: Minimal visual nudges; ALS bar is quiet indicator
 * - `active`: Focused hints tied to recent actions
 * - `learning`: Stronger cues around recording/performance, still non-blocking
 * - `optimizing`: Performance-focused guidance, critical issue warnings
 * 
 * **Privacy & Redaction:**
 * - All snapshots respect ALS Privacy Guard (no raw clip names, filenames, user identifiers)
 * - Export requires explicit consent (`VITE_SESSION_PROBE_ALLOW_EXPORT=1`)
 * - User memory uses neutral descriptors and IDs only
 */

export type PrimeBrainMode = 'passive' | 'active' | 'learning' | 'optimizing';

export type PrimeBrainALSChannel = 'temperature' | 'momentum' | 'pressure' | 'harmony';

export interface PrimeBrainBloomEvent {
  actionId: string;
  name: string;
  intent: string;
  confidence: number;
  outcome: 'accepted' | 'dismissed' | 'ignored';
  triggeredAt: string;
}

export interface PrimeBrainCommandLog {
  id: string;
  commandType: string;
  payload: Record<string, unknown>;
  issuedAt: string;
  accepted: boolean;
}

export interface PrimeBrainGuidance {
  lastSuggestion?: string;
  lastCommand?: PrimeBrainCommandLog;
}

export interface PrimeBrainConversationTurn {
  role: 'primeBrain' | 'creator';
  mode: PrimeBrainMode;
  message: string;
  issuedAt: string;
  linkedCommandId?: string;
}

export interface PrimeBrainAudioMetrics {
  latencyMs?: number;
  cpuLoad?: number;
  dropoutsPerMinute?: number;
  bufferSize?: number;
  sampleRate?: number;
}

export interface PrimeBrainHarmonicState {
  key: string;
  scale: string;
  consonance: number;
  tension: number;
  velocityEnergy?: number;
}

export interface PrimeBrainAIFlag {
  category: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
}

export interface PrimeBrainUserMemory {
  recentActions: Array<{ action: string; timestamp: string }>;
  recallAnchors: string[];
}

export interface PrimeBrainModeHints {
  isPlaying: boolean;
  armedTrackCount: number;
  activeBloomActions: number;
  cpuLoad?: number;
  dropoutsPerMinute?: number;
}

export interface PrimeBrainSnapshotInputs {
  sessionId: string;
  userId?: string | null;
  captureTimestamp: string;
  transport: {
    isPlaying: boolean;
    playheadSeconds: number;
    tempo?: number;
    isLooping: boolean;
    cycle?: { startSeconds: number; endSeconds: number } | null;
  };
  alsChannels: Array<{ channel: PrimeBrainALSChannel; value: number }>;
  audioMetrics: PrimeBrainAudioMetrics;
  harmonicState: PrimeBrainHarmonicState;
  aiAnalysisFlags: PrimeBrainAIFlag[];
  bloomTrace: PrimeBrainBloomEvent[];
  userMemory: PrimeBrainUserMemory;
  issuedCommands: PrimeBrainCommandLog[];
  conversationTurns: PrimeBrainConversationTurn[];
  mode?: PrimeBrainMode;
  modeHints: PrimeBrainModeHints;
  guidance?: PrimeBrainGuidance;
}

export interface PrimeBrainRawSnapshot {
  snapshotId: string;
  sessionId: string;
  userId?: string | null;
  capturedAt: string;
  mode: PrimeBrainMode;
  transport: {
    tempo?: number;
    isPlaying: boolean;
    playheadSeconds: number;
    cycle?: { enabled: boolean; startSeconds: number; endSeconds: number } | null;
  };
  alsChannels: Array<{ channel: PrimeBrainALSChannel; value: number; normalized: number }>;
  audioMetrics: {
    latencyMs?: number;
    cpuLoad?: number;
    dropoutsPerMinute?: number;
    bufferSize?: number;
  };
  harmonicState: {
    timestamp: string;
    key: string;
    scale: string;
    consonance: number;
    tension: number;
    velocityEnergy?: number;
  };
  aiAnalysisFlags: PrimeBrainAIFlag[];
  userMemorySummary?: PrimeBrainUserMemory;
  bloomTrace: PrimeBrainBloomEvent[];
  issuedCommands?: PrimeBrainCommandLog[];
  conversationTurns: PrimeBrainConversationTurn[];
  guidance?: PrimeBrainGuidance;
}

const PRIME_CHANNELS: PrimeBrainALSChannel[] = ['temperature', 'momentum', 'pressure', 'harmony'];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const ensureChannelVector = (channels: Array<{ channel: PrimeBrainALSChannel; value: number }>) => {
  const map = new Map<PrimeBrainALSChannel, number>();
  channels.forEach((entry) => {
    map.set(entry.channel, clamp01(entry.value));
  });
  return PRIME_CHANNELS.map((channel) => {
    const value = map.get(channel) ?? 0;
    return {
      channel,
      value,
      normalized: clamp01(value),
    };
  });
};

export const derivePrimeBrainMode = (inputs: PrimeBrainSnapshotInputs): PrimeBrainMode => {
  if (inputs.mode) {
    return inputs.mode;
  }

  const { cpuLoad = 0, dropoutsPerMinute = 0 } = inputs.modeHints;
  const hasCriticalFlag = inputs.aiAnalysisFlags.some((flag) => flag.severity === 'critical');

  if (hasCriticalFlag || cpuLoad > 0.9 || dropoutsPerMinute > 3) {
    return 'optimizing';
  }

  if (inputs.modeHints.armedTrackCount > 0) {
    return 'learning';
  }

  if (inputs.modeHints.isPlaying || inputs.modeHints.activeBloomActions > 0) {
    return 'active';
  }

  return 'passive';
};

export const buildPrimeBrainRawSnapshot = (inputs: PrimeBrainSnapshotInputs): PrimeBrainRawSnapshot => {
  const snapshotId = uuid();
  const mode = derivePrimeBrainMode(inputs);
  const alsChannels = ensureChannelVector(inputs.alsChannels);

  const conversationTurns = inputs.conversationTurns.slice(-10);
  const bloomTrace = inputs.bloomTrace.slice(-24);
  const issuedCommands = inputs.issuedCommands.slice(-20);

  const toSeconds = (value?: number) =>
    typeof value === 'number' && !Number.isNaN(value) ? Number(value.toFixed(3)) : undefined;

  const transportCycle = inputs.transport.cycle
    ? {
        enabled: true,
        startSeconds: toSeconds(inputs.transport.cycle.startSeconds) ?? 0,
        endSeconds:
          toSeconds(inputs.transport.cycle.endSeconds) ??
          toSeconds(inputs.transport.playheadSeconds) ??
          0,
      }
    : inputs.transport.isLooping
    ? {
        enabled: true,
        startSeconds: 0,
        endSeconds: toSeconds(inputs.transport.playheadSeconds) ?? 0,
      }
    : null;

  return {
    snapshotId,
    sessionId: inputs.sessionId,
    userId: inputs.userId ?? null,
    capturedAt: inputs.captureTimestamp,
    mode,
    transport: {
      tempo: inputs.transport.tempo,
      isPlaying: inputs.transport.isPlaying,
      playheadSeconds: Number(inputs.transport.playheadSeconds.toFixed(3)),
      cycle: transportCycle,
    },
    alsChannels,
    audioMetrics: {
      latencyMs: inputs.audioMetrics.latencyMs,
      cpuLoad: inputs.audioMetrics.cpuLoad,
      dropoutsPerMinute: inputs.audioMetrics.dropoutsPerMinute,
      bufferSize: inputs.audioMetrics.bufferSize,
    },
    harmonicState: {
      timestamp: inputs.captureTimestamp,
      key: inputs.harmonicState.key,
      scale: inputs.harmonicState.scale,
      consonance: Number(clamp01(inputs.harmonicState.consonance).toFixed(3)),
      tension: Number(clamp01(inputs.harmonicState.tension).toFixed(3)),
      velocityEnergy:
        typeof inputs.harmonicState.velocityEnergy === 'number'
          ? Number(clamp01(inputs.harmonicState.velocityEnergy).toFixed(3))
          : undefined,
    },
    aiAnalysisFlags: inputs.aiAnalysisFlags,
    userMemorySummary:
      inputs.userMemory.recentActions.length || inputs.userMemory.recallAnchors.length
        ? inputs.userMemory
        : undefined,
    bloomTrace,
    issuedCommands: issuedCommands.length ? issuedCommands : undefined,
    conversationTurns,
    guidance: inputs.guidance,
  };
};

