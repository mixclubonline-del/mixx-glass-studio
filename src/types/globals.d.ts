/**
 * Mixx Club Studio — Global Type Definitions
 * 
 * Central registry for all window globals used by the Flow Studio engine.
 * Consolidating these here prevents TS2320 (Subsequent property declarations must have the same type).
 */

import { TakeMemory } from '../core/performance/takeMemory';

declare global {
  interface Window {
    // Session State (Flow Loop)
    __mixx_playbackState?: {
      playing: boolean;
      looping: boolean;
      playCount?: number;
      cursor?: number;
      regionStart?: number;
      regionEnd?: number;
      bar?: number;
      bpm?: number;
      beatsPerMinute?: number;
      position?: number;
      regionLength?: number;
      cursorLock?: boolean;
    };
    
    __mixx_compBrain?: any[];
    
    __mixx_autoPunch?: {
      start: number;
      end: number;
      duration: number;
      confidence: number;
    };
    
    __mixx_recordTaps?: Array<{ ts: number }>;
    __mixx_loopEvents?: Array<{ type: string; timestamp: number }>;
    __quantum_scheduler_traces?: any[];
    
    __mixx_recordState?: {
      recording: boolean;
      armedTrack: boolean;
      noiseFloor: number;
      threshold?: number;
      hush?: boolean;
      recordStart?: number;
      lastBreathMs?: number;
    };

    // Events (Interaction Logging)
    __mixx_editEvents?: Array<{ distance: number; timestamp: number }>;
    __mixx_toolSwitches?: Array<{ tool: string; timestamp: number }>;
    __mixx_zoomEvents?: Array<{ delta: number; pos: number; timestamp: number }>;
    __mixx_viewSwitches?: Array<{ view: string; timestamp: number }>;
    
    // Core Engine Subsystems
    __mixx_masterChain?: {
      targetLUFS: number;
      profile: string;
      calibrated: boolean;
      masterVolume: number;
    };
    
    __mixx_takeMemory?: Array<TakeMemory>;
    
    __mixx_punchHistory?: Array<{
      ts: number;
      cursor: number;
      duration?: number;
      type?: string;
    }>;

    // ALS / Hardware Bridge
    __alsMessages?: any[];
    __als?: {
      temperature: 'cold' | 'warm' | 'hot' | string;
      momentum: number;
      pressure: number;
      harmony: number;
      guidance: string;
      flow: number;
      pulse: number;
      midiAccess?: MIDIAccess;
    };

    // Prime Brain / Infrastructure
    __primeBrainInstance?: {
      state?: {
        flow?: number;
        suggestionId?: string;
      };
    };
    
    // Quantum Scheduler
    __mixx_schedulerState?: {
      isStarved: boolean;
      lastProcessTime: number;
    };

    // Flow Import / Export & Session
    __flow_lastImport?: {
      stems: Record<string, AudioBuffer | null>;
      metadata: any; // Using any to avoid circular dependency with StemMetadata
      info: {
        sampleRate: number;
        channels: number;
        duration: number;
        length: number;
        format?: string;
      };
    };
    
    __bloom_ready?: boolean;
    
    __mixx_session?: {
      addTrack: (config: any) => { id: string }; // Using any to avoid TrackConfig circular deps
      addClip: (config: {
        trackId: string;
        buffer: AudioBuffer;
        start: number;
        metadata: any;
      }) => void;
    };

    __mixx_stem_separation_exporter?: {
        enabled: boolean;
        exportSnapshot: (snapshot: any) => void;
    };
  }
}

export {};
