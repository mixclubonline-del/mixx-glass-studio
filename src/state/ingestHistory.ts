// src/state/ingestHistory.ts
import { ClipId, TrackId } from "../hooks/useArrange";

export type IngestHistoryEntry = {
  entryId: string;
  jobId: string;
  clipIds: ClipId[];
  trackIds: TrackId[];
  fileName: string;
  completedAt: number;
  context: "import" | "reingest";
  metadata?: Record<string, unknown>;
};

type Listener = (entries: IngestHistoryEntry[]) => void;

class IngestHistoryStore {
  private entries: IngestHistoryEntry[] = [];
  private readonly listeners = new Set<Listener>();
  private readonly maxEntries = 32;

  exportAll() {
    return [...this.entries];
  }

  hydrate(entries: IngestHistoryEntry[]) {
    const limited = [...entries]
      .slice(0, this.maxEntries)
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    const timestamp = Date.now();
    this.entries = limited.map((entry, index) => ({
      ...entry,
      entryId:
        entry.entryId ??
        `ingest-history-${timestamp}-${index}-${Math.random().toString(36).slice(2, 9)}`,
      clipIds: [...entry.clipIds],
      trackIds: [...entry.trackIds],
      metadata: entry.metadata ? { ...entry.metadata } : undefined,
    }));
    this.emit();
  }

  record(entry: Omit<IngestHistoryEntry, "entryId">) {
    const next: IngestHistoryEntry = {
      ...entry,
      entryId: `ingest-history-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    this.entries = [next, ...this.entries].slice(0, this.maxEntries);
    this.emit();
    return next;
  }

  updateByJob(jobId: string, patch: Partial<IngestHistoryEntry>) {
    let changed = false;
    this.entries = this.entries.map((entry) => {
      if (entry.jobId !== jobId) return entry;
      changed = true;
      return { ...entry, ...patch };
    });
    if (changed) this.emit();
  }

  getLatest(): IngestHistoryEntry | null {
    return this.entries[0] ?? null;
  }

  findByClipId(clipId: ClipId): IngestHistoryEntry | null {
    return this.entries.find((entry) => entry.clipIds.includes(clipId)) ?? null;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.entries);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.entries));
  }
}

export const ingestHistoryStore = new IngestHistoryStore();
/**
 * Bloom / ALS Event History
 * what: Temporary in-memory history queue for studio feedback notes.
 * why: Preserve Mixx Recall until Prime Fabric ingest wiring lands.
 * how: Append to a scoped array and expose hooks for consumers. (Reduction / Flow / Recall)
 */
export interface HistoryNote {
  id: string;
  timestamp: number;
  scope: "mixer" | "timeline" | "system" | "recording" | "translation-matrix" | "prime-brain";
  message: string;
  accent?: string;
}

const historyBuffer: HistoryNote[] = [];
const listeners: Set<(notes: HistoryNote[]) => void> = new Set();

export const appendHistoryNote = (note: HistoryNote) => {
  historyBuffer.push(note);
  listeners.forEach((listener) => listener([...historyBuffer]));
};

export const subscribeHistory = (listener: (notes: HistoryNote[]) => void) => {
  listeners.add(listener);
  listener([...historyBuffer]);
  return () => listeners.delete(listener);
};

export const clearHistory = () => {
  historyBuffer.length = 0;
  listeners.forEach((listener) => listener([...historyBuffer]));
};


