import { FourAnchors } from '../types/sonic-architecture';
import { VelvetLoudnessMetrics } from '../audio/VelvetLoudnessMeter';
import { TimelineMarker } from '../state/timelineStore';
import { ArrangeClip } from '../hooks/useArrange';

export type TriggerType = 'BEAT' | 'TRANSPORT' | 'THRESHOLD' | 'STATE_CHANGE' | 'BLOOM_INVOKE' | 'SONIC_METRIC' | 'AGENT_INTENT' | 'ARRANGEMENT_LOOKAHEAD';
export type ActionType = 'TOGGLE_MUTE' | 'TOGGLE_SOLO' | 'SET_VOLUME' | 'INVOKE_BLOOM' | 'PLAY_SOUND' | 'MACRO' | 'SET_MASTERING_PROFILE' | 'COMPLEX_MACRO' | 'SERVICE_ORCHESTRATION' | 'QUANTUM_STEER';
export type MetricType = 'LUFS_INTEGRATED' | 'LUFS_MOMENTARY' | 'PRESENCE' | 'AIRINESS' | 'BODY' | 'TRANSIENT_DENSITY';
export type LogicType = 'AND' | 'OR';

export interface NexusTrigger {
  type: TriggerType;
  params: {
    beat?: number;
    bar?: number;
    trackId?: string;
    threshold?: number;
    targetState?: boolean;
    bloomTool?: string;
    metricType?: MetricType;
    operator?: '>' | '<' | '>=';
    
    // Phase 5: Neural Synthesis Additions
    secondaryTrigger?: NexusTrigger;
    logicType?: LogicType;
    leadTimeMs?: number; // Pre-emptive firing
    snapToGrid?: boolean; // Wait for next beat if triggered by metric
    
    // Phase 6: Neural Adaptation
    deltaThreshold?: number; // Rate of change threshold
    deltaWindowMs?: number; // Time window for rate of change calculation
    variance?: number; // 0-1, organic timing/param jitter
    
    // Phase 7: Synapse Params
    intent?: string;             // AI Intent Match (e.g. "atmospheric")
    register?: string;           // Nexus Register Key
    registerValue?: any;         // Nexus Register Value Match
    
    // Phase 8: Lookahead
    lookaheadMs?: number;
    targetMarker?: string;
    eventType?: 'CLIP_START' | 'CLIP_END' | 'MARKER';
    
    // Phase 9: Resonance & Expressions
    expression?: string;         // For dynamic register scaling (e.g. "x * 0.5")
    resonanceId?: string;      // Tracking specific resonance chains
  };
}

export interface NexusAction {
  type: ActionType;
  params: {
    trackId?: string;
    value?: number;
    state?: boolean;
    bloomTool?: string;
    macroName?: string;
    soundUrl?: string;
    profileName?: string;
    macroActions?: NexusAction[];
    
    // Phase 7: Synapse Params
    service?: 'UNREAL' | 'MIXOS_UI' | 'AGENT_CONDUCTOR';
    payload?: any;
    registerKey?: string;        // For SET_REGISTER or TOGGLE_REGISTER
    registerValue?: any;         // For SET_REGISTER
    
    // Phase 9: Engine Steering
    engine?: 'QUANTUM_CORE' | 'FIVE_PILLARS' | 'VELVET_CURVE';
    parameter?: string;          // e.g. "coherence", "warmth", "silk"
    expression?: string;         // Dynamic value calculation
    delayMs?: number;           // For recursive macro chaining
  };
}

export interface NexusRule {
  id: string;
  name: string;
  trigger: NexusTrigger;
  action: NexusAction;
  enabled: boolean;
  lastFired?: number | string;
  
  // Phase 6: Adaptation State
  confidenceScore?: number; // 0-1, degrades on override
  suppressUntil?: number; // Inhibition timestamp
}

export interface NexusContext {
  rules: NexusRule[];
  addRule: (rule: NexusRule) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  rejectRule: (id: string) => void;
  // Phase 7: Synapse State & Ops
  registers: Record<string, any>;
  setRegister: (key: string, value: any) => void;
  registerIntent: (intent: string) => void;
  markers: TimelineMarker[];
  clips: ArrangeClip[];
  masterAnalysis?: FourAnchors | null;
  loudnessMetrics?: VelvetLoudnessMetrics | null;
  trends?: Record<MetricType, 'UP' | 'DOWN' | 'STABLE'>;
  transportTime: number;
  bpm: number;
}
