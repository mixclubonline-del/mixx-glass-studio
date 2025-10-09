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
import { PluginWindow } from "@/studio/components/Plugins/PluginWindow";
import { MixxReverb } from "@/studio/components/Plugins/MixxReverb";
import { MixxTune } from "@/studio/components/Plugins/MixxTune";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useViewStore } from "@/store/viewStore";
import { useTimelineStore } from "@/store/timelineStore";
import { useTracksStore } from "@/store/tracksStore";
import { useMixerStore } from "@/store/mixerStore";
import { Bot } from "lucide-react";
import { Track } from "@/audio/Track";
import { Bus } from "@/audio/Bus";
import { EQParams, CompressorParams, PeakLevel } from "@/types/audio";
import { TimelineTrack, Region } from "@/types/timeline";
import type { MusicalContext } from "@/types/mixxtune";

const Index = () => {
  const engineRef = useRef<AudioEngine | null>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Global stores
  const { currentView } = useViewStore();
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying, setDuration } = useTimelineStore();
  const { tracks, regions, addTrack, addRegion } = useTracksStore();
  const { 
    channels, 
    masterPeakLevel,
    addChannel,
    updatePeakLevel,
    setMasterPeakLevel
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
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  // Update peak meters
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
    }, 100);
    
    return () => clearInterval(interval);
  }, [channels, setMasterPeakLevel, updatePeakLevel]);

  const handleLoadTrack = async (file: File) => {
    if (!engineRef.current) return;
    
    try {
      const id = `track-${Date.now()}`;
      await engineRef.current.loadTrack(id, file.name, file);
      
      const audioTracks = engineRef.current.getTracks();
      const loadedTrack = audioTracks.find(t => t.id === id);
      
      if (loadedTrack && loadedTrack.buffer) {
        // Add to timeline store
        const timelineTrack: TimelineTrack = {
          id,
          name: file.name,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          height: 100,
          regions: [],
          muted: false,
          solo: false,
          recordArmed: false
        };
        addTrack(timelineTrack);
        
        // Create region
        const region: Region = {
          id: `region-${id}`,
          trackId: id,
          name: file.name,
          startTime: 0,
          duration: loadedTrack.buffer.duration,
          bufferOffset: 0,
          bufferDuration: loadedTrack.buffer.duration,
          color: timelineTrack.color,
          fadeIn: 0,
          fadeOut: 0,
          gain: 1,
          locked: false,
          muted: false
        };
        addRegion(region);
        
        // Store audio buffer
        setAudioBuffers(prev => new Map(prev).set(region.id, loadedTrack.buffer!));
        
        // Add to mixer
        addChannel({
          id,
          name: file.name,
          volume: 0.75,
          pan: 0,
          muted: false,
          solo: false,
          color: timelineTrack.color,
          peakLevel: { left: -60, right: -60 }
        });
        
        // Update duration
        setDuration(Math.max(region.startTime + region.duration, 0));
      }
    } catch (error) {
      console.error("Failed to load track:", error);
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
    }
  };

  const handleMuteToggle = (id: string) => {
    if (engineRef.current) {
      const track = Array.from(channels.values()).find(t => t.id === id);
      if (track) {
        engineRef.current.setTrackMute(id, !track.muted);
      }
    }
  };

  const handlePlay = () => {
    if (engineRef.current) {
      engineRef.current.play();
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
      engineRef.current.stop();
      setCurrentTime(time);
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
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
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
          onSave={() => {}}
          onLoad={() => {}}
        />
        
        {/* View switcher */}
        <div className="flex items-center justify-center py-3 glass border-b border-border/30">
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
                />
              )}
              
              {currentView === 'mix' && (
                <NextGenMixerView
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              )}
              
              {currentView === 'edit' && (
                <WaveformEditor />
              )}
            </div>
            
            {/* Metering dashboard (right side) */}
            <MeteringDashboard
              masterPeakLevel={masterPeakLevel}
            />
          </div>
        </ViewContainer>
        
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
        />
      </div>
      
      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
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
