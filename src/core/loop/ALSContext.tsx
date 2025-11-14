/**
 * ALS Context
 * 
 * ALS is passive - it ONLY displays what Prime Brain tells it.
 * This keeps ALS as the visual heartbeat of the Studio.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BehaviorState } from './behaviorEngine';

interface ALSState {
  flow: number;
  pulse: number;
  tension: number;
  momentum: number;
  hushFlags: string[];
}

interface ALSContextValue {
  state: ALSState;
  setState: (state: Partial<ALSState>) => void;
}

const ALSContext = createContext<ALSContextValue | null>(null);

export function useALS() {
  const context = useContext(ALSContext);
  if (!context) {
    throw new Error('useALS must be used within ALSProvider');
  }
  return context;
}

interface ALSProviderProps {
  children: React.ReactNode;
}

export function ALSProvider({ children }: ALSProviderProps) {
  const [state, setStateInternal] = useState<ALSState>({
    flow: 0,
    pulse: 0,
    tension: 0,
    momentum: 0,
    hushFlags: [],
  });
  
  // Use ref to track if we're in a batch update to reduce re-renders
  const updateTimeoutRef = React.useRef<number | null>(null);
  
  const setState = useCallback((updates: Partial<ALSState>) => {
    // Batch updates to reduce re-renders from flow loop
    if (updateTimeoutRef.current !== null) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = window.setTimeout(() => {
      setStateInternal(prev => {
        // Only update if values actually changed (prevent unnecessary re-renders)
        const hasChanges = Object.keys(updates).some(key => {
          const typedKey = key as keyof ALSState;
          if (typedKey === 'hushFlags') {
            const prevFlags = prev.hushFlags || [];
            const newFlags = updates.hushFlags || [];
            return JSON.stringify(prevFlags) !== JSON.stringify(newFlags);
          }
          return Math.abs((prev[typedKey] as number) - (updates[typedKey] as number)) > 0.01;
        });
        
        return hasChanges ? { ...prev, ...updates } : prev;
      });
      updateTimeoutRef.current = null;
    }, 16); // ~60fps update rate instead of every 40ms
  }, []);
  
  React.useEffect(() => {
    return () => {
      if (updateTimeoutRef.current !== null) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <ALSContext.Provider value={{ state, setState }}>
      {children}
    </ALSContext.Provider>
  );
}

