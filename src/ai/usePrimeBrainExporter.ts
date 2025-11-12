import { useCallback, useEffect, useRef } from 'react';
import {
  PrimeBrainSnapshotInputs,
  PrimeBrainRawSnapshot,
  buildPrimeBrainRawSnapshot,
} from './PrimeBrainSnapshot';

interface PrimeBrainExporterOptions {
  enabled: boolean;
  exportUrl?: string | null;
  snapshotInputs: PrimeBrainSnapshotInputs | null;
  intervalMs?: number;
  debug?: boolean;
}

interface PendingSnapshot {
  payload: string;
  snapshot: PrimeBrainRawSnapshot;
  attempts: number;
}

const DEFAULT_INTERVAL_MS = 2000;
const MAX_QUEUE_SIZE = 20;

export function usePrimeBrainExporter(options: PrimeBrainExporterOptions) {
  const { enabled, exportUrl, intervalMs = DEFAULT_INTERVAL_MS, snapshotInputs, debug = false } =
    options;

  const latestInputsRef = useRef<PrimeBrainSnapshotInputs | null>(snapshotInputs);
  const queueRef = useRef<PendingSnapshot[]>([]);
  const sendingRef = useRef(false);
  const lastPayloadRef = useRef<string | null>(null);

  useEffect(() => {
    latestInputsRef.current = snapshotInputs;
  }, [snapshotInputs]);

  const flushQueue = useCallback(
    async (url: string) => {
      if (sendingRef.current) return;
      if (!queueRef.current.length) return;

      sendingRef.current = true;
      try {
        while (queueRef.current.length) {
          const pending = queueRef.current[0];
          const success = await sendSnapshot(url, pending.payload);

          if (success) {
            queueRef.current.shift();
            if (debug) {
              console.debug('[PrimeBrain] Snapshot delivered', pending.snapshot.snapshotId);
            }
          } else {
            pending.attempts += 1;
            if (pending.attempts >= 5) {
              queueRef.current.shift();
              if (debug) {
                console.warn(
                  '[PrimeBrain] Dropping snapshot after repeated failures',
                  pending.snapshot.snapshotId,
                );
              }
            }
            break;
          }
        }
      } finally {
        sendingRef.current = false;
      }
    },
    [debug],
  );

  useEffect(() => {
    if (!enabled || !exportUrl) return;

    let cancelled = false;

    const pushSnapshot = () => {
      if (cancelled) return;
      const inputs = latestInputsRef.current;
      if (!inputs) return;
      try {
        const snapshot = buildPrimeBrainRawSnapshot({
          ...inputs,
          captureTimestamp: new Date().toISOString(),
        });
        const payload = JSON.stringify(snapshot);
        if (payload === lastPayloadRef.current) {
          return;
        }
        lastPayloadRef.current = payload;

        queueRef.current.push({ payload, snapshot, attempts: 0 });
        if (queueRef.current.length > MAX_QUEUE_SIZE) {
          queueRef.current.shift();
        }
        void flushQueue(exportUrl);
      } catch (error) {
        if (debug) {
          console.warn('[PrimeBrain] Failed to build snapshot', error);
        }
      }
    };

    const intervalId = window.setInterval(pushSnapshot, intervalMs);
    const visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        void flushQueue(exportUrl);
      }
    };
    const beforeUnloadHandler = () => {
      if (!queueRef.current.length) return;
      queueRef.current.forEach((pending) => {
        try {
          navigator.sendBeacon?.(
            exportUrl,
            new Blob([pending.payload], { type: 'application/json' }),
          );
        } catch (err) {
          if (debug) {
            console.warn('[PrimeBrain] Beacon flush failed', err);
          }
        }
      });
    };

    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [enabled, exportUrl, intervalMs, flushQueue, debug]);
}

async function sendSnapshot(url: string, payload: string) {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const beaconSuccess = navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    if (beaconSuccess) {
      return true;
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Prime-Fabric-Channel': 'prime-brain',
      },
      body: payload,
      keepalive: true,
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    console.warn('[PrimeBrain] Snapshot upload failed', error);
    return false;
  }
}

