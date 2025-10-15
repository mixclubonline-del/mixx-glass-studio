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
import { ViewContainer } from "../studio/components/Navigation/ViewContainer";
import { UnifiedTransportBar } from "../studio/components/Navigation/UnifiedTransportBar";
import { CollapsibleMeteringPanel } from "../studio/components/Metering/CollapsibleMeteringPanel";
import { AudioPlaybackCoordinator } from "@/audio/AudioPlaybackCoordinator";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useTracksStore } from "@/store/tracksStore";

// Inner component that uses ProjectContext
function StudioPageContent() {
  const { currentView } = useViewStore();
  const { audioEngine } = useProject();
  const { transport } = useTransport();
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
      {/* Unified Transport Bar - Always visible */}
      <div className="px-3 pt-3">
        <UnifiedTransportBar />
      </div>
      
      {/* View Switcher */}
      <div className="px-3 py-2 border-b border-border/30">
        <ViewSwitcher />
      </div>

      {/* View Content */}
      <ViewContainer className="flex-1">
        {currentView === 'ai-studio' ? (
          <MixxAIStudio />
        ) : currentView === 'producer-lab' ? (
          <ProducerLab />
        ) : (
          <div style={{ padding: 12 }}>
            {/* Top timeline/arranger */}
            <div style={{ marginBottom: 12 }}>
              <Timeline 
                currentTime={transport.currentTime}
                duration={duration}
                isPlaying={transport.isPlaying}
                onSeek={handleSeek}
              />
            </div>

            {/* Main rack (your plugins live here) */}
            <div style={{ marginBottom: 12 }}>
              <EffectsRack 
                reverbMix={reverbMix}
                delayTime={delayTime}
                delayFeedback={delayFeedback}
                delayMix={delayMix}
                limiterThreshold={limiterThreshold}
                onEffectChange={handleEffectChange}
              />
            </div>
          </div>
        )}
      </ViewContainer>

      {/* Global Collapsible Metering Panel - accessible from View menu */}
      <CollapsibleMeteringPanel />
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
