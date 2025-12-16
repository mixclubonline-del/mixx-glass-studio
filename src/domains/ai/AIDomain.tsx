/**
 * AIDomain - Prime Brain, Bloom, and AI guidance
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type PrimeBrainMode = 'passive' | 'active' | 'learning' | 'optimizing';

export interface BloomContext {
  type: 'mix' | 'master' | 'create' | 'analyze';
  intensity: number;
}

export interface AIGuidance {
  id: string;
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  dismissed: boolean;
}

export interface AIState {
  primeBrainMode: PrimeBrainMode;
  bloomContext: BloomContext;
  guidanceQueue: AIGuidance[];
  isAIEnabled: boolean;
  telemetryEnabled: boolean;
}

export interface AIActions {
  setPrimeBrainMode: (mode: PrimeBrainMode) => void;
  setBloomContext: (context: BloomContext) => void;
  addGuidance: (message: string, priority?: 'low' | 'medium' | 'high') => string;
  dismissGuidance: (id: string) => void;
  clearGuidance: () => void;
  toggleAI: () => void;
  setTelemetryEnabled: (enabled: boolean) => void;
}

export interface AIDomainContextType extends AIState, AIActions {}

// ============================================================================
// Context
// ============================================================================

const AIDomainContext = createContext<AIDomainContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useAI(): AIDomainContextType {
  const context = useContext(AIDomainContext);
  if (!context) {
    throw new Error('useAI must be used within AIDomainProvider');
  }
  return context;
}

// ============================================================================
// Utilities
// ============================================================================

let guidanceIdCounter = 0;
const generateGuidanceId = () => `guidance-${++guidanceIdCounter}-${Date.now().toString(36)}`;

// ============================================================================
// Provider
// ============================================================================

interface AIDomainProviderProps {
  children: ReactNode;
}

export function AIDomainProvider({ children }: AIDomainProviderProps) {
  const [primeBrainMode, setPrimeBrainModeState] = useState<PrimeBrainMode>('passive');
  const [bloomContext, setBloomContextState] = useState<BloomContext>({ type: 'mix', intensity: 0.5 });
  const [guidanceQueue, setGuidanceQueue] = useState<AIGuidance[]>([]);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [telemetryEnabled, setTelemetryEnabledState] = useState(false);

  // Set Prime Brain mode
  const setPrimeBrainMode = useCallback((mode: PrimeBrainMode) => {
    setPrimeBrainModeState(mode);
  }, []);

  // Set Bloom context
  const setBloomContext = useCallback((context: BloomContext) => {
    setBloomContextState(context);
  }, []);

  // Add guidance
  const addGuidance = useCallback((
    message: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): string => {
    const id = generateGuidanceId();
    const guidance: AIGuidance = {
      id,
      message,
      timestamp: Date.now(),
      priority,
      dismissed: false,
    };
    setGuidanceQueue(prev => [...prev, guidance]);
    return id;
  }, []);

  // Dismiss guidance
  const dismissGuidance = useCallback((id: string) => {
    setGuidanceQueue(prev => prev.map(g => 
      g.id === id ? { ...g, dismissed: true } : g
    ));
  }, []);

  // Clear guidance
  const clearGuidance = useCallback(() => {
    setGuidanceQueue([]);
  }, []);

  // Toggle AI
  const toggleAI = useCallback(() => {
    setIsAIEnabled(prev => !prev);
  }, []);

  // Set telemetry enabled
  const setTelemetryEnabled = useCallback((enabled: boolean) => {
    setTelemetryEnabledState(enabled);
  }, []);

  const contextValue: AIDomainContextType = {
    primeBrainMode,
    bloomContext,
    guidanceQueue,
    isAIEnabled,
    telemetryEnabled,
    setPrimeBrainMode,
    setBloomContext,
    addGuidance,
    dismissGuidance,
    clearGuidance,
    toggleAI,
    setTelemetryEnabled,
  };

  return (
    <AIDomainContext.Provider value={contextValue}>
      {children}
    </AIDomainContext.Provider>
  );
}

export default AIDomainProvider;
