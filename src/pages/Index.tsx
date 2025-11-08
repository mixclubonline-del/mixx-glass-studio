import { useState, useEffect, useRef } from "react";
import { AudioEngine } from "@/audio/AudioEngine";
import {
  ViewContainer,
  AdvancedTimelineView,
  NextGenMixerView,
  MeteringDashboard,
  WaveformEditor,
  TransportControls,
  AIAssistantPanel
} from "@/studio/components";
import { CentralCommandHub } from "@/studio/components/Navigation/CentralCommandHub";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { PluginBrowser } from "@/studio/components/Plugins/PluginBrowser";
import { PluginWindowManager } from "@/studio/components/Plugins/PluginWindowManager";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useViewStore } from "@/store/viewStore";
import { useTimelineStore } from "@/store/timelineStore";
import { useTracksStore } from "@/store/tracksStore";
import { useMixerStore } from "@/store/mixerStore";
import { Track } from "@/audio/Track";
import { Bus } from "@/audio/Bus";
import { EQParams, CompressorParams, PeakLevel } from "@/types/audio";
import { TimelineTrack, Region } from "@/types/timeline";
import type { MusicalContext } from "@/types/mixxtune";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MasterMeteringPanel, VelvetFloorPanel } from '@/studio/components/Metering';
import { AudioAnalyzer } from "@/audio/analysis/AudioAnalyzer";
import { MixxAmbientOverlay } from "@/components/MixxAmbientOverlay";
import { BeastModeAmbient } from "@/components/BeastModeAmbient";
import { primeBrain } from "@/ai/primeBrain";
import { predictionEngine } from "@/ai/predictionEngine";
import { beastModeEngine } from "@/services/BeastModeEngine";
import { useBeastModeStore } from "@/store/beastModeStore";
import { BeastModePanel } from "@/studio/components/AI/BeastModePanel";
import { AISuggestionsPanel } from "@/studio/components/AI/AISuggestionsPanel";
import { SPACING } from "@/lib/layout-constants";
import { ContextualBloomWrapper } from "@/components/Bloom/ContextualBloomWrapper";
import { EdgeBloomTrigger } from "@/components/Bloom/EdgeBloomTrigger";
import { useBloomDetection } from "@/hooks/useBloomDetection";
import { useBloomStore } from "@/store/bloomStore";

