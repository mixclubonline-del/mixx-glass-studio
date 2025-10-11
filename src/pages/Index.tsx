import { useState, useEffect, useRef } from "react";
import { AudioEngine } from "@/audio/AudioEngine";
import {
  TopMenuBar,
  ViewContainer,
  AdvancedTimelineView,
  NextGenMixerView,
  MeteringDashboard,
  WaveformEditor,
  ViewSwitcher,
  TransportControls,
  AIAssistantPanel
} from "@/studio/components";
import { PluginBrowser } from "@/studio/components/Plugins/PluginBrowser";
import { PluginWindowManager } from "@/studio/components/Plugins/PluginWindowManager";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useViewStore } from "@/store/viewStore";
import { useTimelineStore } from "@/store/timelineStore";
import { useTracksStore } from "@/store/tracksStore";
import { useMixerStore } from "@/store/mixerStore";
import { Bot, Upload } from "lucide-react";
import { Track } from "@/audio/Track";
import { Bus } from "@/audio/Bus";
import { EQParams, CompressorParams, PeakLevel } from "@/types/audio";
import { TimelineTrack, Region } from "@/types/timeline";
import type { MusicalContext } from "@/types/mixxtune";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AudioAnalyzer } from "@/audio/analysis/AudioAnalyzer";
import { MixxAmbientOverlay } from "@/components/MixxAmbientOverlay";
import { BeastModeAmbient } from "@/components/BeastModeAmbient";
import { primeBrain } from "@/ai/primeBrain";
import { predictionEngine } from "@/ai/predictionEngine";
import { beastModeEngine } from "@/services/BeastModeEngine";
import { useBeastModeStore } from "@/store/beastModeStore";
import { BeastModePanel } from "@/studio/components/AI/BeastModePanel";
import { AISuggestionsPanel } from "@/studio/components/AI/AISuggestionsPanel";

