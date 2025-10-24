import React, { useState, useEffect } from 'react';
import { ProjectProvider } from '../contexts/ProjectContext';
import { PrimeBrainProvider } from '../contexts/PrimeBrainContext';
import TopMenuBar from '../studio/components/Navigation/TopMenuBar';
import ProfessionalMixer from '../studio/components/Mixer/ProfessionalMixer';
import AIMixingAssistant from '../studio/components/AI/AIMixingAssistant';
import './StudioPageV2.css';

/**
 * PROFESSIONAL STUDIO PAGE V2
 * Purpose: Real professional DAW layout similar to Logic/Ableton/Pro Tools
 * - Large main viewport for tracks and arrangement
 * - Left sidebar for track management
 * - Right sidebar for mixing and controls
 * - Top control bar
 * - Bottom transport controls
 */

const StudioPageV2Inner: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [pan, setPan] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rightPanelMode, setRightPanelMode] = useState<'mixer' | 'ai' | 'performance'>('mixer');

  // Simulation playback state
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 180; // 3 minutes

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.016; // ~60fps
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* TOP MENU BAR */}
      <TopMenuBar />

      <div className="flex-1 flex overflow-hidden gap-px bg-black/20">
        
        {/* ===== LEFT SIDEBAR - TRACK LIST ===== */}
        <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-white/10 flex flex-col overflow-hidden">
          {/* Track List Header */}
          <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-slate-800/50 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider">TRACKS</h2>
            <div className="text-xs text-white/50 mt-1">8 Ch</div>
          </div>

          {/* Track List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTrack(`track-${i}`)}
                  className={`w-full px-3 py-2 rounded text-sm font-semibold transition-all duration-200 text-left ${
                    selectedTrack === `track-${i}`
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-white/70 hover:bg-slate-600'
                  }`}
                >
                  Track {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Add Track Button */}
          <div className="p-3 border-t border-white/10 bg-slate-800/50">
            <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg">
              + ADD TRACK
            </button>
          </div>
        </div>

        {/* ===== CENTER MAIN VIEWPORT ===== */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-800/30 via-slate-900 to-black">
          
          {/* ZOOM CONTROLS */}
          <div className="px-4 py-2 border-b border-white/10 bg-slate-800/30 flex items-center gap-4 text-xs">
            <label htmlFor="zoom-control" className="text-white/60">ZOOM:</label>
            <input 
              id="zoom-control"
              type="range" 
              min="50" 
              max="400" 
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32"
              title="Adjust timeline zoom"
            />
            <span className="text-purple-300 font-mono">{zoom}%</span>
          </div>

          {/* MAIN ARRANGE WINDOW */}
          <div className="flex-1 overflow-auto relative">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            
            {/* Timeline Header */}
            <div className="sticky top-0 z-10 bg-slate-800/80 backdrop-blur-sm border-b border-white/10">
              <div className="flex items-center h-12 px-4">
                <div className="text-xs font-mono text-white/40 w-16">TIME</div>
                <div className="flex-1 text-xs font-mono text-white/40 ml-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="inline-block w-12 text-center border-r border-white/5">
                      {i * 10}s
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tracks Area */}
            <div className="relative">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-20 border-b border-white/5 px-4 py-2 flex items-center cursor-pointer transition-all duration-200 ${
                    selectedTrack === `track-${i}`
                      ? 'bg-purple-500/20'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedTrack(`track-${i}`)}
                >
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">TRACK {i + 1}</div>
                    <div className="text-xs text-white/40">Audio Channel</div>
                  </div>
                  
                  {/* Waveform placeholder */}
                  <div className="w-96 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white/20">
                      📻 Waveform
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="studio-playhead"
              style={{
                left: `${(currentTime / duration) * 100}%`,
                transition: isPlaying ? 'none' : 'left 0.1s linear'
              }}
            />
          </div>

          {/* TRANSPORT CONTROLS */}
          <div className="border-t border-white/10 bg-gradient-to-r from-slate-800 to-slate-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-lg font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-green-500/50"
              >
                {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
              </button>
              
              <button
                onClick={() => setCurrentTime(0)}
                className="px-4 py-3 bg-slate-600 hover:bg-slate-500 rounded-lg font-bold text-sm transition-all duration-300"
              >
                ⏹️ STOP
              </button>

              <button className="px-4 py-3 bg-slate-600 hover:bg-slate-500 rounded-lg font-bold text-sm transition-all duration-300">
                🔴 REC
              </button>
            </div>

            {/* Time Display */}
            <div className="flex items-center gap-4 text-sm font-mono">
              <div>
                <span className="text-purple-300">{formatTime(currentTime)}</span>
                <span className="text-white/40 mx-2">/</span>
                <span className="text-white/60">{formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="bpm-input" className="text-white/40">BPM:</label>
                <input
                  id="bpm-input"
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-16 bg-slate-700 border border-white/10 rounded px-2 py-1 text-sm font-mono"
                  title="Adjust tempo"
                />
              </div>
            </div>

            {/* Master Volume */}
            <div className="flex items-center gap-3">
              <label htmlFor="master-volume" className="text-xs text-white/60">MASTER:</label>
              <input
                id="master-volume"
                type="range"
                min="-60"
                max="12"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-32"
                title="Master volume fader"
              />
              <span className="text-xs font-mono text-purple-300 w-10">{volume} dB</span>
            </div>
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR - MIXER/AI/PERFORMANCE ===== */}
        <div className="w-96 bg-gradient-to-b from-slate-800 to-slate-900 border-l border-white/10 flex flex-col overflow-hidden">
          
          {/* Panel Selector */}
          <div className="flex border-b border-white/10 bg-slate-800/50">
            {[
              { id: 'mixer', label: '🎛️ MIXER', color: 'from-blue-600 to-blue-500' },
              { id: 'ai', label: '🧠 AI', color: 'from-purple-600 to-pink-500' },
              { id: 'performance', label: '⚙️ PERF', color: 'from-cyan-600 to-blue-500' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightPanelMode(tab.id as any)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  rightPanelMode === tab.id
                    ? `text-white bg-gradient-to-r ${tab.color}`
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rightPanelMode === 'mixer' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="volume-slider" className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-2">VOLUME</label>
                  <input
                    id="volume-slider"
                    type="range"
                    min="-60"
                    max="12"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-8"
                    title="Track volume"
                  />
                  <div className="text-xs text-purple-300 font-mono mt-1">{volume} dB</div>
                </div>

                <div>
                  <label htmlFor="pan-slider" className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-2">PAN</label>
                  <input
                    id="pan-slider"
                    type="range"
                    min="-100"
                    max="100"
                    value={pan}
                    onChange={(e) => setPan(Number(e.target.value))}
                    className="w-full h-8"
                    title="Stereo pan position"
                  />
                  <div className="text-xs text-purple-300 font-mono mt-1">{pan > 0 ? 'R' : 'L'} {Math.abs(pan)}%</div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <ProfessionalMixer />
                </div>
              </div>
            )}

            {rightPanelMode === 'ai' && (
              <div>
                <h3 className="text-sm font-bold text-purple-300 mb-4 uppercase">PRIME BRAIN AI</h3>
                <AIMixingAssistant />
              </div>
            )}

            {rightPanelMode === 'performance' && (
              <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-4 uppercase">PERFORMANCE</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-white/60">CPU Usage</div>
                    <div className="text-green-400 font-mono">35%</div>
                  </div>
                  <div>
                    <div className="text-white/60">Memory</div>
                    <div className="text-blue-400 font-mono">245 MB</div>
                  </div>
                  <div>
                    <div className="text-white/60">FPS</div>
                    <div className="text-cyan-400 font-mono">60 fps</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Page Component with Providers
const StudioPageV2: React.FC = () => {
  return (
    <ProjectProvider>
      <PrimeBrainProvider>
        <StudioPageV2Inner />
      </PrimeBrainProvider>
    </ProjectProvider>
  );
};

export default StudioPageV2;
