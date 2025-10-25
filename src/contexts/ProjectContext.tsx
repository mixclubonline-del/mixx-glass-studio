/**
 * Project Context - Global state synchronization for entire studio
 * Single source of truth for BPM, Key, Transport, and AudioEngine
 * Routes transport control through Prime Brain (Master Clock)
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AudioEngine } from '@/audio/AudioEngine';
import { StudioEngine, createStudioEngine } from '@/studio/core';
import { primeBrain } from '@/ai/primeBrain';
import { regionPlaybackEngine } from '@/audio/RegionPlaybackEngine';

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
  studioEngine: StudioEngine;
  
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
  
  // Studio Engine wraps AudioEngine with enhanced features
  const studioEngineRef = useRef<StudioEngine>(createStudioEngine(audioEngine));
  const studioEngine = studioEngineRef.current;
  
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
    studioEngine.setBPM(newBpm);
  }, [studioEngine]);
  
  // Transport controls - Route through Prime Brain (drives RegionPlaybackEngine via subscription)
  const play = useCallback(async (fromTime?: number) => {
    // Resume AudioContext ONCE at transport start
    if (regionPlaybackEngine.audioContext.state === 'suspended') {
      await regionPlaybackEngine.audioContext.resume();
    }
    
    primeBrain.start(fromTime);
    studioEngine.play(fromTime);
    setTransport(prev => ({ ...prev, isPlaying: true }));
  }, [studioEngine]);
  
  const pause = useCallback(() => {
    primeBrain.pause();
    regionPlaybackEngine.stopAll();
    studioEngine.pause();
    setTransport(prev => ({ ...prev, isPlaying: false }));
  }, [studioEngine]);
  
  const stop = useCallback(() => {
    primeBrain.stop();
    regionPlaybackEngine.stopAll();
    studioEngine.stop();
    setTransport(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, [studioEngine]);
  
  const seek = useCallback((time: number) => {
    primeBrain.seek(time);
    regionPlaybackEngine.seek(time);
    studioEngine.seek(time);
    setTransport(prev => ({ ...prev, currentTime: time }));
  }, [studioEngine]);
  
  const toggleLoop = useCallback(() => {
    studioEngine.toggleLoop();
    primeBrain.setLoop(audioEngine.loopEnabled, audioEngine.loopStart, audioEngine.loopEnd);
    setTransport(prev => ({ ...prev, loopEnabled: audioEngine.loopEnabled }));
  }, [studioEngine, audioEngine]);
  
  const setLoopRange = useCallback((start: number, end: number) => {
    studioEngine.setLoopRange(start, end);
    primeBrain.setLoop(true, start, end);
    setTransport(prev => ({ ...prev, loopStart: start, loopEnd: end }));
  }, [studioEngine]);
  
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
    regionPlaybackEngine.setMasterVolume(volume);
  }, [audioEngine]);
  
  // Update current time during playback using Prime Brain clock (SINGLE SOURCE OF TRUTH)
  useEffect(() => {
    const unsubscribe = primeBrain.subscribe((time) => {
      // Update transport state
      setTransport(prev => ({ ...prev, currentTime: time }));
      
      // Sync timeline store for UI display
      const { setCurrentTime } = require('@/store/timelineStore').useTimelineStore.getState();
      setCurrentTime(time);
      
      // Drive region playback with sample-accurate time
      const samples = Math.round(time * regionPlaybackEngine.audioContext.sampleRate);
      regionPlaybackEngine.update(samples);
    });
    
    return unsubscribe;
  }, []);
  
  // Initialize audio engine settings
  useEffect(() => {
    audioEngine.bpm = bpm;
    audioEngine.timeSignature = timeSignature;
    audioEngine.setMasterGain(masterVolume);
    regionPlaybackEngine.setMasterVolume(masterVolume);
    
    return () => {
      // Cleanup on unmount
      regionPlaybackEngine.stopAll();
    };
  }, [audioEngine, bpm, timeSignature, masterVolume]);
  
  const value: ProjectContextValue = {
    audioEngine,
    studioEngine,
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

export const useStudioEngine = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useStudioEngine must be used within ProjectProvider');
  return context.studioEngine;
};
