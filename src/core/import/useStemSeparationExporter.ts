/**
 * Stem Separation Exporter Hook
 * 
 * Collects and exports stem separation snapshots for Prime Fabric training.
 * Similar to Prime Brain exporter pattern.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StemSeparationSnapshot } from './stemSeparationSnapshot';
import { als } from '../../utils/alsFeedback';

const MAX_QUEUE_SIZE = 50; // Larger queue for stem separation (less frequent than Prime Brain)
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

interface StemSeparationExporterOptions {
  enabled: boolean;
  exportUrl: string | null;
  intervalMs?: number;
  debug?: boolean;
}

interface QueuedSnapshot {
  payload: string;
  snapshot: StemSeparationSnapshot;
  attempts: number;
}

function resolveExportUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check window first (for runtime override)
  if ((window as any).__MIXX_STEM_SEPARATION_EXPORT_URL) {
    return (window as any).__MIXX_STEM_SEPARATION_EXPORT_URL;
  }
  
  // Check environment variables
  if (import.meta.env.VITE_STEM_SEPARATION_EXPORT_URL) {
    return import.meta.env.VITE_STEM_SEPARATION_EXPORT_URL;
  }
  
  return null;
}

function resolveDebugFlag(): boolean {
  if (typeof window === 'undefined') return false;
  return import.meta.env.DEV && import.meta.env.VITE_STEM_SEPARATION_EXPORT_DEBUG === '1';
}

/**
 * Hook for exporting stem separation snapshots to Prime Fabric
 */
export function useStemSeparationExporter(options: StemSeparationExporterOptions) {
  const { enabled, exportUrl: providedUrl, debug = resolveDebugFlag() } = options;
  
  const exportUrl = providedUrl || resolveExportUrl();
  const queueRef = useRef<QueuedSnapshot[]>([]);
  const sendingRef = useRef(false);

  const flushQueue = useCallback(
    async (url: string) => {
      if (sendingRef.current || queueRef.current.length === 0) return;
      
      sendingRef.current = true;
      
      try {
        while (queueRef.current.length > 0) {
          const item = queueRef.current[0];
          
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Prime-Fabric-Channel': 'stem-separation',
              },
              body: item.payload,
            });
            
            if (response.ok) {
              queueRef.current.shift();
              if (debug) {
                console.debug('[STEM SEPARATION] Snapshot exported:', item.snapshot.id);
              }
            } else {
              item.attempts++;
              if (item.attempts >= MAX_RETRIES) {
                const dropped = queueRef.current.shift();
                if (debug && dropped) {
                  // Max retries reached - debug only (no ALS needed for training data export)
                }
              } else {
                // Move to end of queue for retry
                queueRef.current.push(queueRef.current.shift()!);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              }
            }
          } catch (error) {
            item.attempts++;
            if (item.attempts >= MAX_RETRIES) {
              const dropped = queueRef.current.shift();
              if (debug && dropped) {
                // Export failed - debug only (no ALS needed for training data export)
              }
            } else {
              queueRef.current.push(queueRef.current.shift()!);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
          }
        }
      } finally {
        sendingRef.current = false;
      }
    },
    [debug]
  );

  const exportSnapshot = useCallback(
    (snapshot: StemSeparationSnapshot) => {
      if (!enabled || !exportUrl) return;
      
      try {
        const payload = JSON.stringify(snapshot);
        
        queueRef.current.push({ payload, snapshot, attempts: 0 });
        
        if (queueRef.current.length > MAX_QUEUE_SIZE) {
          const dropped = queueRef.current.shift();
          if (debug && dropped) {
            // Queue overflow - debug only (no ALS needed for training data export)
          }
        }
        
        if (debug) {
          // Debug log - keep in DEV mode only
        }
        
        void flushQueue(exportUrl);
      } catch (error) {
        if (debug) {
          // Failed to queue snapshot - debug only (no ALS needed for training data export)
        }
      }
    },
    [enabled, exportUrl, flushQueue, debug]
  );

  // Flush queue on page unload
  useEffect(() => {
    if (!enabled || !exportUrl) return;

    const beforeUnloadHandler = () => {
      // Use sendBeacon for reliable delivery on page unload
      while (queueRef.current.length > 0) {
        const item = queueRef.current.shift();
        if (item) {
          navigator.sendBeacon(exportUrl, item.payload);
        }
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [enabled, exportUrl]);

  return { exportSnapshot, queueSize: queueRef.current.length };
}








