/**
 * Project Context - Global state synchronization for entire studio
 * Single source of truth for BPM, Key, Transport, and AudioEngine
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AudioEngine } from '@/audio/AudioEngine';

interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
}

interface ProjectContextValue {
  // Audio Engine
  audioEngine: AudioEngine;
  
  // Project Settings
  bpm: number;
  setBpm: (bpm: number) => void;
  key: string;
  setKey: (key: string) => void;
  timeSignature: { numerator: number; denominator: number };
  setTimeSignature: (sig: { numerator: number; denominator: number }) => void;
  
  // Transport
  transport: TransportState;
  play: (fromTime?: number) => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  toggleLoop: () => void;
  setLoopRange: (start: number, end: number) => void;
  toggleRecord: () => void;
  prevBar: () => void;
  nextBar: () => void;
  
  // Position
  getBarPosition: () => { bar: number; beat: number; tick: number };
  
  // Master
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Audio Engine instance (singleton)
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const audioEngine = audioEngineRef.current;
  
  // Project Settings
  const [bpm, setBpmState] = useState(120);
  const [key, setKey] = useState('C Major');
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [masterVolume, setMasterVolumeState] = useState(0.75);
  
  // Transport State
  const [transport, setTransport] = useState<TransportState>({
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    loopEnabled: false,
    loopStart: 0,
    loopEnd: 0,
  });
  
  // Update audio engine when BPM changes
  const setBpm = useCallback((newBpm: number) => {
    setBpmState(newBpm);
    audioEngine.bpm = newBpm;
  }, [audioEngine]);
  
  // Transport controls
  const play = useCallback((fromTime?: number) => {
    audioEngine.play(fromTime);
    setTransport(prev => ({ ...prev, isPlaying: true }));
  }, [audioEngine]);
  
  const pause = useCallback(() => {
    audioEngine.pause();
    setTransport(prev => ({ ...prev, isPlaying: false }));
  }, [audioEngine]);
  
  const stop = useCallback(() => {
    audioEngine.stop();
    setTransport(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, [audioEngine]);
  
  const seek = useCallback((time: number) => {
    audioEngine.seek(time);
    setTransport(prev => ({ ...prev, currentTime: time }));
  }, [audioEngine]);
  
  const toggleLoop = useCallback(() => {
    audioEngine.loopEnabled = !audioEngine.loopEnabled;
    setTransport(prev => ({ ...prev, loopEnabled: audioEngine.loopEnabled }));
  }, [audioEngine]);
  
  const setLoopRange = useCallback((start: number, end: number) => {
    audioEngine.loopStart = start;
    audioEngine.loopEnd = end;
    setTransport(prev => ({ ...prev, loopStart: start, loopEnd: end }));
  }, [audioEngine]);
  
  const toggleRecord = useCallback(() => {
    setTransport(prev => ({ ...prev, isRecording: !prev.isRecording }));
  }, []);
  
  const prevBar = useCallback(() => {
    const currentBar = audioEngine.timeToBarsBeatsTicks(transport.currentTime);
    const prevBarTime = audioEngine.barsBeatTicksToTime(Math.max(1, currentBar.bar - 1), 1, 0);
    seek(prevBarTime);
  }, [audioEngine, transport.currentTime, seek]);
  
  const nextBar = useCallback(() => {
    const currentBar = audioEngine.timeToBarsBeatsTicks(transport.currentTime);
    const nextBarTime = audioEngine.barsBeatTicksToTime(currentBar.bar + 1, 1, 0);
    seek(nextBarTime);
  }, [audioEngine, transport.currentTime, seek]);
  
  const getBarPosition = useCallback(() => {
    return audioEngine.timeToBarsBeatsTicks(transport.currentTime);
  }, [audioEngine, transport.currentTime]);
  
  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    audioEngine.setMasterGain(volume);
  }, [audioEngine]);
  
  // Update current time during playback
  useEffect(() => {
    if (!transport.isPlaying) return;
    
    const intervalId = setInterval(() => {
      const currentTime = audioEngine.getCurrentTime();
      setTransport(prev => ({ ...prev, currentTime }));
    }, 50); // Update every 50ms
    
    return () => clearInterval(intervalId);
  }, [transport.isPlaying, audioEngine]);
  
  // Initialize audio engine settings
  useEffect(() => {
    audioEngine.bpm = bpm;
    audioEngine.timeSignature = timeSignature;
    audioEngine.setMasterGain(masterVolume);
  }, [audioEngine, bpm, timeSignature, masterVolume]);
  
  const value: ProjectContextValue = {
    audioEngine,
    bpm,
    setBpm,
    key,
    setKey,
    timeSignature,
    setTimeSignature,
    transport,
    play,
    pause,
    stop,
    seek,
    toggleLoop,
    setLoopRange,
    toggleRecord,
    prevBar,
    nextBar,
    getBarPosition,
    masterVolume,
    setMasterVolume,
  };
  
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

// Hooks
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
};

export const useTransport = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useTransport must be used within ProjectProvider');
  return {
    transport: context.transport,
    play: context.play,
    pause: context.pause,
    stop: context.stop,
    seek: context.seek,
    toggleLoop: context.toggleLoop,
    setLoopRange: context.setLoopRange,
    toggleRecord: context.toggleRecord,
    prevBar: context.prevBar,
    nextBar: context.nextBar,
    getBarPosition: context.getBarPosition,
  };
};

export const useAudioEngine = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useAudioEngine must be used within ProjectProvider');
  return context.audioEngine;
};
