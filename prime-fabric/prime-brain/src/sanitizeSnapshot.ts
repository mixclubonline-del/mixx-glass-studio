import { RawPrimeBrainSnapshotSchema, SanitizedPrimeBrainRecordSchema, SanitizedPrimeBrainRecord } from './schema.js';

const LATENCY_BUCKETS = [
  { max: 7, label: 'low' },
  { max: 20, label: 'medium' },
  { max: Infinity, label: 'high' },
] as const;

const CPU_BUCKETS = [
  { max: 35, label: 'calm' },
  { max: 65, label: 'rising' },
  { max: Infinity, label: 'critical' },
] as const;

const DROPOUT_BUCKETS = [
  { max: 0.5, label: 'none' },
  { max: 3, label: 'some' },
  { max: Infinity, label: 'frequent' },
] as const;

function bucketize(value: number | undefined, buckets: readonly { max: number; label: 'low' | 'medium' | 'high' | 'calm' | 'rising' | 'critical' | 'none' | 'some' | 'frequent' }[]) {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return buckets.find((bucket) => value <= bucket.max)?.label;
}

function deriveTempoEnergy(tempo: number | undefined) {
  if (tempo === undefined || Number.isNaN(tempo)) return undefined;
  // Translate tempo into a normalized energy band (assumes 60-180 BPM working range)
  const clamped = Math.min(Math.max(tempo, 60), 180);
  return Number(((clamped - 60) / 120).toFixed(3));
}

function redactActions(actions: { action: string; timestamp: string }[] = []) {
  return actions.map((action) => {
    const sanitizedAction = action.action.replace(/\d+/g, '#');
    return { action: sanitizedAction.slice(0, 80), timestamp: action.timestamp };
  });
}

export function sanitizeSnapshot(rawInput: unknown): SanitizedPrimeBrainRecord {
  const raw = RawPrimeBrainSnapshotSchema.parse(rawInput);

  const latencyBucket = bucketize(raw.audioMetrics.latencyMs, LATENCY_BUCKETS);
  const cpuStress = bucketize(raw.audioMetrics.cpuLoad, CPU_BUCKETS);
  const dropoutBucket = bucketize(raw.audioMetrics.dropoutsPerMinute, DROPOUT_BUCKETS);

  const als = raw.alsChannels.map((channel) => ({
    channel: channel.channel,
    value: Number(channel.normalized.toFixed(3)),
  }));

  const recallContext = raw.userMemorySummary
    ? {
        actionSignatures: redactActions(raw.userMemorySummary.recentActions).map((entry) => entry.action),
        recallAnchors: raw.userMemorySummary.recallAnchors.slice(0, 6),
      }
    : undefined;

  const bloomSummary = {
    actions: raw.bloomTrace.slice(-6).map((action) => ({
      intent: action.intent,
      confidence: Number(action.confidence.toFixed(3)),
      outcome: action.outcome,
    })),
  };

  const lastTurn = raw.conversationTurns[raw.conversationTurns.length - 1];
  const lastSuggestion = lastTurn?.role === 'primeBrain' ? lastTurn.message : undefined;

  const lastCommand = raw.issuedCommands?.[raw.issuedCommands.length - 1];

  const sanitized = {
    snapshotId: raw.snapshotId,
    capturedAt: raw.capturedAt,
    mode: raw.mode,
    transport: {
      isPlaying: raw.transport.isPlaying,
      playheadSeconds: Number(raw.transport.playheadSeconds.toFixed(3)),
      cycle: raw.transport.cycle
        ? {
            enabled: raw.transport.cycle.enabled,
            startSeconds: Number(raw.transport.cycle.startSeconds.toFixed(3)),
            endSeconds: Number(raw.transport.cycle.endSeconds.toFixed(3)),
          }
        : undefined,
      tempoEnergy: deriveTempoEnergy(raw.transport.tempo),
    },
    als,
    audioHealth: {
      latencyBucket,
      cpuStress,
      dropouts: dropoutBucket,
    },
    harmonicState: {
      key: raw.harmonicState.key,
      scale: raw.harmonicState.scale,
      consonance: Number(raw.harmonicState.consonance.toFixed(3)),
      tension: Number(raw.harmonicState.tension.toFixed(3)),
    },
    aiFlags: raw.aiAnalysisFlags.map((flag) => ({
      category: flag.category,
      severity: flag.severity,
    })),
    recallContext,
    bloomSummary,
    guidance: {
      lastSuggestion,
      lastCommand: lastCommand
        ? {
            commandType: lastCommand.commandType,
            payload: lastCommand.payload,
            accepted: lastCommand.accepted,
          }
        : undefined,
    },
  };

  return SanitizedPrimeBrainRecordSchema.parse(sanitized);
}

export function sanitizeSnapshots(rawInputs: unknown[]): SanitizedPrimeBrainRecord[] {
  return rawInputs.map((input) => sanitizeSnapshot(input));
}


