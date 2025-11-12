import { v4 as uuid } from 'uuid';
import { InstructionSample, InstructionSampleSchema, PRIME_BRAIN_MODES, SanitizedPrimeBrainRecord } from './schema.js';

export interface EngineeredFeatureRecord {
  snapshotId: string;
  mode: typeof PRIME_BRAIN_MODES[number];
  alsVector: Record<string, number>;
  audioHealthVector: {
    latency: number;
    cpuStress: number;
    dropouts: number;
  };
  harmonicVector: {
    consonance: number;
    tension: number;
  };
  contextTags: string[];
  preferredChannel: 'ALS' | 'Bloom';
  suggestedAction?: string;
}

const AUDIO_HEALTH_MAPPING: Record<string, number> = {
  low: 0.25,
  medium: 0.6,
  high: 0.9,
  calm: 0.2,
  rising: 0.55,
  critical: 0.92,
  none: 0.1,
  some: 0.5,
  frequent: 0.95,
};

function vectorizeAls(record: SanitizedPrimeBrainRecord) {
  return record.als.reduce<Record<string, number>>((acc, channel) => {
    acc[channel.channel] = Number(channel.value.toFixed(3));
    return acc;
  }, {});
}

function audioHealthVector(record: SanitizedPrimeBrainRecord) {
  return {
    latency: record.audioHealth.latencyBucket ? AUDIO_HEALTH_MAPPING[record.audioHealth.latencyBucket] : 0.5,
    cpuStress: record.audioHealth.cpuStress ? AUDIO_HEALTH_MAPPING[record.audioHealth.cpuStress] : 0.5,
    dropouts: record.audioHealth.dropouts ? AUDIO_HEALTH_MAPPING[record.audioHealth.dropouts] : 0.5,
  };
}

function extractContextTags(record: SanitizedPrimeBrainRecord) {
  const tags = new Set<string>();
  if (record.mode === 'active') tags.add('active-guidance');
  if (record.mode === 'learning') tags.add('learning-loop');
  if (record.mode === 'optimizing') tags.add('optimizing');

  if (record.audioHealth.cpuStress === 'critical') tags.add('cooldown');
  if (record.audioHealth.latencyBucket === 'high') tags.add('latency-mitigation');
  if (record.audioHealth.dropouts === 'frequent') tags.add('stability-alert');

  if (record.harmonicState.tension > 0.7) tags.add('high-tension');
  if (record.harmonicState.consonance < 0.4) tags.add('dissonant');

  record.aiFlags.forEach((flag) => tags.add(`flag-${flag.category}`));
  record.recallContext?.recallAnchors.forEach((anchor) => tags.add(`recall-${anchor}`.toLowerCase()));

  return [...tags];
}

function pickPreferredChannel(record: SanitizedPrimeBrainRecord): 'ALS' | 'Bloom' {
  if (record.mode === 'passive' || record.mode === 'learning') return 'ALS';
  const lastCommandAccepted = record.guidance.lastCommand?.accepted;
  if (lastCommandAccepted) return 'Bloom';
  const recentBloomAcceptance = record.bloomSummary.actions.some((action) => action.outcome === 'accepted');
  return recentBloomAcceptance ? 'Bloom' : 'ALS';
}

function deriveSuggestedAction(record: SanitizedPrimeBrainRecord): string | undefined {
  const flagged = record.aiFlags.find((flag) => flag.severity === 'critical');
  if (flagged) return `Address ${flagged.category} issue via targeted Bloom action.`;

  if (record.audioHealth.cpuStress === 'critical') {
    return 'Throttle processing and suggest bouncing nonessential tracks.';
  }
  if (record.audioHealth.dropouts === 'frequent') {
    return 'Recommend resampling or increasing buffer to stabilize playback.';
  }
  if (record.harmonicState.tension > 0.75 && record.mode === 'active') {
    return 'Offer harmonic relief suggestion (e.g., introduce complementary pad).';
  }
  return undefined;
}

export function engineerFeature(record: SanitizedPrimeBrainRecord): EngineeredFeatureRecord {
  return {
    snapshotId: record.snapshotId,
    mode: record.mode,
    alsVector: vectorizeAls(record),
    audioHealthVector: audioHealthVector(record),
    harmonicVector: {
      consonance: Number(record.harmonicState.consonance.toFixed(3)),
      tension: Number(record.harmonicState.tension.toFixed(3)),
    },
    contextTags: extractContextTags(record),
    preferredChannel: pickPreferredChannel(record),
    suggestedAction: deriveSuggestedAction(record),
  };
}

function buildPrompt(record: SanitizedPrimeBrainRecord, engineered: EngineeredFeatureRecord) {
  const alsDescriptor = Object.entries(engineered.alsVector)
    .map(([channel, value]) => `${channel}:${value.toFixed(2)}`)
    .join(' ');
  const audioStress = engineered.contextTags.filter((tag) => tag.includes('latency') || tag.includes('cooldown'));
  const recall = record.recallContext?.recallAnchors.join(', ') ?? 'none';

  return [
    `Mode: ${record.mode}`,
    `ALS: ${alsDescriptor}`,
    `Harmonic: tension=${engineered.harmonicVector.tension.toFixed(2)} consonance=${engineered.harmonicVector.consonance.toFixed(2)}`,
    `AudioHealthTags: ${audioStress.join(', ') || 'stable'}`,
    `RecallAnchors: ${recall}`,
    `LastSuggestion: ${record.guidance.lastSuggestion ?? 'none'}`,
    `PreferredChannel: ${engineered.preferredChannel}`,
  ].join('\n');
}

function buildResponse(record: SanitizedPrimeBrainRecord, engineered: EngineeredFeatureRecord) {
  const commandHint = record.guidance.lastCommand
    ? `Command: ${record.guidance.lastCommand.commandType}`
    : 'Command: none';
  const action = engineered.suggestedAction ?? 'Maintain steady monitoring.';

  return [
    `Narrative: ${action}`,
    commandHint,
    `Tone: calm, confident, reductionist`,
    `Surface: ${engineered.preferredChannel === 'Bloom' ? 'Bloom petals' : 'ALS pulse'}`,
  ].join('\n');
}

export function buildInstructionSample(record: SanitizedPrimeBrainRecord): InstructionSample {
  const engineered = engineerFeature(record);
  const sample = {
    id: `${record.snapshotId}-${uuid()}`,
    prompt: buildPrompt(record, engineered),
    response: buildResponse(record, engineered),
    mode: record.mode,
    metadata: {
      guidanceIntent: engineered.suggestedAction,
      alsEnergy: engineered.alsVector,
      commandJson: record.guidance.lastCommand
        ? {
            commandType: record.guidance.lastCommand.commandType,
            payload: record.guidance.lastCommand.payload,
          }
        : undefined,
      evaluationTags: engineered.contextTags,
    },
  };

  return InstructionSampleSchema.parse(sample);
}

export function buildInstructionSamples(records: SanitizedPrimeBrainRecord[]): InstructionSample[] {
  return records.map((record) => buildInstructionSample(record));
}


