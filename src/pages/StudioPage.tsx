/**
 * Studio Page - Main DAW interface with view routing
 */
import { useState } from "react";
import { useViewStore } from "@/store/viewStore";
import { ProjectProvider, useProject, useTransport } from "@/contexts/ProjectContext";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import { EffectsRack } from "../studio/components/EffectsRack";
import { TransportControls } from "../studio/components/TransportControls";
import { MixxAIStudio } from "../studio/components/AI/MixxAIStudio";
import { ProducerLab } from "../studio/components/Producer/ProducerLab";
import { ViewSwitcher } from "../studio/components/Navigation/ViewSwitcher";
import { ViewContainer } from "../studio/components/Navigation/ViewContainer";
import { CompactStudioHeader } from "../studio/components/Navigation/CompactStudioHeader";
import { FloatingBeastMode } from "../studio/components/AI/FloatingBeastMode";
import { CollapsibleMeteringPanel } from "../studio/components/Metering/CollapsibleMeteringPanel";
import { AdvancedTimelineView } from "../studio/components/Timeline/AdvancedTimelineView";
import { TransportFloatingMini } from "../studio/components/TransportFloatingMini";

// Inner component that uses ProjectContext
function StudioPageContent() {
  const viewStore = useViewStore();
  const { currentView } = viewStore;
  const { audioEngine } = useProject();
  const { transport } = useTransport();
  const [duration, setDuration] = useState(180);
  const [reverbMix, setReverbMix] = useState(0.3);
  const [delayTime, setDelayTime] = useState(0.5);
  const [delayFeedback, setDelayFeedback] = useState(0.4);
  const [delayMix, setDelayMix] = useState(0.3);
  const [limiterThreshold, setLimiterThreshold] = useState(-1);
  const [transportHidden, setTransportHidden] = useState(false);
  const [transportFloating, setTransportFloating] = useState(false);
  
  const handleViewChange = (view: string) => {
    // Map from compact header view names to store view names
    const viewMap: Record<string, typeof currentView> = {
      'arrange': 'arrange',
      'mix': 'mix',
      'edit': 'edit',
      'produce': 'producer-lab',
      'ai': 'ai-studio'
    };
    viewStore.setView(viewMap[view] || 'arrange');
  };

  // Enable global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  const handleSeek = (time: number) => {
    audioEngine.seek(time);
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
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Compact Studio Header - Single 64px header */}
      {!transportHidden && (
        <CompactStudioHeader 
          currentView={currentView}
          onViewChange={handleViewChange}
          transportHidden={transportHidden}
          transportFloating={transportFloating}
          onToggleTransportHide={() => setTransportHidden(!transportHidden)}
          onToggleTransportFloat={() => setTransportFloating(!transportFloating)}
        />
      )}

      {/* View Content - Fills remaining space */}
      <ViewContainer className="flex-1 overflow-hidden">
        {currentView === 'arrange' ? (
          <AdvancedTimelineView
            audioBuffers={new Map()}
            onSeek={handleSeek}
          />
        ) : currentView === 'ai-studio' ? (
          <MixxAIStudio />
        ) : currentView === 'producer-lab' ? (
          <ProducerLab />
        ) : currentView === 'mix' ? (
          <div className="h-full flex items-center justify-center bg-background/50">
            <div className="text-center text-muted-foreground py-12">
              <h2 className="text-2xl font-bold mb-2">Mixer View</h2>
              <p>Dedicated mixer console coming soon...</p>
            </div>
          </div>
        ) : currentView === 'edit' ? (
          <div className="h-full flex items-center justify-center bg-background/50">
            <div className="text-center text-muted-foreground py-12">
              <h2 className="text-2xl font-bold mb-2">Edit View</h2>
              <p>Waveform editor coming soon...</p>
            </div>
          </div>
        ) : null}
      </ViewContainer>

      {/* Global Collapsible Metering Panel - accessible from View menu */}
      <CollapsibleMeteringPanel />
      
      {/* Floating Beast Mode Panel - Bottom right */}
      <FloatingBeastMode />

      {/* Floating Mini Transport - Always visible */}
      <TransportFloatingMini
        isPlaying={transport.isPlaying}
        onPlay={() => audioEngine.play()}
        onPause={() => audioEngine.pause()}
        onStop={() => audioEngine.stop()}
        onToggleFloat={() => {}}
        isFloating={true}
        currentTime={transport.currentTime}
      />
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
