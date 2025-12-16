/**
 * useGPUAudio - React hook for GPU-accelerated audio processing
 * Phase 35: GPU Acceleration
 * 
 * Provides easy access to WebGPU-accelerated FFT and spectral analysis.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getGPUAudioProcessor,
  initializeGPUAudio,
  gpuFFT,
  gpuSpectralAnalysis,
  type GPUAudioStatus,
  type SpectralAnalysis,
} from '../core/quantum/GPUAudioProcessor';

export interface UseGPUAudioResult {
  status: GPUAudioStatus;
  isInitializing: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Methods
  initialize: () => Promise<void>;
  computeFFT: (samples: Float32Array) => Promise<{ real: Float32Array; imag: Float32Array } | null>;
  analyzeSpectrum: (samples: Float32Array, sampleRate: number) => Promise<SpectralAnalysis | null>;
  
  // Real-time analysis
  startRealtimeAnalysis: (audioContext: AudioContext, source: AudioNode) => void;
  stopRealtimeAnalysis: () => void;
  realtimeSpectrum: SpectralAnalysis | null;
}

export function useGPUAudio(): UseGPUAudioResult {
  const [status, setStatus] = useState<GPUAudioStatus>({
    available: false,
    backend: 'cpu',
    features: {
      parallelFFT: false,
      batchProcessing: false,
      spectralAnalysis: false,
    },
    performanceMultiplier: 1,
  });
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeSpectrum, setRealtimeSpectrum] = useState<SpectralAnalysis | null>(null);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processorRef = useRef(getGPUAudioProcessor());
  
  // Initialize GPU audio
  const initialize = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    setError(null);
    
    try {
      const newStatus = await initializeGPUAudio();
      setStatus(newStatus);
      
      if (!newStatus.available) {
        console.warn('[useGPUAudio] GPU not available, using CPU fallback');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'GPU initialization failed';
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);
  
  // Compute FFT
  const computeFFT = useCallback(async (samples: Float32Array) => {
    setIsProcessing(true);
    try {
      const result = await gpuFFT(samples);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'FFT computation failed';
      setError(msg);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Analyze spectrum
  const analyzeSpectrum = useCallback(async (samples: Float32Array, sampleRate: number) => {
    setIsProcessing(true);
    try {
      const result = await gpuSpectralAnalysis(samples, sampleRate);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Spectral analysis failed';
      setError(msg);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Real-time analysis
  const startRealtimeAnalysis = useCallback((audioContext: AudioContext, source: AudioNode) => {
    // Create analyser
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;
    
    const dataArray = new Float32Array(analyser.frequencyBinCount);
    
    const analyze = async () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getFloatTimeDomainData(dataArray);
      
      try {
        const spectrum = await gpuSpectralAnalysis(dataArray, audioContext.sampleRate);
        setRealtimeSpectrum(spectrum);
      } catch {
        // Ignore errors in realtime loop
      }
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  }, []);
  
  const stopRealtimeAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    setRealtimeSpectrum(null);
  }, []);
  
  // Auto-initialize on mount
  useEffect(() => {
    initialize();
    
    return () => {
      stopRealtimeAnalysis();
    };
  }, [initialize, stopRealtimeAnalysis]);
  
  return {
    status,
    isInitializing,
    isProcessing,
    error,
    initialize,
    computeFFT,
    analyzeSpectrum,
    startRealtimeAnalysis,
    stopRealtimeAnalysis,
    realtimeSpectrum,
  };
}

export default useGPUAudio;
