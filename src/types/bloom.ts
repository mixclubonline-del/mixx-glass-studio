export type BloomActionSource =
  | "bloom-dock"
  | "bloom-floating"
  | "prime-brain"
  | "system";

export interface BloomActionMeta {
  source?: BloomActionSource;
  context?: Record<string, unknown>;
}

export type BloomContext =
  | "arrange"
  | "record"
  | "mix"
  | "master"
  | "ai"
  | "ingest"
  | "idle";

export const BLOOM_CONTEXT_LABELS: Record<BloomContext, string> = {
  arrange: "Arrange Bloom",
  record: "Record Bloom",
  mix: "Mix Bloom",
  master: "Master Bloom",
  ai: "Prime Bloom",
  ingest: "Ingest Bloom",
  idle: "Bloom HUD",
};

export const BLOOM_CONTEXT_ACCENTS: Record<BloomContext, string> = {
  arrange: "#d6b1ff",
  record: "#ff7b8a",
  mix: "#7ad0ff",
  master: "#f5a34c",
  ai: "#f472d0",
  ingest: "#38d9a9",
  idle: "#94a3b8",
};



