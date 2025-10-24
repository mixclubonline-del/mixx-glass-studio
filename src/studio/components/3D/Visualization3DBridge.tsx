/**
 * Mixx Club Studio - 3D Visualization Data Bridge
 * Connects Prime Brain analysis data to Enhanced3DVisualizer
 * Manages real-time data flow and mode switching
 */

import React, { useEffect, useState, useRef } from 'react';
import { usePrimeBrain } from '../../../contexts/PrimeBrainContext';
import Enhanced3DVisualizer from './Enhanced3DVisualizer';
import type { CompleteAnalysis } from '../../../utils/RealTimeAudioAnalyzer';

interface Visualization3DBridgeProps {
  isPlaying: boolean;
  showControls?: boolean;
}

/**
 * Visualization3DBridge
 * 
 * Acts as a bridge between the Prime Brain central intelligence system
 * and the Enhanced 3D visualization engine. Automatically receives real-time
 * analysis data from Prime Brain and feeds it to the 3D renderer.
 * 
 * Features:
 * - Real-time data binding from Prime Brain
 * - Automatic mode selection based on musical context
 * - Performance optimization with data throttling
 * - Interactive camera controls
 */
const Visualization3DBridge: React.FC<Visualization3DBridgeProps> = ({ 
  isPlaying,
  showControls = true 
}) => {
  const primeBrain = usePrimeBrain();
  const [analysisData, setAnalysisData] = useState<CompleteAnalysis | null>(null);
  const [mode, setMode] = useState<'spectrum' | 'waveform' | 'harmonic' | 'meters' | 'combined'>('combined');
  const [autoMode, setAutoMode] = useState(true);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to Prime Brain visualization data updates
  useEffect(() => {
    if (!isPlaying || !primeBrain) return;

    // Update visualization data from Prime Brain at 30fps (throttled from analysis at 60fps)
    updateIntervalRef.current = setInterval(() => {
      const vizData = primeBrain.state.visualizationData;
      
      if (vizData) {
        // For now, cast visualization data - in production this would need proper CompleteAnalysis structure
        setAnalysisData(vizData as any);

        // Auto-select visualization mode based on musical context
        if (autoMode) {
          const harmonicData = primeBrain.state.harmonicData;
          if (harmonicData?.fundamentalFreq && harmonicData.fundamentalFreq > 2000) {
            setMode('harmonic'); // High freq content - show harmonics
          } else if (harmonicData && harmonicData.consonance > 0.7) {
            setMode('combined'); // Harmonious content - full view
          } else {
            setMode('spectrum'); // Default to spectrum
          }
        }
      }
    }, 33); // ~30fps

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isPlaying, primeBrain, autoMode]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {showControls && (
        <div className="bg-gray-800/50 p-3 rounded space-y-2 border border-gray-700">
          <div className="text-xs font-semibold text-gray-300">3D VISUALIZATION CONTROL</div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Mode</label>
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as any);
                  setAutoMode(false); // Disable auto when manually selecting
                }}
                title="Select visualization mode"
                className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
              >
                <option value="spectrum">Spectrum</option>
                <option value="waveform">Waveform</option>
                <option value="harmonic">Harmonics</option>
                <option value="meters">Meters</option>
                <option value="combined">Combined</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Auto Mode</label>
              <button
                onClick={() => setAutoMode(!autoMode)}
                className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
                  autoMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {autoMode ? '✓ AUTO' : '○ MANUAL'}
              </button>
            </div>
          </div>

          {analysisData && (
            <div className="text-xs text-gray-400 space-y-1 border-t border-gray-700 pt-2">
              <div className="flex justify-between">
                <span>Data Available:</span>
                <span className="text-gray-200">✓</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3D Visualization Container */}
      <div className="flex-1 rounded-lg overflow-hidden bg-black/50 border border-gray-700">
        {analysisData ? (
          <Enhanced3DVisualizer
            analysisData={analysisData}
            isActive={isPlaying}
            mode={mode}
            interactiveMode={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm">Waiting for audio data...</div>
              <div className="text-xs text-gray-500 mt-1">Enable audio input to start visualization</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Visualization3DBridge;