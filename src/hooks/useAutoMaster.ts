/**
 * useAutoMaster - React hook for AURA Auto-Master
 * Phase 39: AI-Powered Automatic Mastering
 * 
 * Provides easy access to the auto-mastering engine from React components.
 * 
 * FLOW Doctrine: Exposes ALS-compatible output via ALSMasterResult.
 * Raw results are available internally but UI should use alsResult.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  getAutoMasterEngine,
  runAutoMaster,
  MASTER_PRESETS,
  type AutoMasterResult,
  type MasterSettings,
  type MixAnalysis,
  type MasterFormat,
  type MasterTarget,
} from '../ai/AURAAutoMasterEngine';
import {
  translateAutoMasterToALS,
  publishMasterAnalysisALS,
  type ALSMasterResult,
  type ALSMixCharacter,
  type ALSMasterGuidance,
  FORMAT_DESCRIPTIONS,
} from '../ai/AutoMasterALSBridge';
import type { AURAContext } from '../ai/AURALocalLLMEngine';

export interface UseAutoMasterResult {
  // State
  isAnalyzing: boolean;
  error: string | null;
  progress: number; // 0-1
  
  // Results (internal - contains raw numbers)
  result: AutoMasterResult | null;
  analysis: MixAnalysis | null;
  settings: MasterSettings | null;
  
  // ALS Results (doctrine-compliant - no raw numbers!)
  // Use these for UI display
  alsResult: ALSMasterResult | null;
  mixCharacter: ALSMixCharacter | null;
  guidance: ALSMasterGuidance | null;
  formatDescriptions: typeof FORMAT_DESCRIPTIONS;
  
  // Actions
  analyzeAndMaster: (
    audioBuffer: AudioBuffer,
    format?: MasterFormat,
    context?: AURAContext
  ) => Promise<AutoMasterResult | null>;
  
  // Settings adjustments
  adjustInputGain: (delta: number) => void;
  adjustLimiterCeiling: (value: number) => void;
  toggleEQ: () => void;
  toggleMultiband: () => void;
  toggleStereo: () => void;
  toggleSaturation: () => void;
  
  // Format presets
  setFormat: (format: MasterFormat) => void;
  availableFormats: MasterFormat[];
  
  // Reset
  reset: () => void;
}

export function useAutoMaster(): UseAutoMasterResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AutoMasterResult | null>(null);
  const [settings, setSettings] = useState<MasterSettings | null>(null);
  const [analysis, setAnalysis] = useState<MixAnalysis | null>(null);
  
  // Compute ALS-compatible results
  const alsResult = useMemo((): ALSMasterResult | null => {
    if (!result) return null;
    return translateAutoMasterToALS(result);
  }, [result]);
  
  const mixCharacter = useMemo(() => alsResult?.mixCharacter ?? null, [alsResult]);
  const guidance = useMemo(() => alsResult?.guidance ?? null, [alsResult]);
  
  const availableFormats: MasterFormat[] = ['streaming', 'club', 'broadcast', 'vinyl', 'custom'];
  
  // Analyze and generate master settings
  const analyzeAndMaster = useCallback(async (
    audioBuffer: AudioBuffer,
    format: MasterFormat = 'streaming',
    context?: AURAContext
  ): Promise<AutoMasterResult | null> => {
    if (isAnalyzing) return null;
    
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.1, 0.9));
      }, 150);
      
      const masterResult = await runAutoMaster(audioBuffer, format, context);
      
      clearInterval(progressInterval);
      setProgress(1);
      
      setResult(masterResult);
      setSettings(masterResult.settings);
      setAnalysis(masterResult.analysis);
      
      // Publish ALS signals (doctrine compliance)
      const alsOutput = translateAutoMasterToALS(masterResult);
      publishMasterAnalysisALS(alsOutput);
      
      return masterResult;
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Auto-master failed';
      setError(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);
  
  // Adjust input gain
  const adjustInputGain = useCallback((delta: number) => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        inputGain: Math.max(-12, Math.min(12, prev.inputGain + delta)),
      };
    });
  }, []);
  
  // Adjust limiter ceiling
  const adjustLimiterCeiling = useCallback((value: number) => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        limiter: {
          ...prev.limiter,
          ceiling: Math.max(-3, Math.min(-0.1, value)),
        },
      };
    });
  }, []);
  
  // Toggle EQ
  const toggleEQ = useCallback(() => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        preEQ: {
          ...prev.preEQ,
          enabled: !prev.preEQ.enabled,
        },
      };
    });
  }, []);
  
  // Toggle multiband
  const toggleMultiband = useCallback(() => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        multiband: {
          ...prev.multiband,
          enabled: !prev.multiband.enabled,
        },
      };
    });
  }, []);
  
  // Toggle stereo
  const toggleStereo = useCallback(() => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stereo: {
          ...prev.stereo,
          enabled: !prev.stereo.enabled,
        },
      };
    });
  }, []);
  
  // Toggle saturation
  const toggleSaturation = useCallback(() => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        saturation: {
          ...prev.saturation,
          enabled: !prev.saturation.enabled,
        },
      };
    });
  }, []);
  
  // Set format and update settings
  const setFormat = useCallback((format: MasterFormat) => {
    if (!result || !settings) return;
    
    const newTarget = { format, ...MASTER_PRESETS[format] };
    
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        limiter: {
          ...prev.limiter,
          ceiling: newTarget.truePeakCeiling,
        },
        dither: {
          ...prev.dither,
          bitDepth: newTarget.bitDepth,
          enabled: newTarget.bitDepth < 24,
        },
      };
    });
  }, [result, settings]);
  
  // Reset
  const reset = useCallback(() => {
    setResult(null);
    setSettings(null);
    setAnalysis(null);
    setProgress(0);
    setError(null);
  }, []);
  
  return {
    isAnalyzing,
    error,
    progress,
    result,
    analysis,
    settings,
    alsResult,
    mixCharacter,
    guidance,
    formatDescriptions: FORMAT_DESCRIPTIONS,
    analyzeAndMaster,
    adjustInputGain,
    adjustLimiterCeiling,
    toggleEQ,
    toggleMultiband,
    toggleStereo,
    toggleSaturation,
    setFormat,
    availableFormats,
    reset,
  };
}

export default useAutoMaster;
