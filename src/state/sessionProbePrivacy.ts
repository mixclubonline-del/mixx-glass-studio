import type { FlowSignal } from "./flowSignals";
import type {
  ProbeSignal,
  SessionProbeClipSummary,
  SessionProbeContext,
  SessionProbeMarker,
} from "./sessionProbe";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const TOKEN_PREFIX = "als::";

const redactionCache = new Map<string, string>();

const hashString = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash.toString(36);
};

const redactString = (value: string, category: string): string => {
  if (!value) {
    return "";
  }
  if (value.startsWith(TOKEN_PREFIX)) {
    return value;
  }

  const cacheKey = `${category}:${value}`;
  const cached = redactionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const token = `${TOKEN_PREFIX}${category}:${hashString(value)}`;
  redactionCache.set(cacheKey, token);
  return token;
};

const sanitizeUnknown = (input: unknown, category: string): JsonValue => {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === "string") {
    return redactString(input, category);
  }

  if (Array.isArray(input)) {
    return input.map((entry, index) => sanitizeUnknown(entry, `${category}[${index}]`));
  }

  if (typeof input === "object") {
    const result: { [key: string]: JsonValue } = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[key] = sanitizeUnknown(value, `${category}.${key}`);
    }
    return result;
  }

  if (typeof input === "number" || typeof input === "boolean") {
    return input;
  }

  return null;
};

const sanitizeRecord = (
  input: Record<string, unknown>,
  category: string
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const sanitized = sanitizeUnknown(value, `${category}.${key}`);
    if (sanitized !== null) {
      result[key] = sanitized;
    }
  }

  return result;
};

const sanitizeClipSummary = (clip: SessionProbeClipSummary): SessionProbeClipSummary => ({
  ...clip,
  id: redactString(clip.id, "clip-id"),
  name: redactString(clip.name, "clip-name"),
  trackId: redactString(clip.trackId, "track-id"),
});

const sanitizeFlowSignalPayload = (signal: FlowSignal): FlowSignal => {
  if (signal.channel === "ingest") {
    return {
      ...signal,
      payload: {
        ...signal.payload,
        snapshot: {
          ...signal.payload.snapshot,
          jobs: signal.payload.snapshot.jobs.map((job) => ({
            ...job,
            id: redactString(job.id, "ingest-job"),
            fileName: redactString(job.fileName, "ingest-file"),
            metadata: job.metadata ? sanitizeRecord(job.metadata, "ingest-meta") : undefined,
            progressMessage: job.progressMessage
              ? redactString(job.progressMessage, "ingest-progress")
              : null,
            awaitingReason: job.awaitingReason
              ? redactString(job.awaitingReason, "ingest-await")
              : null,
            error: job.error ? redactString(job.error, "ingest-error") : null,
          })),
          activeJobId: signal.payload.snapshot.activeJobId
            ? redactString(signal.payload.snapshot.activeJobId, "ingest-job")
            : null,
        },
        meta: signal.payload.meta ? sanitizeRecord(signal.payload.meta, "ingest-meta-root") : undefined,
      },
    };
  }

  if (signal.channel === "bloom") {
    return {
      ...signal,
      payload: {
        ...signal.payload,
        payload: signal.payload.payload
          ? (sanitizeUnknown(signal.payload.payload, "bloom-payload") as unknown)
          : undefined,
      },
    };
  }

  if (signal.channel === "als") {
    return {
      ...signal,
      payload: {
        ...signal.payload,
        meta: signal.payload.meta
          ? sanitizeRecord(signal.payload.meta, "als-meta")
          : undefined,
      },
    };
  }

  return signal;
};

export const sanitizeProbeSignal = (signal: ProbeSignal): ProbeSignal => {
  if (signal.channel === "timeline") {
    return signal;
  }
  return sanitizeFlowSignalPayload(signal);
};

export const sanitizeProbeContext = (
  context: SessionProbeContext | null
): SessionProbeContext | null => {
  if (!context) {
    return null;
  }

  return {
    ...context,
    bloomContext: redactString(context.bloomContext, "bloom-context"),
    selectedClips: context.selectedClips.map(sanitizeClipSummary),
  };
};

export const sanitizeProbeMarker = (marker: SessionProbeMarker): SessionProbeMarker => ({
  ...marker,
  label: redactString(marker.label, "probe-marker"),
  meta: marker.meta
    ? sanitizeRecord(marker.meta, "probe-marker-meta")
    : undefined,
  context: sanitizeProbeContext(marker.context),
});


