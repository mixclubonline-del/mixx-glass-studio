/**
 * useLoudnessMeters - React hook for real-time loudness metering
 * Phase 25: React Integration Layer
 * 
 * Subscribes to the 'loudness-meters' Tauri event emitted at 10 FPS
 */

import { useState, useEffect, useCallback } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { LoudnessMeters } from '../types/rust-audio';

export interface LoudnessState {
  momentary: number;
  shortTerm: number;
  integrated: number;
  truePeak: number;
  isActive: boolean;
}

const INITIAL_STATE: LoudnessState = {
  momentary: -Infinity,
  shortTerm: -Infinity,
  integrated: -Infinity,
  truePeak: -Infinity,
  isActive: false,
};

// Check if we're in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window && '__TAURI_INTERNALS__' in window;

export function useLoudnessMeters() {
  const [state, setState] = useState<LoudnessState>(INITIAL_STATE);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Skip listener setup if not in Tauri environment
    if (!isTauri) {
      console.log('[useLoudnessMeters] Web mode - Tauri events not available');
      return;
    }

    let unlisten: UnlistenFn | null = null;
    let lastUpdate = 0;

    const setupListener = async () => {
      try {
        unlisten = await listen<LoudnessMeters>('loudness-meters', (event) => {
          const now = Date.now();
          // Throttle to 30 FPS max for React rendering
          if (now - lastUpdate < 33) return;
          lastUpdate = now;

          const { momentary_lufs, short_term_lufs, integrated_lufs, true_peak_db } = event.payload;
          
          setState({
            momentary: momentary_lufs,
            shortTerm: short_term_lufs,
            integrated: integrated_lufs,
            truePeak: true_peak_db,
            isActive: true,
          });
        });
        
        setIsListening(true);
      } catch (err) {
        console.error('[useLoudnessMeters] Failed to listen:', err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
      setIsListening(false);
    };
  }, []);


  // Reset meters
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Format LUFS value for display
  const formatLUFS = useCallback((value: number): string => {
    if (!isFinite(value)) return '-∞';
    return value.toFixed(1);
  }, []);

  return {
    ...state,
    isListening,
    reset,
    formatLUFS,
    
    // Convenience formatted values
    formatted: {
      momentary: formatLUFS(state.momentary),
      shortTerm: formatLUFS(state.shortTerm),
      integrated: formatLUFS(state.integrated),
      truePeak: formatLUFS(state.truePeak),
    },
  };
}

export default useLoudnessMeters;
