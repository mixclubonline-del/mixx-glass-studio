/**
 * AudioDomain - Centralized audio context and master chain management
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useRef, useState, useCallback, ReactNode, useEffect } from 'react';
import { createSignalMatrix } from '../../audio/SignalMatrix';
import { buildMasterChain, VelvetMasterChain } from '../../audio/masterChain';
import { VelvetLoudnessMeter, DEFAULT_VELVET_LOUDNESS_METRICS } from '../../audio/VelvetLoudnessMeter';
import type { VelvetLoudnessMetrics } from '../../audio/VelvetLoudnessMeter';
import { TranslationMatrix, type TranslationProfileKey } from '../../audio/TranslationMatrix';
import { rustMasterBridge } from '../../audio/RustMasterBridge';
import StemSeparationIntegration from '../../audio/StemSeparationIntegration';
import { PLUGIN_CATALOG } from '../../audio/pluginCatalog';
import { getPluginRegistry, PluginId } from '../../audio/plugins';
import { 
  TRACK_ANALYSER_FFT, 
  MASTER_ANALYSER_SMOOTHING, 
  MIN_DECIBELS, 
  MAX_DECIBELS,
  ensureMasterMeterBuffers,
  MasterMeterBuffers
} from './metering';

// ============================================================================
// Types
// ============================================================================

export interface AudioDomainState {
  // Core audio context
  audioContext: AudioContext | null;
  isAudioReady: boolean;
  sampleRate: number;
  
  // Master chain & Analysis
  masterNodes: VelvetMasterChain | null;
  signalMatrix: ReturnType<typeof createSignalMatrix> | null;
  loudnessMetrics: VelvetLoudnessMetrics;
  masterVolume: number;
  translationProfile: TranslationProfileKey;
  
  // Progress/Status
  masterReady: boolean;
  importMessage: string | null;
}

export interface AudioDomainActions {
  // Audio context management
  initializeAudio: () => Promise<void>;
  closeAudio: () => Promise<void>;
  
  // Master controls
  setMasterVolume: (volume: number) => void;
  recalibrateMaster: () => void;
  setTranslationProfile: (profile: TranslationProfileKey) => void;
  
  // Getters (for components that need refs or current values)
  getAudioContext: () => AudioContext | null;
  getContext: () => AudioContext | null;
  getSignalMatrix: () => ReturnType<typeof createSignalMatrix> | null;
  getMasterNodes: () => VelvetMasterChain | null;
  getTranslationMatrix: () => TranslationMatrix | null;
  getStemIntegration: () => StemSeparationIntegration | null;
  
  // Progress setters
  setImportMessage: (msg: string | null) => void;
  
  // Utilities
  analyzeAudioBuffer: (buffer: AudioBuffer) => Promise<{ rms: number; peak: number; level: number; transient: boolean; waveform: number[] }>;
}

export interface AudioDomainContextType extends AudioDomainState, AudioDomainActions {}

// ============================================================================
// Context
// ============================================================================

const AudioDomainContext = createContext<AudioDomainContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useAudioDomain(): AudioDomainContextType {
  const context = useContext(AudioDomainContext);
  if (!context) {
    throw new Error('useAudioDomain must be used within AudioDomainProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface AudioDomainProviderProps {
  children: ReactNode;
}

export function AudioDomainProvider({ children }: AudioDomainProviderProps) {
  // Refs for audio bridge components
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterNodesRef = useRef<VelvetMasterChain | null>(null);
  const signalMatrixRef = useRef<ReturnType<typeof createSignalMatrix> | null>(null);
  const translationMatrixRef = useRef<TranslationMatrix | null>(null);
  const velvetLoudnessMeterRef = useRef<VelvetLoudnessMeter | null>(null);
  const stemIntegrationRef = useRef<StemSeparationIntegration | null>(null);
  const masterMeterBufferRef = useRef<MasterMeterBuffers | null>(null);
  const loudnessListenerRef = useRef<((event: Event) => void) | null>(null);
  
  // State
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [masterReady, setMasterReady] = useState(false);
  const [sampleRate, setSampleRate] = useState(48000);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [translationProfile, setTranslationProfileState] = useState<TranslationProfileKey>('flat');
  const [loudnessMetrics, setLoudnessMetrics] = useState<VelvetLoudnessMetrics>(DEFAULT_VELVET_LOUDNESS_METRICS);
  const [importMessage, setImportMessageState] = useState<string | null>(null);

  // Audio setup function migrated from App.tsx
  const initializeAudio = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      return;
    }

    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;
    setSampleRate(ctx.sampleRate);

    try {
      // 1. Build Master Chain
      const masterChain = await buildMasterChain(ctx);
      masterNodesRef.current = masterChain;
      
      // Initialize Rust Backend Master Chain
      const profile = masterChain.getProfile();
      rustMasterBridge.initialize(ctx.sampleRate, profile.name);

      // 2. Initialize Signal Matrix
      signalMatrixRef.current = createSignalMatrix(ctx, masterChain.input);

      // 3. Setup Translation Matrix
      const translationMatrix = new TranslationMatrix(ctx);
      translationMatrix.attach(masterChain.output, ctx.destination);
      translationMatrixRef.current = translationMatrix;

      // 4. Setup Master Analyser
      const masterAnalyser = masterChain.analyser;
      masterAnalyser.fftSize = TRACK_ANALYSER_FFT;
      masterAnalyser.smoothingTimeConstant = MASTER_ANALYSER_SMOOTHING;
      masterAnalyser.minDecibels = MIN_DECIBELS;
      masterAnalyser.maxDecibels = MAX_DECIBELS;

      if (typeof window !== 'undefined') {
        (window as any).__mixx_masterAnalyser = masterAnalyser;
        (window as any).__mixx_masterChain = {
          targetLUFS: profile.targetLUFS,
          profile: profile.name.toLowerCase().replace(/\s+/g, '-'),
          calibrated: true,
          masterVolume: masterVolume,
        };
      }

      masterMeterBufferRef.current = ensureMasterMeterBuffers(
        masterMeterBufferRef.current,
        masterAnalyser
      );

      // 5. Setup Loudness Meter
      if (velvetLoudnessMeterRef.current && loudnessListenerRef.current) {
        velvetLoudnessMeterRef.current.removeEventListener(
          "metrics",
          loudnessListenerRef.current as EventListener
        );
      }
      
      const meter = new VelvetLoudnessMeter();
      velvetLoudnessMeterRef.current = meter;
      await meter.initialize(ctx);
      meter.reset();
      
      const handler = (event: Event) => {
        const metricsEvent = event as CustomEvent<VelvetLoudnessMetrics>;
        if (metricsEvent.detail) {
          setLoudnessMetrics(metricsEvent.detail);
        }
      };
      meter.addEventListener('metrics', handler as EventListener);
      loudnessListenerRef.current = handler;

      // Wire meter into master chain tapping points
      const complianceTap = masterChain.complianceTap;
      const softLimiterNode = masterChain.softLimiter;
      const meterNode = meter.getNode();
      
      if (meterNode) {
        complianceTap.connect(meterNode as AudioNode);
        (meterNode as AudioNode).connect(softLimiterNode);
      } else {
        complianceTap.connect(softLimiterNode);
      }

      // 6. Apply initial translation profile
      translationMatrix.activate(translationProfile);

      // 7. Setup Stem Integration
      const stemIntegration = new StemSeparationIntegration(ctx);
      stemIntegrationRef.current = stemIntegration;
      try {
        stemIntegration.prewarm();
      } catch (err) {
        console.warn('[AUDIO] Stem prewarm not available', err);
      }

      setIsAudioReady(true);
      setMasterReady(true);
      console.log('[AudioDomain] ✅ Audio context and orchestration initialized');
    } catch (err) {
      console.error('[AudioDomain] ❌ Failed to initialize audio:', err);
      throw err;
    }
  }, [masterVolume]);

  const closeAudio = useCallback(async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
      masterNodesRef.current = null;
      signalMatrixRef.current = null;
      translationMatrixRef.current = null;
      
      if (velvetLoudnessMeterRef.current && loudnessListenerRef.current) {
        velvetLoudnessMeterRef.current.removeEventListener('metrics', loudnessListenerRef.current);
      }
      velvetLoudnessMeterRef.current = null;
      setIsAudioReady(false);
      setMasterReady(false);
    }
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    if (masterNodesRef.current) {
      masterNodesRef.current.setMasterTrim(volume);
    }
  }, []);

  const recalibrateMaster = useCallback(() => {
    if (masterNodesRef.current) {
      const profile = masterNodesRef.current.getProfile();
      masterNodesRef.current.setProfile(profile);
    }
  }, []);

  const setTranslationProfile = useCallback((profile: TranslationProfileKey) => {
    setTranslationProfileState(profile);
    if (translationMatrixRef.current) {
      translationMatrixRef.current.activate(profile);
    }
  }, []);

  const getAudioContext = useCallback(() => audioContextRef.current, []);
  const getSignalMatrix = useCallback(() => signalMatrixRef.current, []);
  const getMasterNodes = useCallback(() => masterNodesRef.current, []);
  const getTranslationMatrix = useCallback(() => translationMatrixRef.current, []);
  const getStemIntegration = useCallback(() => stemIntegrationRef.current, []);
  
  const setImportMessage = useCallback((msg: string | null) => {
    setImportMessageState(msg);
  }, []);

  const getContext = useCallback(() => audioContextRef.current, []);

  const analyzeAudioBuffer = useCallback(async (buffer: AudioBuffer) => {
    let peak = 0;
    let sumSquares = 0;
    const timeDomain = buffer.getChannelData(0);
    
    for (let i = 0; i < timeDomain.length; i++) {
        const sample = timeDomain[i];
        const absolute = Math.abs(sample);
        if (absolute > peak) peak = absolute;
        sumSquares += sample * sample;
    }
    
    const rms = Math.sqrt(sumSquares / timeDomain.length);
    
    // Basic waveform for visualization
    const waveform: number[] = [];
    const step = Math.floor(timeDomain.length / 100);
    for (let i = 0; i < 100; i++) {
        waveform.push(timeDomain[i * step] || 0);
    }

    return {
        rms,
        peak,
        level: rms,
        transient: peak > rms * 4, // Simple heuristic
        waveform
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeAudio();
    };
  }, [closeAudio]);

  const value: AudioDomainContextType = {
    audioContext: audioContextRef.current,
    isAudioReady,
    masterReady,
    sampleRate,
    masterNodes: masterNodesRef.current,
    signalMatrix: signalMatrixRef.current,
    loudnessMetrics,
    masterVolume,
    translationProfile,
    importMessage,
    
    initializeAudio,
    closeAudio,
    setMasterVolume,
    recalibrateMaster,
    setTranslationProfile,
    getAudioContext,
    getContext,
    getSignalMatrix,
    getMasterNodes,
    getTranslationMatrix,
    getStemIntegration,
    setImportMessage,
    analyzeAudioBuffer,
  };

  return (
    <AudioDomainContext.Provider value={value}>
      {children}
    </AudioDomainContext.Provider>
  );
}

export default AudioDomainProvider;
