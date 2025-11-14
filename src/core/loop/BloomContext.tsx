/**
 * Bloom Context
 * 
 * Bloom is ALWAYS hidden unless summoned.
 * But Bloom LISTENS and gets preloaded with context when Prime Brain
 * detects Flow, Creative Burst, Precision Editing, or Performance Mode.
 * 
 * Bloom doesn't open. Bloom ANTICIPATES.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BehaviorState, FlowMode } from './behaviorEngine';

interface BloomPreparedContext {
  mode: FlowMode;
  commonActions: string[];
  predictions: string[];
  flow: number;
  pulse: number;
  tension: number;
}

interface BloomContextValue {
  preparedContext: BloomPreparedContext | null;
  prepare: (context: Partial<BloomPreparedContext>) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const BloomContext = createContext<BloomContextValue | null>(null);

export function useBloom() {
  const context = useContext(BloomContext);
  if (!context) {
    throw new Error('useBloom must be used within BloomProvider');
  }
  return context;
}

interface BloomProviderProps {
  children: React.ReactNode;
}

export function BloomProvider({ children }: BloomProviderProps) {
  const [preparedContext, setPreparedContext] = useState<BloomPreparedContext | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const prepare = useCallback((context: Partial<BloomPreparedContext>) => {
    setPreparedContext(prev => ({
      mode: context.mode ?? prev?.mode ?? 'idle',
      commonActions: context.commonActions ?? prev?.commonActions ?? [],
      predictions: context.predictions ?? prev?.predictions ?? [],
      flow: context.flow ?? prev?.flow ?? 0,
      pulse: context.pulse ?? prev?.pulse ?? 0,
      tension: context.tension ?? prev?.tension ?? 0,
    }));
  }, []);
  
  return (
    <BloomContext.Provider value={{ preparedContext, prepare, isVisible, setIsVisible }}>
      {children}
    </BloomContext.Provider>
  );
}

