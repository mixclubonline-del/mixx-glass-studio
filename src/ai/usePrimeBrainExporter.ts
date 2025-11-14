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
const MAX_RETRY_ATTEMPTS = 5;

// Resolve debug flag from env
const resolveDebugFlag = (): boolean => {
  if (typeof import.meta === 'undefined') return false;
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_PRIME_BRAIN_EXPORT_DEBUG === '1';
  } catch {
    return false;
  }
};

// Resolve sample rate override from env
const resolveSampleRateOverride = (): number | null => {
  if (typeof import.meta === 'undefined') return null;
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const override = env?.VITE_PRIME_BRAIN_EXPORT_SAMPLE_RATE;
    if (override) {
      const parsed = parseInt(override, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export function usePrimeBrainExporter(options: PrimeBrainExporterOptions) {
  const envDebug = resolveDebugFlag();
  const sampleRateOverride = resolveSampleRateOverride();
  const effectiveIntervalMs = sampleRateOverride ?? options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const { enabled, exportUrl, snapshotInputs, debug = envDebug } = options;

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
            if (pending.attempts >= MAX_RETRY_ATTEMPTS) {
              queueRef.current.shift();
              if (debug) {
                console.warn(
                  '[PrimeBrain] Dropping snapshot after repeated failures',
                  pending.snapshot.snapshotId,
                  `(${pending.attempts} attempts)`,
                );
              }
            } else if (debug) {
              console.debug(
                '[PrimeBrain] Snapshot send failed, will retry',
                pending.snapshot.snapshotId,
                `(attempt ${pending.attempts}/${MAX_RETRY_ATTEMPTS})`,
              );
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
          const dropped = queueRef.current.shift();
          if (debug && dropped) {
            console.warn(
              '[PrimeBrain] Queue overflow, dropping oldest snapshot',
              dropped.snapshot.snapshotId,
            );
          }
        }
        if (debug) {
          console.debug(
            '[PrimeBrain] Snapshot queued',
            snapshot.snapshotId,
            `(queue size: ${queueRef.current.length}/${MAX_QUEUE_SIZE})`,
          );
        }
        void flushQueue(exportUrl);
      } catch (error) {
        if (debug) {
          console.warn('[PrimeBrain] Failed to build snapshot', error);
        }
      }
    };

    const intervalId = window.setInterval(pushSnapshot, effectiveIntervalMs);
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
  }, [enabled, exportUrl, effectiveIntervalMs, flushQueue, debug]);
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

