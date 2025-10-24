/**
 * Mixx Club Studio - Advanced Leveling System (ALS) Enhanced
 * Professional real-time audio analysis with spectrum visualization
 * Integrates RealTimeAudioAnalyzer for professional metering
 */

import React, { useState, useEffect, useRef } from 'react';
import './ALSControlPanelEnhanced.css';
import type RealTimeAudioAnalyzer from '../../../utils/RealTimeAudioAnalyzer';
import type { CompleteAnalysis } from '../../../utils/RealTimeAudioAnalyzer';

interface ALSEnhancedState {
  isActive: boolean;
  mode: 'master' | 'track' | 'bus';
  selectedTrack: number;
  analysisData: CompleteAnalysis | null;
  peakHoldValue: number;
  peakHoldTime: number;
  lufsHistory: number[];
  showFrequencyBands: boolean;
  showHarmonics: boolean;
}

interface FrequencyBandVisualization {
  name: string;
  frequency: string;
  level: number;
  color: string;
}

const ALSControlPanelEnhanced: React.FC = () => {
  const [state, setState] = useState<ALSEnhancedState>({
    isActive: false,
    mode: 'master',
    selectedTrack: 0,
    analysisData: null,
    peakHoldValue: 0,
    peakHoldTime: 0,
    lufsHistory: Array(60).fill(-23),
    showFrequencyBands: true,
    showHarmonics: true
  });

  const analyzerRef = useRef<RealTimeAudioAnalyzer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize analyzer
  useEffect(() => {
    const initAnalyzer = async () => {
      try {
        // Dynamically import analyzer to avoid type issues at module load
        const { default: RealTimeAudioAnalyzer } = await import('../../../utils/RealTimeAudioAnalyzer');
        
        // Try to get audio context from audio routing engine
        const audioContext = (window as any).audioContext;
        if (!audioContext) {
          console.warn('AudioContext not available for ALS');
          return;
        }

        // Create or get analyser node from routing engine
        const analyserNode = audioContext.createAnalyser();
        const analyzer = new RealTimeAudioAnalyzer();
        await analyzer.initialize(audioContext, analyserNode);
        
        analyzerRef.current = analyzer;
        console.log('🎵 ALS Enhanced Analyzer initialized');
      } catch (error) {
        console.error('Failed to initialize ALS analyzer:', error);
      }
    };

    if (state.isActive) {
      initAnalyzer();
    }

    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
        analyzerRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isActive]);

  // Main analysis loop
  useEffect(() => {
    if (!state.isActive || !analyzerRef.current) return;

    const runAnalysis = () => {
      try {
        const analysis = analyzerRef.current!.analyze();

        // Update peak hold
        const newPeakValue = analysis.metering.peak;
        let newPeakHold = state.peakHoldValue;
        let newPeakHoldTime = state.peakHoldTime;

        if (newPeakValue > newPeakHold) {
          newPeakHold = newPeakValue;
          newPeakHoldTime = 2000; // 2 second hold
        } else {
          newPeakHoldTime = Math.max(0, newPeakHoldTime - 16.7); // 60fps
        }

        // Update LUFS history
        const newLufsHistory = [...state.lufsHistory];
        newLufsHistory.push(analysis.metering.lufs);
        if (newLufsHistory.length > 60) {
          newLufsHistory.shift();
        }

        setState(prev => ({
          ...prev,
          analysisData: analysis,
          peakHoldValue: newPeakValue > newPeakHold ? newPeakValue : newPeakHold,
          peakHoldTime: newPeakHoldTime,
          lufsHistory: newLufsHistory
        }));
      } catch (error) {
        console.error('Analysis error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(runAnalysis);
    };

    animationFrameRef.current = requestAnimationFrame(runAnalysis);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isActive, state.peakHoldValue, state.peakHoldTime]);

  const getLevelColor = (level: number): string => {
    if (level > 0.9) return 'bg-red-600';
    if (level > 0.7) return 'bg-yellow-600';
    if (level > 0.5) return 'bg-green-600';
    return 'bg-blue-600';
  };

  const getLevelTextColor = (level: number): string => {
    if (level > 0.9) return 'text-red-500';
    if (level > 0.7) return 'text-yellow-500';
    if (level > 0.5) return 'text-green-500';
    return 'text-blue-500';
  };

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getFrequencyBands = (): FrequencyBandVisualization[] => {
    if (!state.analysisData) {
      return [];
    }

    const bands = state.analysisData.frequency.energyByBand;
    return [
      { name: 'Sub', frequency: '20-60Hz', level: bands.subBass, color: 'from-red-600' },
      { name: 'Bass', frequency: '60-250Hz', level: bands.bass, color: 'from-red-500' },
      { name: 'Lo Mid', frequency: '250-500Hz', level: bands.lowMids, color: 'from-yellow-600' },
      { name: 'Mid', frequency: '500-2kHz', level: bands.mids, color: 'from-yellow-500' },
      { name: 'Hi Mid', frequency: '2-4kHz', level: bands.highMids, color: 'from-green-600' },
      { name: 'Presence', frequency: '4-6kHz', level: bands.presence, color: 'from-green-500' },
      { name: 'Brilliance', frequency: '6-20kHz', level: bands.brilliance, color: 'from-blue-500' }
    ];
  };

  const renderLevelMeter = (value: number, label: string, unit: string, minValue: number = 0, maxValue: number = 1) => {
    const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{label}</span>
          <span className={`font-mono ${getLevelTextColor(value)}`}>
            {typeof value === 'number' ? value.toFixed(1) : '0.0'}{unit}
          </span>
        </div>
        <div className="w-full bg-gray-900 rounded h-2 overflow-hidden">
          <div
            className={`meter-fill h-full rounded transition-all duration-75 ${getLevelColor(value)}`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` } as React.CSSProperties}
          />
        </div>
      </div>
    );
  };

  if (!state.analysisData) {
    return (
      <div className="als-enhanced-panel glass-panel p-6">
        <div className="text-center text-gray-400">
          <p>Advanced Leveling System - No audio data available</p>
          <p className="text-sm mt-2">Enable audio input to see real-time analysis</p>
        </div>
      </div>
    );
  }

  const frequencyBands = getFrequencyBands();

  return (
    <div className="als-enhanced-panel glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Advanced Leveling System</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setState(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`px-3 py-1 rounded text-sm font-semibold ${
              state.isActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {state.isActive ? '⏹ Stop' : '▶ Analyze'}
          </button>
          
          <select
            value={state.mode}
            onChange={(e) => setState(prev => ({ ...prev, mode: e.target.value as 'master' | 'track' | 'bus' }))}
            title="Select analysis target"
            className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600"
          >
            <option value="master">Master</option>
            <option value="track">Track</option>
            <option value="bus">Bus</option>
          </select>
        </div>
      </div>

      {/* Primary Metering */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300">Peak Levels</h4>
          {renderLevelMeter(state.analysisData.metering.peak, 'Peak', '', 0, 1)}
          {renderLevelMeter(state.analysisData.metering.truePeak, 'True Peak', ' dB', -24, 0)}
          {renderLevelMeter(state.analysisData.metering.rms, 'RMS', '', 0, 1)}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300">Loudness</h4>
          {renderLevelMeter(state.analysisData.metering.lufs + 24, 'LUFS', ` ${state.analysisData.metering.lufs.toFixed(1)} dB`, 0, 24)}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Loudness Range</span>
              <span className="font-mono text-white">{state.analysisData.metering.loudnessRange.toFixed(1)} LU</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Dynamic Range</span>
              <span className="font-mono text-white">{state.analysisData.metering.dynamicRange.toFixed(1)} dB</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300">Quality</h4>
          <div className="space-y-2">
            <div className={`text-lg font-bold ${getQualityColor(state.analysisData.quality)}`}>
              {state.analysisData.quality.toUpperCase()}
            </div>
            <div className="text-xs text-gray-400">
              <div>Crest: {state.analysisData.metering.crestFactor.toFixed(1)}</div>
              <div>SNR: {state.analysisData.dynamics.signalToNoiseRatio.toFixed(1)} dB</div>
              <div>Transients: {state.analysisData.dynamics.transientDensity.toFixed(1)}/s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Analysis */}
      {state.showFrequencyBands && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300">Frequency Bands</h4>
          <div className="grid grid-cols-7 gap-2">
            {frequencyBands.map((band, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`frequency-band w-full bg-gradient-to-t ${band.color} to-transparent rounded transition-all duration-75`}
                  style={{ height: `${Math.max(4, band.level * 60)}px` } as React.CSSProperties}
                />
                <div className="band-label">{band.name}</div>
                <div className="band-value">{(band.level * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spectral Features */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-gray-300 mb-2">Spectral Characteristics</div>
          <div className="space-y-1 font-mono text-gray-400">
            <div>Centroid: {(state.analysisData.frequency.spectralCentroid / 1000).toFixed(2)} kHz</div>
            <div>Rolloff: {(state.analysisData.frequency.spectralRolloff / 1000).toFixed(2)} kHz</div>
            <div>Flatness: {(state.analysisData.frequency.spectralFlatness * 100).toFixed(1)}%</div>
            <div>Zero Xing: {(state.analysisData.frequency.zeroCrossingRate * 1000).toFixed(0)}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <div className="text-gray-300 mb-2">Dynamic Analysis</div>
          <div className="space-y-1 font-mono text-gray-400">
            <div>Attack: {state.analysisData.dynamics.attackTime.toFixed(1)} ms</div>
            <div>Release: {state.analysisData.dynamics.releaseTime.toFixed(1)} ms</div>
            <div>Sustain: {(state.analysisData.dynamics.sustainLevel * 100).toFixed(1)}%</div>
            <div>Density: {state.analysisData.dynamics.transientDensity.toFixed(1)} /s</div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>{state.analysisData.isClipping ? '🔴 CLIPPING DETECTED' : '🟢 No Clipping'}</div>
          <div>Analysis: {state.isActive ? 'ACTIVE' : 'INACTIVE'}</div>
          <div>Quality: {state.analysisData.quality}</div>
          <div>{new Date(state.analysisData.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default ALSControlPanelEnhanced;