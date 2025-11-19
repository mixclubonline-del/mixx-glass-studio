import { useEffect, useRef, useState } from 'react';
import { useALSPulse } from '../als/useALSPulse';
import { meterBatcher } from '../core/performance/meterBatcher';
import { createParallelAnalyserTap } from '../core/performance/safeAnalyserTap';

interface MeterValues {
  peak: number; // 0–1
  rms: number; // 0–1
  clipped: boolean;
  transient: boolean; // shimmer
}

/**
 * useMeterEngine
 *
 * Unified meter core:
 * - Peak + peak-hold
 * - Smoothed RMS
 * - Clip detection
 * - Transient shimmer flag
 * - ALS Pulse integration for subtle visual breathing
 */
export function useMeterEngine(audioNode?: AudioNode) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const data = useRef<Float32Array | null>(null);

  const [values, setValues] = useState<MeterValues>({
    peak: 0,
    rms: 0,
    clipped: false,
    transient: false,
  });

  const peakHold = useRef<number>(0);
  const peakHoldTime = useRef<number>(0);
  const lastRMS = useRef<number>(0);

  const pulse = useALSPulse(); // 0–1 intensity from ALS

  useEffect(() => {
    if (!audioNode) {
      setValues({ peak: 0, rms: 0, clipped: false, transient: false });
      return;
    }

    const ctx = audioNode.context as BaseAudioContext;
    
    // Create safe analyser tap to prevent feedback loops
    let analyserTap: ReturnType<typeof createParallelAnalyserTap> | null = null;
    let unsubscribe: (() => void) | null = null;

    try {
      analyserTap = createParallelAnalyserTap(audioNode, ctx);
      analyserRef.current = analyserTap.analyser;
      data.current = new Float32Array(analyserTap.analyser.fftSize);

      let lastTransient = 0;

      // Use batched meter reading instead of individual RAF loop
      const subscriptionId = `meter-engine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      unsubscribe = meterBatcher.subscribe(
        subscriptionId,
        analyserTap.analyser,
        (reading) => {
          // Convert dB readings to 0-1 range for meter display
          const peakLinear = reading.peak !== -Infinity ? Math.pow(10, reading.peak / 20) : 0;
          const rmsLinear = reading.rms !== -Infinity ? Math.pow(10, reading.rms / 20) : 0;

          const now = performance.now();

          // Peak hold logic
          if (peakLinear > peakHold.current) {
            peakHold.current = peakLinear;
            peakHoldTime.current = now;
          } else {
            const diff = now - peakHoldTime.current;
            if (diff > 900) {
              peakHold.current = Math.max(peakHold.current - 0.005, peakLinear);
            }
          }

          // Smooth RMS
          const smoothRMS = lastRMS.current * 0.7 + rmsLinear * 0.3;
          lastRMS.current = smoothRMS;

          // Clip detection
          const clipped = peakLinear >= 0.98;

          // Transient shimmer
          const transient = peakLinear > lastTransient + 0.15;
          if (transient) lastTransient = peakLinear;
          lastTransient *= 0.92;

          // Pulse integration
          const pulseBoost = pulse * 0.15;
          const finalPeak = Math.min(peakHold.current + pulseBoost, 1);
          const finalRMS = Math.min(smoothRMS + pulseBoost * 0.4, 1);

          setValues({
            peak: finalPeak,
            rms: finalRMS,
            clipped,
            transient,
          });
        }
      );
    } catch (err) {
      console.error('[USE METER ENGINE] Failed to create analyser tap:', err);
      setValues({ peak: 0, rms: 0, clipped: false, transient: false });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (analyserTap) {
        analyserTap.disconnect();
      }
      analyserRef.current = null;
      data.current = null;
    };
  }, [audioNode, pulse]);

  return values;
}


