import { useEffect, useRef, useState } from 'react';

/**
 * useALSPulse
 *
 * Lightweight hook that reads the current ALS pulse value from the global
 * Flow runtime (`window.__als`) and returns a normalized 0–1 value.
 *
 * This is intentionally simple and render-friendly – it uses rAF polling
 * so meters can stay in sync with the audio render loop without adding
 * extra event wiring.
 */
export function useALSPulse(): number {
  const [pulse, setPulse] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      if (typeof window !== 'undefined') {
        const als = (window as any).__als || {};
        const raw = typeof als.pulse === 'number' ? als.pulse : 0; // expected 0–100
        const normalized = Math.max(0, Math.min(1, raw / 100));
        setPulse((prev) => (prev !== normalized ? normalized : prev));
      }
      frameRef.current = window.requestAnimationFrame(loop);
    };

    frameRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return pulse;
}