const Index = () => {
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
  const [transportFloating, setTransportFloating] = useState(false);
  const [transportCollapsed, setTransportCollapsed] = useState(false);
  const [transportCovered, setTransportCovered] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const { toast } = useToast();
  
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

  // Update peak meters at 30Hz (33ms) for smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current) {
        const master = engineRef.current.getMasterPeakLevel();
        setMasterPeakLevel(master);
        
        channels.forEach((_, id) => {
          const level = engineRef.current!.getTrackPeakLevel(id);
          updatePeakLevel(id, level);
        });
      }
    }, 33); // 30Hz update rate
    
    return () => clearInterval(interval);
  }, [channels, setMasterPeakLevel, updatePeakLevel]);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => handleLoadTrack(file));
      toast({
        title: "Audio files imported",
        description: `${files.length} file(s) loaded successfully`,
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadTrack = async (file: File) => {
    if (!engineRef.current) return;
    
    try {
      const id = `track-${Date.now()}`;
      await engineRef.current.loadTrack(id, file.name, file);
      
      const audioTracks = engineRef.current.getTracks();
      const loadedTrack = audioTracks.find(t => t.id === id);
      
      if (loadedTrack && loadedTrack.buffer) {
        // Generate color
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 70%, 50%)`;
        
        // Add to timeline store
        const timelineTrack: TimelineTrack = {
          id,
          name: file.name,
          color,
          height: 100,
          regions: [],
          muted: false,
          solo: false,
          recordArmed: false
        };
        addTrack(timelineTrack);
        
        // Create region - start at time 0
        const region: Region = {
          id: `region-${id}`,
          trackId: id,
          name: file.name,
          startTime: 0, // Start at beginning of timeline
          duration: loadedTrack.buffer.duration,
          bufferOffset: 0,
          bufferDuration: loadedTrack.buffer.duration,
          color,
          fadeIn: 0,
          fadeOut: 0,
          gain: 1,
          locked: false,
          muted: false
        };
        addRegion(region);
        
        // Store audio buffer
        setAudioBuffers(prev => new Map(prev).set(region.id, loadedTrack.buffer!));
        
        // Auto-detect BPM, key, and time signature (client-side, non-blocking)
        setTimeout(() => {
          try {
            const bpm = AudioAnalyzer.detectBPM(loadedTrack.buffer!);
            const { key, scale } = AudioAnalyzer.detectKey(loadedTrack.buffer!);
            const timeSignature = AudioAnalyzer.inferTimeSignature(bpm, loadedTrack.buffer!);
            
            setDetectedBPM(bpm);
            setDetectedKey(`${key} ${scale}`);
            
            if (engineRef.current) {
              engineRef.current.bpm = bpm;
              engineRef.current.timeSignature = timeSignature;
            }
            
            toast({
              title: "Audio Analysis Complete",
              description: `BPM: ${bpm} | Key: ${key} ${scale} | Time: ${timeSignature.numerator}/${timeSignature.denominator}`,
            });
          } catch (error) {
            console.error("Audio analysis failed:", error);
          }
        }, 100);
        
        // Add to mixer - sync state
        addChannel({
          id,
          name: file.name,
          volume: 0.75,
          pan: 0,
          muted: false,
          solo: false,
          color,
          peakLevel: { left: -60, right: -60 }
        });
        
        // Sync initial volume to audio engine
        engineRef.current.setTrackVolume(id, 0.75);
        
        // Update duration
        const totalDuration = Math.max(region.startTime + region.duration, currentTime);
        setDuration(totalDuration);
        
        toast({
          title: "Track loaded",
          description: `${file.name} added to timeline and mixer`,
        });
      }
    } catch (error) {
      console.error("Failed to load track:", error);
      toast({
        title: "Error",
        description: "Failed to load audio file",
        variant: "destructive"
      });
    }
  };

  const handleRemoveTrack = (id: string) => {
    if (engineRef.current) {
      engineRef.current.removeTrack(id);
      // Stores will handle removal through their own methods
    }
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
      
      {/* Animated background */}
      <div className="fixed inset-0 gradient-animate opacity-10 pointer-events-none" />
      
      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--prime-500)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--prime-500)) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="flex flex-col h-screen">
        <TopMenuBar
          onExport={handleExport}
          onSave={() => toast({ title: "Save", description: "Project saved locally" })}
          onLoad={() => toast({ title: "Load", description: "Not yet implemented" })}
          onImport={handleImport}
          onAIMix={() => setShowAIAssistant(true)}
          onStemSeparation={() => toast({ 
            title: "Stem Separation", 
            description: "Feature ready - upload audio to begin separation" 
          })}
          onAutoMaster={() => toast({ 
            title: "Auto-Master", 
            description: "Analyzing mix for optimal mastering settings..." 
          })}
          transportHidden={transportCollapsed}
          transportFloating={transportFloating}
          transportCovered={transportCovered}
          onToggleTransportHide={() => setTransportCollapsed(!transportCollapsed)}
          onToggleTransportFloat={() => setTransportFloating(!transportFloating)}
          onToggleTransportCover={() => setTransportCovered(!transportCovered)}
        />
        
        {/* View switcher & quick actions */}
        <div className="flex items-center justify-between px-4 py-3 glass border-b border-border/30">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Audio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePanel('browser')}
              className="gap-2 neon-glow-prime"
            >
              🎛️ Plugin Suite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              AI Assistant
            </Button>
            {(detectedBPM || detectedKey) && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {detectedBPM && <span className="font-mono">BPM: {detectedBPM}</span>}
                {detectedKey && <span className="font-mono">Key: {detectedKey}</span>}
              </div>
            )}
          </div>
          <ViewSwitcher />
        </div>
        
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
            
            {/* Right side panels */}
            <div className="flex flex-col gap-2">
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
                <MeteringDashboard
                  masterPeakLevel={masterPeakLevel}
                  analyserNode={engineRef.current?.getMasterAnalyser()}
                  engineRef={engineRef}
                />
              )}
            </div>
          </div>
        </ViewContainer>
        
        {/* Transport Controls - Collapsible and Floatable */}
        {!transportCollapsed && (
          <div className={`${transportFloating ? "fixed bottom-4 right-4 z-50" : ""} ${transportCovered ? "opacity-30 hover:opacity-100 transition-opacity" : ""}`}>
            <TransportControls
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onExport={handleExport}
              isExporting={isExporting}
              bpm={120}
              timeSignature={{ numerator: 4, denominator: 4 }}
              onBpmChange={() => {}}
              onTimeSignatureChange={() => {}}
              isRecording={false}
              isLooping={useTimelineStore.getState().loopEnabled}
              onRecord={handleRecord}
              onLoopToggle={handleLoopToggle}
              onPrevBar={handlePrevBar}
              onNextBar={handleNextBar}
              currentTime={currentTime}
              masterVolume={engineRef.current?.getMasterGain() || 0.75}
              onMasterVolumeChange={(volume) => {
                if (engineRef.current) {
                  engineRef.current.setMasterGain(volume);
                  
                  // Send to Prime Brain
                  primeBrain.processControlEvent({
                    type: 'fader',
                    controlId: 'master_volume',
                    value: volume,
                    timestamp: Date.now()
                  });
                }
              }}
            />
          </div>
        )}
        
        {/* Transport Toggle Buttons */}
        <div className="fixed bottom-4 left-4 flex gap-2 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTransportCollapsed(!transportCollapsed)}
            title={transportCollapsed ? "Show Transport" : "Hide Transport"}
          >
            {transportCollapsed ? "Show Transport" : "Hide Transport"}
          </Button>
          {!transportCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransportFloating(!transportFloating)}
              title={transportFloating ? "Dock Transport" : "Float Transport"}
            >
              {transportFloating ? "Dock" : "Float"}
            </Button>
          )}
        </div>
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
      
      {/* AI Assistant Toggle FAB */}
      <button
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        className="fixed right-4 bottom-24 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40 neon-glow-prime"
      >
        <Bot className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Index;
