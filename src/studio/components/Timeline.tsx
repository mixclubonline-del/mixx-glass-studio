/**
 * Mixx Club Studio - Advanced Timeline Component
 * Professional DAW timeline with musical timing and automation
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTransport } from '../../contexts/ProjectContext';

interface TimelineProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ bpm, onBpmChange }) => {
  const { isPlaying, isRecording } = useTransport();
  const [currentBar, setCurrentBar] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [zoom, setZoom] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Musical timing simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      const beatDuration = 60000 / bpm; // milliseconds per beat
      const phaseDuration = beatDuration / 4; // 4 phases per beat
      
      interval = setInterval(() => {
        setCurrentPhase(prev => {
          const newPhase = prev + 0.1;
          if (newPhase >= 1) {
            setCurrentBeat(prevBeat => {
              const newBeat = prevBeat + 1;
              if (newBeat > 4) {
                setCurrentBar(prevBar => prevBar + 1);
                return 1;
              }
              return newBeat;
            });
            return 0;
          }
          return newPhase;
        });
      }, phaseDuration);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  return (
    <div className="timeline-container bg-gray-800 border-t border-gray-700">
      {/* Transport Controls */}
      <div className="transport-controls flex items-center gap-4 p-4 bg-gray-900">
        <button
          onClick={() => {/* Play/Pause logic */}}
          className={`px-6 py-2 rounded font-bold ${
            isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button
          onClick={() => {/* Stop logic */}}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold text-white"
        >
          ⏹️ Stop
        </button>
        
        <button
          onClick={() => {/* Record logic */}}
          className={`px-6 py-2 rounded font-bold ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white`}
        >
          {isRecording ? '⏺️ Recording' : '⏺️ Record'}
        </button>

        {/* BPM Control */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300">BPM:</label>
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="text-white font-mono w-12">{bpm}</span>
        </div>

        {/* Zoom Control */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300">Zoom:</label>
          <input
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-white font-mono w-12">{zoom.toFixed(1)}x</span>
        </div>
      </div>

      {/* Timeline Display */}
      <div className="timeline-display relative h-32 bg-gray-800 overflow-x-auto" ref={timelineRef}>
        {/* Grid Lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 32 }, (_, i) => (
            <div
              key={i}
              className="border-r border-gray-600 flex-shrink-0"
              style={{ width: `${100 * zoom}px` }}
            >
              <div className="text-xs text-gray-400 p-1">
                {currentBar + i}
              </div>
            </div>
          ))}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{
            left: `${(currentPhase + (currentBeat - 1) + (currentBar - 1) * 4) * 25 * zoom}px`,
            transition: 'left 0.1s ease'
          }}
        />

        {/* Timeline Info */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 p-2 rounded text-white text-sm">
          <div className="font-mono">
            Bar: {currentBar} | Beat: {currentBeat} | Phase: {(currentPhase * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
