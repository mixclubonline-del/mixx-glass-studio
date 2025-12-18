/**
 * AIDomain - Prime Brain, Bloom, and AI guidance
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { 
  PrimeBrainSnapshotInputs, 
  PrimeBrainBloomEvent, 
  PrimeBrainCommandLog, 
  PrimeBrainGuidance, 
  PrimeBrainAIFlag, 
  PrimeBrainMode, 
  PrimeBrainALSChannel, 
  PrimeBrainConversationTurn, 
  PrimeBrainModeHints, 
  derivePrimeBrainMode 
} from '../../ai/PrimeBrainSnapshot';
import { 
  FourAnchors, 
} from '../../types/sonic-architecture';
import { 
  PrimeBrainStatus, 
} from '../../types/primeBrainStatus';
import { ALSActionPulse } from '../../utils/ALS';
import { useAudioDomain } from '../audio';
import { useTransport } from '../transport';
import { useMixer } from '../mixer';
import { useTracks } from '../tracks';
import { useFlowContext } from '../../state/flowContextService';
import {
  clamp01,
  describeAlsChannel,
  derivePrimeBrainHealth,
  deriveVelvetLensState,
  MODE_CAPTIONS
} from './AIUtils';

// ============================================================================
// State & Actions Types
// ============================================================================

export interface BloomContextType {
  type: 'mix' | 'master' | 'create' | 'analyze';
  intensity: number;
}

export interface MixerActionPulseWrapper {
  trackId: string;
  pulse: ALSActionPulse;
  message: string;
}

export interface AIGuidance {
  id: string;
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  dismissed: boolean;
}

export interface AIState {
  analysisResult: FourAnchors | null;
  mixerActionPulse: MixerActionPulseWrapper | null;
  primeBrainStatus: PrimeBrainStatus;
  primeBrainSnapshotInputs: PrimeBrainSnapshotInputs | null;
  telemetryEnabled: boolean;
  guidanceQueue: AIGuidance[];
  isAIEnabled: boolean;
}

export interface AIActions {
  setAnalysisResult: (res: FourAnchors | null) => void;
  setMixerActionPulse: (pulse: MixerActionPulseWrapper | null) => void;
  setTelemetryEnabled: (enabled: boolean) => void;
  logPrimeBrainAction: (action: string) => void;
  addGuidance: (message: string, priority?: 'low' | 'medium' | 'high') => string;
  dismissGuidance: (id: string) => void;
  clearGuidance: () => void;
  toggleAI: () => void;
  setPrimeBrainSessionId: (id: string) => void;
  logPrimeBrainBloomEvent: (intent: string, name: string, outcome?: 'accepted' | 'dismissed' | 'ignored') => void;
  logPrimeBrainCommand: (commandType: string, payload: Record<string, unknown>, accepted?: boolean) => void;
  recordPrimeBrainEvent: (type: string, data: any, outcome?: 'success' | 'failure' | 'warning') => void;
}

export interface AIDomainContextType extends AIState, AIActions {}

const AIDomainContext = createContext<AIDomainContextType | null>(null);

export function useAI() {
  const ctx = useContext(AIDomainContext);
  if (!ctx) throw new Error('useAI must be used within AIDomainProvider');
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

const TELEMETRY_KEY = 'prime-brain-telemetry';

export function AIDomainProvider({ children }: { children: ReactNode }) {
  // Domain dependencies
  const audio = useAudioDomain();
  const transport = useTransport();
  const mixer = useMixer();
  const tracksDomain = useTracks();
  const flowContext = useFlowContext();

  // State
  const [analysisResult, setAnalysisResult] = useState<FourAnchors | null>(null);
  const [mixerActionPulse, setMixerActionPulse] = useState<MixerActionPulseWrapper | null>(null);
  const [telemetryEnabled, setTelemetryEnabled] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem(TELEMETRY_KEY) !== 'disabled' : true
  );
  const [guidanceQueue, setGuidanceQueue] = useState<AIGuidance[]>([]);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [primeBrainTick, setPrimeBrainTick] = useState(0);

  // Refs for intelligence tracking
  const sessionIdRef = useRef<string>('');
  const bloomTraceRef = useRef<PrimeBrainBloomEvent[]>([]);
  const commandLogRef = useRef<PrimeBrainCommandLog[]>([]);
  const guidanceRef = useRef<PrimeBrainGuidance>({});
  const recentActionsRef = useRef<{ action: string; timestamp: string }[]>([]);
  const audioMetricsRef = useRef<PrimeBrainSnapshotInputs['audioMetrics']>({ latencyMs: 0, cpuLoad: 0 });

  // Persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TELEMETRY_KEY, telemetryEnabled ? 'enabled' : 'disabled');
  }, [telemetryEnabled]);

  // Tick for Prime Brain updates
  useEffect(() => {
    const timer = setInterval(() => setPrimeBrainTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Actions
  const logPrimeBrainAction = useCallback((action: string) => {
    recentActionsRef.current.unshift({ action, timestamp: new Date().toISOString() });
    if (recentActionsRef.current.length > 20) recentActionsRef.current.pop();
  }, []);

  const addGuidance = useCallback((message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const id = `guidance-${Date.now()}`;
    setGuidanceQueue(prev => [...prev, { id, message, timestamp: Date.now(), priority, dismissed: false }]);
    return id;
  }, []);

  const dismissGuidance = useCallback((id: string) => {
    setGuidanceQueue(prev => prev.map(g => g.id === id ? { ...g, dismissed: true } : g));
  }, []);

  const clearGuidance = useCallback(() => setGuidanceQueue([]), []);
  const toggleAI = useCallback(() => setIsAIEnabled(p => !p), []);
  const setPrimeBrainSessionId = useCallback((id: string) => { sessionIdRef.current = id; }, []);

  const logPrimeBrainBloomEvent = useCallback((intent: string, name: string, outcome: 'accepted' | 'dismissed' | 'ignored' = 'accepted') => {
    const event: PrimeBrainBloomEvent = {
      actionId: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `pbloom-${Date.now()}`,
      name,
      intent,
      confidence: 0.85,
      outcome,
      triggeredAt: new Date().toISOString(),
    };
    bloomTraceRef.current = [...bloomTraceRef.current.slice(-23), event];
    setPrimeBrainTick(t => t + 1);
  }, []);

  const logPrimeBrainCommand = useCallback((commandType: string, payload: Record<string, unknown>, accepted = true) => {
    const command: PrimeBrainCommandLog = {
      id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `pcmd-${Date.now()}`,
      commandType,
      payload,
      issuedAt: new Date().toISOString(),
      accepted,
    };
    commandLogRef.current = [...commandLogRef.current.slice(-19), command];
    guidanceRef.current = { ...guidanceRef.current, lastCommand: command };
    setPrimeBrainTick(t => t + 1);
  }, []);

  const recordPrimeBrainEvent = useCallback((type: string, data: any, outcome: 'success' | 'failure' | 'warning' = 'success') => {
    // Basic event logging to recent actions
    logPrimeBrainAction(`${type}${outcome !== 'success' ? ` (${outcome})` : ''}`);
    // If it's a significant event, could also add to bloom trace or command log
  }, [logPrimeBrainAction]);

  // Derived Snapshots
  const primeBrainSnapshotInputs = useMemo<PrimeBrainSnapshotInputs | null>(() => {
    if (!sessionIdRef.current) return null;

    try {
      const hasAudio = mixer.masterAnalysis.level > 0.001;
      const alsTemperature = hasAudio ? clamp01(mixer.masterAnalysis.level) : 0;
      
      let momentum = hasAudio 
        ? Math.max(flowContext.momentum, transport.isPlaying ? 0.45 + mixer.masterAnalysis.level * 0.4 : 0.18)
        : 0;

      if (mixerActionPulse) {
        momentum = Math.min(1, Math.max(momentum, flowContext.momentum + mixerActionPulse.pulse.intensity * 0.3));
      }

      const pressureBase = (mixer.masterAnalysis.transient ? 0.55 + mixer.masterAnalysis.level * 0.4 : mixer.masterAnalysis.level * 0.6) + flowContext.momentumTrend * 0.35;
      const pressure = clamp01(audio.importMessage ? Math.max(pressureBase, 0.65) : pressureBase);
      
      const harmony = hasAudio && analysisResult
        ? clamp01((analysisResult.soul / 100) * 0.6 + (analysisResult.silk / 100) * 0.4)
        : 0;

      const harmonyWithFlow = hasAudio ? clamp01(harmony + (flowContext.intensity === 'immersed' ? 0.08 : flowContext.intensity === 'charged' ? 0.04 : 0)) : 0;

      const alsChannels: PrimeBrainSnapshotInputs['alsChannels'] = [
        { channel: 'temperature', value: alsTemperature },
        { channel: 'momentum', value: momentum },
        { channel: 'pressure', value: pressure },
        { channel: 'harmony', value: harmonyWithFlow },
      ];

      const modeHints: PrimeBrainModeHints = {
        isPlaying: transport.isPlaying,
        armedTrackCount: tracksDomain.tracks.filter(t => (t as any).isArmed).length,
        activeBloomActions: bloomTraceRef.current.filter(e => Date.now() - Date.parse(e.triggeredAt) < 16000).length,
        cpuLoad: audioMetricsRef.current.cpuLoad,
        dropoutsPerMinute: audioMetricsRef.current.dropoutsPerMinute,
      };

      const mode = derivePrimeBrainMode({ modeHints, aiAnalysisFlags: [], mode: 'passive' } as any);

      return {
        sessionId: sessionIdRef.current,
        captureTimestamp: new Date().toISOString(),
        transport: {
          isPlaying: transport.isPlaying,
          playheadSeconds: transport.currentTime,
          tempo: transport.bpm,
          isLooping: transport.isLooping,
          cycle: transport.isLooping ? { startSeconds: 0, endSeconds: transport.currentTime } : null
        },
        alsChannels,
        audioMetrics: audioMetricsRef.current,
        harmonicState: {
          key: 'C',
          scale: 'major',
          consonance: analysisResult ? clamp01((analysisResult.silk + analysisResult.soul) / 200) : 0.5,
          tension: analysisResult ? clamp01((analysisResult.body + analysisResult.air) / 200) : 0.5,
        },
        aiAnalysisFlags: [],
        bloomTrace: bloomTraceRef.current,
        userMemory: { recentActions: recentActionsRef.current, recallAnchors: [] },
        issuedCommands: commandLogRef.current,
        conversationTurns: [],
        mode,
        modeHints,
        guidance: guidanceRef.current,
      };
    } catch (e) {
      return null;
    }
  }, [primeBrainTick, mixer.masterAnalysis, transport, audio.importMessage, analysisResult, flowContext, mixerActionPulse]);

  const primeBrainStatus = useMemo<PrimeBrainStatus>(() => {
    const fallback = {
      mode: 'passive' as PrimeBrainMode,
      modeCaption: MODE_CAPTIONS.passive,
      health: derivePrimeBrainHealth({} as any, []),
      alsChannels: (['temperature', 'momentum', 'pressure', 'harmony'] as PrimeBrainALSChannel[]).map(c => describeAlsChannel(c, 0)),
      velvet: deriveVelvetLensState(analysisResult),
      userMemoryAnchors: [],
      aiFlags: [],
      guidanceLine: 'Flow ready — transport armed.'
    };

    if (!primeBrainSnapshotInputs) return fallback;

    try {
      const mode = derivePrimeBrainMode(primeBrainSnapshotInputs);
      const health = derivePrimeBrainHealth(primeBrainSnapshotInputs.audioMetrics, primeBrainSnapshotInputs.aiAnalysisFlags);
      const alsChannels = primeBrainSnapshotInputs.alsChannels.map(e => describeAlsChannel(e.channel, e.value));
      const lastBloom = primeBrainSnapshotInputs.bloomTrace.slice(-1)[0] || null;
      
      let guidanceLine = primeBrainSnapshotInputs.guidance?.lastSuggestion || 'Flow ready.';
      if (flowContext.adaptiveSuggestions.suggestViewSwitch) {
        guidanceLine = `Consider switching to ${flowContext.adaptiveSuggestions.suggestViewSwitch} view.`;
      }

      return {
        mode,
        modeCaption: MODE_CAPTIONS[mode],
        health,
        alsChannels,
        velvet: deriveVelvetLensState(analysisResult),
        lastBloom,
        guidanceLine,
        userMemoryAnchors: primeBrainSnapshotInputs.userMemory.recallAnchors,
        aiFlags: primeBrainSnapshotInputs.aiAnalysisFlags,
      };
    } catch (e) {
      return fallback;
    }
  }, [analysisResult, primeBrainSnapshotInputs, flowContext]);

  const value: AIDomainContextType = {
    analysisResult,
    mixerActionPulse,
    primeBrainStatus,
    primeBrainSnapshotInputs,
    telemetryEnabled,
    guidanceQueue,
    isAIEnabled,
    setAnalysisResult,
    setMixerActionPulse,
    setTelemetryEnabled,
    toggleAI,
    setPrimeBrainSessionId,
    logPrimeBrainAction,
    addGuidance,
    dismissGuidance,
    clearGuidance,
    logPrimeBrainBloomEvent,
    logPrimeBrainCommand,
    recordPrimeBrainEvent
  };

  return <AIDomainContext.Provider value={value}>{children}</AIDomainContext.Provider>;
}

export default AIDomainProvider;
