/**
 * Mixx Club Studio - Advanced Leveling System (ALS)
 * Comprehensive feedback core with visual feedback
 */

import React, { useState, useEffect } from 'react';

interface ALSFeedback {
  level: number;
  peak: number;
  rms: number;
  lufs: number;
  truePeak: number;
  phase: number;
  stereo: number;
  dynamics: number;
  frequency: number[];
  harmonics: number[];
}

const ALSControlPanel: React.FC = () => {
  const [feedback, setFeedback] = useState<ALSFeedback>({
    level: 0.5,
    peak: 0.7,
    rms: 0.4,
    lufs: -12,
    truePeak: -0.5,
    phase: 0.2,
    stereo: 0.8,
    dynamics: 0.6,
    frequency: Array.from({ length: 32 }, () => Math.random() * 0.8),
    harmonics: Array.from({ length: 16 }, () => Math.random() * 0.6)
  });

  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'master' | 'track' | 'bus'>('master');

  // Simulate real-time feedback
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setFeedback(prev => ({
        ...prev,
        level: Math.max(0, Math.min(1, prev.level + (Math.random() - 0.5) * 0.1)),
        peak: Math.max(0, Math.min(1, prev.peak + (Math.random() - 0.5) * 0.05)),
        rms: Math.max(0, Math.min(1, prev.rms + (Math.random() - 0.5) * 0.08)),
        lufs: prev.lufs + (Math.random() - 0.5) * 2,
        truePeak: prev.truePeak + (Math.random() - 0.5) * 0.5,
        phase: Math.max(-1, Math.min(1, prev.phase + (Math.random() - 0.5) * 0.1)),
        stereo: Math.max(0, Math.min(1, prev.stereo + (Math.random() - 0.5) * 0.05)),
        dynamics: Math.max(0, Math.min(1, prev.dynamics + (Math.random() - 0.5) * 0.03)),
        frequency: prev.frequency.map(f => Math.max(0, Math.min(1, f + (Math.random() - 0.5) * 0.1))),
        harmonics: prev.harmonics.map(h => Math.max(0, Math.min(1, h + (Math.random() - 0.5) * 0.05)))
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const getLevelColor = (level: number) => {
    if (level > 0.9) return 'text-red-500';
    if (level > 0.7) return 'text-yellow-500';
    if (level > 0.5) return 'text-green-500';
    return 'text-blue-500';
  };

  const getPhaseColor = (phase: number) => {
    if (Math.abs(phase) > 0.8) return 'text-red-500';
    if (Math.abs(phase) > 0.5) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="als-control-panel glass-panel p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Advanced Leveling System</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 rounded font-bold ${
              isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isActive ? '⏸️ Pause ALS' : '▶️ Start ALS'}
          </button>
          
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'master' | 'track' | 'bus')}
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="master">Master</option>
            <option value="track">Track</option>
            <option value="bus">Bus</option>
          </select>
        </div>
      </div>

      {/* Main Level Display */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Level Meters */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Level Analysis</h4>
          
          {/* Peak Level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Peak</span>
              <span className={`font-mono ${getLevelColor(feedback.peak)}`}>
                {Math.round(feedback.peak * 100)}%
              </span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
              <div
                className="als-meter h-3 rounded-full transition-all duration-100"
                style={{ width: `${feedback.peak * 100}%` }}
              />
            </div>
          </div>

          {/* RMS Level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">RMS</span>
              <span className={`font-mono ${getLevelColor(feedback.rms)}`}>
                {Math.round(feedback.rms * 100)}%
              </span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
              <div
                className="als-meter h-3 rounded-full transition-all duration-100"
                style={{ width: `${feedback.rms * 100}%` }}
              />
            </div>
          </div>

          {/* LUFS */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">LUFS</span>
              <span className="font-mono text-white">
                {feedback.lufs.toFixed(1)} dB
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.max(0, Math.min(100, (feedback.lufs + 30) * 2))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Phase & Stereo Analysis */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Phase & Stereo</h4>
          
          {/* Phase Correlation */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Phase</span>
              <span className={`font-mono ${getPhaseColor(feedback.phase)}`}>
                {feedback.phase.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-100 ${
                  Math.abs(feedback.phase) > 0.8 ? 'bg-red-500' :
                  Math.abs(feedback.phase) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.abs(feedback.phase) * 100}%` }}
              />
            </div>
          </div>

          {/* Stereo Width */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Stereo</span>
              <span className="font-mono text-white">
                {Math.round(feedback.stereo * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${feedback.stereo * 100}%` }}
              />
            </div>
          </div>

          {/* Dynamics */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Dynamics</span>
              <span className="font-mono text-white">
                {Math.round(feedback.dynamics * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${feedback.dynamics * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Analysis */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Frequency Analysis</h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Frequency Spectrum */}
          <div>
            <div className="text-sm text-gray-300 mb-2">Spectrum</div>
            <div className="flex items-end gap-1 h-20 bg-gray-800 p-2 rounded">
              {feedback.frequency.map((freq, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm transition-all duration-100"
                  style={{ height: `${freq * 100}%`, width: '8px' }}
                />
              ))}
            </div>
          </div>

          {/* Harmonic Analysis */}
          <div>
            <div className="text-sm text-gray-300 mb-2">Harmonics</div>
            <div className="flex items-end gap-1 h-20 bg-gray-800 p-2 rounded">
              {feedback.harmonics.map((harm, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-green-500 to-yellow-500 rounded-sm transition-all duration-100"
                  style={{ height: `${harm * 100}%`, width: '8px' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ALS Status */}
      <div className="mt-6 p-4 bg-gray-800 rounded">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            ALS Status: <span className={isActive ? 'text-green-500' : 'text-red-500'}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="text-sm text-gray-300">
            Mode: <span className="text-white">{mode.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ALSControlPanel;