/**
 * Flow File Input Component
 * 
 * The official Flow import handler that orchestrates the entire stem separation pipeline.
 * 
 * Flow breathes in the file → Flow transforms it → Flow places it exactly where it belongs.
 * 
 * Pipeline:
 * 1. prepAudio → normalize and prepare
 * 2. classify → determine file type
 * 3. stemSplit → separate stems
 * 4. analyze → detect BPM/key
 * 5. assembleMetadata → create unified metadata
 * 6. buildTracks → create track lanes
 * 7. loadIntoFlow → wake ALS + Prime Brain
 */

import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { runFlowStemPipeline } from '../../core/import/stemPipeline';
import { useTimelineStore } from '../../state/timelineStore';
import type { StemMetadata } from '../../core/import/metadata';
import { computeFlowPulse } from '../../core/pulse/flowPulseEngine';
import { syncALSToPulseResult, syncALSToPulse, updateGlobalALS } from '../../core/als/alsSync';
import { hasAudioPlaying } from '../../core/loop/audioLevelDetector';
import { ImportInspector, type ImportStep } from './ImportInspector';
import type { FlowPulseResult } from '../../core/pulse/flowPulseEngine';
import type { StemResult } from '../../core/import/stemEngine';
import { als } from '../../utils/alsFeedback';

export interface TrackConfig {
  name: string;
  type: 'vocal' | 'instrument' | 'drum' | 'other';
  buffer: AudioBuffer;
  metadata: StemMetadata;
  readyForPunch: boolean;
  readyForComp: boolean;
  color: string;
}

// Window interface extensions moved to src/types/globals.d.ts

interface FileInputProps {
  onImportComplete?: (result: {
    tracks: TrackConfig[];
    metadata: StemMetadata;
    stems?: StemResult;
    audioBuffers?: Record<string, AudioBuffer>;
  }) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  'aria-label'?: string;
}

export interface FileInputHandle {
  click: () => void;
}

