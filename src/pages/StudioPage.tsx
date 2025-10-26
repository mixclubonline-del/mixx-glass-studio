/**
 * Studio Page - Main DAW interface with view routing
 */
import { useState, useEffect, useRef } from "react";
import { useViewStore } from "@/store/viewStore";
import { ProjectProvider, useProject, useTransport } from "@/contexts/ProjectContext";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import { EffectsRack } from "../studio/components/EffectsRack";
import { Timeline } from "../studio/components/Timeline";
import { TransportControls } from "../studio/components/TransportControls";
import { MixxAIStudio } from "../studio/components/AI/MixxAIStudio";
import { ProducerLab } from "../studio/components/Producer/ProducerLab";
import { ViewSwitcher } from "../studio/components/Navigation/ViewSwitcher";
import { ArrangeWindow } from "../studio/components/Timeline/ArrangeWindow";
import { ViewContainer } from "../studio/components/Navigation/ViewContainer";
import { UnifiedTransportBar } from "../studio/components/Navigation/UnifiedTransportBar";
import { CollapsibleMeteringPanel } from "../studio/components/Metering/CollapsibleMeteringPanel";
import { AudioPlaybackCoordinator } from "@/audio/AudioPlaybackCoordinator";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useTracksStore } from "@/store/tracksStore";
import { ArrangeBrowserPanel } from "@/studio/components/Timeline/ArrangeBrowserPanel";

// Inner component that uses ProjectContext
function StudioPageContent() {
  const { currentView } = useViewStore();
  const { audioEngine, bpm, setBpm, masterVolume, setMasterVolume } = useProject();
  const { transport, play, pause, stop } = useTransport();
  const [duration, setDuration] = useState(180);
  const [reverbMix, setReverbMix] = useState(0.3);
  const [delayTime, setDelayTime] = useState(0.5);
  const [delayFeedback, setDelayFeedback] = useState(0.4);
  const [delayMix, setDelayMix] = useState(0.3);
  const [limiterThreshold, setLimiterThreshold] = useState(-1);

  // Audio playback coordinator
  const coordinatorRef = useRef<AudioPlaybackCoordinator | null>(null);
  
  // Recording hook
  const recording = useAudioRecording();
  const selectedTrackId = useTracksStore(state => state.selectedTrackId);

  // Enable global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  // Initialize audio coordinator
  useEffect(() => {
    if (!coordinatorRef.current) {
      coordinatorRef.current = new AudioPlaybackCoordinator(audioEngine);
      coordinatorRef.current.syncTracksToMixer();
    }
    
    return () => {
      coordinatorRef.current?.dispose();
    };
  }, [audioEngine]);

  // Update coordinator during playback
  useEffect(() => {
    if (coordinatorRef.current) {
      if (transport.isPlaying) {
        coordinatorRef.current.play(transport.currentTime);
      } else {
        coordinatorRef.current.pause();
      }
      coordinatorRef.current.update(transport.currentTime);
    }
  }, [transport.isPlaying, transport.currentTime]);

  // Sync tracks to mixer when tracks change
  const tracks = useTracksStore(state => state.tracks);
  useEffect(() => {
    coordinatorRef.current?.syncTracksToMixer();
  }, [tracks]);

  const handleSeek = (time: number) => {
    audioEngine.seek(time);
    coordinatorRef.current?.seek(time);
  };

  const handleRecord = () => {
    if (recording.isRecording) {
      recording.stopRecording();
    } else if (selectedTrackId) {
      recording.startRecording(selectedTrackId, transport.currentTime);
    }
  };
  
  const handleExport = async () => {
    try {
      const blob = await audioEngine.exportMix();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mixx-export.wav';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const handleEffectChange = (param: string, value: number) => {
    switch (param) {
      case 'reverbMix': setReverbMix(value); break;
      case 'delayTime': setDelayTime(value); break;
      case 'delayFeedback': setDelayFeedback(value); break;
      case 'delayMix': setDelayMix(value); break;
      case 'limiterThreshold': setLimiterThreshold(value); break;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar: Transport Controls */}
      <div className="flex-none border-b border-border/30">
        <UnifiedTransportBar />
      </div>
      
      {/* Main Content Area: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Context-aware browser/tools */}
        <div className="w-80 flex-none border-r border-border/30 bg-card/50 backdrop-blur-sm overflow-y-auto">
          {currentView === 'producer-lab' ? (
            <ProducerLab />
          ) : currentView === 'ai-studio' ? (
            <MixxAIStudio />
          ) : (
            <ArrangeBrowserPanel />
          )}
        </div>

        {/* Main Content Area */}
        <ViewContainer className="flex-1 flex flex-col overflow-hidden">
          {/* View Switcher - Now integrated into main area */}
          <div className="flex-none px-3 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm">
            <ViewSwitcher />
          </div>
          
          {/* Main Timeline/Arrange View */}
          <div className="flex-1 overflow-hidden">
            <ArrangeWindow
              bpm={bpm}
              onBpmChange={setBpm}
              isPlaying={transport.isPlaying}
              onPlay={play}
              onPause={pause}
              onStop={stop}
              onRecord={handleRecord}
              currentTime={transport.currentTime}
              masterVolume={masterVolume}
              onMasterVolumeChange={setMasterVolume}
            />
          </div>
        </ViewContainer>

        {/* Right Panel - Metering (collapsible) */}
        <CollapsibleMeteringPanel />
      </div>
    </div>
  );
}

// Wrap with ProjectProvider
export default function StudioPage() {
  return (
    <ProjectProvider>
      <StudioPageContent />
    </ProjectProvider>
  );
}
