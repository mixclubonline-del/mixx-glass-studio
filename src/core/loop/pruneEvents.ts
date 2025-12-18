/**
 * Event Pruning / Cleanup Module
 * 
 * Cleans up all Mixx Club Studio event buffers.
 * Prevents memory buildup and ensures Flow loop stays smooth.
 * 
 * This keeps arrays from exploding and ensures the behavior engine stays fast.
 */

// Window interface extensions moved to src/types/globals.d.ts

/**
 * Prune a single event array by removing events older than the window
 */
function pruneArray(
  key: keyof Window,
  now: number,
  windowMs: number
): void {
  if (typeof window === 'undefined') return;
  const arr = (window as any)[key];
  if (!Array.isArray(arr)) return;
  
  (window as any)[key] = arr.filter(
    (e: { timestamp: number }) => now - e.timestamp < windowMs
  );
}

/**
 * Prune all event arrays to keep memory usage constant and performance smooth.
 * Called periodically by the Flow Loop (every 40-50ms).
 * 
 * Window sizes are tuned for Flow detection:
 * - Edit events: 1.2s (captures recent editing bursts)
 * - Tool switches: 2s (captures tool velocity patterns)
 * - Zoom events: 0.9s (captures zoom bursts and hunting)
 * - View switches: 1.8s (captures view switching bursts)
 * 
 * Playback and record states are objects, not arrays — they don't need pruning.
 */
export function pruneEvents(): void {
  const now = performance.now();
  
  pruneArray('__mixx_editEvents', now, 1200);       // 1.2 sec window
  pruneArray('__mixx_toolSwitches', now, 2000);     // 2 sec window
  pruneArray('__mixx_zoomEvents', now, 900);        // 0.9 sec window
  pruneArray('__mixx_viewSwitches', now, 1800);     // 1.8 sec window
  
  // playback + record states are objects, not arrays — don't prune
}
