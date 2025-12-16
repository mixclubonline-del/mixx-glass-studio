/**
 * useAutoMix - React hook for AURA Auto-Mix
 * Phase 38: AI-Powered Automatic Mixing
 * 
 * Provides easy access to the auto-mix engine from React components.
 * 
 * FLOW Doctrine: Exposes ALS-compatible output via ALSMixResult.
 * Raw AutoMixResult is available for internal use but should NOT
 * be displayed to users - use alsResult instead.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  getAutoMixEngine,
  runAutoMix,
  type AutoMixResult,
  type AutoMixSettings,
  type TrackAnalysis,
} from '../ai/AURAAutoMixEngine';
import {
  translateAutoMixToALS,
  publishMixAnalysisALS,
  type ALSMixResult,
  type ALSMixGuidance,
} from '../ai/AutoMixALSBridge';
import type { AURAContext } from '../ai/AURALocalLLMEngine';


export interface UseAutoMixResult {
  // State
  isAnalyzing: boolean;
  isApplying: boolean;
  error: string | null;
  progress: number; // 0-1
  
  // Results (internal - contains raw numbers)
  result: AutoMixResult | null;
  trackSettings: Map<string, AutoMixSettings>;
  
  // ALS Results (doctrine-compliant - no raw numbers!)
  // Use these for UI display
  alsResult: ALSMixResult | null;
  trackGuidance: Map<string, ALSMixGuidance>;
  
  // Actions
  analyzeAndMix: (
    tracks: Array<{ id: string; name: string; buffer: AudioBuffer }>,
    context?: AURAContext
  ) => Promise<AutoMixResult | null>;
  
  applySettings: (onApply: (settings: AutoMixSettings) => void) => void;
  applyTrackSettings: (trackId: string, onApply: (settings: AutoMixSettings) => void) => void;
  
  // Adjustments
  adjustVolume: (trackId: string, delta: number) => void;
  adjustPan: (trackId: string, delta: number) => void;
  toggleEQ: (trackId: string) => void;
  toggleCompressor: (trackId: string) => void;
  
  // Reset
  reset: () => void;
}


export function useAutoMix(): UseAutoMixResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AutoMixResult | null>(null);
  const [trackSettings, setTrackSettings] = useState<Map<string, AutoMixSettings>>(new Map());
  const [analyses, setAnalyses] = useState<TrackAnalysis[]>([]);
  
  // Compute ALS-compatible results (doctrine-compliant - no raw numbers)
  const alsResult = useMemo((): ALSMixResult | null => {
    if (!result || analyses.length === 0) return null;
    return translateAutoMixToALS(result, analyses);
  }, [result, analyses]);
  
  const trackGuidance = useMemo((): Map<string, ALSMixGuidance> => {
    const map = new Map<string, ALSMixGuidance>();
    if (alsResult) {
      for (const guidance of alsResult.tracks) {
        map.set(guidance.trackId, guidance);
      }
    }
    return map;
  }, [alsResult]);
  
  // Analyze and generate mix
  const analyzeAndMix = useCallback(async (
    tracks: Array<{ id: string; name: string; buffer: AudioBuffer }>,
    context?: AURAContext
  ): Promise<AutoMixResult | null> => {
    if (isAnalyzing) return null;
    
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.1, 0.9));
      }, 200);
      
      const mixResult = await runAutoMix(tracks, context);
      
      clearInterval(progressInterval);
      setProgress(1);
      
      // Store results
      setResult(mixResult);
      
      // Store analyses for ALS translation
      const engine = getAutoMixEngine();
      const trackAnalyses: TrackAnalysis[] = [];
      for (const track of tracks) {
        const analysis = await engine.analyzeTrack(track.id, track.name, track.buffer);
        trackAnalyses.push(analysis);
      }
      setAnalyses(trackAnalyses);
      
      // Build settings map
      const settingsMap = new Map<string, AutoMixSettings>();
      for (const settings of mixResult.tracks) {
        settingsMap.set(settings.trackId, settings);
      }
      setTrackSettings(settingsMap);
      
      // Publish ALS signals (doctrine compliance)
      const alsOutput = translateAutoMixToALS(mixResult, trackAnalyses);
      publishMixAnalysisALS(alsOutput);
      
      return mixResult;
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Auto-mix failed';
      setError(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);
  
  // Apply all settings
  const applySettings = useCallback((onApply: (settings: AutoMixSettings) => void) => {
    if (!result) return;
    
    setIsApplying(true);
    
    for (const settings of result.tracks) {
      onApply(settings);
    }
    
    setIsApplying(false);
  }, [result]);
  
  // Apply single track settings
  const applyTrackSettings = useCallback((
    trackId: string,
    onApply: (settings: AutoMixSettings) => void
  ) => {
    const settings = trackSettings.get(trackId);
    if (settings) {
      onApply(settings);
    }
  }, [trackSettings]);
  
  // Adjust volume
  const adjustVolume = useCallback((trackId: string, delta: number) => {
    setTrackSettings(prev => {
      const newMap = new Map(prev);
      const settings = newMap.get(trackId);
      if (settings) {
        newMap.set(trackId, {
          ...settings,
          volume: Math.max(0, Math.min(1, settings.volume + delta)),
        });
      }
      return newMap;
    });
  }, []);
  
  // Adjust pan
  const adjustPan = useCallback((trackId: string, delta: number) => {
    setTrackSettings(prev => {
      const newMap = new Map(prev);
      const settings = newMap.get(trackId);
      if (settings) {
        newMap.set(trackId, {
          ...settings,
          pan: Math.max(-1, Math.min(1, settings.pan + delta)),
        });
      }
      return newMap;
    });
  }, []);
  
  // Toggle EQ
  const toggleEQ = useCallback((trackId: string) => {
    setTrackSettings(prev => {
      const newMap = new Map(prev);
      const settings = newMap.get(trackId);
      if (settings) {
        newMap.set(trackId, {
          ...settings,
          eq: { ...settings.eq, enabled: !settings.eq.enabled },
        });
      }
      return newMap;
    });
  }, []);
  
  // Toggle compressor
  const toggleCompressor = useCallback((trackId: string) => {
    setTrackSettings(prev => {
      const newMap = new Map(prev);
      const settings = newMap.get(trackId);
      if (settings) {
        newMap.set(trackId, {
          ...settings,
          compressor: { ...settings.compressor, enabled: !settings.compressor.enabled },
        });
      }
      return newMap;
    });
  }, []);
  
  // Reset
  const reset = useCallback(() => {
    setResult(null);
    setTrackSettings(new Map());
    setProgress(0);
    setError(null);
  }, []);
  
  return {
    isAnalyzing,
    isApplying,
    error,
    progress,
    result,
    trackSettings,
    alsResult,
    trackGuidance,
    analyzeAndMix,
    applySettings,
    applyTrackSettings,
    adjustVolume,
    adjustPan,
    toggleEQ,
    toggleCompressor,
    reset,
  };
}

export default useAutoMix;
