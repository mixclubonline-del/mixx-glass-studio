/**
 * Mixx Club Studio - Professional Mixer Component
 * Advanced mixing console with routing, effects, and Prime Brain integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePrimeBrain } from '../../../contexts/PrimeBrainContext';
import AudioRoutingEngine from '../../../utils/AudioRoutingEngine';
import type { AudioTrack, EffectChain } from '../../../utils/AudioRoutingEngine';

interface MixerProps {
  audioContext?: AudioContext;
}

interface TrackState {
  track: AudioTrack;
  level: number;
  peak: number;
  isRecording: boolean;
  isPlaying: boolean;
}

const ProfessionalMixer: React.FC<MixerProps> = ({ audioContext }) => {
  const primeBrain = usePrimeBrain();
  const routingEngineRef = useRef<AudioRoutingEngine | null>(null);
  const [tracks, setTracks] = useState<TrackState[]>([]);
  const [masterLevel, setMasterLevel] = useState(0.75);
  const [auxLevels, setAuxLevels] = useState({ aux1: 0.5, aux2: 0.4 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize routing engine
  useEffect(() => {
    const initializeRouting = async () => {
      try {
        if (audioContext) {
          routingEngineRef.current = new AudioRoutingEngine(primeBrain);
          await routingEngineRef.current.initialize(audioContext);
          setIsInitialized(true);
          
          // Create default tracks
          createDefaultTracks();
          
          console.log('🎛️ Professional Mixer initialized');
        }
      } catch (error) {
        console.error('❌ Mixer initialization failed:', error);
      }
    };

    initializeRouting();

    return () => {
      if (routingEngineRef.current) {
        routingEngineRef.current.dispose();
      }
    };
  }, [audioContext, primeBrain]);

  const createDefaultTracks = () => {
    if (!routingEngineRef.current) return;

    const defaultTracks = [
      'Lead Vocal',
      'Backing Vocals',
      'Kick Drum',
      'Snare',
      'Hi-Hats',
      'Bass',
      '808 Sub',
      'Lead Synth'
    ];

    const newTracks = defaultTracks.map(name => {
      const track = routingEngineRef.current!.createAudioTrack(name);
      return {
        track,
        level: 0,
        peak: 0,
        isRecording: false,
        isPlaying: false
      };
    });

    setTracks(newTracks);
  };

  // Update track levels from routing engine
  useEffect(() => {
    if (!routingEngineRef.current || !isInitialized) return;

    const updateLevels = () => {
      const updatedTracks = tracks.map(trackState => {
        const metrics = routingEngineRef.current!.getTrackMetrics(trackState.track.id);
        return {
          ...trackState,
          level: metrics.level,
          peak: metrics.peak
        };
      });
      setTracks(updatedTracks);
    };

    const interval = setInterval(updateLevels, 50); // 20fps for smooth meters
    return () => clearInterval(interval);
  }, [tracks, isInitialized]);

  const handleTrackGain = (trackId: string, gain: number) => {
    if (routingEngineRef.current) {
      routingEngineRef.current.setTrackGain(trackId, gain);
      primeBrain.recordUserAction(`Track gain: ${gain.toFixed(2)}`);
    }
  };

  const handleTrackPan = (trackId: string, pan: number) => {
    if (routingEngineRef.current) {
      routingEngineRef.current.setTrackPan(trackId, pan);
      primeBrain.recordUserAction(`Track pan: ${pan.toFixed(2)}`);
    }
  };

  const handleTrackMute = (trackId: string, mute: boolean) => {
    if (routingEngineRef.current) {
      routingEngineRef.current.muteTrack(trackId, mute);
      primeBrain.recordUserAction(`Track ${mute ? 'muted' : 'unmuted'}`);
    }
  };

  const handleTrackSolo = (trackId: string, solo: boolean) => {
    if (routingEngineRef.current) {
      routingEngineRef.current.soloTrack(trackId, solo);
      primeBrain.recordUserAction(`Track ${solo ? 'soloed' : 'unsoloed'}`);
    }
  };

  const addSendToTrack = (trackId: string, auxBus: 'aux_1' | 'aux_2', level: number) => {
    if (routingEngineRef.current) {
      routingEngineRef.current.addSendToTrack(trackId, auxBus, level);
      primeBrain.recordUserAction(`Send added: ${level.toFixed(2)} to ${auxBus}`);
    }
  };

  const addEffectToTrack = (trackId: string, effectType: EffectChain['type']) => {
    if (!routingEngineRef.current) return;

    const effect: EffectChain = {
      id: `${effectType}_${Date.now()}`,
      name: effectType.charAt(0).toUpperCase() + effectType.slice(1),
      type: effectType,
      enabled: true,
      wet: 0.3,
      dry: 0.7,
      parameters: getDefaultEffectParameters(effectType),
      bypass: false
    };

    routingEngineRef.current.addEffectToTrack(trackId, effect);
    primeBrain.recordUserAction(`Added ${effectType} effect`);
  };

  const getDefaultEffectParameters = (type: EffectChain['type']): Record<string, number> => {
    switch (type) {
      case 'eq':
        return { frequency: 1000, q: 1, gain: 0 };
      case 'compressor':
        return { threshold: -12, ratio: 4, attack: 0.003, release: 0.25, knee: 30 };
      case 'reverb':
        return { roomSize: 0.7, damping: 0.5, preDelay: 20, diffusion: 0.8 };
      case 'delay':
        return { time: 375, feedback: 0.4, filter: 0.3, modulation: 0.1 };
      default:
        return {};
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing Professional Mixer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 p-4">
      <div className="glass-panel h-full">
        {/* Mixer Header */}
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Professional Mixer</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-300">
                  {isInitialized ? 'Routing Active' : 'Offline'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {tracks.length} Tracks • {primeBrain.state.systemStatus.audioEngine.active ? 'Engine Online' : 'Engine Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Mixer Console */}
        <div className="flex h-full">
          {/* Channel Strips */}
          <div className="flex-1 flex overflow-x-auto p-4 space-x-2">
            {tracks.map((trackState) => (
              <ChannelStrip
                key={trackState.track.id}
                trackState={trackState}
                onGainChange={(gain) => handleTrackGain(trackState.track.id, gain)}
                onPanChange={(pan) => handleTrackPan(trackState.track.id, pan)}
                onMute={(mute) => handleTrackMute(trackState.track.id, mute)}
                onSolo={(solo) => handleTrackSolo(trackState.track.id, solo)}
                onAddSend={(aux, level) => addSendToTrack(trackState.track.id, aux, level)}
                onAddEffect={(type) => addEffectToTrack(trackState.track.id, type)}
              />
            ))}
          </div>

          {/* Master Section */}
          <div className="w-32 border-l border-white/10 p-4">
            <MasterSection
              level={masterLevel}
              auxLevels={auxLevels}
              onMasterChange={setMasterLevel}
              onAuxChange={setAuxLevels}
              primeBrain={primeBrain}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Channel Strip Component
interface ChannelStripProps {
  trackState: TrackState;
  onGainChange: (gain: number) => void;
  onPanChange: (pan: number) => void;
  onMute: (mute: boolean) => void;
  onSolo: (solo: boolean) => void;
  onAddSend: (aux: 'aux_1' | 'aux_2', level: number) => void;
  onAddEffect: (type: EffectChain['type']) => void;
}

const ChannelStrip: React.FC<ChannelStripProps> = ({
  trackState,
  onGainChange,
  onPanChange,
  onMute,
  onSolo,
  onAddSend,
  onAddEffect
}) => {
  const [showEffects, setShowEffects] = useState(false);
  const { track, level, peak } = trackState;

  return (
    <div className="w-20 bg-gray-800/50 rounded-lg p-2 space-y-2">
      {/* Track Name */}
      <div className="text-xs text-center text-white font-medium truncate">
        {track.name}
      </div>

      {/* Level Meter */}
      <div className="h-32 bg-gray-700 rounded relative">
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded"
          style={{ height: `${Math.min(level * 100, 100)}%` }}
        />
        <div 
          className="absolute left-0 right-0 h-0.5 bg-white"
          style={{ bottom: `${Math.min(peak * 100, 100)}%` }}
        />
      </div>

      {/* Pan Control */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Pan</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          defaultValue={track.pan}
          onChange={(e) => onPanChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Gain Fader */}
      <div className="h-24 relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue={track.gain}
          onChange={(e) => onGainChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer"
          style={{ writingMode: 'vertical-lr' as any, WebkitAppearance: 'slider-vertical' }}
        />
      </div>

      {/* Control Buttons */}
      <div className="space-y-1">
        <button
          onClick={() => onMute(!track.mute)}
          className={`w-full py-1 px-2 text-xs rounded ${track.mute ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'}`}
        >
          MUTE
        </button>
        <button
          onClick={() => onSolo(!track.solo)}
          className={`w-full py-1 px-2 text-xs rounded ${track.solo ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-gray-300'}`}
        >
          SOLO
        </button>
      </div>

      {/* Send Controls */}
      <div className="space-y-1">
        <button
          onClick={() => onAddSend('aux_1', 0.2)}
          className="w-full py-1 px-2 text-xs rounded bg-purple-600 text-white hover:bg-purple-700"
        >
          AUX 1
        </button>
        <button
          onClick={() => onAddSend('aux_2', 0.15)}
          className="w-full py-1 px-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          AUX 2
        </button>
      </div>

      {/* Effects */}
      <div className="space-y-1">
        <button
          onClick={() => setShowEffects(!showEffects)}
          className="w-full py-1 px-2 text-xs rounded bg-orange-600 text-white hover:bg-orange-700"
        >
          FX
        </button>
        {showEffects && (
          <div className="space-y-1">
            <button onClick={() => onAddEffect('eq')} className="w-full py-1 px-1 text-xs rounded bg-gray-700 text-white">EQ</button>
            <button onClick={() => onAddEffect('compressor')} className="w-full py-1 px-1 text-xs rounded bg-gray-700 text-white">COMP</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Master Section Component
interface MasterSectionProps {
  level: number;
  auxLevels: { aux1: number; aux2: number };
  onMasterChange: (level: number) => void;
  onAuxChange: (levels: { aux1: number; aux2: number }) => void;
  primeBrain: any;
}

const MasterSection: React.FC<MasterSectionProps> = ({
  level,
  auxLevels,
  onMasterChange,
  onAuxChange,
  primeBrain
}) => {
  const systemHealth = primeBrain.getSystemHealth();
  const recommendations = primeBrain.getRecommendations().slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="text-center text-white font-bold">MASTER</div>
      
      {/* Master Level */}
      <div className="h-32 bg-gray-700 rounded relative">
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded"
          style={{ height: `${level * 100}%` }}
        />
      </div>
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={level}
        onChange={(e) => onMasterChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />

      {/* Aux Returns */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">AUX RETURNS</div>
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={auxLevels.aux1}
            onChange={(e) => onAuxChange({ ...auxLevels, aux1: parseFloat(e.target.value) })}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={auxLevels.aux2}
            onChange={(e) => onAuxChange({ ...auxLevels, aux2: parseFloat(e.target.value) })}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* System Health */}
      <div className="text-xs space-y-2">
        <div className="text-gray-400">SYSTEM HEALTH</div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${systemHealth > 0.8 ? 'bg-green-400' : systemHealth > 0.5 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
          <span className="text-white">{Math.round(systemHealth * 100)}%</span>
        </div>
      </div>

      {/* Prime Brain Recommendations */}
      {recommendations.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="text-gray-400">PRIME BRAIN</div>
          {recommendations.map((rec: any) => (
            <div key={rec.id} className="text-purple-300 text-xs">
              {rec.message.slice(0, 30)}...
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalMixer;