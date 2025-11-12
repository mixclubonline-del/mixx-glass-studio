import { describe, expect, it } from 'vitest';

import IngestQueueManager, { IngestJobSnapshot, IngestJobStatus } from '../IngestQueueManager';

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const terminalStatuses: IngestJobStatus[] = ['completed', 'failed', 'cancelled'];

const waitForSnapshot = async (
  manager: IngestQueueManager,
  predicate: (snapshot: IngestJobSnapshot) => boolean,
  timeoutMs = 2000
) => {
  let settled = false;
  let unsubscribe: (() => void) | null = null;
  return new Promise<IngestJobSnapshot>((resolve, reject) => {
    const start = Date.now();
    unsubscribe = manager.subscribe((snapshot) => {
      if (settled) return;
      if (predicate(snapshot)) {
        settled = true;
        resolve(snapshot);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        settled = true;
        reject(new Error('Timed out waiting for ingest snapshot condition'));
      }
    });
  }).finally(() => {
    unsubscribe?.();
  });
};

const waitForJobsToSettle = async (
  manager: IngestQueueManager,
  expectedJobs: number,
  timeoutMs = 3000
) => {
  return waitForSnapshot(
    manager,
    (snapshot) =>
      snapshot.jobs.length === expectedJobs &&
      snapshot.jobs.every((job) => terminalStatuses.includes(job.status)) &&
      snapshot.activeJobId === null,
    timeoutMs
  );
};

