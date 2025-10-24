import React, { useState, useEffect } from 'react';
import { useElectron } from '../hooks/useElectron';
import { ProjectProvider } from '../contexts/ProjectContext';
import { PrimeBrainProvider, usePrimeBrain } from '../contexts/PrimeBrainContext';
import TopMenuBar from '../studio/components/Navigation/TopMenuBar';
import Timeline from '../studio/components/Timeline';
import TrackList from '../studio/components/TrackManagement/TrackList';
import ALSControlPanel from '../studio/components/ALS/ALSControlPanel';
import ALSControlPanelEnhanced from '../studio/components/ALS/ALSControlPanelEnhanced';
import AIMixingAssistant from '../studio/components/AI/AIMixingAssistant';
import BloomMenu from '../studio/components/Bloom/BloomMenu';
import ProfessionalMixer from '../studio/components/Mixer/ProfessionalMixer';
import NativeVelvetCurveBridge from '../components/NativeVelvetCurveBridge';
import HushInputBridge from '../components/HushInputBridge';
import HarmonicLatticeBridge from '../components/HarmonicLatticeBridge';
import PrimeBrainCore from '../studio/components/3D/PrimeBrainCore';
import ALSVisualizer from '../studio/components/3D/ALSVisualizer';
import Waveform3D from '../studio/components/3D/Waveform3D';

interface AudioMetrics {
  inputLevel: number;
  outputLevel: number;
  latency: number;
  cpuUsage: number;
  dropouts: number;
}

interface HarmonicData {
  fundamentalFreq: number;
  harmonics: Array<{
    frequency: number;
    amplitude: number;
    phase: number;
    harmonic: number;
  }>;
  tonality: 'major' | 'minor' | 'dominant' | 'diminished' | 'augmented' | 'unknown';
  key: string;
  consonance: number;
  dissonance: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
}

interface MusicalKey {
  note: string;
  mode: 'major' | 'minor';
  confidence: number;
}

