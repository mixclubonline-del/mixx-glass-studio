/**
 * Flow Meter Stack - Meter Reading Hook (STEP 4)
 * React hook for real-time meter updates using batched requestAnimationFrame.
 * 
 * QUANTUM OPTIMIZATION: Uses centralized meterBatcher to reduce RAF overhead.
 * 
 * @author Prime (Mixx Club)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { meterBatcher } from '../core/performance/meterBatcher';
import type { MeterReading } from '../core/meters/meterUtils';

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
  const subscriptionIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Memoized callback to avoid recreating on every render
  const handleUpdate = useCallback((meterReading: MeterReading) => {
    setReading(meterReading);
    if (onUpdate) {
      onUpdate(meterReading);
    }
  }, [onUpdate]);

  useEffect(() => {
    if (!analyser) {
      setIsActive(false);
      setReading(null);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        subscriptionIdRef.current = null;
      }
      return;
    }

    setIsActive(true);

    // Generate unique subscription ID
    const subscriptionId = `meter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    subscriptionIdRef.current = subscriptionId;

    // Subscribe to batched meter updates
    const unsubscribe = meterBatcher.subscribe(
      subscriptionId,
      analyser,
      handleUpdate,
      {
        enableTruePeak,
        oversampleFactor,
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        subscriptionIdRef.current = null;
      }
      setIsActive(false);
    };
  }, [analyser, enableTruePeak, oversampleFactor, handleUpdate]);

  return { reading, isActive };
}