describe('IngestQueueManager', () => {
  it('processes multi-file imports sequentially and surfaces progress metadata', async () => {
    const executionOrder: string[] = [];
    const manager = new IngestQueueManager({
      onProcessJob: async (job, controls) => {
        executionOrder.push(`start:${job.fileName}`);
        controls.reportProgress({ percent: 15, message: `Priming ${job.fileName}` });
        await delay(5);
        controls.reportProgress({
          percent: 95,
          message: `${job.fileName} • Velvet curve finishing`,
          metadata: { stage: 'finishing' },
        });
        await delay(5);
        controls.reportProgress({ percent: 100, message: `${job.fileName} • Complete` });
        executionOrder.push(`complete:${job.fileName}`);
        return { status: 'completed', summary: { stage: 'completed' } };
      },
    });

    const snapshots: IngestJobSnapshot[] = [];
    const unsubscribe = manager.subscribe((snapshot) => {
      snapshots.push(snapshot);
    });

    manager.enqueue({ file: {} as File, fileName: 'alpha.wav', resetSession: true });
    manager.enqueue({ file: {} as File, fileName: 'beta.wav', resetSession: false });
    manager.enqueue({ file: {} as File, fileName: 'gamma.wav', resetSession: false });

    const finalSnapshot = await waitForJobsToSettle(manager, 3);
    unsubscribe();

    expect(executionOrder).toEqual([
      'start:alpha.wav',
      'complete:alpha.wav',
      'start:beta.wav',
      'complete:beta.wav',
      'start:gamma.wav',
      'complete:gamma.wav',
    ]);

    const alphaJob = finalSnapshot.jobs.find((job) => job.fileName === 'alpha.wav');
    const betaJob = finalSnapshot.jobs.find((job) => job.fileName === 'beta.wav');
    const gammaJob = finalSnapshot.jobs.find((job) => job.fileName === 'gamma.wav');

    expect(alphaJob?.status).toBe('completed');
    expect(alphaJob?.resetSession).toBe(true);
    expect(betaJob?.resetSession).toBe(false);
    expect(gammaJob?.resetSession).toBe(false);
    expect(betaJob?.progressPercent).toBe(100);
    expect(betaJob?.progressMessage).toBe('beta.wav • Complete');
    expect(betaJob?.metadata?.stage).toBe('completed');
    expect(finalSnapshot.activeJobId).toBeNull();
  });

  it('pauses for stem selection and resumes when stems are confirmed', async () => {
    let resumeJob: (() => void) | null = null;
    const manager = new IngestQueueManager({
      onProcessJob: async (job, controls) => {
        controls.reportProgress({ percent: 30, message: `Analyzing ${job.fileName}` });
        controls.markAwaitingUser('stem-selection');
        await new Promise<void>((resolve) => {
          resumeJob = () => {
            controls.resumeProcessing();
            resolve();
          };
        });
        controls.reportProgress({
          percent: 85,
          message: 'Rendering stem lanes…',
          metadata: { stemsCreated: 4 },
        });
        controls.reportProgress({
          percent: 100,
          message: 'Stem lanes ready',
          metadata: { stemsCreated: 4 },
        });
        return { status: 'completed', summary: { stemsCreated: 4 } };
      },
    });

    manager.enqueue({ file: {} as File, fileName: 'delta.wav', resetSession: false });

    const awaitingSnapshot = await waitForSnapshot(
      manager,
      (snapshot) => snapshot.jobs[0]?.status === 'awaiting-user'
    );
    expect(awaitingSnapshot.jobs[0]?.awaitingReason).toBe('stem-selection');

    if (!resumeJob) {
      throw new Error('Expected resumeJob to be set before resuming ingest job');
    }
    const resume = resumeJob as () => void;
    resume();

    const finalSnapshot = await waitForJobsToSettle(manager, 1);
    const stemJob = finalSnapshot.jobs[0];
    expect(stemJob.status).toBe('completed');
    expect(stemJob.progressPercent).toBe(100);
    expect(stemJob.progressMessage).toBe('Stem lanes ready');
    expect(stemJob.metadata?.stemsCreated).toBe(4);
    expect(finalSnapshot.activeJobId).toBeNull();
  });

  it('cancels pending and active jobs while emitting ALS/Bloom-friendly updates', async () => {
    const manager = new IngestQueueManager({
      onProcessJob: async (job, controls) => {
        controls.reportProgress({ percent: 5, message: `Decoding ${job.fileName}` });
        await delay(10);
        if (controls.isCancelled()) {
          controls.markCancelled('User cancelled import');
          return { status: 'cancelled' };
        }
        controls.reportProgress({ percent: 60, message: `Shaping ${job.fileName}` });
        await delay(10);
        if (controls.isCancelled()) {
          controls.markCancelled('User cancelled import');
          return { status: 'cancelled' };
        }
        controls.reportProgress({ percent: 100, message: `${job.fileName} • Complete` });
        return { status: 'completed' };
      },
      onCancelActiveJob: async () => {
        await delay(5);
      },
    });

    const snapshots: IngestJobSnapshot[] = [];
    const unsubscribe = manager.subscribe((snapshot) => snapshots.push(snapshot));

    const activeJobId = manager.enqueue({ file: {} as File, fileName: 'ingest-A.wav', resetSession: true });
    const pendingJobId = manager.enqueue({ file: {} as File, fileName: 'ingest-B.wav', resetSession: false });

    await waitForSnapshot(
      manager,
      (snapshot) => snapshot.jobs.some((job) => job.id === pendingJobId && job.status === 'pending')
    );
    manager.cancel(pendingJobId);

    await waitForSnapshot(
      manager,
      (snapshot) => snapshot.jobs.some((job) => job.id === pendingJobId && job.status === 'cancelled')
    );

    await waitForSnapshot(
      manager,
      (snapshot) => snapshot.jobs.some((job) => job.id === activeJobId && job.status === 'processing')
    );
    manager.cancel(activeJobId);

    const finalSnapshot = await waitForJobsToSettle(manager, 2);
    unsubscribe();

    const activeJob = finalSnapshot.jobs.find((job) => job.id === activeJobId);
    const pendingJob = finalSnapshot.jobs.find((job) => job.id === pendingJobId);

    expect(activeJob?.status).toBe('cancelled');
    expect(activeJob?.progressMessage).toBe('Cancelling…');
    expect(pendingJob?.status).toBe('cancelled');
    expect(pendingJob?.progressPercent).toBe(0);
    expect(finalSnapshot.activeJobId).toBeNull();
  });
});


