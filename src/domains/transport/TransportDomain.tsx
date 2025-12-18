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
  currentTime: number; // in seconds
  loopStart: number;
  loopEnd: number;
  isLooping: boolean;
  bpm: number;
  timeSignature: [number, number]; // [beats, noteValue] e.g., [4, 4]
  currentBeat: number;
  currentBar: number;
}

export interface TransportActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  toggleRecord: () => void;
  seek: (position: number) => void;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setBpm: (bpm: number | ((prev: number) => number)) => void;
  setTimeSignature: (beats: number, noteValue: number) => void;
  setLoop: (start: number, end: number) => void;
  setIsLooping: (looping: boolean | ((prev: boolean) => boolean)) => void;
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
  const [isPlaying, setIsPlayingState] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [isLooping, setIsLoopingState] = useState(false);
  const [bpm, setBpmState] = useState(120);
  const [timeSignature, setTimeSignatureState] = useState<[number, number]>([4, 4]);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentBar, setCurrentBar] = useState(1);

  // Refs for animation frame
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Play
  const play = useCallback(() => {
    setIsPlayingState(true);
    setIsPaused(false);
    if (audioContext) {
      startTimeRef.current = audioContext.currentTime - currentTime;
    }
  }, [audioContext, currentTime]);

  // Pause
  const pause = useCallback(() => {
    setIsPlayingState(false);
    setIsPaused(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Stop
  const setIsPlaying = useCallback((playing: boolean | ((prev: boolean) => boolean)) => {
    setIsPlayingState(playing);
  }, []);

  const stop = useCallback(() => {
    setIsPlayingState(false);
    setIsPaused(false);
    setCurrentTimeState(0);
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
    setCurrentTimeState(Math.max(0, position));
    if (audioContext && isPlaying) {
      startTimeRef.current = audioContext.currentTime - position;
    }
  }, [audioContext, isPlaying]);

  const setCurrentTime = useCallback((time: number | ((prev: number) => number)) => {
    setCurrentTimeState(time);
  }, []);

  const setBpm = useCallback((bpm: number | ((prev: number) => number)) => {
    if (typeof bpm === 'function') {
      setBpmState(prev => {
        const next = bpm(prev);
        return Math.max(20, Math.min(300, next));
      });
    } else {
      setBpmState(Math.max(20, Math.min(300, bpm)));
    }
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
  const setIsLooping = useCallback((looping: boolean | ((prev: boolean) => boolean)) => {
    setIsLoopingState(looping);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLoopingState(prev => !prev);
  }, []);

  // Context value
  const contextValue: TransportDomainContextType = {
    // State
    isPlaying,
    isPaused,
    isRecording,
    currentTime,
    loopStart,
    loopEnd,
    isLooping,
    bpm,
    timeSignature,
    currentBeat,
    currentBar,
    
    // Actions
    play,
    pause,
    stop,
    setIsPlaying,
    toggleRecord,
    seek,
    setCurrentTime,
    setBpm,
    setTimeSignature,
    setLoop,
    setIsLooping,
    toggleLoop,
  };

  return (
    <TransportDomainContext.Provider value={contextValue}>
      {children}
    </TransportDomainContext.Provider>
  );
}

export default TransportDomainProvider;
