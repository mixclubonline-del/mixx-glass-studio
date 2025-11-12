export type IngestJobStatus =
  | 'pending'
  | 'processing'
  | 'awaiting-user'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface IngestJobDescriptor {
  file: File | null;
  fileName: string;
  resetSession: boolean;
  metadata?: Record<string, unknown>;
}

export interface IngestJobSnapshot {
  jobs: IngestJobPublic[];
  activeJobId: string | null;
  lastUpdated: number;
}

export interface IngestJobPublic {
  id: string;
  fileName: string;
  status: IngestJobStatus;
  createdAt: number;
  updatedAt: number;
  progressPercent: number;
  progressMessage: string | null;
  awaitingReason: string | null;
  metadata?: Record<string, unknown>;
  error?: string | null;
  completedAt?: number;
  startedAt?: number;
  resetSession: boolean;
}

export interface IngestJobOutcome {
  status?: Exclude<IngestJobStatus, 'pending' | 'processing' | 'awaiting-user'>;
  summary?: Record<string, unknown>;
}

export interface IngestRuntimeJob extends IngestJobDescriptor {
  id: string;
  status: IngestJobStatus;
  metadata?: Record<string, unknown>;
}

export interface IngestJobControls {
  /** Update job-level progress for HUD/Bloom consumers */
  reportProgress: (update: {
    percent?: number;
    message?: string;
    metadata?: Record<string, unknown>;
  }) => void;
  /** Use when user interaction is required (e.g., stem selection modal) */
  markAwaitingUser: (reason: string) => void;
  /** Resume active processing after awaiting user input */
  resumeProcessing: () => void;
  /** Returns true when the job has been cancelled by the user/UI */
  isCancelled: () => boolean;
  /** Mark the job as cancelled (usually after cleanup completes) */
  markCancelled: (reason?: string) => void;
  /** Mark the job as failed and capture an optional error payload */
  markFailed: (errorMessage: string) => void;
}

type Listener = (snapshot: IngestJobSnapshot) => void;

interface IngestQueueManagerOptions {
  onProcessJob: (
    job: InternalJob,
    controls: IngestJobControls
  ) => Promise<IngestJobOutcome | void>;
  onCancelActiveJob?: (job: InternalJob) => Promise<void> | void;
}

interface InternalJob extends IngestJobDescriptor {
  id: string;
  status: IngestJobStatus;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  progressPercent: number;
  progressMessage: string | null;
  awaitingReason: string | null;
  summary?: Record<string, unknown>;
  error?: string | null;
  cancelRequested: boolean;
}

export type PersistedIngestJob = IngestJobPublic;

export interface PersistedIngestSnapshot {
  jobs: PersistedIngestJob[];
  activeJobId: string | null;
  lastUpdated: number;
}

export class IngestQueueManager {
  private readonly queue: InternalJob[] = [];
  private readonly listeners = new Set<Listener>();
  private processing = false;
  private readonly onProcessJob: IngestQueueManagerOptions['onProcessJob'];
  private readonly onCancelActiveJob?: IngestQueueManagerOptions['onCancelActiveJob'];

  constructor(options: IngestQueueManagerOptions) {
    this.onProcessJob = options.onProcessJob;
    this.onCancelActiveJob = options.onCancelActiveJob;
  }

  hydrateFromPersisted(snapshot: PersistedIngestSnapshot) {
    if (!snapshot || !Array.isArray(snapshot.jobs)) {
      return;
    }
    this.queue.splice(0, this.queue.length);
    const now = Date.now();
    snapshot.jobs.forEach((job) => {
      if (!job) {
        return;
      }
      const shouldAwaitResume =
        job.status === 'processing' || job.status === 'pending' || job.status === 'awaiting-user';
      const status: IngestJobStatus = shouldAwaitResume ? 'awaiting-user' : job.status;
      const metadata = job.metadata ? { ...job.metadata } : undefined;
      const internal: InternalJob = {
        id: job.id,
        file: null,
        fileName: job.fileName,
        resetSession: job.resetSession ?? false,
        metadata,
        status,
        createdAt: job.createdAt ?? now,
        updatedAt: job.updatedAt ?? now,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        progressPercent: job.progressPercent ?? 0,
        progressMessage: shouldAwaitResume
          ? 'Waiting for source file to resume after reload.'
          : job.progressMessage ?? null,
        awaitingReason: shouldAwaitResume
          ? 'Source file missing after session reload. Drop the original file to resume.'
          : job.awaitingReason ?? null,
        summary: undefined,
        error: job.error ?? null,
        cancelRequested: status === 'cancelled',
      };
      if (shouldAwaitResume) {
        internal.metadata = { ...(internal.metadata ?? {}), resumeRequired: true };
      }
      this.queue.push(internal);
    });
    this.processing = false;
    this.emit();
  }