// Enhanced Studio Component with Prime Brain Integration
const StudioPageInner: React.FC = () => {
  const { isElectron } = useElectron();
  const [bpm, setBpm] = useState(120);
  const [activePanel, setActivePanel] = useState<'timeline' | 'tracks' | 'als' | 'ai' | 'bloom' | 'mixer'>('timeline');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180); // 3 minutes
  
  // 🧠 PRIME BRAIN INTEGRATION
  const primeBrain = usePrimeBrain();
  
  // Enhanced audio processing states
  const [realtimeAudioData, setRealtimeAudioData] = useState<Float32Array>(new Float32Array(512));
  
  // Sample audio data for 3D visualization
  const [audioData, setAudioData] = useState<number[]>([]);
  
  useEffect(() => {
    // Generate sample audio data
    const sampleData = Array.from({ length: 512 }, () => Math.random() * 2 - 1);
    setAudioData(sampleData);
  }, []);
  
  // Simulate playback
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  // Handle real-time audio data from Velvet Curve engine
  const handleAudioData = (data: Float32Array) => {
    setRealtimeAudioData(data);
    // Convert to array for visualization components that expect number[]
    setAudioData(Array.from(data.slice(0, 512)));
  };

  // Get current metrics and status from Prime Brain
  const audioEngineActive = primeBrain.state.systemStatus.audioEngine.active;
  const currentMetrics = primeBrain.state.audioMetrics;
  const currentKey = primeBrain.getCurrentKey();
  const systemHealth = primeBrain.getSystemHealth();
  const recommendations = primeBrain.getRecommendations().slice(0, 3); // Show top 3

  return (
    <ProjectProvider>
      <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
        {/* Background Glass Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-purple-500/10" />
        
        {/* Enhanced Audio Processing Bridges */}
        <NativeVelvetCurveBridge 
          onAudioData={handleAudioData}
          config={{ lowLatency: true, sampleRate: 48000 }}
        />
        <HushInputBridge onStateChange={(isActive: boolean) => {
          console.log('🔇 Hush Input Bridge:', isActive ? 'Active' : 'Inactive');
        }} />
        <HarmonicLatticeBridge 
          audioData={realtimeAudioData}
          sampleRate={48000}
        />

        {/* Top Menu Bar */}
        <div className="glass-surface m-4 mb-2">
          <TopMenuBar />
        </div>

        {/* Audio Engine Status Bar */}
        <div className="mx-4 mb-2 glass-surface p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className={`flex items-center space-x-2 ${audioEngineActive ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${audioEngineActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="font-medium">Audio Engine {audioEngineActive ? 'Online' : 'Offline'}</span>
              </div>
              {audioEngineActive && (
                <>
                  <div className="text-purple-400 font-medium">
                    🎼 {currentKey || 'Analyzing...'}
                  </div>
                  <div className="text-blue-400">
                    🔊 {currentMetrics?.latency.toFixed(1) || '0.0'}ms latency
                  </div>
                  <div className="text-yellow-400">
                    💻 {Math.round((currentMetrics?.cpuUsage || 0) * 100)}% CPU
                  </div>
                  {primeBrain.state.harmonicData && (
                    <div className="text-orange-400">
                      🎵 {Math.round(primeBrain.state.harmonicData.fundamentalFreq)}Hz fundamental
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="text-gray-400 text-xs">
              Mixx Glass Studio {audioEngineActive ? 'Professional' : 'Standard'} Edition • BPM: {bpm}
            </div>
          </div>
        </div>

        {/* Main Studio Interface */}
        <div className="flex-1 flex mx-4 mb-4 gap-4">
          {/* Left Panel - Track Management */}
          <div className="w-80 glass-panel">
            <TrackList />
          </div>

          {/* Center Panel - Timeline */}
          <div className="flex-1 flex flex-col glass-panel">
            <div className="p-4 border-b border-white/10">
              <Timeline bpm={bpm} onBpmChange={setBpm} />
            </div>
            
            {/* Timeline Canvas Area */}
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
              
              {/* 3D Waveform Visualization */}
              <div className="h-1/2">
                <Waveform3D
                  audioData={audioData}
                  isPlaying={isPlaying}
                  color="#8B5CF6"
                  height={2}
                  width={8}
                />
              </div>
              
              {/* PRIME BRAIN Core */}
              <div className="h-1/2">
                <PrimeBrainCore
                  isActive={primeBrain.state.isActive}
                  intensity={primeBrain.state.intensity}
                  onStateChange={(active) => {
                    if (active) {
                      primeBrain.activatePrimeBrain();
                    } else {
                      primeBrain.deactivatePrimeBrain();
                    }
                  }}
                />
              </div>
              
              {/* Transport Controls */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass-panel p-4 flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flow-interactive px-6 py-3 rounded-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300"
                  >
                    {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
                  </button>
                  
                  <button
                    onClick={() => setCurrentTime(0)}
                    className="flow-interactive px-4 py-3 rounded-lg font-bold bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg transition-all duration-300"
                  >
                    ⏹️ STOP
                  </button>
                  
                  <div className="flex-1 mx-4">
                    <div className="text-xs text-purple-300 mb-1">TIMELINE</div>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-white mt-1">
                      {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toFixed(1).padStart(4, '0')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Tools */}
          <div className="w-80 glass-panel flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'als', label: 'ALS', icon: '📊', color: 'from-blue-500 to-cyan-500' },
                { id: 'ai', label: 'AI', icon: '🧠', color: 'from-purple-500 to-pink-500' },
                { id: 'bloom', label: 'Bloom', icon: '✨', color: 'from-yellow-500 to-orange-500' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 px-4 py-4 text-sm font-medium flow-interactive relative ${
                    activePanel === tab.id
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {activePanel === tab.id && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-20 rounded-t-lg`} />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activePanel === 'als' && (
                <div className="space-y-4">
                  <ALSVisualizer
                    data={{
                      level: 0.7,
                      peak: 0.9,
                      rms: 0.6,
                      lufs: -12,
                      phase: 0.2,
                      stereo: 0.8,
                      dynamics: 0.6,
                      frequency: Array.from({ length: 32 }, () => Math.random() * 0.8),
                      harmonics: Array.from({ length: 16 }, () => Math.random() * 0.6)
                    }}
                    isActive={true}
                    mode="master"
                  />
                  <ALSControlPanelEnhanced />
                </div>
              )}
              {activePanel === 'ai' && <AIMixingAssistant />}
              {activePanel === 'bloom' && <BloomMenu />}
              {activePanel === 'mixer' && <ProfessionalMixer />}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="glass-surface mx-4 mb-4 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full als-pulse" />
                <span className="text-white/80">BPM: <span className="text-white font-mono font-bold">{bpm}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                <span className="text-white/80">Platform: <span className="text-white font-bold">{isElectron ? 'Desktop' : 'Web'}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full als-pulse" />
                <span className="text-white/80">Audio Engine: <span className="text-green-400 font-bold">Active</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                <span className="text-white/80">AI Assistant: <span className="text-blue-400 font-bold">Ready</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full als-pulse" />
                <span className="text-white/80">Bloom Menu: <span className="text-yellow-400 font-bold">Active</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
};

// Main StudioPage with Prime Brain Provider
const StudioPage: React.FC = () => {
  return (
    <PrimeBrainProvider>
      <ProjectProvider>
        <StudioPageInner />
      </ProjectProvider>
    </PrimeBrainProvider>
  );
};

export default StudioPage;
