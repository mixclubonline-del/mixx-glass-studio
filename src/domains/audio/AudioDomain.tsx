/**
 * AudioDomain - Centralized audio context and master chain management
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { createSignalMatrix } from '../../audio/SignalMatrix';

// ============================================================================
// Types
// ============================================================================

export interface MasterNodes {
  input: GainNode;
  compressor: DynamicsCompressorNode;
  limiter: DynamicsCompressorNode;
  meter: AnalyserNode;
  output: GainNode;
}

export interface AudioDomainState {
  // Core audio context
  audioContext: AudioContext | null;
  isAudioReady: boolean;
  sampleRate: number;
  
  // Master chain
  masterNodes: MasterNodes | null;
  signalMatrix: ReturnType<typeof createSignalMatrix> | null;
  masterVolume: number;
  masterMuted: boolean;
}

export interface AudioDomainActions {
  // Audio context management
  initializeAudio: () => Promise<AudioContext>;
  closeAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  
  // Master controls
  setMasterVolume: (volume: number) => void;
  setMasterMuted: (muted: boolean) => void;
  
  // Getters (for components that need refs)
  getAudioContext: () => AudioContext | null;
  getSignalMatrix: () => ReturnType<typeof createSignalMatrix> | null;
  getMasterNodes: () => MasterNodes | null;
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
  // Refs (not state - don't trigger re-renders)
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterNodesRef = useRef<MasterNodes | null>(null);
  const signalMatrixRef = useRef<ReturnType<typeof createSignalMatrix> | null>(null);
  
  // State (triggers re-renders for UI updates)
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [sampleRate, setSampleRate] = useState(48000);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [masterMuted, setMasterMutedState] = useState(false);

  // Initialize audio context and master chain
  const initializeAudio = useCallback(async (): Promise<AudioContext> => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      return audioContextRef.current;
    }

    // Create audio context
    const ctx = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = ctx;
    setSampleRate(ctx.sampleRate);

    // Create master nodes
    const input = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const limiter = ctx.createDynamicsCompressor();
    const meter = ctx.createAnalyser();
    const output = ctx.createGain();

    // Configure compressor
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Configure limiter
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;

    // Configure meter
    meter.fftSize = 2048;

    // Chain: input -> compressor -> limiter -> meter -> output -> destination
    input.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(meter);
    meter.connect(output);
    output.connect(ctx.destination);

    masterNodesRef.current = { input, compressor, limiter, meter, output };

    // Create signal matrix
    signalMatrixRef.current = createSignalMatrix(ctx, input);

    setIsAudioReady(true);
    return ctx;
  }, []);

  // Close audio context
  const closeAudio = useCallback(async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
      masterNodesRef.current = null;
      signalMatrixRef.current = null;
      setIsAudioReady(false);
    }
  }, []);

  // Resume audio context (after user gesture)
  const resumeAudio = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    if (masterNodesRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      masterNodesRef.current.output.gain.setTargetAtTime(volume, now, 0.01);
    }
  }, []);

  // Set master muted
  const setMasterMuted = useCallback((muted: boolean) => {
    setMasterMutedState(muted);
    if (masterNodesRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      masterNodesRef.current.output.gain.setTargetAtTime(muted ? 0 : masterVolume, now, 0.01);
    }
  }, [masterVolume]);

  // Getters for ref access
  const getAudioContext = useCallback(() => audioContextRef.current, []);
  const getSignalMatrix = useCallback(() => signalMatrixRef.current, []);
  const getMasterNodes = useCallback(() => masterNodesRef.current, []);

  // Context value
  const contextValue: AudioDomainContextType = {
    // State
    audioContext: audioContextRef.current,
    isAudioReady,
    sampleRate,
    masterNodes: masterNodesRef.current,
    signalMatrix: signalMatrixRef.current,
    masterVolume,
    masterMuted,
    
    // Actions
    initializeAudio,
    closeAudio,
    resumeAudio,
    setMasterVolume,
    setMasterMuted,
    getAudioContext,
    getSignalMatrix,
    getMasterNodes,
  };

  return (
    <AudioDomainContext.Provider value={contextValue}>
      {children}
    </AudioDomainContext.Provider>
  );
}

export default AudioDomainProvider;
