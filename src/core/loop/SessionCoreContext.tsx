/**
 * Session Core Context
 * 
 * Session Core is the DAW's internal engine:
 * - audio graph
 * - routing
 * - clip ops
 * - timeline logic
 * - piano roll
 * - drum grid
 * - transport state
 * 
 * Session Core modifies behavior based on Prime Brain signals.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { BehaviorState, FlowMode } from './behaviorEngine';

interface SessionCoreState {
  snapPrecision: number; // Increased in precision mode
  scrollSmoothing: number; // Enabled in flow mode
  prefetchEnabled: boolean; // Enabled in burst mode
  lowLatencyMode: boolean; // Enabled in record/performance mode
  uiAnimationReduced: boolean; // Reduced animations in performance mode
  bloomSuppressed: boolean; // Suppress Bloom in performance mode
  // Punch Mode settings
  punchMode: boolean; // Punch Mode active
  autoCrossfade: boolean; // Auto-crossfade enabled in punch mode
  preRollAuto: boolean; // Auto pre-roll in punch mode
  postRollAuto: boolean; // Auto post-roll trim in punch mode
  waveformSmoothing: boolean; // Waveform smoothing in punch mode
  snapDisabled: boolean; // Snap disabled in punch mode
  // Auto-Punch settings
  autoPunchRegion?: { start: number; end: number }; // Predicted punch region
}

interface SessionCoreContextValue {
  state: SessionCoreState;
  applyBrainState: (brainState: BehaviorState) => void;
}

const SessionCoreContext = createContext<SessionCoreContextValue | null>(null);

export function useSessionCore() {
  const context = useContext(SessionCoreContext);
  if (!context) {
    throw new Error('useSessionCore must be used within SessionCoreProvider');
  }
  return context;
}

interface SessionCoreProviderProps {
  children: React.ReactNode;
}

export function SessionCoreProvider({ children }: SessionCoreProviderProps) {
  const [state, setState] = useState<SessionCoreState>({
    snapPrecision: 1.0,
    scrollSmoothing: 0.5,
    prefetchEnabled: false,
    lowLatencyMode: false,
    uiAnimationReduced: false,
    bloomSuppressed: false,
    punchMode: false,
    autoCrossfade: false,
    preRollAuto: false,
    postRollAuto: false,
    waveformSmoothing: false,
    snapDisabled: false,
    autoPunchRegion: undefined,
  });
  
  const preparePunchRegion = useCallback((start: number, end: number) => {
    setState(prev => ({
      ...prev,
      autoPunchRegion: { start, end },
    }));
  }, []);
  
  const applyBrainState = useCallback((brainState: BehaviorState) => {
    const { mode, flow, tension } = brainState;
    const isPerformanceMode = mode === 'record';
    const isPunchMode = mode === 'punch';
    
    setState({
      // Precision Mode → increase snapping (disabled in punch mode)
      snapPrecision: isPunchMode ? 0 : mode === 'edit' ? 2.0 : mode === 'flow' ? 1.5 : 1.0,
      
      // Flow Mode → smooth scroll & zoom interpolation
      scrollSmoothing: mode === 'flow' || mode === 'burst' ? 0.8 : 0.5,
      
      // Creative Burst → prefetch next assets
      prefetchEnabled: mode === 'burst' && flow > 0.7,
      
      // Performance/Recording Mode → low-latency monitoring
      lowLatencyMode: isPerformanceMode || isPunchMode,
      
      // Performance Mode → reduce UI animation noise
      uiAnimationReduced: isPerformanceMode || isPunchMode,
      
      // Performance Mode → suppress Bloom (quiet control room)
      bloomSuppressed: isPerformanceMode || isPunchMode,
      
      // Punch Mode settings
      punchMode: isPunchMode,
      autoCrossfade: isPunchMode,
      preRollAuto: isPunchMode,
      postRollAuto: isPunchMode,
      waveformSmoothing: isPunchMode,
      snapDisabled: isPunchMode,
    });
  }, []);
  
  return (
    <SessionCoreContext.Provider value={{ state, applyBrainState, preparePunchRegion }}>
      {children}
    </SessionCoreContext.Provider>
  );
}

