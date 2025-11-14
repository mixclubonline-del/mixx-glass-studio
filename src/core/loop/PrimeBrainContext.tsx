/**
 * Prime Brain Context
 * 
 * Provides Prime Brain state and behavior computation to the flow loop.
 * Integrates with existing Prime Brain orchestration.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { SessionSignals } from './gatherSessionSignals';
import { computeBehavior, type BehaviorState, type FlowMode } from './behaviorEngine';
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';

interface PrimeBrainContextValue {
  state: BehaviorState;
  primeBrainStatus: PrimeBrainStatus | null;
  updateFromSession: (signals: SessionSignals) => void;
  updateFromALS: (alsState: { flow: number; pulse: number; tension: number }) => void;
}

const PrimeBrainContext = createContext<PrimeBrainContextValue | null>(null);

export function usePrimeBrain() {
  const context = useContext(PrimeBrainContext);
  if (!context) {
    throw new Error('usePrimeBrain must be used within PrimeBrainProvider');
  }
  return context;
}

interface PrimeBrainProviderProps {
  children: React.ReactNode;
  primeBrainStatus: PrimeBrainStatus | null;
}

export function PrimeBrainProvider({ children, primeBrainStatus }: PrimeBrainProviderProps) {
  const [state, setState] = useState<BehaviorState>({
    flow: 0,
    pulse: 0,
    momentum: 0,
    tension: 0,
    hushWarnings: [],
    mode: 'idle',
  });
  
  const lastSignalsRef = useRef<SessionSignals | null>(null);
  
  const updateFromSession = useCallback((signals: SessionSignals) => {
    lastSignalsRef.current = signals;
    const behavior = computeBehavior(signals);
    setState(behavior);
  }, []);
  
  const updateFromALS = useCallback((alsState: { flow: number; pulse: number; tension: number }) => {
    // Feedback loop: ALS state influences Prime Brain
    // This creates the continuous rhythm
    // For now, we just update state based on ALS feedback
    // The behavior engine will incorporate this in the next tick
    setState(prev => ({
      ...prev,
      flow: Math.max(prev.flow, alsState.flow * 0.3), // Subtle influence
      pulse: Math.max(prev.pulse, alsState.pulse * 0.3),
      tension: Math.max(prev.tension, alsState.tension * 0.3),
    }));
  }, []);
  
  return (
    <PrimeBrainContext.Provider value={{ state, primeBrainStatus, updateFromSession, updateFromALS }}>
      {children}
    </PrimeBrainContext.Provider>
  );
}

