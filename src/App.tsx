

import React, { useState, useRef, createRef, useCallback, useEffect, useMemo } from 'react';
import FXWindow from './components/FXWindow';
import FXRack from './components/FXRack';
import Header from './components/Header';
import AddTrackModal from './components/AddTrackModal';
import { getVelvetCurveEngine, initializeVelvetCurveEngine, VelvetCurveState } from './audio/VelvetCurveEngine';
import VelvetCurveVisualizer from './components/VelvetCurveVisualizer';
import { getHarmonicLattice, initializeHarmonicLattice, HarmonicLatticeState } from './audio/HarmonicLattice';
import HarmonicLatticeVisualizer from './components/HarmonicLatticeVisualizer';
import MixxFXVisualizer from './components/MixxFXVisualizer';
import { analyzeVelvetCurve, FourAnchors, MusicalContext, calculateVelvetScore, getVelvetColor } from './types/sonic-architecture';
import TrackContextMenu from './components/TrackContextMenu';
import RenameTrackModal from './components/RenameTrackModal';
import ChangeColorModal from './components/ChangeColorModal';
import { BloomHUD } from './components/BloomHUD/BloomHUD';
import { useArrange, ArrangeClip, ClipId } from "./hooks/useArrange";
import { ArrangeWindow } from "./components/ArrangeWindow";
import ImportModal from './components/ImportModal';
import Mixer from './components/mixer/Mixer';
import PrimeBrainInterface from './components/PrimeBrainInterface';
import { getMixxFXEngine, initializeMixxFXEngine } from './audio/MixxFXEngine';
import { buildMasterChain } from './audio/masterChain';
import { serializeAudioBuffers, deserializeAudioBuffers } from './audio/serialization';
import { VelvetProcessor } from './audio/VelvetProcessor';
import { PluginId, PluginConfig, getPluginRegistry, PlaceholderAudioEngine } from './audio/plugins';
import TimeWarpVisualizer from './components/TimeWarpVisualizer';
import PluginBrowser from './components/PluginBrowser';
import { IAudioEngine } from './types/audio-graph';
import { getHushSystem } from './audio/HushSystem';
import AIHub from './components/AIHub/AIHub'; // Import AIHub


export interface TrackData {
  id: string;
  trackName: string;
  trackColor: 'cyan' | 'magenta' | 'blue' | 'green' | 'purple';
  waveformType: 'dense' | 'sparse' | 'varied' | 'bass';
  group: 'Vocals' | 'Harmony' | 'Adlibs' | 'Bass' | 'Drums' | 'Instruments';
  isProcessing?: boolean;
}

export interface AutomationPoint {
    time: number; // in seconds
    value: number; // typically 0-1.2 for volume, -1 to 1 for pan, or parameter-specific
}

// --- Web Audio Node Management ---
interface AudioNodes {
  gain: GainNode; // Fader
  panner: StereoPannerNode;
  analyser: AnalyserNode;
  input: GainNode; // Main input for the track chain
}
interface FxNode {
    input: GainNode; // Input to the FX Node wrapper
    output: GainNode; // Output from the FX Node wrapper
    engine?: IAudioEngine; // The actual IAudioEngine instance
    bypass: GainNode; // WET signal path gain
    direct: GainNode; // DRY signal path gain
}
export interface MixerSettings {
    volume: number;
    pan: number;
    isMuted: boolean;
}
export interface TrackAnalysisData {
    level: number;
    transient: boolean;
}
interface MasterNodes {
  input: BiquadFilterNode;
  glue: DynamicsCompressorNode;
  shaper: WaveShaperNode;
  preLimiter: GainNode;
  limiter: DynamicsCompressorNode;
  panner: StereoPannerNode;
  output: GainNode;
  analyser: AnalyserNode;
}


// --- Interactive FX Visualizer Components ---
export interface VisualizerProps<T = any> {
  connectedColor?: 'cyan' | 'magenta' | 'blue' | 'green' | 'purple';
  params: T;
  onChange: (param: string, value: any) => void;
  isPlaying?: boolean;
  currentTime?: number;
  // Automation specific props
  trackId: string;
  fxId: FxWindowId;
  automationData: Record<string, Record<string, Record<string, AutomationPoint[]>>>; // trackId -> fxId -> paramName -> points
  onAddAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, point: AutomationPoint) => void;
  onUpdateAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number, point: AutomationPoint) => void;
  onDeleteAutomationPoint: (trackId: string, fxId: FxWindowId, paramName: string, index: number) => void;
}


// FIX: Corrected FxWindowConfig type to use Omit, resolving a type conflict on the 'engineInstance' property.
export type FxWindowConfig = Omit<PluginConfig, 'engineInstance'> & {
    params: any;
    onChange: (param: string, value: any) => void;
    engineInstance: IAudioEngine;
};

