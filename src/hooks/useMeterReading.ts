/**
 * Flow Meter Stack - Meter Reading Hook (STEP 4)
 * React hook for real-time meter updates using requestAnimationFrame.
 */

import { useEffect, useRef, useState } from 'react';
import { computeMeterReading, type MeterReading } from '../core/meters/meterUtils';
import { detectTruePeakFromAnalyser } from '../core/meters/truePeak';

/**
 * Options for meter reading hook.
 */
export interface UseMeterReadingOptions {
  /** AnalyserNode to read from */
  analyser: AnalyserNode | null;
  /** Enable true peak detection (oversampling) */
  enableTruePeak?: boolean;
  /** Oversampling factor for true peak (default 4) */
  oversampleFactor?: number;
  /** Callback when meter reading updates */
  onUpdate?: (reading: MeterReading) => void;
}

/**
 * Hook for real-time meter readings from an AnalyserNode.
 * Updates at 60fps using requestAnimationFrame.
 * 
 * @example
 * ```tsx
 * const { reading, isActive } = useMeterReading({
 *   analyser: trackNodes.preFaderMeter,
 *   enableTruePeak: true,
 *   onUpdate: (reading) => {
 *     console.log('Peak:', reading.peak, 'RMS:', reading.rms);
 *   }
 * });
 * ```
 */
export function useMeterReading(options: UseMeterReadingOptions) {
  const { analyser, enableTruePeak = false, oversampleFactor = 4, onUpdate } = options;
  
  const [reading, setReading] = useState<MeterReading | null>(null);
  const [isActive, setIsActive] = useState(false);
  const frameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Update analyser ref when it changes
  useEffect(() => {
    analyserRef.current = analyser;
  }, [analyser]);

  useEffect(() => {
    if (!analyser) {
      setIsActive(false);
      setReading(null);
      return;
    }

    setIsActive(true);
    let lastTruePeak: number | undefined;

    const update = () => {
      const currentAnalyser = analyserRef.current;
      if (!currentAnalyser) {
        setIsActive(false);
        return;
      }

      try {
        // Compute standard meter reading
        const meterReading = computeMeterReading(currentAnalyser, lastTruePeak);

        // Optionally compute true peak
        if (enableTruePeak) {
          try {
            lastTruePeak = detectTruePeakFromAnalyser(currentAnalyser, oversampleFactor);
            meterReading.truePeak = lastTruePeak;
          } catch (err) {
            // True peak computation failed, continue without it
            console.warn('[FLOW METER] True peak detection failed:', err);
          }
        }

        setReading(meterReading);
        
        // Call update callback if provided
        if (onUpdate) {
          onUpdate(meterReading);
        }

        // Schedule next update
        frameRef.current = requestAnimationFrame(update);
      } catch (err) {
        console.error('[FLOW METER] Meter reading failed:', err);
        setIsActive(false);
      }
    };

    // Start update loop
    frameRef.current = requestAnimationFrame(update);

    // Cleanup
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setIsActive(false);
    };
  }, [analyser, enableTruePeak, oversampleFactor, onUpdate]);

  return { reading, isActive };
}

