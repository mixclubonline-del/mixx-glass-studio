import { z } from 'zod';

export const PRIME_BRAIN_MODES = ['passive', 'active', 'learning', 'optimizing'] as const;

export const RawALSChannelSchema = z.object({
  channel: z.enum(['temperature', 'momentum', 'pressure', 'harmony']),
  value: z.number(),
  normalized: z.number().min(0).max(1),
});

export const RawTransportSchema = z.object({
  tempo: z.number().optional(),
  isPlaying: z.boolean(),
  playheadSeconds: z.number().nonnegative(),
  cycle: z
    .object({
      enabled: z.boolean(),
      startSeconds: z.number().nonnegative(),
      endSeconds: z.number().nonnegative(),
    })
    .optional(),
});

export const RawAudioMetricSchema = z.object({
  latencyMs: z.number().nonnegative().optional(),
  cpuLoad: z.number().min(0).max(100).optional(),
  dropoutsPerMinute: z.number().nonnegative().optional(),
  bufferSize: z.number().optional(),
});

export const RawHarmonicFrameSchema = z.object({
  timestamp: z.string(),
  key: z.string().min(1),
  scale: z.string().min(1),
  consonance: z.number().min(0).max(1),
  tension: z.number().min(0).max(1),
  velocityEnergy: z.number().min(0).max(1).optional(),
});

export const RawBloomActionSchema = z.object({
  actionId: z.string(),
  name: z.string(),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  outcome: z.enum(['accepted', 'dismissed', 'ignored']),
});

export const RawCommandSchema = z.object({
  id: z.string().uuid().optional(),
  commandType: z.string(),
  payload: z.record(z.any()),
  issuedAt: z.string(),
  accepted: z.boolean(),
});

export const RawConversationTurnSchema = z.object({
  role: z.enum(['primeBrain', 'creator']),
  mode: z.enum(PRIME_BRAIN_MODES),
  message: z.string(),
  issuedAt: z.string(),
  linkedCommandId: z.string().optional(),
});

export const RawPrimeBrainSnapshotSchema = z.object({
  snapshotId: z.string().uuid(),
  sessionId: z.string(),
  userId: z.string().optional(),
  capturedAt: z.string(),
  mode: z.enum(PRIME_BRAIN_MODES),
  transport: RawTransportSchema,
  alsChannels: z.array(RawALSChannelSchema).max(4),
  audioMetrics: RawAudioMetricSchema,
  harmonicState: RawHarmonicFrameSchema,
  aiAnalysisFlags: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(['info', 'warn', 'critical']),
      message: z.string(),
    }),
  ),
  userMemorySummary: z
    .object({
      recentActions: z.array(
        z.object({
          action: z.string(),
          timestamp: z.string(),
        }),
      ),
      recallAnchors: z.array(z.string()),
    })
    .optional(),
  bloomTrace: z.array(RawBloomActionSchema),
  issuedCommands: z.array(RawCommandSchema).optional(),
  conversationTurns: z.array(RawConversationTurnSchema).max(10),
});

export const SanitizedPrimeBrainRecordSchema = z.object({
  snapshotId: z.string().uuid(),
  capturedAt: z.string(),
  mode: z.enum(PRIME_BRAIN_MODES),
  transport: RawTransportSchema.omit({ tempo: true }).extend({
    tempoEnergy: z.number().min(0).max(1).optional(),
  }),
  als: z.array(
    z.object({
      channel: z.enum(['temperature', 'momentum', 'pressure', 'harmony']),
      value: z.number().min(0).max(1),
    }),
  ),
  audioHealth: z.object({
    latencyBucket: z.enum(['low', 'medium', 'high']).optional(),
    cpuStress: z.enum(['calm', 'rising', 'critical']).optional(),
    dropouts: z.enum(['none', 'some', 'frequent']).optional(),
  }),
  harmonicState: RawHarmonicFrameSchema.pick({
    key: true,
    scale: true,
    consonance: true,
    tension: true,
  }),
  aiFlags: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(['info', 'warn', 'critical']),
    }),
  ),
  recallContext: z
    .object({
      actionSignatures: z.array(z.string()),
      recallAnchors: z.array(z.string()),
    })
    .optional(),
  bloomSummary: z.object({
    actions: z.array(
      z.object({
        intent: z.string(),
        confidence: z.number().min(0).max(1),
        outcome: z.enum(['accepted', 'dismissed', 'ignored']),
      }),
    ),
  }),
  guidance: z.object({
    lastSuggestion: z.string().optional(),
    lastCommand: RawCommandSchema.pick({
      commandType: true,
      payload: true,
      accepted: true,
    }).optional(),
  }),
});

export const InstructionSampleSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  response: z.string(),
  mode: z.enum(PRIME_BRAIN_MODES),
  metadata: z.object({
    guidanceIntent: z.string().optional(),
    alsEnergy: z.record(z.string(), z.number()).optional(),
    commandJson: RawCommandSchema.pick({
      commandType: true,
      payload: true,
    }).optional(),
    evaluationTags: z.array(z.string()).optional(),
  }),
});

export type PrimeBrainMode = (typeof PRIME_BRAIN_MODES)[number];
export type RawPrimeBrainSnapshot = z.infer<typeof RawPrimeBrainSnapshotSchema>;
export type SanitizedPrimeBrainRecord = z.infer<typeof SanitizedPrimeBrainRecordSchema>;
export type InstructionSample = z.infer<typeof InstructionSampleSchema>;


