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
import { prepAudioFile, normalizeBuffer } from '../../core/import/filePrep';
import { classifyAudio } from '../../core/import/classifier';
import { stemSplitEngine, determineOptimalMode, type StemResult } from '../../core/import/stemEngine';
import { analyzeTiming } from '../../core/import/analysis';
import { assembleMetadata } from '../../core/import/metadata';
import { buildAndHydrateFromStem } from '../../core/import/trackBuilder';
import { useTimelineStore } from '../../state/timelineStore';
import type { StemMetadata } from '../../core/import/metadata';
import type { AudioClassification } from '../../core/import/classifier';
import { computeFlowPulse } from '../../core/pulse/flowPulseEngine';
import { syncALSToPulseResult, syncALSToPulse, updateGlobalALS } from '../../core/als/alsSync';
import { ImportInspector, type ImportStep } from './ImportInspector';
import type { FlowPulseResult } from '../../core/pulse/flowPulseEngine';

declare global {
  interface Window {
    __flow_lastImport?: {
      stems: Record<string, AudioBuffer | null>;
      metadata: StemMetadata;
      info: {
        sampleRate: number;
        channels: number;
        duration: number;
        length: number;
        format?: string;
      };
    };
    __primeBrainInstance?: {
      updateFromImport?: (metadata: StemMetadata) => void;
      state?: {
        flow: number;
        momentum: number;
        tension: number;
      };
    };
    __primeBrain?: {
      guidance: string;
    };
    __als?: {
      flow: number;
      temperature: string;
      guidance: string;
      pulse?: number; // Flow Pulse % (0-100)
      momentum?: number; // Momentum score (0-100)
      pressure?: number; // Pressure score (0-100)
      harmony?: number; // Harmony score (0-100)
    };
    __bloom_ready?: boolean;
    __mixx_session?: {
      addTrack: (config: TrackConfig) => { id: string };
      addClip: (config: {
        trackId: string;
        buffer: AudioBuffer;
        start: number;
        metadata: StemMetadata;
      }) => void;
    };
  }
}

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
        window.__als = window.__als || { flow: 0, temperature: 'cooling', guidance: '' };
        window.__primeBrain = window.__primeBrain || { guidance: '' };
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
      if (typeof window !== 'undefined' && window.__primeBrain) {
        window.__primeBrain.guidance = 'Flow is preparing to listen.';
      }
      await new Promise(resolve => setTimeout(resolve, 150)); // Breathing delay
      
      // Phase 2: Prep audio file
      setCurrentPhase(1);
      setPrimeBrainGuidance('Scanning waveform structure.');
      if (typeof window !== 'undefined' && window.__als) {
        window.__als.flow = 54; // 48 + 1 * 6
        window.__als.guidance = 'Scanning waveform structure.';
      }
      if (typeof window !== 'undefined' && window.__primeBrain) {
        window.__primeBrain.guidance = 'Scanning waveform structure.';
      }
      
      // Log file prep start (helps debug hanging)
      if ((import.meta as any).env?.DEV) {
        console.log('[FLOW IMPORT] Starting file prep:', {
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          type: file.type,
        });
      }
      
      const { audioBuffer: rawBuffer, info } = await prepAudioFile(file);
      
      // Log file prep completion
      if ((import.meta as any).env?.DEV) {
        console.log('[FLOW IMPORT] File prep complete:', {
          duration: `${info.duration.toFixed(1)}ms`,
          sampleRate: `${info.sampleRate}Hz`,
          channels: info.channels,
        });
      }
      
      // Normalize buffer before processing (with timeout protection)
      if ((import.meta as any).env?.DEV) {
        console.log('[FLOW IMPORT] Normalizing audio buffer...');
      }
      const audioBuffer = await normalizeBuffer(rawBuffer);
      if ((import.meta as any).env?.DEV) {
        console.log('[FLOW IMPORT] Normalization complete');
      }
      
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
      if (typeof window !== 'undefined' && window.__primeBrain) {
        window.__primeBrain.guidance = 'Separating vocals and instruments.';
      }
      
      // Add progress update for long operations
      const classification = classifyAudio(audioBuffer);
      const mode = determineOptimalMode(classification);
      
      // Log start of stem separation (helps debug hanging)
      if ((import.meta as any).env?.DEV) {
        console.log('[FLOW IMPORT] Starting stem separation:', {
          mode,
          duration: `${audioBuffer.duration.toFixed(1)}s`,
          sampleRate: `${audioBuffer.sampleRate}Hz`,
          length: audioBuffer.length,
        });
      }
      
      const stems = await stemSplitEngine(audioBuffer, mode, classification);
      
      // Log completion
      if ((import.meta as any).env?.DEV) {
        console.log('[FLOW IMPORT] Stem separation complete:', {
          stems: Object.keys(stems).filter(k => stems[k as keyof typeof stems] !== null),
        });
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
      if (typeof window !== 'undefined' && window.__primeBrain) {
        window.__primeBrain.guidance = 'Organizing lanes and roles.';
      }
      const analysis = await analyzeTiming(audioBuffer);
      const metadata = assembleMetadata(
        stems,
        analysis,
        classification,
        info.sampleRate,
        info.duration,
        info.channels,
        info.format,
        audioBuffer // Pass main buffer for Layer 4 intelligence analysis
      );
      
      // FLOW GOLDEN PATH: Hydrate stems to timeline with full Flow intelligence
      // This happens AFTER metadata is assembled so we have punch zones, harmonics, headroom
      function hydrateStemsToTimeline(
        stems: Record<string, AudioBuffer | null>,
        metadata: StemMetadata,
        classification: AudioClassification,
        sampleRate: number,
        durationMs: number,
        channels: number,
        format?: string
      ) {
        const entries = Object.entries(stems);
        const hydratedTrackIds: string[] = [];
        
        entries.forEach(([stemName, buffer], index) => {
          if (!buffer) return;
          
          // Map stem name to role
          const role = classification.type;
          
          const result = buildAndHydrateFromStem({
            name: stemName,
            role,
            color: undefined,        // optional – auto-color will handle it
            audioBuffer: buffer,
            durationMs,
            sampleRate,
            channels,
            format,
            metadata,
            index,
          });
          
          hydratedTrackIds.push(result.trackId);
        });
        
        if ((import.meta as any).env?.DEV) {
          console.log('[FLOW IMPORT] Zustand hydration complete with Flow intelligence:', {
            trackIds: hydratedTrackIds,
            stemsHydrated: entries.filter(([_, b]) => b !== null).length,
            metadata: {
              bpm: metadata.bpm,
              key: metadata.key,
              punchZones: metadata.punchZones.length,
              headroom: metadata.headroom,
              harmonics: metadata.harmonics.length > 0,
            },
          });
        }
        
        return hydratedTrackIds;
      }
      
      // Hydrate all stems with full Flow intelligence
      const hydratedTrackIds = hydrateStemsToTimeline(
        stems,
        metadata,
        classification,
        info.sampleRate,
        info.duration,
        info.channels,
        info.format
      );
      
      // Compute Flow Pulse (Layer 5)
      const pulseResult = computeFlowPulse(audioBuffer, metadata);
      setFlowPulse(pulseResult);
      
      // Sync ALS to Pulse (Layer 6)
      const initialALS = syncALSToPulseResult(pulseResult, metadata);
      updateGlobalALS(initialALS);
      
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
            metadata,
            pulseResult.energy,
            pulseResult.harmonicBoost
          );
          updateGlobalALS(alsSync);
          
          pulseIndex = (pulseIndex + 1) % pulseResult.pulse.length;
        }
      }, 30); // Update every 30ms for smooth animation
      
      // Tracks are already hydrated via buildAndHydrateFromStem above
      // No need to build tracks again - they're in Zustand
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
      if (typeof window !== 'undefined' && window.__primeBrain) {
        window.__primeBrain.guidance = 'Optimizing for performance.';
      }
      
      // Load tracks into session (if session API exists)
      // Note: Tracks are already in Zustand, but we can sync to session API if needed
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
              metadata,
            } as any);
            
            // Auto-insert timeline clip
            window.__mixx_session.addClip({
              trackId: sessionTrack.id,
              buffer,
              start: 0,
              metadata,
            });
          }
        });
      }
      
      // Tell Flow it's loaded
      if (typeof window !== 'undefined') {
        window.__flow_lastImport = {
          stems,
          metadata,
          info,
        };
      }
      
      // Wake ALS + Prime Brain on import
      const brain = typeof window !== 'undefined' ? window.__primeBrainInstance : null;
      if (brain?.updateFromImport) {
        brain.updateFromImport(metadata);
      }
      
      // ALS and Prime Brain already updated above during phases
      // Bloom ready already set above
      
      // Final step
      markStepDone(4);
      setPrimeBrainGuidance('Your arrangement is ready.');
      setAlsFlow(75);
      
      // Final Flow brain update
      if (typeof window !== 'undefined') {
        if (window.__als) {
          window.__als.flow = 75;
          window.__als.temperature = 'balanced';
          window.__als.guidance = 'Your arrangement is ready.';
        }
        if (window.__primeBrain) {
          window.__primeBrain.guidance = 'Your arrangement is ready.';
        }
        // Bloom ready
        window.__bloom_ready = true;
      }
      
      // Wait a moment for user to see completion, then hide inspector
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Stop pulse animation
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      
      // Set final ALS sync values
      if (typeof window !== 'undefined' && pulseResult.pulse.length > 0) {
        const finalALS = syncALSToPulseResult(pulseResult, metadata);
        updateGlobalALS(finalALS);
      }
      
      setInspectorVisible(false);
      
      // Log completion (dev mode)
      if ((import.meta as any).env?.DEV) {
        console.log('[FLOW IMPORT] Complete', {
          stems: Object.keys(stems).filter(k => stems[k] !== null),
          metadata: {
            type: metadata.type,
            bpm: metadata.bpm,
            key: metadata.key,
            stemCount: metadata.stems.length,
          },
          info: {
            duration: `${(info.duration / 1000).toFixed(1)}s`,
            sampleRate: `${info.sampleRate}Hz`,
            channels: info.channels,
          },
        });
      }
      
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
            buffer: buffer || audioBuffer, // Fallback to main buffer
            metadata,
            readyForPunch: track.group === 'Vocals',
            readyForComp: track.group === 'Vocals',
            color: track.trackColor,
          };
        });
        
        onImportComplete({ 
          tracks: trackConfigs, 
          metadata,
          stems, // Include stems for direct hydration
          audioBuffers: zustandBuffers, // Include buffers from Zustand
        });
      }
      
      // Reset input for next import
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      console.error('[FLOW IMPORT] Error:', error);
      
      // Stop pulse animation on error
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      
      // Reset ALS on error
      if (typeof window !== 'undefined') {
        window.__als = window.__als || {};
        window.__als.pulse = 0;
        window.__als.flow = 0;
        window.__als.temperature = 'cold';
        (window.__als as any).momentum = 0;
        (window.__als as any).pressure = 0;
        (window.__als as any).harmony = 0;
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

