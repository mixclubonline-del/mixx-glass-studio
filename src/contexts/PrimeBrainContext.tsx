/**
 * Mixx Club Studio - Prime Brain Central Intelligence
 * The central nervous system connecting all audio processing, AI analysis, and visualization
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// === PRIME BRAIN DATA STRUCTURES ===

interface AudioMetrics {
  inputLevel: number;
  outputLevel: number;
  latency: number;
  cpuUsage: number;
  dropouts: number;
  timestamp: number;
}

interface HarmonicData {
  fundamentalFreq: number;
  harmonics: Array<{
    frequency: number;
    amplitude: number;
    phase: number;
    harmonic: number;
  }>;
  tonality: 'major' | 'minor' | 'dominant' | 'diminished' | 'augmented' | 'unknown';
  key: string;
  consonance: number;
  dissonance: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  timestamp: number;
}

interface AIAnalysis {
  mixingIssues: Array<{
    id: string;
    type: 'eq' | 'compression' | 'reverb' | 'stereo' | 'dynamics';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion: string;
    confidence: number;
  }>;
  genreConfidence: number;
  culturalContext: 'artist' | 'engineer' | 'producer';
  overallScore: number;
  timestamp: number;
}

interface VisualizationData {
  waveformData: Float32Array;
  spectrumData: Float32Array;
  alsData: {
    level: number;
    peak: number;
    rms: number;
    lufs: number;
    dynamics: number;
  };
  primeBrainIntensity: number;
  timestamp: number;
}

interface SystemStatus {
  audioEngine: {
    active: boolean;
    sampleRate: number;
    bufferSize: number;
    latency: number;
  };
  harmonicAnalyzer: {
    active: boolean;
    processing: boolean;
  };
  aiMixing: {
    active: boolean;
    analyzing: boolean;
    confidence: number;
  };
  visualization: {
    active: boolean;
    frameRate: number;
  };
}

// === PRIME BRAIN STATE ===

interface PrimeBrainState {
  // Core Intelligence
  isActive: boolean;
  intensity: number;
  mode: 'passive' | 'active' | 'learning' | 'optimizing';
  
  // Real-time Data
  audioMetrics: AudioMetrics | null;
  harmonicData: HarmonicData | null;
  aiAnalysis: AIAnalysis | null;
  visualizationData: VisualizationData | null;
  
  // System Status
  systemStatus: SystemStatus;
  
  // Historical Data for Learning
  performanceHistory: Array<{
    timestamp: number;
    metrics: AudioMetrics;
    userActions: string[];
  }>;
  
  // Prime Brain Decisions
  recommendations: Array<{
    id: string;
    type: 'audio' | 'mixing' | 'workflow' | 'performance';
    priority: number;
    message: string;
    action?: () => void;
    timestamp: number;
  }>;
}

// === ACTIONS ===

type PrimeBrainAction =
  | { type: 'ACTIVATE_PRIME_BRAIN'; intensity: number }
  | { type: 'DEACTIVATE_PRIME_BRAIN' }
  | { type: 'UPDATE_AUDIO_METRICS'; metrics: AudioMetrics }
  | { type: 'UPDATE_HARMONIC_DATA'; data: HarmonicData }
  | { type: 'UPDATE_AI_ANALYSIS'; analysis: AIAnalysis }
  | { type: 'UPDATE_VISUALIZATION_DATA'; data: VisualizationData }
  | { type: 'UPDATE_SYSTEM_STATUS'; component: keyof SystemStatus; status: Partial<SystemStatus[keyof SystemStatus]> }
  | { type: 'ADD_RECOMMENDATION'; recommendation: Omit<PrimeBrainState['recommendations'][0], 'timestamp'> }
  | { type: 'REMOVE_RECOMMENDATION'; id: string }
  | { type: 'SET_MODE'; mode: PrimeBrainState['mode'] }
  | { type: 'RECORD_USER_ACTION'; action: string };

// === REDUCER ===

const initialState: PrimeBrainState = {
  isActive: false,
  intensity: 0.7,
  mode: 'passive',
  audioMetrics: null,
  harmonicData: null,
  aiAnalysis: null,
  visualizationData: null,
  systemStatus: {
    audioEngine: { active: false, sampleRate: 48000, bufferSize: 128, latency: 0 },
    harmonicAnalyzer: { active: false, processing: false },
    aiMixing: { active: false, analyzing: false, confidence: 0 },
    visualization: { active: false, frameRate: 60 }
  },
  performanceHistory: [],
  recommendations: []
};

function primeBrainReducer(state: PrimeBrainState, action: PrimeBrainAction): PrimeBrainState {
  switch (action.type) {
    case 'ACTIVATE_PRIME_BRAIN':
      return {
        ...state,
        isActive: true,
        intensity: action.intensity,
        mode: 'active'
      };
      
    case 'DEACTIVATE_PRIME_BRAIN':
      return {
        ...state,
        isActive: false,
        intensity: 0,
        mode: 'passive'
      };
      
    case 'UPDATE_AUDIO_METRICS':
      return {
        ...state,
        audioMetrics: action.metrics,
        performanceHistory: [
          ...state.performanceHistory.slice(-99), // Keep last 100 entries
          {
            timestamp: Date.now(),
            metrics: action.metrics,
            userActions: [] // Would be populated with recent user actions
          }
        ]
      };
      
    case 'UPDATE_HARMONIC_DATA':
      return {
        ...state,
        harmonicData: action.data
      };
      
    case 'UPDATE_AI_ANALYSIS':
      return {
        ...state,
        aiAnalysis: action.analysis
      };
      
    case 'UPDATE_VISUALIZATION_DATA':
      return {
        ...state,
        visualizationData: action.data
      };
      
    case 'UPDATE_SYSTEM_STATUS':
      return {
        ...state,
        systemStatus: {
          ...state.systemStatus,
          [action.component]: {
            ...state.systemStatus[action.component],
            ...action.status
          }
        }
      };
      
    case 'ADD_RECOMMENDATION':
      return {
        ...state,
        recommendations: [
          ...state.recommendations,
          {
            ...action.recommendation,
            timestamp: Date.now()
          }
        ]
      };
      
    case 'REMOVE_RECOMMENDATION':
      return {
        ...state,
        recommendations: state.recommendations.filter(r => r.id !== action.id)
      };
      
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode
      };
      
    case 'RECORD_USER_ACTION':
      // Add to most recent performance history entry
      const updatedHistory = [...state.performanceHistory];
      if (updatedHistory.length > 0) {
        const lastEntry = updatedHistory[updatedHistory.length - 1];
        lastEntry.userActions.push(action.action);
      }
      return {
        ...state,
        performanceHistory: updatedHistory
      };
      
    default:
      return state;
  }
}

// === CONTEXT ===

interface PrimeBrainContextType {
  state: PrimeBrainState;
  
  // Core Controls
  activatePrimeBrain: (intensity?: number) => void;
  deactivatePrimeBrain: () => void;
  setMode: (mode: PrimeBrainState['mode']) => void;
  
  // Data Updates (called by components)
  updateAudioMetrics: (metrics: AudioMetrics) => void;
  updateHarmonicData: (data: HarmonicData) => void;
  updateAIAnalysis: (analysis: AIAnalysis) => void;
  updateVisualizationData: (data: VisualizationData) => void;
  updateSystemStatus: (component: keyof SystemStatus, status: Partial<SystemStatus[keyof SystemStatus]>) => void;
  
  // Intelligence & Recommendations
  addRecommendation: (recommendation: Omit<PrimeBrainState['recommendations'][0], 'timestamp'>) => void;
  removeRecommendation: (id: string) => void;
  recordUserAction: (action: string) => void;
  
  // Derived Intelligence
  getPerformanceTrend: () => 'improving' | 'stable' | 'declining';
  getCurrentKey: () => string | null;
  getSystemHealth: () => number; // 0-1 scale
  getRecommendations: () => PrimeBrainState['recommendations'];
}

const PrimeBrainContext = createContext<PrimeBrainContextType | null>(null);

// === PROVIDER ===

export const PrimeBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(primeBrainReducer, initialState);

  // === CORE CONTROLS ===
  
  const activatePrimeBrain = useCallback((intensity: number = 0.7) => {
    dispatch({ type: 'ACTIVATE_PRIME_BRAIN', intensity });
    console.log('🧠 PRIME BRAIN ACTIVATED - Central Intelligence Online');
  }, []);

  const deactivatePrimeBrain = useCallback(() => {
    dispatch({ type: 'DEACTIVATE_PRIME_BRAIN' });
    console.log('🧠 Prime Brain deactivated');
  }, []);

  const setMode = useCallback((mode: PrimeBrainState['mode']) => {
    dispatch({ type: 'SET_MODE', mode });
    console.log(`🧠 Prime Brain mode: ${mode.toUpperCase()}`);
  }, []);

  // === DATA UPDATES ===
  
  const updateAudioMetrics = useCallback((metrics: AudioMetrics) => {
    dispatch({ type: 'UPDATE_AUDIO_METRICS', metrics });
  }, []);

  const updateHarmonicData = useCallback((data: HarmonicData) => {
    dispatch({ type: 'UPDATE_HARMONIC_DATA', data });
  }, []);

  const updateAIAnalysis = useCallback((analysis: AIAnalysis) => {
    dispatch({ type: 'UPDATE_AI_ANALYSIS', analysis });
  }, []);

  const updateVisualizationData = useCallback((data: VisualizationData) => {
    dispatch({ type: 'UPDATE_VISUALIZATION_DATA', data });
  }, []);

  const updateSystemStatus = useCallback((component: keyof SystemStatus, status: Partial<SystemStatus[keyof SystemStatus]>) => {
    dispatch({ type: 'UPDATE_SYSTEM_STATUS', component, status });
  }, []);

  // === INTELLIGENCE & RECOMMENDATIONS ===
  
  const addRecommendation = useCallback((recommendation: Omit<PrimeBrainState['recommendations'][0], 'timestamp'>) => {
    dispatch({ type: 'ADD_RECOMMENDATION', recommendation });
  }, []);

  const removeRecommendation = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_RECOMMENDATION', id });
  }, []);

  const recordUserAction = useCallback((action: string) => {
    dispatch({ type: 'RECORD_USER_ACTION', action });
  }, []);

  // === DERIVED INTELLIGENCE ===
  
  const getPerformanceTrend = useCallback((): 'improving' | 'stable' | 'declining' => {
    if (state.performanceHistory.length < 5) return 'stable';
    
    const recent = state.performanceHistory.slice(-5);
    const avgLatency = recent.reduce((sum, entry) => sum + entry.metrics.latency, 0) / recent.length;
    const avgCpu = recent.reduce((sum, entry) => sum + entry.metrics.cpuUsage, 0) / recent.length;
    
    const older = state.performanceHistory.slice(-10, -5);
    if (older.length === 0) return 'stable';
    
    const oldAvgLatency = older.reduce((sum, entry) => sum + entry.metrics.latency, 0) / older.length;
    const oldAvgCpu = older.reduce((sum, entry) => sum + entry.metrics.cpuUsage, 0) / older.length;
    
    const latencyTrend = avgLatency < oldAvgLatency;
    const cpuTrend = avgCpu < oldAvgCpu;
    
    if (latencyTrend && cpuTrend) return 'improving';
    if (!latencyTrend && !cpuTrend) return 'declining';
    return 'stable';
  }, [state.performanceHistory]);

  const getCurrentKey = useCallback((): string | null => {
    return state.harmonicData?.key || null;
  }, [state.harmonicData]);

  const getSystemHealth = useCallback((): number => {
    let health = 0;
    let factors = 0;
    
    // Audio engine health
    if (state.systemStatus.audioEngine.active) {
      health += state.audioMetrics?.latency ? Math.max(0, 1 - state.audioMetrics.latency / 50) : 0.5;
      factors++;
    }
    
    // AI analysis health
    if (state.systemStatus.aiMixing.active) {
      health += state.aiAnalysis?.overallScore || 0.5;
      factors++;
    }
    
    // Harmonic analyzer health
    if (state.systemStatus.harmonicAnalyzer.active) {
      health += state.harmonicData?.consonance || 0.5;
      factors++;
    }
    
    return factors > 0 ? health / factors : 0;
  }, [state]);

  const getRecommendations = useCallback(() => {
    return state.recommendations.sort((a, b) => b.priority - a.priority);
  }, [state.recommendations]);

  // === PRIME BRAIN INTELLIGENCE LOOP ===
  
  useEffect(() => {
    if (!state.isActive) return;

    const intelligenceLoop = setInterval(() => {
      // Analyze current state and generate recommendations
      const health = getSystemHealth();
      const trend = getPerformanceTrend();
      
      // Generate intelligent recommendations based on current state
      if (health < 0.5 && state.recommendations.length === 0) {
        addRecommendation({
          id: `health-${Date.now()}`,
          type: 'performance',
          priority: 8,
          message: 'System performance degraded. Consider adjusting buffer size or sample rate.'
        });
      }
      
      if (trend === 'declining') {
        addRecommendation({
          id: `trend-${Date.now()}`,
          type: 'performance',
          priority: 6,
          message: 'Performance trend declining. Prime Brain suggests optimization review.'
        });
      }
      
      // Auto-adjust mode based on activity
      if (state.audioMetrics && state.harmonicData && state.mode === 'passive') {
        setMode('active');
      }
      
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(intelligenceLoop);
  }, [state.isActive, state.audioMetrics, state.harmonicData, state.mode, getSystemHealth, getPerformanceTrend, addRecommendation, setMode, state.recommendations.length]);

  const contextValue: PrimeBrainContextType = {
    state,
    activatePrimeBrain,
    deactivatePrimeBrain,
    setMode,
    updateAudioMetrics,
    updateHarmonicData,
    updateAIAnalysis,
    updateVisualizationData,
    updateSystemStatus,
    addRecommendation,
    removeRecommendation,
    recordUserAction,
    getPerformanceTrend,
    getCurrentKey,
    getSystemHealth,
    getRecommendations
  };

  return (
    <PrimeBrainContext.Provider value={contextValue}>
      {children}
    </PrimeBrainContext.Provider>
  );
};

// === HOOK ===

export const usePrimeBrain = () => {
  const context = useContext(PrimeBrainContext);
  if (!context) {
    throw new Error('usePrimeBrain must be used within a PrimeBrainProvider');
  }
  return context;
};

export default PrimeBrainContext;