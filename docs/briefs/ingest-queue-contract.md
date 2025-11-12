# Ingest Queue Contract Notes

## Queue sequencing
- Only one job runs at a time. `activeJobId` points to the job whose status is `processing` or `awaiting-user`.
- Multi-file imports enqueue in submission order. The first job sets `resetSession: true`; subsequent files inherit the current session (`resetSession: false`).
- When a handler finishes without explicitly changing status, the manager promotes the job to `completed` and merges any `summary` payload back into `metadata` for downstream consumers.

## Await / resume handshake (stem selection)
- When stem splitting needs user selection, the ingest handler must call `markAwaitingUser('stem-selection')`; the queue flips the job status to `awaiting-user` and freezes sequencing.
- UI components (Bloom ingest threads + ALS progress) read `awaitingReason` to surface actionable copy. `resumeProcessing()` returns the job to `processing` and the queue picks up from the paused step.
- Stem completion should end with `reportProgress({ percent: 100, message: 'Stem lanes ready', metadata: { stemsCreated } })` so ALS can animate intensity and Bloom can show the lane count.

## Cancel behaviour
- `cancel(jobId)` immediately marks pending jobs as `cancelled` (no processing run). For active jobs it sets `cancelRequested = true`, updates `progressMessage` to `Cancelling…`, and invokes `onCancelActiveJob` for cleanup.
- Active handlers must poll `controls.isCancelled()` and call `controls.markCancelled(reason)` to confirm shutdown. Once set, the queue timestamps `completedAt` and leaves `progressMessage` intact for ALS playback.

## ALS / Bloom expectations
- ALS colours and Bloom menus use `progressPercent`, `progressMessage`, and merged `metadata` to render energy threads. Keep these fields updated at meaningful breakpoints (decode, velvet finishing, stems ready).
- Bloom’s ingest menu reads `metadata.stage`, `metadata.stemsCreated`, and `awaitingReason` to describe each queue item. Avoid numeric readouts elsewhere; encode energy/phase in message strings and ALS pulse metadata.


