/**
 * useStemSeparation - React hook for local Demucs stem separation
 * Phase 33: Local Stem Separation Integration
 * 
 * Uses Tauri commands to invoke local Demucs for AI-powered stem separation.
 * Falls back to Web Worker DSP separation if Demucs is not available.
 */

import { useState, useCallback, useEffect } from 'react';

// Check if we're in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Tauri invoke helper with dynamic import
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    throw new Error('Tauri not available');
  }
  const importFn = new Function('specifier', 'return import(specifier)');
  const { invoke } = await importFn('@tauri-apps/api/core');
  return invoke(cmd, args);
}

export interface DemucsStatus {
  available: boolean;
  version?: string;
  method?: 'direct' | 'python_module';
  models?: string[];
  error?: string;
  install_hint?: string;
  fallback?: string;
}

export interface StemModel {
  id: string;
  name: string;
  stems: number;
  stem_names: string[];
  quality: 'good' | 'high' | 'best';
  speed: 'fast' | 'medium' | 'slow';
}

export interface StemSeparationResult {
  success: boolean;
  stems: string[];  // Paths to separated stem files
  model: string;
  processing_time_ms: number;
  error?: string;
}

export interface StemSeparationState {
  isChecking: boolean;
  isSeparating: boolean;
  demucsAvailable: boolean | null;
  demucsStatus: DemucsStatus | null;
  models: StemModel[];
  progress: number;
  currentStep: string;
  error: string | null;
  lastResult: StemSeparationResult | null;
}

export function useStemSeparation() {
  const [state, setState] = useState<StemSeparationState>({
    isChecking: false,
    isSeparating: false,
    demucsAvailable: null,
    demucsStatus: null,
    models: [],
    progress: 0,
    currentStep: '',
    error: null,
    lastResult: null,
  });

  // Check if Demucs is available
  const checkDemucs = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const status = await tauriInvoke<DemucsStatus>('stem_check_demucs');
      setState(prev => ({
        ...prev,
        isChecking: false,
        demucsAvailable: status.available,
        demucsStatus: status,
      }));
      return status;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check Demucs';
      setState(prev => ({
        ...prev,
        isChecking: false,
        demucsAvailable: false,
        error: errorMsg,
      }));
      return { available: false, error: errorMsg };
    }
  }, []);

  // Load available models
  const loadModels = useCallback(async () => {
    try {
      const models = await tauriInvoke<StemModel[]>('stem_get_models');
      setState(prev => ({ ...prev, models }));
      return models;
    } catch (err) {
      console.warn('[StemSeparation] Failed to load models:', err);
      return [];
    }
  }, []);

  // Separate stems using Demucs
  const separateWithDemucs = useCallback(async (
    inputPath: string,
    outputDir: string,
    model?: string,
    twoStems?: string,
  ): Promise<StemSeparationResult> => {
    setState(prev => ({
      ...prev,
      isSeparating: true,
      progress: 0,
      currentStep: 'Initializing Demucs...',
      error: null,
      lastResult: null,
    }));

    try {
      // Update progress periodically
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.progress < 90) {
            return {
              ...prev,
              progress: prev.progress + 5,
              currentStep: prev.progress < 30 ? 'Loading model...' :
                          prev.progress < 60 ? 'Processing audio...' :
                          'Encoding stems...',
            };
          }
          return prev;
        });
      }, 2000);

      const result = await tauriInvoke<StemSeparationResult>('stem_separate_with_demucs', {
        inputPath,
        outputDir,
        model,
        twoStems,
      });

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        isSeparating: false,
        progress: 100,
        currentStep: result.success ? 'Complete!' : 'Failed',
        lastResult: result,
        error: result.error || null,
      }));

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Stem separation failed';
      setState(prev => ({
        ...prev,
        isSeparating: false,
        progress: 0,
        currentStep: 'Error',
        error: errorMsg,
      }));
      
      return {
        success: false,
        stems: [],
        model: model || 'unknown',
        processing_time_ms: 0,
        error: errorMsg,
      };
    }
  }, []);

  // Cancel separation (not yet implemented in Rust)
  const cancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSeparating: false,
      progress: 0,
      currentStep: 'Cancelled',
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-check Demucs on mount
  useEffect(() => {
    if (isTauri && state.demucsAvailable === null) {
      checkDemucs().then(() => loadModels());
    }
  }, [checkDemucs, loadModels, state.demucsAvailable]);

  return {
    ...state,
    checkDemucs,
    loadModels,
    separateWithDemucs,
    cancel,
    clearError,
    isTauri,
  };
}

export default useStemSeparation;