export type FxWindowId = PluginId;


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [tracks, setTracks] = useState<TrackData[]>([{ id: 'track-1', trackName: 'AUDIO 1', trackColor: 'cyan', waveformType: 'varied', group: 'Vocals' }]);
  const [audioBuffers, setAudioBuffers] = useState<Record<string, AudioBuffer>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [bpm, setBpm] = useState(120);
  const audioContextRef = useRef<AudioContext | null>(null);
  const trackNodesRef = useRef<{ [key: string]: AudioNodes }>({});
  const fxNodesRef = useRef<{[key: string]: FxNode}>({}); // This will manage instances of ALL plugins
  const masterNodesRef = useRef<MasterNodes | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeSourcesRef = useRef<{ source: AudioBufferSourceNode, gain: GainNode }[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  
  const [isAddTrackModalOpen, setIsAddTrackModalModalOpen] = useState(false);
  const [mixerSettings, setMixerSettings] = useState<{ [key: string]: MixerSettings }>({ 'track-1': { volume: 0.75, pan: 0, isMuted: false } });
  const [soloedTracks, setSoloedTracks] = useState(new Set<string>());
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [masterBalance, setMasterBalance] = useState(0);
  const [trackAnalysis, setTrackAnalysis] = useState<{ [key: string]: TrackAnalysisData }>({});
  const [masterAnalysis, setMasterAnalysis] = useState({ level: 0, transient: false, waveform: new Uint8Array(128) });
  const masterLevelAvg = useRef(0.01);
  const [analysisResult, setAnalysisResult] = useState<FourAnchors | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [fileInputContext, setFileInputContext] = useState<'import' | 'load'>('import');
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; trackId: string } | null>(null);
  const [renameModal, setRenameModal] = useState<string | null>(null);
  const [changeColorModal, setChangeColorModal] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'arrange' | 'mixer'>('arrange');
  const [activePrimeBrainClipId, setActivePrimeBrainClipId] = useState<ClipId | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [armedTracks, setArmedTracks] = useState<Set<string>>(new Set());

  // --- Dynamic Inserts (Replaces useConnections for routing) ---
  const [inserts, setInserts] = useState<Record<string, FxWindowId[]>>({ 'track-1': [] }); // trackId -> [pluginId1, pluginId2, ...]
  const [isPluginBrowserOpen, setIsPluginBrowserOpen] = useState(false);
  const [trackIdForPluginBrowser, setTrackIdForPluginBrowser] = useState<string | null>(null);
  
  const [fxBypassState, setFxBypassState] = useState<Record<FxWindowId, boolean>>({});

  // --- Automation State ---
  // automationData: { [trackId]: { [fxId | 'track']: { [paramName]: AutomationPoint[] } } }
  const [automationData, setAutomationData] = useState<Record<string, Record<string, Record<string, AutomationPoint[]>>>>({});
  // visibleAutomationLanes: { [trackId]: { fxId: string, paramName: string } | null }
  const [visibleAutomationLanes, setVisibleAutomationLanes] = useState<Record<string, { fxId: string, paramName: string } | null>>({});
  const [automationParamMenu, setAutomationParamMenu] = useState<{ x: number; y: number; trackId: string; } | null>(null);

  // --- CONTEXTUAL ENGINE STATE ---
  const [musicalContext, setMusicalContext] = useState<MusicalContext>({ genre: 'Streaming', mood: 'Balanced' });
  
  // --- HUSH SYSTEM STATE ---
  const [isHushActive, setIsHushActive] = useState(false);
  const [hushFeedback, setHushFeedback] = useState({ color: '#1a1030', intensity: 0.0, isEngaged: false, noiseCount: 0 });
  let hushSystem = useMemo(() => getHushSystem(), []);
  const hushProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);

  // --- AI Hub State ---
  const [isAIHubOpen, setIsAIHubOpen] = useState(false);


  const { clips, setClips, selection, setSelection, clearSelection, ppsAPI, scrollX, setScrollX, moveClip, resizeClip, onSplitAt, setClipsSelect, duplicateClips, updateClipProperties } = useArrange({
    clips: []
  });

  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  // FIX: Corrected initialization to null for MediaStream ref
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  
  const recordingStartRef = useRef<number>(0);
  const recordedChunksRef = useRef<Record<string, Blob[]>>({});
  const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
  
  const projectDuration = useMemo(() => {
    if (!clips.length) return 60; // Default to 60 seconds if no clips
    let maxDuration = 0;
    clips.forEach(clip => {
      const clipEndTime = clip.start + clip.duration;
      if (clipEndTime > maxDuration) {
        maxDuration = clipEndTime;
      }
    });
    return Math.max(maxDuration + 5, 60); // Add some buffer time, min 60s
  }, [clips]);

  const getVelvetCurveState = useCallback(() => getVelvetCurveEngine().getState(), []);
  const [velvetCurveState, setVelvetCurveState] = useState<VelvetCurveState>(getVelvetCurveState);

  const handleVelvetCurveChange = useCallback((param: string, value: any) => {
    const engine = getVelvetCurveEngine();
    engine.setParameter(param, value); // Use generic setParameter
    setVelvetCurveState(engine.getState());
  }, [setVelvetCurveState]);
  
  const handleTimeWarpChange = useCallback((param: string, value: any) => {
    // Placeholder for TimeWarp FX parameter changes
    // In a real scenario, this would interact with a TimeWarpEngine instance
    // console.log(`TimeWarp: ${param} changed to ${value}`);
    // For now, update the fxWindows state directly for visualization if it's a fixed instance
  }, []);

  const getHarmonicLatticeState = useCallback(() => getHarmonicLattice().getHarmonicLatticeState(), []);
  const [harmonicLatticeState, setHarmonicLatticeState] = useState<HarmonicLatticeState>(getHarmonicLatticeState);

  // For HarmonicLattice, its state changes internally, so we need to poll/update.
  useEffect(() => {
    const engine = getHarmonicLattice();
    if (engine.isActive()) {
      const interval = setInterval(() => {
        setHarmonicLatticeState(engine.getHarmonicLatticeState());
      }, 100); // Update UI every 100ms
      return () => clearInterval(interval);
    }
  }, [getHarmonicLatticeState]);


  const handleMixxFXChange = useCallback((param: string, value: any) => {
    getMixxFXEngine().setParameter(param, value);
    // MixxFXEngine's internal state is simpler, so direct interaction is fine
  }, []);


  const handleContextChange = useCallback((newContext: MusicalContext) => {
    setMusicalContext(newContext);
    const engine = getVelvetCurveEngine();
    engine.setContext(newContext);
    // Crucially, update the React state to reflect the engine's new internal state
    setVelvetCurveState(engine.getState());
  }, [setVelvetCurveState]);

  // Lazy initialization of pluginRegistry
  const [pluginRegistry, setPluginRegistry] = useState<PluginConfig[]>([]);
  const engineInstancesRef = useRef<Map<PluginId, IAudioEngine>>(new Map());


  // All FX Window configurations based on the registry
  const fxWindows: FxWindowConfig[] = useMemo(() => {
    if (!audioContextRef.current) return [];
    
    return pluginRegistry.map(plugin => {
      const engineInstance = engineInstancesRef.current.get(plugin.id);
      if (!engineInstance) {
          console.error(`Engine instance not found for plugin: ${plugin.id}`);
          // This should still conform to the structure to avoid further errors down the line
          const { engineInstance: _factory, ...pluginWithoutFactory } = plugin;
          return { ...pluginWithoutFactory, params: {}, onChange: () => {}, engineInstance: null as any };
      }

      let params: any;
      let onChange: (param: string, value: any) => void;
      
      switch (plugin.id) {
        case 'velvet-curve':
          params = velvetCurveState;
          onChange = handleVelvetCurveChange;
          break;
        case 'harmonic-lattice':
          params = harmonicLatticeState;
          onChange = () => {}; // HarmonicLattice updates internally
          break;
        case 'mixx-fx':
          params = { drive: engineInstance.getParameter('drive'), tone: engineInstance.getParameter('tone'), depth: engineInstance.getParameter('depth'), mix: engineInstance.getParameter('mix') };
          onChange = handleMixxFXChange;
          break;
        case 'time-warp':
          params = { warp: engineInstance.getParameter('warp'), intensity: engineInstance.getParameter('intensity') }; // Assuming TimeWarp has these params
          onChange = handleTimeWarpChange;
          break;
        default:
          // For generic MixxClub plugins, use PlaceholderAudioEngine
          params = engineInstance.getParameterNames().reduce((acc: any, paramName: string) => {
            acc[paramName] = engineInstance.getParameter(paramName);
            return acc;
          }, {});
          onChange = (param: string, value: any) => {
              // Placeholder for generic plugin param changes
              // console.log(`Generic Plugin ${plugin.id}: ${param} changed to ${value}`);
              engineInstance.setParameter(param, value);
          };
      }
      const { engineInstance: _factory, ...pluginWithoutFactory } = plugin;
      return { ...pluginWithoutFactory, params, onChange, engineInstance };
    });
  }, [velvetCurveState, harmonicLatticeState, handleVelvetCurveChange, handleMixxFXChange, handleTimeWarpChange, pluginRegistry]);


  const [fxVisibility, setFxVisibility] = useState<Record<FxWindowId, boolean>>(() => {
    const initialVisibility: Record<FxWindowId, boolean> = {};
    return initialVisibility;
  });

  const handleToggleFxVisibility = useCallback((fxId: FxWindowId) => {
      setFxVisibility(prev => ({ ...prev, [fxId]: !prev[fxId] }));
  }, []);

  // Handler to open specific FX Window when clicked from insert badge
  const handleOpenPluginSettings = useCallback((fxId: FxWindowId) => {
    setFxVisibility(prev => ({ ...prev, [fxId]: true }));
  }, []);

  const handleSeek = (time: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) handlePlayPause(); // Stop first
    setCurrentTime(time);
    if (wasPlaying) handlePlayPause(); // Then restart at new time
  };
  
  const handleRewind = () => handleSeek(Math.max(0, currentTime - 5));
  const handleFastForward = () => handleSeek(Math.min(projectDuration, currentTime + 5));
  const handleToggleLoop = () => setIsLooping(!isLooping);

  const startBackgroundStemSeparation = (originalTrackId: string, buffer: AudioBuffer, bufferId: string, fileName: string) => {
      setTimeout(() => {
        const stemsToCreate = ['Vocals', 'Drums', 'Bass', 'Other'];
        const newTracks: TrackData[] = [];
        const newClips: ArrangeClip[] = [];
        const newSettings: { [key: string]: MixerSettings } = {};
        const trackColors: TrackData['trackColor'][] = ['magenta', 'blue', 'green', 'purple'];

        stemsToCreate.forEach((stemName, index) => {
            const newTrackId = `track-stem-${Date.now()}-${stemName.toLowerCase().replace(/\s/g, '-')}`;
            const color = trackColors[index % trackColors.length];
            const newTrack: TrackData = {
                id: newTrackId,
                trackName: `${fileName} - ${stemName.toUpperCase()}`,
                trackColor: color,
                waveformType: 'varied',
                group: 'Instruments',
            };
            newTracks.push(newTrack);

            const newClip: ArrangeClip = {
                id: `clip-stem-${Date.now()}-${stemName.toLowerCase().replace(/\s/g, '-')}`,
                trackId: newTrackId,
                name: stemName.toUpperCase(),
                color: color === 'cyan' ? '#06b6d4' : color === 'magenta' ? '#d946ef' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#22c55e' : color === 'purple' ? '#8b5cf6' : '#8b5cf6',
                start: 0,
                duration: buffer.duration,
                originalDuration: buffer.duration,
                timeStretchRate: 1.0,
                sourceStart: 0,
                // FIX: Corrected variable name from `newBufferId` to `bufferId`
                bufferId: bufferId
            };
            newClips.push(newClip);
            newSettings[newTrackId] = { volume: 0.75, pan: 0, isMuted: false };
        });

        // Update the original track to no longer be processing
        setTracks(prev => {
            const originalTrackIndex = prev.findIndex(t => t.id === originalTrackId);
            if (originalTrackIndex === -1) return prev; 
            
            const updatedTracks = [...prev];
            updatedTracks[originalTrackIndex] = { ...updatedTracks[originalTrackIndex], isProcessing: false };
            updatedTracks.splice(originalTrackIndex + 1, 0, ...newTracks); // Insert stems below original
            return updatedTracks;
        });

        // Mute original track and add settings for new stems
        setMixerSettings(prev => ({
            ...prev,
            [originalTrackId]: { ...prev[originalTrackId], isMuted: true },
            ...newSettings,
        }));

        setClips(prev => [...prev, ...newClips]);
        
        console.log(`%c[INTELLIGENT INGESTION] Background processing complete. Created ${newTracks.length} stem tracks.`, "color: #06b6d4; font-weight: bold;");
        setImportMessage(null);
      }, 3500); // 3.5 second simulation
  };


  const handleFileImport = async (buffer: AudioBuffer, fileName: string) => {
      if (!audioContextRef.current) return;
      
      setImportMessage('Applying Velvet Sonics...');

      const velvetProcessor = new VelvetProcessor(audioContextRef.current);
      const processedBuffer = await velvetProcessor.processAudioBuffer(buffer, {
          profile: { // Direct definition of a MasteringProfile for 'streaming'
            name: 'Streaming Standard',
            targetLUFS: -14,
            velvetFloor: { depth: 70, translation: 'deep', warmth: 60 },
            harmonicLattice: { character: 'warm', presence: 75, airiness: 70 },
            phaseWeave: { width: 80, monoCompatibility: 90 }
          }
      });
      
      const newBufferId = `buffer-import-${Date.now()}`;
      
      console.log("%c[DAW CORE] New audio imported. Resetting project and starting intelligent ingestion.", "color: orange; font-weight: bold;");
      
      // Clear ALL existing state for a fresh project
      setAudioBuffers({ [newBufferId]: processedBuffer });
      setTracks([]); // Clear tracks
      setClips([]); // Clear clips
      setMixerSettings({}); // Clear mixer settings
      setInserts({}); // Clear inserts
      setAutomationData({}); // Clear automation
      setVisibleAutomationLanes({}); // Clear visible lanes
      setFxBypassState({}); // Clear FX bypass state

      const newTrackId = `track-import-${Date.now()}`;
      const newTrackColor = 'cyan' as TrackData['trackColor'];
      const newTrack: TrackData = {
          id: newTrackId,
          trackName: fileName.toUpperCase(),
          trackColor: newTrackColor,
          waveformType: 'varied',
          group: 'Instruments',
          isProcessing: true, // Indicate background stem separation
      };
      const newClip: ArrangeClip = {
          id: `clip-import-${Date.now()}`,
          trackId: newTrackId,
          name: 'FULL MIX',
          color: '#06b6d4',
          start: 0,
          duration: processedBuffer.duration,
          originalDuration: processedBuffer.duration,
          timeStretchRate: 1.0,
          sourceStart: 0,
          bufferId: newBufferId
      };
      
      setTracks([newTrack]);
      setClips([newClip]);
      setMixerSettings({ [newTrackId]: { volume: 0.75, pan: 0, isMuted: false } });
      setInserts({ [newTrackId]: [] }); // Initialize inserts for new track
      
      setImportMessage('Prime Brain is analyzing stems...');
      startBackgroundStemSeparation(newTrackId, processedBuffer, newBufferId, fileName);
  };
  
  const handleSaveProject = async () => {
      const serializedBuffers = await serializeAudioBuffers(audioBuffers);
      const projectState = {
          tracks,
          clips,
          mixerSettings,
          inserts, // Save the new inserts state
          masterVolume,
          masterBalance,
          isLooping,
          bpm, // Save BPM
          ppsValue: ppsAPI.value,
          scrollX,
          audioBuffers: serializedBuffers,
          automationData,
          visibleAutomationLanes,
          musicalContext,
          fxBypassState, // Save FX bypass state
      };

      const jsonString = JSON.stringify(projectState, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow-project-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log("Project saved.");
  };

  const handleProjectLoad = async (projectState: any) => {
      if (!audioContextRef.current) return;
      stopPlayback();
      setIsPlaying(false);

      const deserializedBuffers = await deserializeAudioBuffers(projectState.audioBuffers, audioContextRef.current);

      setTracks(projectState.tracks || []);
      // FIX: Ensure numeric properties of clips are correctly parsed as numbers during load
      setClips(projectState.clips?.map((c: any) => ({
          ...c,
          start: parseFloat(c.start || 0), // Use parseFloat and provide default if undefined
          duration: parseFloat(c.duration || 0),
          sourceStart: parseFloat(c.sourceStart || 0),
          originalDuration: parseFloat(c.originalDuration || c.duration || 0),
          timeStretchRate: parseFloat(c.timeStretchRate || 1.0),
          fadeIn: parseFloat(c.fadeIn || 0),
          fadeOut: parseFloat(c.fadeOut || 0),
          gain: parseFloat(c.gain || 1.0),
      })) || []);
      setMixerSettings(projectState.mixerSettings || {});
      setInserts(projectState.inserts || {}); // Load the inserts state
      // FIX: Ensure masterVolume is parsed as a number
      setMasterVolume(parseFloat(projectState.masterVolume || 0.8));
      // FIX: Ensure masterBalance is parsed as a number
      setMasterBalance(parseFloat(projectState.masterBalance || 0));
      setIsLooping(projectState.isLooping || false);
      // FIX: Ensure bpm is parsed as a number
      setBpm(parseFloat(projectState.bpm || 120)); // Load BPM
      // FIX: Ensure ppsValue is parsed as a number
      ppsAPI.set(parseFloat(projectState.ppsValue || 60));
      // FIX: Ensure scrollX is parsed as a number
      setScrollX(parseFloat(projectState.scrollX || 0));
      setAudioBuffers(deserializedBuffers);
      setAutomationData(projectState.automationData || {});
      setVisibleAutomationLanes(projectState.visibleAutomationLanes || {});
      setMusicalContext(projectState.musicalContext || { genre: 'Streaming', mood: 'Balanced' });
      setFxBypassState(projectState.fxBypassState || {}); // Load FX bypass state
      
      console.log("Project loaded.");
  };

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !audioContextRef.current) return;
      
      setImportMessage(fileInputContext === 'import' ? 'Decoding Audio...' : 'Loading Project...');
      try {
          if (fileInputContext === 'import') {
              const arrayBuffer = await file.arrayBuffer();
              const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
              const fileName = file.name.replace(/\.[^/.]+$/, "");
              handleFileImport(decodedBuffer, fileName);
              setImportMessage(null); // Clear message on successful import
          } else if (fileInputContext === 'load') {
              if (!file.name.toLowerCase().endsWith('.json')) {
                  throw new Error("Invalid file type: Please select a .json project file.");
              }
              const fileContent = await file.text();
              const projectState = JSON.parse(fileContent);
              handleProjectLoad(projectState);
              setImportMessage(null); // Clear message on successful load
          }
      } catch (error) {
          console.error("Error handling file:", error);
          let errorMessage = 'Error processing file.';
          if (error instanceof Error) {
              errorMessage = error.message;
          } else if (typeof error === 'string') {
              errorMessage = error;
          }
          setImportMessage(errorMessage);
          setTimeout(() => setImportMessage(null), 3000);
      } finally {
          if (event.target) event.target.value = '';
      }
  };

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prevIsPlaying => {
      const newIsPlaying = !prevIsPlaying;
      if (audioContextRef.current) {
        if (newIsPlaying) {
          audioContextRef.current.resume();
        } else {
          audioContextRef.current.suspend();
        }
      }
      return newIsPlaying;
    });
  }, []);

  const isAnyTrackArmed = armedTracks.size > 0; // Define isAnyTrackArmed here

  const handleBloomAction = (action: string, payload?: any) => {
      switch (action) {
          case 'addTrack':
              setIsAddTrackModalModalOpen(true);
              break;
          case 'importAudio':
              setFileInputContext('import');
              fileInputRef.current?.click();
              break;
          case 'saveProject':
              handleSaveProject();
              break;
          case 'loadProject':
              setFileInputContext('load');
              fileInputRef.current?.click();
              break;
          case 'toggleHush':
              if (isAnyTrackArmed) { // Use the defined isAnyTrackArmed
                  setIsHushActive(prev => !prev);
              }
              break;
          case 'resetMix':
              setMixerSettings(prev => {
                  const newSettings = { ...prev };
                  tracks.forEach(t => {
                      newSettings[t.id] = { ...newSettings[t.id], volume: 0.75, pan: 0 };
                  });
                  return newSettings;
              });
              setMasterVolume(0.8);
              setMasterBalance(0);
              console.log("Mix settings reset.");
              break;
          case 'analyzeMaster':
              (async () => {
                  const firstClip = clips[0];
                  if (!firstClip || !audioBuffers[firstClip.bufferId]) {
                      console.warn("Prime Brain: No audio on timeline to analyze.");
                      setImportMessage(null);
                      return;
                  }
                  const bufferToAnalyze = audioBuffers[firstClip.bufferId];

                  console.log("%c[PRIME BRAIN] Analyzing sonic DNA...", "color: #f59e0b; font-weight: bold;");
                  setImportMessage("Prime Brain Analyzing...");

                  const analysis = await analyzeVelvetCurve(bufferToAnalyze);
                  
                  console.log("[PRIME BRAIN] Analysis complete:", analysis);
                  setAnalysisResult(analysis);
                  
                  const velvetEngine = getVelvetCurveEngine();
                  velvetEngine.adaptToAnchors(analysis);
                  
                  setVelvetCurveState(velvetEngine.getState());

                  // FIX: Corrected typo from getHarmaticLattice to getHarmonicLattice
                  const harmonicLatticeEngine = getHarmonicLattice();
                  // Example: Map 'soul' and 'silk' anchors to emotional bias for HarmonicLattice
                  const emotionalBias = (analysis.soul / 100 + analysis.silk / 100) / 2;
                  harmonicLatticeEngine.setEmotionalBias(emotionalBias);

                  setImportMessage(null);
              })();
              break;
          case 'manageFx':
              // Handled by BloomHUD directly for now, no global action needed
              break;
          case 'engagePrimeBrain':
              setActivePrimeBrainClipId(payload as ClipId);
              break;
          case 'splitClipAtPlayhead':
              onSplitAt(payload as ClipId, currentTime);
              // Also split automation data
              setAutomationData(prev => {
                const updated = { ...prev };
                const clipToSplit = clips.find(c => c.id === payload);
                if (clipToSplit && updated[clipToSplit.trackId]) {
                  for (const fxId in updated[clipToSplit.trackId]) {
                    for (const paramName in updated[clipToSplit.trackId][fxId]) {
                      const points = updated[clipToSplit.trackId][fxId][paramName];
                      if (points) {
                        const newPoints: AutomationPoint[] = [];
                        let splitValue = 0; // Value at the split point
                        
                        // Determine value at split point for two new points
                        const nextPointIndex = points.findIndex(p => p.time > currentTime);
                        if (nextPointIndex === 0) {
                            splitValue = points[0].value;
                        } else if (nextPointIndex === -1) {
                            splitValue = points[points.length - 1].value;
                        } else {
                            const prevPoint = points[nextPointIndex - 1];
                            const nextPoint = points[nextPointIndex];
                            const timeDiff = nextPoint.time - prevPoint.time;
                            const factor = (currentTime - prevPoint.time) / timeDiff;
                            splitValue = prevPoint.value + factor * (nextPoint.value - prevPoint.value);
                        }

                        // Filter points, add new points at split time
                        const firstPartPoints = points.filter(p => p.time < currentTime);
                        const secondPartPoints = points.filter(p => p.time > currentTime);
                        
                        // Add split points for each new clip, ensuring value continuity
                        if (firstPartPoints.length > 0 || secondPartPoints.length > 0) {
                           newPoints.push(...firstPartPoints, { time: currentTime, value: splitValue }, { time: currentTime, value: splitValue }, ...secondPartPoints);
                        }
                        updated[clipToSplit.trackId][fxId][paramName] = newPoints.sort((a,b) => a.time - b.time);
                      }
                    }
                  }
                }
                return updated;
              });
              break;
          case 'duplicateClips':
              duplicateClips(payload as ClipId[]);
              // Also duplicate automation data for selected clips
              setAutomationData(prev => {
                const updated = { ...prev };
                const selectedClips = clips.filter(c => (payload as ClipId[]).includes(c.id));
                if (!selectedClips.length) return prev;

                const maxEndTime = selectedClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
                const duplicateOffset = 1; // Offset new clips by 1 second

                selectedClips.forEach(originalClip => {
                  const originalTrackAutomation = prev[originalClip.trackId];
                  if (originalTrackAutomation) {
                    // Create new automation data for the duplicated clip's track and associated FX
                    const newTrackId = tracks.find(t => t.id === originalClip.trackId)?.id; // Assuming tracks state is updated
                    if (newTrackId) {
                      for (const fxId in originalTrackAutomation) {
                        for (const paramName in originalTrackAutomation[fxId]) {
                          const originalPoints = originalTrackAutomation[fxId][paramName];
                          const newPoints = originalPoints.map(p => ({
                            ...p,
                            time: p.time + (maxEndTime + duplicateOffset - originalClip.start), // Offset by the same amount as clips
                          }));
                          
                          if (!updated[newTrackId]) updated[newTrackId] = {};
                          if (!updated[newTrackId][fxId]) updated[newTrackId][fxId] = {};
                          updated[newTrackId][fxId][paramName] = newPoints;
                        }
                      }
                    }
                  }
                });
                return updated;
              });
              break;
          case 'openAIHub':
              setIsAIHubOpen(true);
              break;
          default:
              console.warn(`Unknown Bloom HUD action: ${action}`);
      }
  };
  
  const handleAddTrack = useCallback((newTrack: Omit<TrackData, 'id'>) => {
    const newTrackData: TrackData = {
        ...newTrack,
        id: `track-${Math.random().toString(36).substring(2, 9)}`
    };
    setTracks(prev => [...prev, newTrackData]);
    setMixerSettings(prev => ({
        ...prev,
        [newTrackData.id]: { volume: 0.75, pan: 0, isMuted: false }
    }));
    setInserts(prev => ({ // Initialize inserts for new track
      ...prev,
      [newTrackData.id]: []
    }));
    setSelectedTrackId(newTrackData.id); // UX improvement: select the new track
    setIsAddTrackModalModalOpen(false);
  }, []);

  const handleMixerChange = useCallback((trackId: string, setting: keyof MixerSettings, value: number | boolean) => {
    setMixerSettings(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [setting]: value
      }
    }));
  }, []);

  const isMixerSettingKey = (setting: string | number | symbol): setting is keyof MixerSettings => {
    return typeof setting === 'string' && (setting === 'volume' || setting === 'pan' || setting === 'isMuted');
  };

  const handleMixerChangeForMixer = useCallback(
    (trackId: string, setting: string | number | symbol, value: number | boolean) => {
      if (isMixerSettingKey(setting)) {
        handleMixerChange(trackId, setting, value);
      }
    },
    [handleMixerChange]
  );

  const handleToggleSolo = (trackId: string) => {
    setSoloedTracks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(trackId)) {
            newSet.delete(trackId);
        } else {
            newSet.add(trackId);
        }
        return newSet;
    });
  };

  const handleToggleArm = (trackId: string) => {
      setArmedTracks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(trackId)) {
            newSet.delete(trackId);
        } else {
            newSet.add(trackId);
        }
        return newSet;
    });
  }

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, trackId });
  };

  const handleDeleteTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setClips(prev => prev.filter(c => c.trackId !== trackId));
    setMixerSettings(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setInserts(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setAutomationData(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setVisibleAutomationLanes(prev => { const { [trackId]: _, ...rest } = prev; return rest; });
    setSoloedTracks(prev => { const newSet = new Set(prev); newSet.delete(trackId); return newSet; });
    setArmedTracks(prev => { const newSet = new Set(prev); newSet.delete(trackId); return newSet; });
    setContextMenu(null);
    if (selectedTrackId === trackId) setSelectedTrackId(null);
  };
  
  const handleRenameTrack = (trackId: string, newName: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, trackName: newName.toUpperCase() } : t));
    setRenameModal(null);
  };

  const handleChangeColor = (trackId: string, newColor: TrackData['trackColor']) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, trackColor: newColor } : t));
    setChangeColorModal(null);
  };
  
  // --- Dynamic Plugin Management ---
  const handleAddPlugin = useCallback((trackId: string, pluginId: FxWindowId) => {
    setInserts(prev => {
      const currentInserts = prev[trackId] || [];
      return {
        ...prev,
        [trackId]: [...currentInserts, pluginId],
      };
    });
    // Initialize bypass state for the new plugin if it doesn't exist
    setFxBypassState(prev => ({
      ...prev,
      [pluginId]: prev[pluginId] ?? false, // Default to not bypassed
    }));
    setIsPluginBrowserOpen(false);
    setTrackIdForPluginBrowser(null);
  }, []);

  const handleRemovePlugin = useCallback((trackId: string, index: number) => {
    setInserts(prev => {
      const currentInserts = prev[trackId] || [];
      const removedPluginId = currentInserts[index];
      const updatedInserts = currentInserts.filter((_, i) => i !== index);
      
      // Clear automation data for the removed plugin
      setAutomationData(autoPrev => {
        const updatedAutomation = { ...autoPrev };
        if (updatedAutomation[trackId] && removedPluginId) {
          const { [removedPluginId]: _, ...restFxAutomation } = updatedAutomation[trackId];
          updatedAutomation[trackId] = restFxAutomation;
        }
        return updatedAutomation;
      });

      // Clear visible automation lane if it belonged to the removed plugin
      setVisibleAutomationLanes(visiblePrev => {
        const updatedVisible = { ...visiblePrev };
        if (updatedVisible[trackId]?.fxId === removedPluginId) {
          updatedVisible[trackId] = null;
        }
        return updatedVisible;
      });

      // Reset bypass state for the removed plugin
      setFxBypassState(bypassPrev => {
        const updatedBypass = { ...bypassPrev };
        if (removedPluginId) {
          const { [removedPluginId]: _, ...restBypassState } = updatedBypass;
          return restBypassState;
        }
        return bypassPrev;
      });

      return {
        ...prev,
        [trackId]: updatedInserts,
      };
    });
  }, []);

  const handleMovePlugin = useCallback((trackId: string, fromIndex: number, toIndex: number) => {
    setInserts(prev => {
      const currentInserts = prev[trackId] || [];
      const [moved] = currentInserts.splice(fromIndex, 1);
      currentInserts.splice(toIndex, 0, moved);
      return {
        ...prev,
        [trackId]: [...currentInserts], // Create new array for state update
      };
    });
  }, []);

    // --- Automation Handlers ---
  const handleToggleAutomationLane = useCallback((trackId: string, fxId: string, paramName: string) => {
    setVisibleAutomationLanes(prev => {
      const current = prev[trackId];
      if (current && current.fxId === fxId && current.paramName === paramName) {
        return { ...prev, [trackId]: null }; // Hide if already visible
      }
      return { ...prev, [trackId]: { fxId, paramName } }; // Show new lane
    });
    setAutomationParamMenu(null); // Close menu after selection
  }, []);


  const handleAddAutomationPoint = useCallback((trackId: string, fxId: string, paramName: string, point: AutomationPoint) => {
    setAutomationData(prev => {
        const trackAutomation = prev[trackId] || {};
        const fxAutomation = trackAutomation[fxId] || {};
        const paramPoints = [...(fxAutomation[paramName] || []), point];
        paramPoints.sort((a, b) => a.time - b.time);
        return { 
          ...prev, 
          [trackId]: {
            ...trackAutomation,
            [fxId]: {
              ...fxAutomation,
              [paramName]: paramPoints
            }
          }
        };
    });
  }, []);
  
  const handleUpdateAutomationPoint = useCallback((trackId: string, fxId: string, paramName: string, index: number, newPoint: AutomationPoint) => {
    setAutomationData(prev => {
        const trackAutomation = prev[trackId];
        if (!trackAutomation) return prev;
        const fxAutomation = trackAutomation[fxId];
        if (!fxAutomation) return prev;
        const paramPoints = [...fxAutomation[paramName]];
        paramPoints[index] = newPoint;
        paramPoints.sort((a, b) => a.time - b.time); // Re-sort if time changed
        return { 
          ...prev, 
          [trackId]: {
            ...trackAutomation,
            [fxId]: {
              ...fxAutomation,
              [paramName]: paramPoints
            }
          }
        };
    });
  }, []);
  
  const handleDeleteAutomationPoint = useCallback((trackId: string, fxId: string, paramName: string, index: number) => {
    setAutomationData(prev => {
        const trackAutomation = prev[trackId];
        if (!trackAutomation) return prev;
        const fxAutomation = trackAutomation[fxId];
        if (!fxAutomation) return prev;
        const paramPoints = fxAutomation[paramName].filter((_, i) => i !== index);
        return { 
          ...prev, 
          [trackId]: {
            ...trackAutomation,
            [fxId]: {
              ...fxAutomation,
              [paramName]: paramPoints
            }
          }
        };
    });
  }, []);

  // Audio setup effect
  useEffect(() => {
    let isCancelled = false;
    let ctx: AudioContext | null = null;

    const setupAudio = async () => {
        console.log("Setting up AudioContext and FX engines...");
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const createdCtx = new AudioCtx();

        if (isCancelled) {
            await createdCtx.close().catch(() => {});
            return;
        }

        // Reset graph containers before wiring up the new context
        trackNodesRef.current = {};
        fxNodesRef.current = {};
        engineInstancesRef.current.clear();
        masterNodesRef.current = null;
        audioContextRef.current = createdCtx;
        ctx = createdCtx;

        const duration = 1;
        const sampleRate = createdCtx.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = createdCtx.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.2; // A4 tone
        }
        if (isCancelled) {
            await createdCtx.close().catch(() => {});
            return;
        }
        setAudioBuffers({ 'default': buffer });
        console.log("Default audio buffer created.");

        masterNodesRef.current = buildMasterChain(createdCtx);
        masterNodesRef.current.output.connect(createdCtx.destination);
        console.log("Master Chain built and connected to destination.");
        
        const initialPluginRegistry = getPluginRegistry(createdCtx);
        if (isCancelled) {
            await createdCtx.close().catch(() => {});
            return;
        }
        setPluginRegistry(initialPluginRegistry);
        console.log("Plugin Registry loaded.");

        engineInstancesRef.current.clear();
        for (const plugin of initialPluginRegistry) {
            if (isCancelled) break;
            const engine = plugin.engineInstance(createdCtx);
            engineInstancesRef.current.set(plugin.id, engine);
            if (typeof engine.initialize === 'function' && !engine.getIsInitialized()) {
                await engine.initialize(createdCtx);
                console.log(`Plugin engine for ${plugin.name} initialized.`);
            }
        }
        if (isCancelled) {
            return;
        }
        console.log("All plugin engines initialized and stored.");

        setFxBypassState(() => {
          const initialState: Record<FxWindowId, boolean> = {};
          initialPluginRegistry.forEach(plugin => (initialState[plugin.id] = false));
          return initialState;
        });
    };
    setupAudio();

    return () => {
        isCancelled = true;
        console.log("Closing AudioContext.");

        // Disconnect track nodes
        Object.values(trackNodesRef.current).forEach(nodes => {
            try {
                nodes.input.disconnect();
                nodes.gain.disconnect();
                nodes.panner.disconnect();
                nodes.analyser.disconnect();
            } catch (err) {
                console.warn("Error disconnecting track nodes during cleanup:", err);
            }
        });
        trackNodesRef.current = {};

        // Disconnect FX nodes
        Object.values(fxNodesRef.current).forEach(fxNode => {
            try {
                fxNode.input.disconnect();
                fxNode.output.disconnect();
                fxNode.bypass.disconnect();
                fxNode.direct.disconnect();
                fxNode.engine?.dispose?.();
            } catch (err) {
                console.warn("Error disconnecting FX nodes during cleanup:", err);
            }
        });
        fxNodesRef.current = {};

        engineInstancesRef.current.forEach(engine => {
            if (engine && typeof engine.dispose === 'function') {
                try {
                    engine.dispose();
                } catch (err) {
                    console.warn("Error disposing engine during cleanup:", err);
                }
            }
        });
        engineInstancesRef.current.clear();

        masterNodesRef.current = null;
        hushProcessorNodeRef.current = null;
        micSourceNodeRef.current = null;

        const contextToClose = ctx ?? audioContextRef.current;
        audioContextRef.current = null;
        if (contextToClose) {
            contextToClose.close().catch(() => {});
        }
    };
  }, []);


  // Set clock for beat-locked LFOs
  useEffect(() => {
    if (!audioContextRef.current || pluginRegistry.length === 0) return;

    const getBeatPhase = () => {
      if (!isPlaying) return 0;
      const beatDuration = 60 / bpm;
      return (currentTime % beatDuration) / beatDuration;
    };

    engineInstancesRef.current.forEach(engine => {
        if (engine && typeof engine.setClock === 'function') {
            engine.setClock(getBeatPhase);
        }
    });

  }, [isPlaying, currentTime, pluginRegistry, bpm]);


  // Create/Destroy track audio nodes when tracks change
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const currentTrackIds = new Set(tracks.map(t => t.id));
    const existingNodeIds = new Set(Object.keys(trackNodesRef.current));

    // Create nodes for new tracks
    tracks.forEach(track => {
        if (!existingNodeIds.has(track.id)) {
            trackNodesRef.current[track.id] = {
                input: ctx.createGain(), // Main input for signal chain
                gain: ctx.createGain(),
                panner: ctx.createStereoPanner(),
                analyser: ctx.createAnalyser(),
            };
            // Initial connection will be handled by the main routing useEffect
            // Nodes are created, but connections established later
        }
    });

    // Destroy nodes for removed tracks
    existingNodeIds.forEach(id => {
        if (!currentTrackIds.has(id)) {
            const nodes = trackNodesRef.current[id];
            // Disconnect all nodes in the chain
            try {
              nodes.input.disconnect();
              nodes.gain.disconnect();
              nodes.panner.disconnect();
              nodes.analyser.disconnect();
            } catch (e) { console.warn(`Error disconnecting nodes for track ${id}:`, e); }
            delete trackNodesRef.current[id];
            console.log(`%c[AUDIO] Disposed nodes for track: ${id}`, "color: grey");
        }
    });
  }, [tracks]);

    // Update audio graph based on mixer settings (pan only) - automation overrides gain
    useEffect(() => {
        tracks.forEach(track => {
            const nodes = trackNodesRef.current[track.id];
            const settings = mixerSettings[track.id];
            if (nodes && settings && audioContextRef.current) {
                // Volume automation handles nodes.gain.gain.value
                // Pan is still controlled by mixer settings if not automated
                nodes.panner.pan.setTargetAtTime(settings.pan, audioContextRef.current.currentTime, 0.01);
            }
        });
    }, [mixerSettings, tracks]);

    // Connect master volume and pan controls to the audio engine
    useEffect(() => {
        if (masterNodesRef.current && audioContextRef.current) {
            const now = audioContextRef.current.currentTime;
            masterNodesRef.current.output.gain.setTargetAtTime(masterVolume, now, 0.01);
            if (masterNodesRef.current.panner) {
                masterNodesRef.current.panner.pan.setTargetAtTime(masterBalance, now, 0.01);
            }
        }
    }, [masterVolume, masterBalance]);


    // Create/Update FX nodes for ALL plugins in registry with proper bypass circuit
    useEffect(() => {
      const ctx = audioContextRef.current;
      if (!ctx || pluginRegistry.length === 0) return;
      
      pluginRegistry.forEach(plugin => {
        const id = plugin.id;
        if (!fxNodesRef.current[id]) {
          const input = ctx.createGain(); // Main input for this FX node wrapper
          const bypass = ctx.createGain(); // WET path gain (signal goes through engine)
          const direct = ctx.createGain(); // DRY path gain (signal bypasses engine)
          const output = ctx.createGain(); // Output from this FX node wrapper
          
          const engine = engineInstancesRef.current.get(id);

          // Connect dry path
          input.connect(direct);
          direct.connect(output);

          // Connect wet path
          input.connect(bypass); 
          if (engine && engine.input && engine.output) {
            // If an IAudioEngine is available, connect it into the wet path
            // FIX: Ensure engine.makeup is used in the wet path
            bypass.connect(engine.input); // Audio from input wrapper goes to engine's input
            engine.output.connect(engine.makeup); // Engine's actual output to its makeup gain
            engine.makeup.connect(output); // Engine's makeup gain to wrapper's output
            console.log(`%c[FX] Initialized engine for plugin: ${id}`, "color: lightgreen");
          } else {
             // If no engine or no proper input/output, wet path is still there but passes directly
             bypass.connect(output);
             console.warn(`%c[FX] Plugin '${id}' has no IAudioEngine, or engine missing input/output. Wet path will be direct.`, "color: yellow");
          }
          
          fxNodesRef.current[id] = { input, output, bypass, direct, engine };
        }
      });
    }, [pluginRegistry, audioContextRef.current]);

    // Update FX bypass state
    const onToggleBypass = useCallback((fxId: FxWindowId) => {
      setFxBypassState(prev => ({ ...prev, [fxId]: !prev[fxId] }));
    }, []);

    useEffect(() => {
        Object.entries(fxBypassState).forEach(([id, isBypassed]) => {
            const fxNode = fxNodesRef.current[id as FxWindowId];
            if (fxNode && audioContextRef.current) {
                const now = audioContextRef.current.currentTime;
                // Crossfade between direct (dry) and bypass (wet)
                fxNode.direct.gain.setTargetAtTime(isBypassed ? 1.0 : 0.0, now, 0.015);
                fxNode.bypass.gain.setTargetAtTime(isBypassed ? 0.0 : 1.0, now, 0.015);
            }
        });
    }, [fxBypassState]);

    // --- Dynamic Audio Routing (Inserts based, Including Mic Input) ---
    useEffect(() => {
        const ctx = audioContextRef.current;
        if (!ctx || !masterNodesRef.current) return;

        console.log(">>> Rebuilding audio routing graph (Inserts-based)...");
        const masterInput = masterNodesRef.current.input;

        // Clear ALL existing connections to prevent doubling or stale paths
        Object.values(trackNodesRef.current).forEach(node => { 
          try { 
            node.input.disconnect(); 
            node.gain.disconnect();
            node.panner.disconnect();
            node.analyser.disconnect(); 
          } catch (e) {} 
        });
        Object.values(fxNodesRef.current).forEach(fxNode => { 
          try { 
            fxNode.input.disconnect(); 
            fxNode.output.disconnect();
          } catch (e) {} 
        });
        if (micSourceNodeRef.current) { 
            try { micSourceNodeRef.current.disconnect(); } catch(e) {} 
        }
        if (hushProcessorNodeRef.current) {
            try { hushProcessorNodeRef.current.disconnect(); } catch(e) {}
        }
        
        // Connect mic input to armed tracks' inputs via HUSH processor
        if (micSourceNodeRef.current && hushProcessorNodeRef.current && armedTracks.size > 0) {
            micSourceNodeRef.current.connect(hushProcessorNodeRef.current);
            armedTracks.forEach(trackId => {
                const trackNodes = trackNodesRef.current[trackId];
                if (trackNodes?.input) { 
                    hushProcessorNodeRef.current!.connect(trackNodes.input);
                }
            });
        }

        // Route each track's signal
        tracks.forEach(track => {
            const trackNodes = trackNodesRef.current[track.id];
            if (!trackNodes) return;

            // Internal chain: Input -> Gain -> Panner
            trackNodes.input.connect(trackNodes.gain);
            trackNodes.gain.connect(trackNodes.panner);

            let currentOutput: AudioNode = trackNodes.panner;
            const trackInserts = inserts[track.id] || [];

            // Inserts chain
            trackInserts.forEach(fxId => {
                const fxNode = fxNodesRef.current[fxId];
                if (fxNode) {
                    currentOutput.connect(fxNode.input);
                    currentOutput = fxNode.output;
                }
            });

            // Post-inserts: connect to analyser for monitoring and then to master
            currentOutput.connect(trackNodes.analyser);
            currentOutput.connect(masterInput);
        });

    }, [inserts, tracks, fxBypassState, armedTracks, pluginRegistry]);

    // Manage Microphone Stream
    useEffect(() => {
        const manageStream = async () => {
            const ctx = audioContextRef.current;
            if (armedTracks.size > 0 && !microphoneStreamRef.current && ctx) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    microphoneStreamRef.current = stream;
                    micSourceNodeRef.current = ctx.createMediaStreamSource(stream);

                    // Create Hush processor
                    const processor = ctx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        // Pass a copy to prevent modification issues if any
                        const outputData = hushSystem.process(new Float32Array(inputData)); 
                        audioProcessingEvent.outputBuffer.getChannelData(0).set(outputData);
                    };
                    hushProcessorNodeRef.current = processor;

                    console.log("Microphone stream acquired and Hush processor created.");
                } catch (err) {
                    console.error("Error acquiring microphone stream:", err);
                    setArmedTracks(new Set()); // Disarm tracks if permission is denied
                }
            } else if (armedTracks.size === 0 && microphoneStreamRef.current) {
                microphoneStreamRef.current.getTracks().forEach(track => track.stop());
                microphoneStreamRef.current = null;
                micSourceNodeRef.current = null;
                hushProcessorNodeRef.current = null; // Will be disconnected by routing effect
                console.log("Microphone stream released.");
            }
        };
        manageStream();
    }, [armedTracks, hushSystem]);

    // Effect to control HushSystem active state
    useEffect(() => {
        hushSystem.setActive(isHushActive);
    }, [isHushActive, hushSystem]);

    // Effect to get feedback from HushSystem
    useEffect(() => {
        let animationFrameId: number;
        if (isHushActive) {
            const updateFeedback = () => {
                setHushFeedback(hushSystem.getALSFeedback());
                animationFrameId = requestAnimationFrame(updateFeedback);
            };
            updateFeedback();
        } else {
            setHushFeedback({ color: '#1a1030', intensity: 0.0, isEngaged: false, noiseCount: 0 });
        }
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isHushActive, hushSystem]);


    const stopPlayback = useCallback(() => {
        activeSourcesRef.current.forEach(item => {
            try { item.source.stop(); item.source.disconnect(); item.gain.disconnect(); } catch(e) {}
        });
        activeSourcesRef.current = [];
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.suspend(); // Suspend context when stopped
        }
    }, []);

    const scheduleClips = useCallback((transportTime: number) => {
        const ctx = audioContextRef.current;
        if (!ctx || Object.keys(audioBuffers).length === 0) return;
    
        // Stop all previously scheduled sources
        activeSourcesRef.current.forEach(item => {
            try { item.source.stop(); item.source.disconnect(); item.gain.disconnect(); } catch (e) {}
        });
        activeSourcesRef.current = [];
    
        const playbackStartTime = ctx.currentTime;
    
        clips.forEach(clip => {
            const trackNodes = trackNodesRef.current[clip.trackId];
            const audioBuffer = audioBuffers[clip.bufferId];
            if (!trackNodes || !audioBuffer) {
                console.warn(`[AUDIO] Skipping clip ${clip.id}: missing nodes or buffer.`);
                return;
            }
    
            const clipAbsoluteEnd = clip.start + clip.duration;
            if (clipAbsoluteEnd <= transportTime) return; // Clip is entirely in the past
    
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = clip.timeStretchRate ?? 1.0;
    
            // Create a dedicated gain node for this clip instance for fades and gain control
            const clipGainNode = ctx.createGain();
            clipGainNode.gain.value = clip.gain ?? 1.0;
            source.connect(clipGainNode);
            clipGainNode.connect(trackNodes.input);
    
            // Calculate when this clip should start playing relative to ctx.currentTime
            const timeUntilClipStarts = Math.max(0, clip.start - transportTime);
            const scheduledStart = playbackStartTime + timeUntilClipStarts;
    
            // Calculate the offset into the audioBuffer
            const offsetIntoSource = (clip.sourceStart ?? 0) + Math.max(0, transportTime - clip.start);
    
            // Determine how long the source should play
            const actualDurationToPlay = clip.duration - Math.max(0, transportTime - clip.start);
    
            if (actualDurationToPlay > 0) {
                source.start(scheduledStart, offsetIntoSource, actualDurationToPlay);
                activeSourcesRef.current.push({ source, gain: clipGainNode });
    
                // Schedule Fade In
                const fadeInDuration = clip.fadeIn ?? 0;
                if (fadeInDuration > 0 && transportTime < clip.start + fadeInDuration) {
                    const timeIntoFadeIn = Math.max(0, transportTime - clip.start);
                    const remainingFadeIn = fadeInDuration - timeIntoFadeIn;
                    const startValue = (clip.gain ?? 1.0) * (timeIntoFadeIn / fadeInDuration);
                    
                    clipGainNode.gain.setValueAtTime(startValue, scheduledStart);
                    clipGainNode.gain.linearRampToValueAtTime(clip.gain ?? 1.0, scheduledStart + remainingFadeIn);
                }
    
                // Schedule Fade Out
                const fadeOutDuration = clip.fadeOut ?? 0;
                if (fadeOutDuration > 0 && transportTime < clipAbsoluteEnd) {
                    const fadeOutStartTime = clipAbsoluteEnd - fadeOutDuration;
                    if (transportTime < fadeOutStartTime) {
                         const scheduledFadeOutStart = playbackStartTime + (fadeOutStartTime - transportTime);
                         clipGainNode.gain.setValueAtTime(clip.gain ?? 1.0, scheduledFadeOutStart);
                         clipGainNode.gain.linearRampToValueAtTime(0, scheduledFadeOutStart + fadeOutDuration);
                    } else { // Handle starting playback inside a fade out
                        const timeIntoFadeOut = transportTime - fadeOutStartTime;
                        const startValue = (clip.gain ?? 1.0) * (1 - (timeIntoFadeOut / fadeOutDuration));
                        clipGainNode.gain.setValueAtTime(startValue, scheduledStart);
                        clipGainNode.gain.linearRampToValueAtTime(0, scheduledStart + (fadeOutDuration - timeIntoFadeOut));
                    }
                }
            }
        });
    }, [audioBuffers, clips]);

    // Refs to track state inside callbacks to avoid stale closures
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    const isLoopingRef = useRef(isLooping);
    useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
    const projectDurationRef = useRef(projectDuration);
    useEffect(() => { projectDurationRef.current = projectDuration; }, [projectDuration]);
    const currentTimeRef = useRef(currentTime);
    useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
    const soloedTracksRef = useRef(soloedTracks);
    useEffect(() => { soloedTracksRef.current = soloedTracks; }, [soloedTracks]);
    const mixerSettingsRef = useRef(mixerSettings);
    useEffect(() => { mixerSettingsRef.current = mixerSettings; }, [mixerSettings]);
    const automationDataRef = useRef(automationData);
    useEffect(() => { automationDataRef.current = automationData; }, [automationData]);
    const tracksRef = useRef(tracks);
    useEffect(() => { tracksRef.current = tracks; }, [tracks]);
    const insertsRef = useRef(inserts);
    useEffect(() => { insertsRef.current = inserts; }, [inserts]);


    const getAutomationValue = useCallback((trackId: string, fxId: string, paramName: string, time: number): number | null => {
      const paramAutomation = automationDataRef.current[trackId]?.[fxId]?.[paramName];
      if (!paramAutomation || paramAutomation.length === 0) return null;

      // Find the two points that bracket the current time
      const nextPointIndex = paramAutomation.findIndex(p => p.time > time);

      // If time is before the first point, use the first point's value
      if (nextPointIndex === 0) return paramAutomation[0].value;
      // If time is after the last point, use the last point's value
      if (nextPointIndex === -1) return paramAutomation[paramAutomation.length - 1].value;
      
      const prevPoint = paramAutomation[nextPointIndex - 1];
      const nextPoint = paramAutomation[nextPointIndex];

      // Linear interpolation between the two points
      const timeDiff = nextPoint.time - prevPoint.time;
      if (timeDiff === 0) return prevPoint.value; // Avoid division by zero

      const factor = (time - prevPoint.time) / timeDiff;
      return prevPoint.value + factor * (nextPoint.value - prevPoint.value);
    }, []);

    useEffect(() => {
        const ctx = audioContextRef.current;
        if (!ctx || (isPlaying && armedTracks.size > 0)) return; // Analysis loop is controlled by recording state if armed

        const analysisLoop = () => {
            if (!isPlayingRef.current) {
                animationFrameRef.current = null;
                return;
            }

            const now = ctx.currentTime;
            const delta = now - lastUpdateTimeRef.current;
            lastUpdateTimeRef.current = now;
            
            let newTime = currentTimeRef.current + delta;
            
            if (newTime >= projectDurationRef.current) {
                if (isLoopingRef.current) {
                    const timeOver = newTime - projectDurationRef.current;
                    newTime = timeOver % projectDurationRef.current;
                    
                    console.log(`%c[DAW CORE] Project Loop Wrap. New Time: ${newTime.toFixed(2)}`, "color: cyan; font-weight: bold;");
                    
                    lastUpdateTimeRef.current = now - timeOver;
                    scheduleClips(newTime); // Reschedule clips for gapless loop
                } else {
                     setIsPlaying(false);
                     setCurrentTime(projectDurationRef.current);
                     return;
                }
            }
            setCurrentTime(newTime);
            
            const newTrackAnalysis: { [key: string]: TrackAnalysisData } = {};
            let masterLevelSum = 0;
            const waveformData = new Uint8Array(masterNodesRef.current!.analyser.frequencyBinCount);
            
            tracksRef.current.forEach(track => { // Use tracksRef to prevent stale closure
                const analyser = trackNodesRef.current[track.id]?.analyser;
                if (analyser) {
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteTimeDomainData(dataArray);
                    const level = dataArray.reduce((sum, val) => sum + Math.abs(val - 128), 0) / dataArray.length / 128;
                    newTrackAnalysis[track.id] = { level, transient: false };
                    masterLevelSum += level;
                }

                const nodes = trackNodesRef.current[track.id];
                const settings = mixerSettingsRef.current[track.id];
                if (!nodes || !settings) return;

                const hasSolo = soloedTracksRef.current.size > 0;
                const isSoloed = soloedTracksRef.current.has(track.id);
                const isMuted = settings.isMuted || (hasSolo && !isSoloed);

                // --- Apply Automation Data ---
                // Volume Automation
                let targetVolume = 0;
                if (!isMuted) {
                    const automationValue = getAutomationValue(track.id, 'track', 'volume', newTime);
                    targetVolume = automationValue !== null ? automationValue : settings.volume;
                }
                nodes.gain.gain.setTargetAtTime(targetVolume, ctx.currentTime, 0.01);

                // Pan Automation
                const panAutomationValue = getAutomationValue(track.id, 'track', 'pan', newTime);
                const targetPan = panAutomationValue !== null ? panAutomationValue : settings.pan;
                nodes.panner.pan.setTargetAtTime(targetPan, ctx.currentTime, 0.01);
                
                // FX Parameter Automation
                const trackInserts = insertsRef.current[track.id] || [];
                trackInserts.forEach(fxId => {
                  const engineInstance = engineInstancesRef.current.get(fxId);
                  if (engineInstance && automationDataRef.current[track.id]?.[fxId]) {
                    const fxAutomation = automationDataRef.current[track.id][fxId];
                    for (const paramName in fxAutomation) {
                        const paramValue = getAutomationValue(track.id, fxId, paramName, newTime);
                        if (paramValue !== null) {
                            if (engineInstance.setParameter) {
                                engineInstance.setParameter(paramName, paramValue);
                            }
                        }
                    }
                  }
                });
            });
            
            masterNodesRef.current!.analyser.getByteTimeDomainData(waveformData);
            const masterLevel = masterLevelSum / (tracksRef.current.length || 1); // Use tracksRef
            masterLevelAvg.current = masterLevelAvg.current * 0.9 + masterLevel * 0.1;

            const isTransient = masterLevel > masterLevelAvg.current + 0.2; // Simple transient detection

            setTrackAnalysis(newTrackAnalysis);
            setMasterAnalysis({ level: masterLevelAvg.current, transient: isTransient, waveform: waveformData });

            animationFrameRef.current = requestAnimationFrame(analysisLoop);
        };
        
        if (isPlaying) {
            lastUpdateTimeRef.current = ctx.currentTime;
            scheduleClips(currentTime); // Schedule clips at current time
            if (!animationFrameRef.current) {
              ctx.resume(); // Ensure context is running when play starts
              animationFrameRef.current = requestAnimationFrame(analysisLoop);
            }
        } else {
            stopPlayback();
            ctx.suspend(); // Suspend context when stopped to save resources
        }

        return () => {
            stopPlayback();
            ctx.suspend();
        };
    }, [isPlaying, scheduleClips, stopPlayback, getAutomationValue, armedTracks]);


  const renderFxWindows = useMemo(() => {
    return fxWindows.map(fw => {
      // Find which track this FX is "primarily" connected to for color and context
      let connectedColor: TrackData['trackColor'] | undefined;
      let connectedTrackId: string | undefined;
      for (const trackId in inserts) {
        if (inserts[trackId].includes(fw.id)) {
          connectedColor = tracks.find(t => t.id === trackId)?.trackColor;
          connectedTrackId = trackId;
          break;
        }
      }

      return fxVisibility[fw.id] ? (
        <FXWindow
          key={fw.id}
          id={fw.id}
          title={fw.name}
          initialPosition={{ x: 250 + (fxWindows.indexOf(fw) * 50), y: 150 + (fxWindows.indexOf(fw) * 50) }}
          isPlaying={isPlaying}
          currentTime={currentTime}
          onClose={() => setFxVisibility(prev => ({ ...prev, [fw.id]: false }))}
          isBypassed={fxBypassState[fw.id]}
          onToggleBypass={onToggleBypass}
          connectedColor={connectedColor}
          onOpenPluginSettings={handleOpenPluginSettings}
        >
          <fw.component
            params={fw.params as any}
            onChange={fw.onChange}
            isPlaying={isPlaying}
            currentTime={currentTime}
            connectedColor={connectedColor}
            // Pass automation specific props for FX Visualizers
            trackId={connectedTrackId || selectedTrackId || ''}
            fxId={fw.id}
            automationData={automationData}
            onAddAutomationPoint={handleAddAutomationPoint}
            onUpdateAutomationPoint={handleUpdateAutomationPoint}
            onDeleteAutomationPoint={handleDeleteAutomationPoint}
          />
        </FXWindow>
      ) : null;
    });
  }, [fxWindows, fxVisibility, isPlaying, currentTime, fxBypassState, inserts, tracks, automationData, handleAddAutomationPoint, handleUpdateAutomationPoint, handleDeleteAutomationPoint, selectedTrackId, setFxVisibility, onToggleBypass, handleOpenPluginSettings]);

    const activeClip = useMemo(() => {
        if (!activePrimeBrainClipId) return null;
        return clips.find(c => c.id === activePrimeBrainClipId) || null;
    }, [activePrimeBrainClipId, clips]);

  const backgroundGlowStyle = useMemo(() => {
      const level = isPlaying ? masterAnalysis.level : 0;
      const intensity = Math.min(1, level * 2.5);
      const hue = 220 + intensity * 60; // From blue (220) to magenta (280)
      const saturation = 40 + intensity * 30;
      const lightness = 15 + intensity * 10;
      return {
          '--bg-glow-color': `hsl(${hue}, ${saturation}%, ${lightness}%)`
      } as React.CSSProperties;
  }, [masterAnalysis.level, isPlaying]);

  const arrangeBorderGlowStyle = useMemo(() => {
    const level = isPlaying ? masterAnalysis.level : 0;
    const intensity = Math.min(1, level * 2.5); // 0 to 1 based on master level
    const velvetScore = analysisResult ? calculateVelvetScore(analysisResult) : 0;
    const { color: velvetGlowColorName } = getVelvetColor(velvetScore ?? 0); // e.g., 'emerald'
    
    // Define some direct hex colors for the glow based on the velvet score
    const glowColors: Record<string, string> = {
        emerald: '#10b981', // emerald-500
        lime: '#84cc16',    // lime-500
        amber: '#f59e0b',   // amber-500
        red: '#ef4444',     // red-500
        rose: '#e11d48',    // rose-500
        default: '#374151' // gray-700
    };
    const primaryGlowColor = glowColors[velvetGlowColorName] || glowColors.default;

    return {
        '--arrange-border-color': primaryGlowColor,
        '--arrange-border-opacity': intensity,
        border: `1px solid rgba(${parseInt(primaryGlowColor.slice(1,3), 16)}, ${parseInt(primaryGlowColor.slice(3,5), 16)}, ${parseInt(primaryGlowColor.slice(5,7), 16)}, ${0.1 + intensity * 0.3})`, // Base border, intensifies with music
        boxShadow: isPlaying && intensity > 0.1
            ? `0 0 ${10 + intensity * 20}px ${primaryGlowColor}, inset 0 0 ${5 + intensity * 10}px ${primaryGlowColor}44`
            : `none`, // Only show box shadow when playing and enough energy
        transition: 'all 0.3s ease-out'
    } as React.CSSProperties;
}, [masterAnalysis.level, isPlaying, analysisResult]);


  return (
    <div className="w-screen h-screen bg-[#03040B] text-white flex flex-col overflow-hidden" style={backgroundGlowStyle}>
        <Header 
            analysisResult={analysisResult}
            hushFeedback={hushFeedback}
            isPlaying={isPlaying}
        />
        <main className="flex-grow relative" style={{ top: '80px', perspective: '1000px', transformStyle: 'preserve-3d' }}>
            <div className={`w-full h-full transition-all duration-700 ease-in-out absolute inset-0 ${viewMode === 'arrange' ? 'opacity-100 transform-none' : 'opacity-0 transform scale-90 -translate-z-50'}`}>
                 <ArrangeWindow
                    height={window.innerHeight - 80}
                    tracks={tracks}
                    clips={clips}
                    setClips={setClips}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                    bpm={bpm}
                    beatsPerBar={4}
                    pixelsPerSecond={ppsAPI.value}
                    ppsAPI={ppsAPI}
                    scrollX={scrollX}
                    setScrollX={setScrollX}
                    selection={selection}
                    setSelection={setSelection}
                    clearSelection={clearSelection}
                    onSplitAt={onSplitAt}
                    selectedTrackId={selectedTrackId}
                    onSelectTrack={setSelectedTrackId}
                    armedTracks={armedTracks}
                    onToggleArm={handleToggleArm}
                    mixerSettings={mixerSettings}
                    onMixerChange={handleMixerChange}
                    soloedTracks={soloedTracks}
                    onToggleSolo={handleToggleSolo}
                    masterAnalysis={masterAnalysis}
                    automationData={automationData}
                    visibleAutomationLanes={visibleAutomationLanes}
                    onAddAutomationPoint={handleAddAutomationPoint}
                    onUpdateAutomationPoint={handleUpdateAutomationPoint}
                    onDeleteAutomationPoint={handleDeleteAutomationPoint}
                    onUpdateClipProperties={updateClipProperties}
                    inserts={inserts}
                    fxWindows={fxWindows}
                    onAddPlugin={handleAddPlugin}
                    onRemovePlugin={handleRemovePlugin}
                    onMovePlugin={handleMovePlugin}
                    onOpenPluginBrowser={(trackId: string) => { setTrackIdForPluginBrowser(trackId); setIsPluginBrowserOpen(true); }}
                    onOpenPluginSettings={handleOpenPluginSettings}
                    automationParamMenu={automationParamMenu}
                    onOpenAutomationParamMenu={(x, y, trackId) => setAutomationParamMenu({ x, y, trackId })}
                    onCloseAutomationParamMenu={() => setAutomationParamMenu(null)}
                    onToggleAutomationLaneWithParam={handleToggleAutomationLane}
                    style={arrangeBorderGlowStyle}
                />
            </div>
             <div className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${viewMode === 'mixer' ? 'opacity-100 transform-none' : 'opacity-0 transform scale-110 translate-z-50'}`}>
                <Mixer 
                    tracks={tracks}
                    mixerSettings={mixerSettings}
                    trackAnalysis={trackAnalysis}
                    onMixerChange={handleMixerChangeForMixer}
                    soloedTracks={soloedTracks}
                    onToggleSolo={handleToggleSolo}
                    masterVolume={masterVolume}
                    onMasterVolumeChange={setMasterVolume}
                    masterBalance={masterBalance}
                    onBalanceChange={setMasterBalance}
                    masterAnalysis={masterAnalysis}
                    selectedTrackId={selectedTrackId}
                    onSelectTrack={setSelectedTrackId}
                    armedTracks={armedTracks}
                    onToggleArm={handleToggleArm}
                    onRenameTrack={handleRenameTrack}
                    inserts={inserts}
                    fxWindows={fxWindows}
                    onAddPlugin={handleAddPlugin}
                    onRemovePlugin={handleRemovePlugin}
                    onMovePlugin={handleMovePlugin}
                    onOpenPluginBrowser={(trackId: string) => { setTrackIdForPluginBrowser(trackId); setIsPluginBrowserOpen(true); }}
                    onOpenPluginSettings={handleOpenPluginSettings}
                />
            </div>

            <FXRack 
              onOpenPluginSettings={handleOpenPluginSettings}
              fxBypassState={fxBypassState}
              onToggleBypass={onToggleBypass}
            >
              {renderFxWindows}
            </FXRack>
        </main>
        
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
            <BloomHUD 
                isPlaying={isPlaying}
                isLooping={isLooping}
                onPlayPause={handlePlayPause}
                onRewind={handleRewind}
                onFastForward={handleFastForward}
                onToggleLoop={handleToggleLoop}
                masterAnalysis={masterAnalysis}
                selectedClips={clips.filter(c => c.selected)}
                onAction={handleBloomAction}
                isAnyTrackArmed={isAnyTrackArmed}
                isHushActive={isHushActive}
                fxWindows={fxWindows}
                fxVisibility={fxVisibility}
                onToggleFxVisibility={handleToggleFxVisibility}
                tracks={tracks}
                selectedTrackId={selectedTrackId}
                viewMode={viewMode}
                onToggleViewMode={() => setViewMode(prev => prev === 'arrange' ? 'mixer' : 'arrange')}
                musicalContext={musicalContext}
                onContextChange={handleContextChange}
                onOpenAIHub={() => setIsAIHubOpen(true)}
            />
        </div>

        {isAddTrackModalOpen && (
            <AddTrackModal
                onClose={() => setIsAddTrackModalModalOpen(false)}
                onAddTrack={handleAddTrack}
            />
        )}
        {importMessage && <ImportModal message={importMessage} />}
        {contextMenu && (
            <TrackContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onDelete={() => handleDeleteTrack(contextMenu.trackId)}
                onRename={() => { setRenameModal(contextMenu.trackId); setContextMenu(null); }}
                onChangeColor={() => { setChangeColorModal(contextMenu.trackId); setContextMenu(null); }}
            />
        )}
        {renameModal && (
            <RenameTrackModal 
                currentName={tracks.find(t => t.id === renameModal)?.trackName || ''}
                onClose={() => setRenameModal(null)}
                onRename={(newName) => handleRenameTrack(renameModal, newName)}
            />
        )}
        {changeColorModal && (
            <ChangeColorModal
                currentColor={tracks.find(t => t.id === changeColorModal)?.trackColor || 'cyan'}
                onClose={() => setChangeColorModal(null)}
                onChangeColor={(newColor) => handleChangeColor(changeColorModal, newColor)}
            />
        )}
        {activeClip && (
            <PrimeBrainInterface
                clip={activeClip}
                onClose={() => setActivePrimeBrainClipId(null)}
                onUpdateClip={updateClipProperties}
            />
        )}

        {/* Plugin Browser Modal */}
        {isPluginBrowserOpen && trackIdForPluginBrowser && (
          <PluginBrowser
            trackId={trackIdForPluginBrowser}
            onClose={() => { setIsPluginBrowserOpen(false); setTrackIdForPluginBrowser(null); }}
            onAddPlugin={handleAddPlugin}
            fxWindows={fxWindows}
            inserts={inserts}
          />
        )}
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileLoad} accept=".json,audio/*"/>

        {isAIHubOpen && (
            <AIHub
                onClose={() => setIsAIHubOpen(false)}
                audioContext={audioContextRef.current}
                clips={clips} 
                tracks={tracks}
                selectedTrackId={selectedTrackId}
            />
        )}
    </div>
  );
};

export default App;