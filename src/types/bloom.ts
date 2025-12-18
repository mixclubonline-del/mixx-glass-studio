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
  | "recording"
  | "recording-option"
  | "mix"
  | "mixer"
  | "master"
  | "ai"
  | "ingest"
  | "sampler"
  | "edit"
  | "idle"
  | "system"
  | "prime-brain"
  | "translation-matrix";

export const BLOOM_CONTEXT_LABELS: Record<BloomContext, string> = {
  arrange: "Arrange Bloom",
  record: "Record Bloom",
  recording: "Recording Bloom",
  "recording-option": "Recording Options",
  mix: "Mix Bloom",
  mixer: "Mixer Bloom",
  master: "Master Bloom",
  ai: "Prime Bloom",
  ingest: "Ingest Bloom",
  sampler: "Sampler Bloom",
  edit: "Edit Bloom",
  idle: "Bloom HUD",
  system: "System Bloom",
  "prime-brain": "Prime Brain",
  "translation-matrix": "Translation Matrix",
};

export const BLOOM_CONTEXT_ACCENTS: Record<BloomContext, string> = {
  arrange: "#d6b1ff",
  record: "#ff7b8a",
  recording: "#ff7b8a",
  "recording-option": "#ff9e7a",
  mix: "#7ad0ff",
  mixer: "#7ad0ff",
  master: "#f5a34c",
  ai: "#f472d0",
  ingest: "#38d9a9",
  sampler: "#6ad5ff",
  edit: "#8b5cf6",
  idle: "#94a3b8",
  system: "#64748b",
  "prime-brain": "#f472d0",
  "translation-matrix": "#c084fc",
};



