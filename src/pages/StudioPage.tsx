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
import { UnifiedTransportBar } from "../studio/components/Navigation/UnifiedTransportBar";
import { CollapsibleMeteringPanel } from "../studio/components/Metering/CollapsibleMeteringPanel";
import { AdvancedTimelineView } from "../studio/components/Timeline/AdvancedTimelineView";

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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Top Bar - Transport + View Switcher */}
      <div className="flex-none border-b border-border/30">
        {/* Transport Controls - Fixed at top */}
        <div className="px-4 py-2 border-b border-border/10">
          <UnifiedTransportBar />
        </div>
        
        {/* View Switcher - Secondary nav */}
        <div className="px-4 py-2">
          <ViewSwitcher />
        </div>
      </div>

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