const IndexContent = () => {
  const engineRef = useRef<AudioEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [pluginBrowserOpen, setPluginBrowserOpen] = useState(false);
  const [selectedTrackForPlugin, setSelectedTrackForPlugin] = useState<string | null>(null);
  const [selectedSlotForPlugin, setSelectedSlotForPlugin] = useState<number>(1);
  const [openPluginWindows, setOpenPluginWindows] = useState<Map<string, { trackId: string; slotNumber: number; pluginId: string }>>(new Map());
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  // Transport is now permanently docked - no toggle states needed
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Helper utilities
  const genId = (prefix: string) =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const DEFAULT_TRACK_HEIGHT = 100;
  const ensureInserts = (slots = 8) =>
    Array.from({ length: slots }).map((_, i) => ({
      slotNumber: i + 1,
      pluginId: null as string | null,
      instanceId: null as string | null,
      bypass: false,
    }));
  
  // Global stores
  const { currentView, isPanelOpen, togglePanel } = useViewStore();
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying, setDuration } = useTimelineStore();
  const { tracks, regions, addTrack, addRegion } = useTracksStore();

  // Track view changes for Prime Brain
  useEffect(() => {
    primeBrain.processSceneChange({
      sceneId: currentView,
      sceneName: currentView === 'arrange' ? 'Arrange View' : 
                currentView === 'mix' ? 'Mixer View' : 'Editor View',
      timestamp: Date.now()
    });
  }, [currentView]);
  
  // Beast Mode integration
  const { isActive: beastModeActive } = useBeastModeStore();
  
  // Bloom System
  useBloomDetection({ idleTimeout: 5000 });
  const { toggleUltraMinimal, toggleDebugMode } = useBloomStore();
  
  useEffect(() => {
    if (beastModeActive) {
      beastModeEngine.start();
    } else {
      beastModeEngine.stop();
    }
    
    return () => {
      beastModeEngine.stop();
    };
  }, [beastModeActive]);
  const { 
    channels, 
    masterPeakLevel,
    buses,
    addChannel,
    updatePeakLevel,
    setMasterPeakLevel,
    addBus,
    updateBus
  } = useMixerStore();

  // Initialize audio engine
  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;
    
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  // Update playback time
  useEffect(() => {
    if (!isPlaying || !engineRef.current) return;
    
    const interval = setInterval(() => {
      const time = engineRef.current?.getCurrentTime() || 0;
      setCurrentTime(time);
      
      // Update prediction engine with current bar
      const bpm = engineRef.current?.bpm || 120;
      const barDuration = (60 / bpm) * 4; // 4 beats per bar
      const currentBar = Math.floor(time / barDuration);
      predictionEngine.updatePosition(currentBar, bpm);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  // No metering loop needed - meters read directly from AnalyserNodes with their own RAF loops

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] } }) => {
    const files = (e as any).target.files as FileList | File[];
    if (files && (files as any).length) {
      Array.from(files as any).forEach((file: File) => handleLoadTrack(file));
      toast({
        title: "Audio files imported",
        description: `${(files as any).length} file(s) loaded successfully`,
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadTrack = async (file: File) => {
    if (!engineRef.current) return;

    try {
      // Unique IDs (prevents collisions on fast multi-imports)
      const trackId = genId("track");

      // Load into engine first so buffer/duration is real
      await engineRef.current.loadTrack(trackId, file.name, file);
      const loaded = engineRef.current.getTracks().find(t => t.id === trackId);
      const buffer = loaded?.buffer;
      if (!buffer) throw new Error("No audio buffer after load");

      // Stable per-track color
      const hue = Math.floor(Math.random() * 360);
      const color = `hsl(${hue}, 70%, 50%)`;

      // 1) Add the new track lane
      const timelineTrack: TimelineTrack = {
        id: trackId,
        name: file.name,
        color,
        height: DEFAULT_TRACK_HEIGHT,
        regions: [],
        muted: false,
        solo: false,
        recordArmed: false,
        volume: 0.75,
        inserts: ensureInserts(8),
      };
      addTrack(timelineTrack);

      // 2) Add the region at the beginning (snap to 0)
      const regionId = `region-${trackId}`;
      addRegion({
        id: regionId,
        trackId,
        name: file.name,
        startTime: 0,                   // <-- lock to 0
        duration: buffer.duration,
        bufferOffset: 0,
        bufferDuration: buffer.duration,
        color,
        fadeIn: 0,
        fadeOut: 0,
        gain: 1,
        locked: false,
        muted: false,
      });

      // 3) Keep a handle to the buffer for the timeline renderer
      setAudioBuffers(prev => new Map(prev).set(regionId, buffer));

      // 4) Mixer sync (channel per track)
      addChannel({
        id: trackId,
        name: file.name,
        volume: 0.75,
        pan: 0,
        muted: false,
        solo: false,
        color,
        peakLevel: { left: -60, right: -60 },
      });
      engineRef.current.setTrackVolume(trackId, 0.75);

      // 5) Update song duration conservatively
      const newEnd = 0 + buffer.duration;
      setDuration(Math.max(newEnd, useTimelineStore.getState().duration || 0));

      // 6) Optional analysis (non-blocking; no UI changes)
      setTimeout(() => {
        try {
          const bpm = AudioAnalyzer.detectBPM(buffer);
          const { key, scale } = AudioAnalyzer.detectKey(buffer);
          const ts = AudioAnalyzer.inferTimeSignature(bpm, buffer);
          setDetectedBPM(bpm);
          setDetectedKey(`${key} ${scale}`);
          if (engineRef.current) {
            engineRef.current.bpm = bpm;
            engineRef.current.timeSignature = ts;
          }
        } catch {}
      }, 120);

      // 7) UX: select the new track (no visual change if your UI already highlights)
      setSelectedTrackId(trackId);

      // 8) Debug logging for waveform rendering
      console.log('🎵 Track loaded:', {
        trackId,
        regionId,
        bufferDuration: buffer.duration,
        audioBuffersSize: audioBuffers.size + 1,
        hasBuffer: !!buffer
      });

      toast({ title: "Track loaded", description: `${file.name} added to timeline & mixer` });
    } catch (error) {
      console.error("Failed to load track:", error);
      toast({
        title: "Error",
        description: "Failed to load audio file",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTrack = (id: string) => {
    engineRef.current?.removeTrack(id);
    useTracksStore.getState().removeTrack?.(id);
    useMixerStore.getState().removeChannel?.(id);
    if (selectedTrackId === id) setSelectedTrackId(null);
  };

  const handleVolumeChange = (id: string, volume: number) => {
    if (engineRef.current) {
      engineRef.current.setTrackVolume(id, volume);
      // Sync to mixer store
      const channel = channels.get(id);
      if (channel) {
        useMixerStore.getState().updateChannel(id, { volume });
      }
      
      // Send to Prime Brain
      primeBrain.processControlEvent({
        type: 'fader',
        controlId: `volume_${id}`,
        value: volume,
        previousValue: channel?.volume,
        timestamp: Date.now()
      });
    }
  };
  
  const handlePanChange = (id: string, pan: number) => {
    if (engineRef.current) {
      engineRef.current.setTrackPan(id, pan);
      
      // Send to Prime Brain
      primeBrain.processControlEvent({
        type: 'knob',
        controlId: `pan_${id}`,
        value: pan,
        timestamp: Date.now()
      });
    }
  };
  
  const handleSoloToggle = (id: string) => {
    if (engineRef.current) {
      const channel = channels.get(id);
      if (channel) {
        engineRef.current.setTrackSolo(id, !channel.solo);
        useMixerStore.getState().updateChannel(id, { solo: !channel.solo });
      }
    }
  };
  
  // Plugin management
  const handleLoadPlugin = (trackId: string, slotNumber: number, pluginId: string) => {
    if (engineRef.current) {
      const instanceId = engineRef.current.loadPluginToTrack(trackId, pluginId, slotNumber);
      
      if (instanceId) {
        // Update tracks store with plugin info
        const { tracks: tracksArray, updateTrack } = useTracksStore.getState();
        const track = tracksArray.find(t => t.id === trackId);
        
        if (track && track.inserts) {
          const updatedInserts = [...track.inserts];
          const insertIndex = updatedInserts.findIndex(i => i.slotNumber === slotNumber);
          if (insertIndex !== -1) {
            updatedInserts[insertIndex] = {
              slotNumber,
              pluginId,
              instanceId,
              bypass: false
            };
            updateTrack(trackId, { inserts: updatedInserts });
          }
        }
        
        toast({
          title: "Plugin Loaded",
          description: `${pluginId} loaded to slot ${slotNumber}`,
        });
      }
    }
  };
  
  const handleUnloadPlugin = (trackId: string, slotNumber: number) => {
    if (engineRef.current) {
      engineRef.current.unloadPluginFromTrack(trackId, slotNumber);
      
      // Update tracks store
      const { tracks: tracksArray, updateTrack } = useTracksStore.getState();
      const track = tracksArray.find(t => t.id === trackId);
      
      if (track && track.inserts) {
        const updatedInserts = [...track.inserts];
        const insertIndex = updatedInserts.findIndex(i => i.slotNumber === slotNumber);
        if (insertIndex !== -1) {
          updatedInserts[insertIndex] = {
            slotNumber,
            pluginId: null,
            instanceId: null,
            bypass: false
          };
          updateTrack(trackId, { inserts: updatedInserts });
        }
      }
      
      toast({
        title: "Plugin Removed",
        description: `Removed plugin from slot ${slotNumber}`,
      });
    }
  };
  
  const handleBypassPlugin = (trackId: string, slotNumber: number, bypass: boolean) => {
    if (engineRef.current) {
      engineRef.current.bypassPluginOnTrack(trackId, slotNumber, bypass);
      
      // Update tracks store
      const { tracks: tracksArray, updateTrack } = useTracksStore.getState();
      const track = tracksArray.find(t => t.id === trackId);
      
      if (track && track.inserts) {
        const updatedInserts = [...track.inserts];
        const insertIndex = updatedInserts.findIndex(i => i.slotNumber === slotNumber);
        if (insertIndex !== -1) {
          updatedInserts[insertIndex].bypass = bypass;
          updateTrack(trackId, { inserts: updatedInserts });
        }
      }
    }
  };
  
  // Send management
  const handleSendChange = (trackId: string, busId: string, amount: number) => {
    if (engineRef.current) {
      const track = engineRef.current.getTracks().find(t => t.id === trackId);
      if (track) {
        track.channelStrip.setSendAmount(busId, amount);
        
        // Update mixer store
        const channel = channels.get(trackId);
        if (channel) {
          const sends = channel.sends || new Map();
          sends.set(busId, amount);
          useMixerStore.getState().updateChannel(trackId, { sends });
        }
      }
    }
  };
  
  const handlePluginSelect = (pluginId: string) => {
    // Use selectedTrackForPlugin if set (from mixer), otherwise use selectedTrackId (from timeline)
    const targetTrack = selectedTrackForPlugin || selectedTrackId;
    
    if (targetTrack && engineRef.current) {
      handleLoadPlugin(targetTrack, selectedSlotForPlugin, pluginId);
      toast({
        title: "Plugin Loaded",
        description: `${pluginId} loaded to track`,
      });
    } else {
      toast({
        title: "No Track Selected",
        description: "Please select a track first",
        variant: "destructive"
      });
    }
    setPluginBrowserOpen(false);
    setSelectedTrackForPlugin(null); // Reset after use
  };
  
  const handleOpenPluginBrowser = (trackId: string, slotNumber: number) => {
    setSelectedTrackForPlugin(trackId);
    setSelectedSlotForPlugin(slotNumber);
    setPluginBrowserOpen(true);
  };
  
  const handleOpenPluginWindow = (trackId: string, slotNumber: number, pluginId: string) => {
    const windowId = `${trackId}_${slotNumber}`;
    setOpenPluginWindows(prev => {
      const newMap = new Map(prev);
      newMap.set(windowId, { trackId, slotNumber, pluginId });
      return newMap;
    });
  };
  
  const handleClosePluginWindow = (windowId: string) => {
    setOpenPluginWindows(prev => {
      const newMap = new Map(prev);
      newMap.delete(windowId);
      return newMap;
    });
  };
  
  const handlePluginParameterChange = (trackId: string, slotNumber: number, paramName: string, value: number) => {
    if (engineRef.current) {
      const pluginInstance = engineRef.current.getPluginInstance(trackId, slotNumber);
      if (pluginInstance && 'setParams' in pluginInstance) {
        // Call setParams if the plugin has this method
        (pluginInstance as any).setParams({ [paramName]: value });
      }
    }
  };
  
  // Bus management  
  const handleCreateBus = (name: string, color: string, type: 'aux' | 'group') => {
    if (engineRef.current) {
      const busId = `bus-${Date.now()}`;
      
      if (type === 'aux') {
        engineRef.current.createAuxBus(busId, name);
      } else {
        engineRef.current.createGroupBus(busId, name);
      }
      
      addBus({
        id: busId,
        name,
        type,
        color,
        volume: 0.75,
        sends: []
      });
      
      toast({
        title: "Bus Created",
        description: `${type === 'aux' ? 'Aux' : 'Group'} bus "${name}" created`,
      });
    }
  };
  
  // Loop & recording
  const handleRecord = () => {
    toast({
      title: "Recording",
      description: "Recording functionality coming soon",
    });
  };
  
  const handleLoopToggle = () => {
    const { loopEnabled, setLoopEnabled } = useTimelineStore.getState();
    setLoopEnabled(!loopEnabled);
  };
  
  const handlePrevBar = () => {
    if (engineRef.current) {
      const bpm = 120;
      const barDuration = (60 / bpm) * 4;
      const currentBar = Math.floor(currentTime / barDuration);
      const newTime = Math.max(0, currentBar * barDuration);
      handleSeek(newTime);
    }
  };
  
  const handleNextBar = () => {
    if (engineRef.current) {
      const bpm = 120;
      const barDuration = (60 / bpm) * 4;
      const currentBar = Math.floor(currentTime / barDuration);
      const newTime = (currentBar + 1) * barDuration;
      handleSeek(newTime);
    }
  };

  const handleMuteToggle = (id: string) => {
    if (engineRef.current) {
      const channel = channels.get(id);
      if (channel) {
        const newMuted = !channel.muted;
        engineRef.current.setTrackMute(id, newMuted);
        // Sync to stores
        useMixerStore.getState().updateChannel(id, { muted: newMuted });
        useTracksStore.getState().updateTrack(id, { muted: newMuted });
      }
    }
  };

  const handlePlay = () => {
    if (engineRef.current) {
      // Resume from current timeline position
      engineRef.current.play(currentTime);
      setIsPlaying(true);
      
      // Verify AudioContext unlocked
      const masterAnalyser = engineRef.current.getMasterAnalyser();
      if (masterAnalyser?.context) {
        console.info('🎵 AudioContext state:', masterAnalyser.context.state);
        if (masterAnalyser.context.state === 'running') {
          console.info('✅ Audio unlocked and ready');
        }
      }
    }
  };
  
  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const handleStop = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };
  
  const handleSeek = (time: number) => {
    if (engineRef.current) {
      const wasPlaying = isPlaying;
      engineRef.current.stop();
      setCurrentTime(time);
      
      // If we were playing, resume playback from new position
      if (wasPlaying) {
        setTimeout(() => {
          if (engineRef.current) {
            engineRef.current.play(time);
            setIsPlaying(true);
          }
        }, 10);
      }
    }
  };

  const handleExport = async () => {
    if (!engineRef.current) return;
    
    setIsExporting(true);
    
    try {
      const blob = await engineRef.current.exportMix();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mixx-club-export-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlay: handlePlay,
    onPause: handlePause,
    onStop: handleStop,
    onExport: handleExport,
    onAIAssistant: () => setShowAIAssistant(prev => !prev),
    onDuplicate: () => {
      const { selectedRegions } = useTimelineStore.getState();
      if (selectedRegions.size > 0) {
        console.log('Duplicate regions:', Array.from(selectedRegions));
        toast({
          title: "Duplicate",
          description: `${selectedRegions.size} region(s) duplicated`,
        });
      }
    },
    onSplit: () => {
      const { selectedRegions } = useTimelineStore.getState();
      if (selectedRegions.size > 0) {
        console.log('Split regions:', Array.from(selectedRegions));
        toast({
          title: "Split",
          description: `${selectedRegions.size} region(s) split`,
        });
      }
    },
    onLoop: handleLoopToggle,
    onPrevBar: handlePrevBar,
    onNextBar: handleNextBar,
  });
  
  // Bloom keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab - Toggle all panels
      if (e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        // Only prevent default if not in an input field
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          toggleUltraMinimal();
        }
      }
      
      // Cmd+Shift+H - Ultra minimal mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h') {
        e.preventDefault();
        toggleUltraMinimal();
      }
      
      // Cmd+/ - Debug mode (show bloom zones)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleDebugMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleUltraMinimal, toggleDebugMode]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {/* Mixx Ambient Lighting Overlays */}
      <MixxAmbientOverlay />
      <BeastModeAmbient />
      
      {/* 2030 Gradient Mesh Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, hsl(275 100% 65% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, hsl(191 100% 50% / 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(314 100% 65% / 0.04) 0%, transparent 70%),
            linear-gradient(180deg, hsl(240 10% 2%) 0%, hsl(240 15% 4%) 100%)
          `
        }}
      />
      
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(275 100% 65% / 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(191 100% 50% / 0.12) 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'float 25s ease-in-out infinite reverse'
          }}
        />
      </div>
      
      {/* Edge Bloom Triggers for Debug Mode */}
      <EdgeBloomTrigger edge="top" thickness={40} />
      <EdgeBloomTrigger edge="bottom" thickness={60} />
      <EdgeBloomTrigger edge="left" thickness={20} />
      <EdgeBloomTrigger edge="right" thickness={20} />

      <div className="flex flex-col h-screen">
        <ViewContainer>
          <div className="flex h-full">
            {/* Main view */}
            <div className="flex-1 flex flex-col">
              {currentView === 'arrange' && (
                <AdvancedTimelineView
                  audioBuffers={audioBuffers}
                  onSeek={handleSeek}
                  onFileSelect={(file) => {
                    handleFileSelect({ target: { files: [file] } } as any);
                  }}
                  onPluginSelect={(pluginId) => {
                    if (selectedTrackId) {
                      handlePluginSelect(pluginId);
                    } else {
                      toast({
                        title: "No Track Selected",
                        description: "Click a track in the timeline to select it",
                      });
                    }
                  }}
                  selectedTrackId={selectedTrackId}
                  onTrackSelect={setSelectedTrackId}
                />
              )}
              
              {currentView === 'mix' && (
                <NextGenMixerView
                  engineRef={engineRef}
                  onExport={handleExport}
                  isExporting={isExporting}
                  onVolumeChange={handleVolumeChange}
                  onPanChange={handlePanChange}
                  onMuteToggle={handleMuteToggle}
                  onSoloToggle={handleSoloToggle}
                  onLoadPlugin={handleLoadPlugin}
                  onUnloadPlugin={handleUnloadPlugin}
                  onBypassPlugin={handleBypassPlugin}
                  onSendChange={handleSendChange}
                  onCreateBus={handleCreateBus}
                  onOpenPluginWindow={handleOpenPluginWindow}
                  onOpenPluginBrowser={handleOpenPluginBrowser}
                />
              )}
              
              {currentView === 'edit' && (
                <WaveformEditor />
              )}
            </div>
            
            {/* Right side panels - ALIGNED with consistent spacing */}
            <div 
              className="flex flex-col overflow-y-auto"
              style={{ gap: `${SPACING.sm}px` }}
            >
              {/* Beast Mode Panel */}
              <BeastModePanel />
              
              {/* AI Suggestions Panel - shows only in mix view */}
              {currentView === 'mix' && <AISuggestionsPanel />}
              
              {/* AI Assistant Panel */}
              {showAIAssistant && (
                <div className="w-96">
                  <AIAssistantPanel 
                    isOpen={showAIAssistant}
                    onClose={() => setShowAIAssistant(false)} 
                  />
                </div>
              )}
              
              {/* Metering dashboard - only in mix view */}
              {currentView === 'mix' && (
                <>
                  <MeteringDashboard
                    masterPeakLevel={masterPeakLevel}
                    analyser={engineRef.current?.getMasterAnalyser()}
                    engineRef={engineRef}
                  />
                  
                  {/* VelvetFloor Panel - Sub-harmonic monitoring */}
                  {engineRef.current && (
                    <VelvetFloorPanel
                      getVelvetFloorState={() => engineRef.current!.getVelvetFloorEngine().getVelvetFloorState()}
                      getHarmonicLattice={() => engineRef.current!.getVelvetFloorEngine().getHarmonicLattice()}
                      getALSColor={() => engineRef.current!.getVelvetFloorEngine().getALSColor()}
                      isPlaying={isPlaying}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </ViewContainer>
        
        {/* Central Command Hub - Permanently docked at bottom with Bloom */}
        <ContextualBloomWrapper
          config={{
            triggerZone: 'bottom',
            idleOpacity: 0.4,
            className: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1400px]",
            preferenceKey: 'transport'
          }}
        >
          <CentralCommandHub
            onImport={handleImport}
            onTogglePluginBrowser={() => togglePanel('browser')}
            onToggleAIAssistant={() => setShowAIAssistant(!showAIAssistant)}
          />
        </ContextualBloomWrapper>
        
        {/* Transport is now permanently visible - no toggle buttons needed */}
      </div>
      
      {/* Plugin Browser */}
      <PluginBrowser
        isOpen={isPanelOpen.browser}
        onClose={() => togglePanel('browser')}
        onPluginSelect={(pluginId) => {
          togglePanel('browser');
          toast({
            title: "Plugin Loaded",
            description: `${pluginId} added to track`,
          });
        }}
      />
      
      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />
      
      {/* Plugin Window Manager */}
      <PluginWindowManager
        openWindows={openPluginWindows}
        onCloseWindow={handleClosePluginWindow}
        onParameterChange={handlePluginParameterChange}
      />
    </div>
  );
};

// Wrap with ProjectProvider
export default function Index() {
  return (
    <ProjectProvider>
      <IndexContent />
    </ProjectProvider>
  );
}
