export type BloomActionSource =
  | "bloom-dock"
  | "bloom-floating"
  | "prime-brain"
  | "system";

export interface BloomActionMeta {
  source?: BloomActionSource;
  context?: Record<string, unknown>;
}


