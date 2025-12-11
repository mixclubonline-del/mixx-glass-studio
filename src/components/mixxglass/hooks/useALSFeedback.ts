/**
 * useALSFeedback Hook
 * 
 * Provides ALS feedback integration for MixxGlass components
 */

import { useMemo } from 'react';
import { generateALSFeedback, type ALSChannel, type ALSFeedback } from '../utils/alsHelpers';

export interface UseALSFeedbackOptions {
  channel: ALSChannel;
  value: number;
  flow?: number;
  enabled?: boolean;
}

/**
 * Hook for ALS feedback in components
 * 
 * Converts numeric values to color/temperature/energy representations
 * (No raw numbers shown to users)
 */
export function useALSFeedback(options: UseALSFeedbackOptions): ALSFeedback | null {
  const { channel, value, flow = 0.5, enabled = true } = options;

  return useMemo(() => {
    if (!enabled) {
      return null;
    }

    return generateALSFeedback(channel, value, flow);
  }, [channel, value, flow, enabled]);
}



