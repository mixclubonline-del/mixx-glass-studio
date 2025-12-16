/**
 * TransportDomain - Playback, timeline, and tempo management
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface TransportState {
  isPlaying: boolean;
  isPaused: boolean;
  isRecording: boolean;
  playheadPosition: number; // in seconds
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  tempo: number; // BPM
  timeSignature: [number, number]; // [beats, noteValue] e.g., [4, 4]
  currentBeat: number;
  currentBar: number;
}

export interface TransportActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleRecord: () => void;
  seek: (position: number) => void;
  setTempo: (bpm: number) => void;
  setTimeSignature: (beats: number, noteValue: number) => void;
  setLoop: (start: number, end: number) => void;
  toggleLoop: () => void;
}

export interface TransportDomainContextType extends TransportState, TransportActions {}

// ============================================================================
// Context
// ============================================================================

const TransportDomainContext = createContext<TransportDomainContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useTransport(): TransportDomainContextType {
  const context = useContext(TransportDomainContext);
  if (!context) {
    throw new Error('useTransport must be used within TransportDomainProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface TransportDomainProviderProps {
  children: ReactNode;
  audioContext?: AudioContext | null;
}

export function TransportDomainProvider({ children, audioContext }: TransportDomainProviderProps) {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [tempo, setTempoState] = useState(120);
  const [timeSignature, setTimeSignatureState] = useState<[number, number]>([4, 4]);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentBar, setCurrentBar] = useState(1);

  // Refs for animation frame
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Play
  const play = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
    if (audioContext) {
      startTimeRef.current = audioContext.currentTime - playheadPosition;
    }
  }, [audioContext, playheadPosition]);

  // Pause
  const pause = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Stop
  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setPlayheadPosition(0);
    setCurrentBeat(1);
    setCurrentBar(1);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Toggle record
  const toggleRecord = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  // Seek
  const seek = useCallback((position: number) => {
    setPlayheadPosition(Math.max(0, position));
    if (audioContext && isPlaying) {
      startTimeRef.current = audioContext.currentTime - position;
    }
  }, [audioContext, isPlaying]);

  // Set tempo
  const setTempo = useCallback((bpm: number) => {
    setTempoState(Math.max(20, Math.min(300, bpm)));
  }, []);

  // Set time signature
  const setTimeSignature = useCallback((beats: number, noteValue: number) => {
    setTimeSignatureState([beats, noteValue]);
  }, []);

  // Set loop
  const setLoop = useCallback((start: number, end: number) => {
    setLoopStart(start);
    setLoopEnd(end);
  }, []);

  // Toggle loop
  const toggleLoop = useCallback(() => {
    setLoopEnabled(prev => !prev);
  }, []);

  // Context value
  const contextValue: TransportDomainContextType = {
    // State
    isPlaying,
    isPaused,
    isRecording,
    playheadPosition,
    loopStart,
    loopEnd,
    loopEnabled,
    tempo,
    timeSignature,
    currentBeat,
    currentBar,
    
    // Actions
    play,
    pause,
    stop,
    toggleRecord,
    seek,
    setTempo,
    setTimeSignature,
    setLoop,
    toggleLoop,
  };

  return (
    <TransportDomainContext.Provider value={contextValue}>
      {children}
    </TransportDomainContext.Provider>
  );
}

export default TransportDomainProvider;