  enqueue(descriptor: IngestJobDescriptor & { id?: string }): string {
    const id =
      descriptor.id ??
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `ingest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    const now = Date.now();
    const job: InternalJob = {
      ...descriptor,
      id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      progressPercent: 0,
      progressMessage: null,
      awaitingReason: null,
      cancelRequested: false,
    };

    this.queue.push(job);
    this.emit();
    void this.kick();
    return id;
  }

  cancel(jobId: string) {
    const job = this.queue.find((entry) => entry.id === jobId);
    if (!job) return;

    job.cancelRequested = true;
    job.updatedAt = Date.now();

    if (job.status === 'pending') {
      job.status = 'cancelled';
      job.completedAt = Date.now();
      this.emit();
      return;
    }

    if (job.status === 'processing' || job.status === 'awaiting-user') {
      job.progressMessage = 'Cancelling…';
      this.emit();
      if (this.onCancelActiveJob) {
        void this.onCancelActiveJob(job);
      }
    }
  }

  clearCompleted() {
    const remaining = this.queue.filter(
      (job) =>
        job.status !== 'completed' &&
        job.status !== 'failed' &&
        job.status !== 'cancelled'
    );
    if (remaining.length !== this.queue.length) {
      this.queue.splice(0, this.queue.length, ...remaining);
      this.emit();
    }
  }

  markAwaiting(jobId: string, reason: string) {
    const job = this.queue.find((entry) => entry.id === jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') return;
    job.status = 'awaiting-user';
    job.awaitingReason = reason;
    job.updatedAt = Date.now();
    this.emit();
  }

  resume(jobId: string) {
    const job = this.queue.find((entry) => entry.id === jobId);
    if (!job || job.status !== 'awaiting-user') return;
    job.status = 'processing';
    job.awaitingReason = null;
    job.updatedAt = Date.now();
    this.emit();
  }

  reportProgress(
    jobId: string,
    update: { percent?: number; message?: string; metadata?: Record<string, unknown> }
  ) {
    const job = this.queue.find((entry) => entry.id === jobId);
    if (!job) return;
    job.updatedAt = Date.now();
    if (typeof update.percent === 'number') {
      job.progressPercent = update.percent;
    }
    if (typeof update.message === 'string') {
      job.progressMessage = update.message;
    }
    if (update.metadata) {
      job.metadata = { ...(job.metadata ?? {}), ...update.metadata };
    }
    this.emit();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): IngestJobSnapshot {
    const lastUpdated =
      this.queue.reduce((latest, job) => Math.max(latest, job.updatedAt), 0) ||
      Date.now();
    const activeJob =
      this.queue.find((job) => job.status === 'processing' || job.status === 'awaiting-user') ??
      null;

    return {
      jobs: this.queue.map((job) => ({
        id: job.id,
        fileName: job.fileName,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        progressPercent: job.progressPercent,
        progressMessage: job.progressMessage,
        awaitingReason: job.awaitingReason,
        metadata: job.metadata,
        error: job.error ?? null,
        resetSession: job.resetSession,
      })),
      activeJobId: activeJob ? activeJob.id : null,
      lastUpdated,
    };
  }

  private async kick() {
    if (this.processing) return;
    const next = this.queue.find((job) => job.status === 'pending');
    if (!next) return;

    this.processing = true;
    next.status = 'processing';
    next.startedAt = Date.now();
    next.updatedAt = Date.now();
    this.emit();

    try {
      const outcome = await this.onProcessJob(next, this.createControls(next));
      if (next.cancelRequested) {
        this.setCancelled(next);
      } else if (outcome?.status === 'failed') {
        this.setFailed(next, outcome.summary);
      } else if (outcome?.status === 'cancelled') {
        this.setCancelled(next);
      } else if (outcome?.status === 'completed') {
        this.setCompleted(next, outcome.summary);
      } else if (next.status === 'processing') {
        // Default to completed if handler finished without changing status
        this.setCompleted(next, outcome?.summary);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown ingest error occurred';
      this.setFailed(next, { error: message });
    } finally {
      this.processing = false;
      this.emit();
      void this.kick();
    }
  }

  private createControls(job: InternalJob): IngestJobControls {
    return {
      reportProgress: (update) => this.reportProgress(job.id, update),
      markAwaitingUser: (reason) => this.markAwaiting(job.id, reason),
      resumeProcessing: () => this.resume(job.id),
      isCancelled: () => job.cancelRequested,
      markCancelled: (reason) => {
        job.error = reason ?? null;
        this.setCancelled(job);
      },
      markFailed: (errorMessage) => {
        this.setFailed(job, { error: errorMessage });
      },
    };
  }

  private setCompleted(job: InternalJob, summary?: Record<string, unknown>) {
    job.status = 'completed';
    job.completedAt = Date.now();
    job.updatedAt = Date.now();
    if (summary) {
      job.summary = summary;
      job.metadata = { ...(job.metadata ?? {}), ...summary };
    }
  }

  private setFailed(job: InternalJob, summary?: Record<string, unknown>) {
    job.status = 'failed';
    job.completedAt = Date.now();
    job.updatedAt = Date.now();
    job.error = summary?.error as string | undefined;
    if (summary) {
      job.summary = summary;
      job.metadata = { ...(job.metadata ?? {}), ...summary };
    }
  }

  private setCancelled(job: InternalJob) {
    job.status = 'cancelled';
    job.completedAt = Date.now();
    job.updatedAt = Date.now();
  }

  supplyFile(jobId: string, file: File) {
    const job = this.queue.find((entry) => entry.id === jobId);
    if (!job) return false;
    job.file = file;
    job.updatedAt = Date.now();
    if (job.status === 'awaiting-user') {
      job.status = 'pending';
      job.awaitingReason = null;
      job.progressMessage = 'Re-queued after file resume.';
      job.metadata = { ...(job.metadata ?? {}), resumeRequired: false };
      this.emit();
      void this.kick();
      return true;
    }
    this.emit();
    return true;
  }

  private emit() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export default IngestQueueManager;

