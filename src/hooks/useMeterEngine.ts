import { useEffect, useRef, useState } from 'react';
import { useALSPulse } from '../als/useALSPulse';

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
    if (!audioNode) return;

    const ctx = audioNode.context as BaseAudioContext;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    data.current = new Float32Array(analyser.fftSize);

    audioNode.connect(analyser);

    let lastTransient = 0;
    let animationFrame: number;

    const loop = () => {
      if (!analyserRef.current || !data.current) return;

      analyserRef.current.getFloatTimeDomainData(data.current);
      const buffer = data.current;

      // ---- PEAK ----
      let peak = 0;
      for (let i = 0; i < buffer.length; i++) {
        const sample = buffer[i];
        const mag = sample < 0 ? -sample : sample;
        if (mag > peak) peak = mag;
      }

      const now = performance.now();

      // Peak hold logic
      if (peak > peakHold.current) {
        peakHold.current = peak;
        peakHoldTime.current = now;
      } else {
        const diff = now - peakHoldTime.current;
        if (diff > 900) {
          peakHold.current = Math.max(peakHold.current - 0.005, peak);
        }
      }

      // ---- RMS ---- (smooth)
      let rmsAccum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const s = buffer[i];
        rmsAccum += s * s;
      }
      const rms = Math.sqrt(rmsAccum / buffer.length);
      const smoothRMS = lastRMS.current * 0.7 + rms * 0.3;
      lastRMS.current = smoothRMS;

      // ---- CLIP ----
      const clipped = peak >= 0.98;

      // ---- TRANSIENT SHIMMER ----
      const transient = peak > lastTransient + 0.15;
      if (transient) lastTransient = peak;
      lastTransient *= 0.92;

      // ---- PULSE INTEGRATION ----
      const pulseBoost = pulse * 0.15;
      const finalPeak = Math.min(peakHold.current + pulseBoost, 1);
      const finalRMS = Math.min(smoothRMS + pulseBoost * 0.4, 1);

      setValues({
        peak: finalPeak,
        rms: finalRMS,
        clipped,
        transient,
      });

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      try {
        if (audioNode && analyser) {
          audioNode.disconnect(analyser);
        }
      } catch {
        // ignore disconnect races
      }
    };
  }, [audioNode, pulse]);

  return values;
}