export const FileInput = forwardRef<FileInputHandle, FileInputProps>(({
  onImportComplete,
  accept = 'audio/*',
  multiple = false,
  className,
  'aria-label': ariaLabel = 'Load audio or project file',
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [importSteps, setImportSteps] = useState<ImportStep[]>([
    { label: 'Initializing…', hint: 'Flow is preparing to listen.', done: false },
    { label: 'Analyzing audio…', hint: 'Scanning waveform structure.', done: false },
    { label: 'Detecting stems…', hint: 'Separating vocals and instruments.', done: false },
    { label: 'Structuring session…', hint: 'Organizing lanes and roles.', done: false },
    { label: 'Preparing workspace…', hint: 'Optimizing for performance.', done: false },
  ]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [alsFlow, setAlsFlow] = useState(55);
  const [alsTemperature, setAlsTemperature] = useState<'cooling' | 'warming' | 'hot' | 'balanced'>('warming');
  const [primeBrainGuidance, setPrimeBrainGuidance] = useState<string>('Flow is listening…');
  const [flowPulse, setFlowPulse] = useState<FlowPulseResult | null>(null);
  const pulseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useImperativeHandle(ref, () => ({
    click: () => {
      inputRef.current?.click();
    },
  }));
  
  const updateStep = (index: number, updates: Partial<ImportStep>) => {
    setImportSteps(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };
  
  const markStepDone = (index: number) => {
    updateStep(index, { done: true });
    setCurrentPhase(index + 1);
  };
  
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show Import Inspector
    setInspectorVisible(true);
    setCurrentPhase(0);
    setAlsFlow(55);
    setAlsTemperature('warming');
    setPrimeBrainGuidance('Flow is listening…');
    
    // Reset steps
    setImportSteps([
      { label: 'Initializing…', hint: 'Flow is preparing to listen.', done: false },
      { label: 'Analyzing audio…', hint: 'Scanning waveform structure.', done: false },
      { label: 'Detecting stems…', hint: 'Separating vocals and instruments.', done: false },
      { label: 'Structuring session…', hint: 'Organizing lanes and roles.', done: false },
      { label: 'Preparing workspace…', hint: 'Optimizing for performance.', done: false },
    ]);
    
    try {
      // Initialize Flow brain globals
      if (typeof window !== 'undefined') {
        (window as any).__als = (window as any).__als || { flow: 0, temperature: 'cooling', guidance: '' };
        (window as any).__primeBrain = (window as any).__primeBrain || { guidance: '' };
        window.__bloom_ready = false;
      }
      
      // Phase 1: Initializing
      markStepDone(0);
      setPrimeBrainGuidance('Flow is preparing to listen.');
      if (typeof window !== 'undefined' && window.__als) {
        window.__als.temperature = 'warming';
        window.__als.flow = 48;
        window.__als.guidance = 'Flow is preparing to listen.';
      }
      if (typeof window !== 'undefined' && (window as any).__primeBrain) {
        (window as any).__primeBrain.guidance = 'Flow is preparing to listen.';
      }
      await new Promise(resolve => setTimeout(resolve, 150)); // Breathing delay
      
      // Phase 2: Prep audio file
      setCurrentPhase(1);
      setPrimeBrainGuidance('Scanning waveform structure.');
      if (typeof window !== 'undefined' && window.__als) {
        window.__als.flow = 54; // 48 + 1 * 6
        window.__als.guidance = 'Scanning waveform structure.';
      }
      if (typeof window !== 'undefined' && (window as any).__primeBrain) {
        (window as any).__primeBrain.guidance = 'Scanning waveform structure.';
      }
      
      // Create AudioContext for import (can be optimized later to reuse App's context)
      const audioContext = new AudioContext();
      
      // FLOW GOLDEN PATH: Run the complete pipeline
      // Set up snapshot export callback if exporter is available
      let snapshotCallback: ((snapshot: any) => void) | undefined;
      if (typeof window !== 'undefined' && (window as any).__mixx_stem_separation_exporter?.enabled) {
        snapshotCallback = (window as any).__mixx_stem_separation_exporter.exportSnapshot;
      }
      
      const result = await runFlowStemPipeline(file, audioContext, snapshotCallback);
      
      markStepDone(1);
      await new Promise(resolve => setTimeout(resolve, 150)); // Breathing delay
      
      // Phase 3: Classify and split
      setCurrentPhase(2);
      setPrimeBrainGuidance('Separating vocals and instruments.');
      setAlsFlow(60); // 48 + 2 * 6
      if (typeof window !== 'undefined' && window.__als) {
        window.__als.flow = 60;
        window.__als.guidance = 'Separating vocals and instruments.';
      }
      if (typeof window !== 'undefined' && (window as any).__primeBrain) {
        (window as any).__primeBrain.guidance = 'Separating vocals and instruments.';
      }
      
      markStepDone(2);
      await new Promise(resolve => setTimeout(resolve, 150)); // Breathing delay
      
      // Phase 4: Analyze and structure
      setCurrentPhase(3);
      setPrimeBrainGuidance('Organizing lanes and roles.');
      setAlsFlow(66); // 48 + 3 * 6
      if (typeof window !== 'undefined' && window.__als) {
        window.__als.flow = 66;
        window.__als.guidance = 'Organizing lanes and roles.';
      }
      if (typeof window !== 'undefined' && (window as any).__primeBrain) {
        (window as any).__primeBrain.guidance = 'Organizing lanes and roles.';
      }
      
      // Get main audio buffer from first stem for Flow Pulse computation
      const mainBuffer = Object.values(result.stems).find(b => b !== null) || result.stems.vocals || result.stems.music;
      
      // Compute Flow Pulse (Layer 5)
      if (mainBuffer) {
        const pulseResult = computeFlowPulse(mainBuffer, result.metadata);
        setFlowPulse(pulseResult);
        
        // Sync ALS to Pulse (Layer 6)
        const initialALS = syncALSToPulseResult(pulseResult, result.metadata);
        const masterAnalyser = (window as any).__mixx_masterAnalyser as AnalyserNode | null;
        const hasAudio = hasAudioPlaying(masterAnalyser);
        updateGlobalALS(initialALS, hasAudio);
        
        // Start pulse animation during import with full ALS sync
        let pulseIndex = 0;
        if (pulseIntervalRef.current) {
          clearInterval(pulseIntervalRef.current);
        }
        pulseIntervalRef.current = setInterval(() => {
          if (pulseResult.pulse.length > 0 && typeof window !== 'undefined') {
            const pulseValue = Math.floor(
              pulseResult.pulse[pulseIndex] + pulseResult.harmonicBoost
            );
            const clampedPulse = Math.min(100, Math.max(0, pulseValue));
            
            // Sync ALS to current pulse value
            const alsSync = syncALSToPulse(
              clampedPulse,
              result.metadata,
              pulseResult.energy,
              pulseResult.harmonicBoost
            );
            const masterAnalyser = (window as any).__mixx_masterAnalyser as AnalyserNode | null;
            const hasAudio = hasAudioPlaying(masterAnalyser);
            updateGlobalALS(alsSync, hasAudio);
            
            pulseIndex = (pulseIndex + 1) % pulseResult.pulse.length;
          }
        }, 30); // Update every 30ms for smooth animation
      }
      
      // Tracks are already hydrated via runFlowStemPipeline
      markStepDone(3);
      await new Promise(resolve => setTimeout(resolve, 150)); // Breathing delay
      
      // Phase 5: Finalize
      setCurrentPhase(4);
      setPrimeBrainGuidance('Optimizing for performance.');
      setAlsFlow(72); // 48 + 4 * 6
      setAlsTemperature('balanced');
      if (typeof window !== 'undefined' && window.__als) {
        window.__als.flow = 72;
        window.__als.temperature = 'balanced';
        window.__als.guidance = 'Optimizing for performance.';
      }
      if (typeof window !== 'undefined' && (window as any).__primeBrain) {
        (window as any).__primeBrain.guidance = 'Optimizing for performance.';
      }
      
      // Load tracks into session (if session API exists)
      if (typeof window !== 'undefined' && window.__mixx_session) {
        const zustandTracks = useTimelineStore.getState().getTracks();
        const zustandClips = useTimelineStore.getState().getClips();
        const zustandBuffers = useTimelineStore.getState().getAudioBuffers();
        
        zustandTracks.forEach(track => {
          const clip = zustandClips.find(c => c.trackId === track.id);
          const buffer = clip ? zustandBuffers[clip.bufferId] : null;
          
          if (buffer && window.__mixx_session) {
            const sessionTrack = window.__mixx_session.addTrack({
              name: track.trackName,
              buffer,
              metadata: result.metadata,
            } as any);
            
            // Auto-insert timeline clip
            window.__mixx_session.addClip({
              trackId: sessionTrack.id,
              buffer,
              start: 0,
              metadata: result.metadata,
            });
          }
        });
      }
      
      // Tell Flow it's loaded
      if (typeof window !== 'undefined') {
        window.__flow_lastImport = {
          stems: result.stems,
          metadata: result.metadata,
          info: {
            sampleRate: result.metadata.sampleRate,
            channels: result.metadata.channels,
            duration: result.metadata.duration,
            length: 0, // Can be computed if needed
            format: result.metadata.format,
          },
        };
      }
      
      // Wake ALS + Prime Brain on import
      const brain = typeof window !== 'undefined' ? window.__primeBrainInstance : null;
      if ((brain as any)?.updateFromImport) {
        (brain as any).updateFromImport(result.metadata);
      }
      
      // Final step
      markStepDone(4);
      setPrimeBrainGuidance('Your arrangement is ready.');
      setAlsFlow(75);
      
      // Final Flow brain update
      if (typeof window !== 'undefined') {
        if ((window as any).__als) {
          (window as any).__als.flow = 75;
          (window as any).__als.temperature = 'balanced';
          (window as any).__als.guidance = 'Your arrangement is ready.';
        }
        if ((window as any).__primeBrain) {
          (window as any).__primeBrain.guidance = 'Your arrangement is ready.';
        }
        // Bloom ready
        (window as any).__bloom_ready = true;
      }
      
      // Wait a moment for user to see completion, then hide inspector
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Stop pulse animation
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      
      // Set final ALS sync values
      if (mainBuffer && typeof window !== 'undefined') {
        const pulseResult = computeFlowPulse(mainBuffer, result.metadata);
        if (pulseResult.pulse.length > 0) {
          const masterAnalyser = (window as any).__mixx_masterAnalyser as AnalyserNode | null;
          const hasAudio = hasAudioPlaying(masterAnalyser);
          const finalALS = syncALSToPulseResult(pulseResult, result.metadata);
          updateGlobalALS(finalALS, hasAudio);
        }
      }
      
      setInspectorVisible(false);
      
      // Call completion callback with full result including stems
      if (onImportComplete) {
        // Get tracks and buffers from Zustand for callback
        const zustandTracks = useTimelineStore.getState().getTracks();
        const zustandClips = useTimelineStore.getState().getClips();
        const zustandBuffers = useTimelineStore.getState().getAudioBuffers();
        
        // Convert Zustand tracks to TrackConfig format for compatibility
        const trackConfigs = zustandTracks.map(track => {
          const clip = zustandClips.find(c => c.trackId === track.id);
          const buffer = clip ? zustandBuffers[clip.bufferId] : null;
          
          return {
            name: track.trackName,
            type: 'other' as const,
            buffer: buffer || mainBuffer || new AudioBuffer({ length: 0, sampleRate: 44100, numberOfChannels: 2 }),
            metadata: result.metadata,
            readyForPunch: track.group === 'Vocals',
            readyForComp: track.group === 'Vocals',
            color: track.trackColor,
          };
        });
        
        onImportComplete({ 
          tracks: trackConfigs, 
          metadata: result.metadata,
          stems: result.stems as any, // Include stems for direct hydration
          audioBuffers: zustandBuffers, // Include buffers from Zustand
        });
      }
      
      // Reset input for next import
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      als.error('[FLOW IMPORT] Import error', error);
      
      // Stop pulse animation on error
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      
      // Reset ALS on error
      if (typeof window !== 'undefined') {
        (window as any).__als = (window as any).__als || {};
        (window as any).__als.pulse = 0;
        (window as any).__als.flow = 0;
        (window as any).__als.temperature = 'cold';
        ((window as any).__als as any).momentum = 0;
        ((window as any).__als as any).pressure = 0;
        ((window as any).__als as any).harmony = 0;
      }
      
      // Hide inspector on error
      setInspectorVisible(false);
      
      // Show user-friendly error
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }
  
  // Cleanup pulse interval on unmount
  useEffect(() => {
    return () => {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, []);
  
  return (
    <>
      <input
        ref={inputRef}
        aria-label={ariaLabel}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFile}
        className={className}
        style={{ display: 'none' }}
      />
      <ImportInspector
        visible={inspectorVisible}
        steps={importSteps}
        currentPhase={currentPhase}
        alsFlow={alsFlow}
        alsTemperature={alsTemperature}
        primeBrainGuidance={primeBrainGuidance}
      />
    </>
  );
});

FileInput.displayName = 'FileInput';

