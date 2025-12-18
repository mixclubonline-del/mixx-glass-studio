import { IngestJobSnapshot } from "../ingest/IngestQueueManager";
import { TrackALSFeedback } from "../utils/ALS";

type FlowChannel = "als" | "bloom" | "ingest";

export interface AlsSignalPayload {
  source: "mixer" | "arrange" | "prime-brain" | "ingest" | "sampler" | "system" | "recording-option" | "recording" | "translation-matrix";
  tracks?: Record<string, TrackALSFeedback>;
  master?: TrackALSFeedback | null;
  meta?: Record<string, unknown>;
  option?: string;
  active?: boolean;
  marker?: { timestamp: string; report: any };
  profile?: string;
}

export interface BloomSignalPayload {
  source: "bloom-dock" | "bloom-floating" | "prime-brain" | "system";
  action: string;
  payload?: unknown;
}

export interface IngestSignalPayload {
  source: "ingest-queue" | "import";
  snapshot: IngestJobSnapshot;
  meta?: Record<string, unknown>;
}

export type FlowSignal =
  | {
      channel: "als";
      timestamp: number;
      payload: AlsSignalPayload;
    }
  | {
      channel: "bloom";
      timestamp: number;
      payload: BloomSignalPayload;
    }
  | {
      channel: "ingest";
      timestamp: number;
      payload: IngestSignalPayload;
    };

type FlowListener = (signal: FlowSignal) => void;

class FlowEventBus {
  private listeners: Set<FlowListener> = new Set();

  publish(signal: FlowSignal) {
    for (const listener of this.listeners) {
      listener(signal);
    }
  }

  subscribe(listener: FlowListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

const eventBus = new FlowEventBus();

export const subscribeToFlow = eventBus.subscribe.bind(eventBus);

const now = () => Date.now();

export const publishAlsSignal = (payload: AlsSignalPayload) => {
  eventBus.publish({
    channel: "als",
    timestamp: now(),
    payload,
  });
};

export const publishBloomSignal = (payload: BloomSignalPayload) => {
  eventBus.publish({
    channel: "bloom",
    timestamp: now(),
    payload,
  });
};

export const publishIngestSignal = (payload: IngestSignalPayload) => {
  eventBus.publish({
    channel: "ingest",
    timestamp: now(),
    payload,
  });
};

export const publishFlowSignal = (signal: FlowSignal) => {
  eventBus.publish(signal);
};



