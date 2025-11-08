/**
 * Studio Page - Main DAW interface with view routing
 */
import { useState } from "react";
import { useViewStore } from "@/store/viewStore";
import { ProjectProvider, useProject, useTransport } from "@/contexts/ProjectContext";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { EffectsRack } from "../studio/components/EffectsRack";
import { TransportControls } from "../studio/components/TransportControls";
import { MixxAIStudio } from "../studio/components/AI/MixxAIStudio";
import { ProducerLab } from "../studio/components/Producer/ProducerLab";
import { ViewSwitcher } from "../studio/components/Navigation/ViewSwitcher";
import { ViewContainer } from "../studio/components/Navigation/ViewContainer";
import { UnifiedTransportBar } from "../studio/components/Navigation/UnifiedTransportBar";
import { CreativeHeader } from "../studio/components/Navigation/CreativeHeader";
import { FloatingBeastMode } from "../studio/components/AI/FloatingBeastMode";
import { CollapsibleMeteringPanel } from "../studio/components/Metering/CollapsibleMeteringPanel";
import { AdvancedTimelineView } from "../studio/components/Timeline/AdvancedTimelineView";
import { ProductionToolsMenu } from "../studio/components/Navigation/ProductionToolsMenu";
import { MasteringPanel } from "../studio/components/Metering/MasteringPanel";
import { HybridMixerArrangeView } from "../studio/components/Mixer/HybridMixerArrangeView";
import { EnhancedPianoRoll } from "../studio/components/Timeline/EnhancedPianoRoll";
import { StepSequencer } from "../studio/components/Producer/StepSequencer";
import { GrooveEngine } from "../studio/components/Producer/GrooveEngine";
import { AdvancedAutomationPanel } from "../studio/components/Automation/AdvancedAutomationPanel";
import { TimeStretchDialog } from "../studio/components/Timeline/TimeStretchDialog";
import { CompingManager } from "../studio/components/Timeline/CompingManager";
import { AdvancedRoutingMatrix } from "../studio/components/Mixer/AdvancedRoutingMatrix";
import { ExportDialog } from "../studio/components/Export";
import { StemSeparation, AudioRestoration, AdvancedPitchCorrection, AudioToMIDI, VoiceIsolation, SpectralEditor } from "../studio/components/Audio";

// Inner component that uses ProjectContext
function StudioPageContent() {
  const { currentView, isPanelOpen, exportDialogOpen, setExportDialogOpen } = useViewStore();
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
      {/* Fixed Top Header - Creative Controls + Transport + View Switcher */}
      <div className="flex-none space-y-3 p-4 border-b border-border/30">
        {/* Creative Header - BPM, Time Signature, Position */}
        <CreativeHeader />
        
        {/* Transport Controls */}
        <UnifiedTransportBar />
        
        {/* View Switcher + Tools Menu */}
        <div className="flex items-center justify-between">
          <ViewSwitcher />
          <ProductionToolsMenu />
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
          <HybridMixerArrangeView
            audioBuffers={new Map()}
            onSeek={handleSeek}
            engineRef={undefined}
            onVolumeChange={(id, volume) => {
              console.log('Volume change:', id, volume);
            }}
            onPanChange={(id, pan) => {
              console.log('Pan change:', id, pan);
            }}
            onMuteToggle={(id) => {
              console.log('Mute toggle:', id);
            }}
            onSoloToggle={(id) => {
              console.log('Solo toggle:', id);
            }}
            onExport={handleExport}
            isExporting={false}
            onLoadPlugin={(trackId, slotNumber, pluginId) => {
              console.log('Load plugin:', trackId, slotNumber, pluginId);
            }}
            onUnloadPlugin={(trackId, slotNumber) => {
              console.log('Unload plugin:', trackId, slotNumber);
            }}
            onBypassPlugin={(trackId, slotNumber, bypass) => {
              console.log('Bypass plugin:', trackId, slotNumber, bypass);
            }}
            onSendChange={(trackId, busId, amount) => {
              console.log('Send change:', trackId, busId, amount);
            }}
            onCreateBus={(name, color, type) => {
              console.log('Create bus:', name, color, type);
            }}
            onOpenPluginWindow={(trackId, slotNumber, pluginId) => {
              console.log('Open plugin window:', trackId, slotNumber, pluginId);
            }}
          />
        ) : currentView === 'edit' ? (
          <div className="h-full flex items-center justify-center bg-background/50">
            <div className="text-center text-muted-foreground py-12">
              <h2 className="text-2xl font-bold mb-2">Edit View</h2>
              <p>Waveform editor coming soon...</p>
            </div>
          </div>
        ) : currentView === 'master' ? (
          <div className="h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Mastering Suite</h2>
                <p className="text-muted-foreground">Professional mastering tools for final polish</p>
              </div>
              <MasteringPanel />
            </div>
          </div>
        ) : null}
      </ViewContainer>

      {/* Global Collapsible Metering Panel - accessible from View menu */}
      <CollapsibleMeteringPanel />
      
      {/* Floating Beast Mode Panel - Bottom right */}
      <FloatingBeastMode />
      
      {/* Production Tool Panels */}
      {isPanelOpen.pianoRoll && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-7xl h-[90vh]">
            <EnhancedPianoRoll 
              regionId="region-1"
              onClose={() => useViewStore.getState().togglePanel('pianoRoll')}
              onSave={(notes) => {
                console.log('Saved notes:', notes);
                useViewStore.getState().togglePanel('pianoRoll');
              }}
            />
          </div>
        </div>
      )}
      
      {isPanelOpen.stepSequencer && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="bg-background rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h2 className="font-semibold">Step Sequencer</h2>
                <Button size="sm" variant="ghost" onClick={() => useViewStore.getState().togglePanel('stepSequencer')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <StepSequencer 
                trackId="track-1"
                onTrigger={(step, velocity, pan, pitch) => {
                  console.log('Step triggered:', { step, velocity, pan, pitch });
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {isPanelOpen.grooveEngine && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <GrooveEngine 
              onApply={(groove) => {
                console.log('Applying groove:', groove);
                useViewStore.getState().togglePanel('grooveEngine');
              }} 
            />
          </div>
        </div>
      )}
      
      {isPanelOpen.automation && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <AdvancedAutomationPanel 
              trackId="track-1"
              parameter="volume"
              onClose={() => useViewStore.getState().togglePanel('automation')} 
            />
          </div>
        </div>
      )}
      
      {isPanelOpen.comping && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <CompingManager 
              trackId="track-1"
              onClose={() => useViewStore.getState().togglePanel('comping')} 
            />
          </div>
        </div>
      )}
      
      {isPanelOpen.routing && (
        <AdvancedRoutingMatrix
          tracks={[
            { id: 'track-1', name: 'Vocals', type: 'audio' },
            { id: 'track-2', name: 'Drums', type: 'audio' },
            { id: 'track-3', name: 'Bass', type: 'audio' },
            { id: 'track-4', name: 'Synth', type: 'midi' },
          ]}
          buses={[
            { id: 'bus-1', name: 'Reverb' },
            { id: 'bus-2', name: 'Delay' },
            { id: 'bus-3', name: 'Parallel Comp' },
          ]}
          onClose={() => useViewStore.getState().togglePanel('routing')}
        />
      )}
      
      {/* Export Dialog */}
      <ExportDialog 
        open={exportDialogOpen} 
        onOpenChange={setExportDialogOpen}
        audioEngine={audioEngine}
      />

      {/* Audio Processing Panels */}
      {isPanelOpen.stemSeparation && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-background rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h2 className="font-semibold">Stem Separation</h2>
                <Button size="sm" variant="ghost" onClick={() => useViewStore.getState().togglePanel('stemSeparation')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <StemSeparation />
            </div>
          </div>
        </div>
      )}

      {isPanelOpen.audioRestoration && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-background rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h2 className="font-semibold">Audio Restoration</h2>
                <Button size="sm" variant="ghost" onClick={() => useViewStore.getState().togglePanel('audioRestoration')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AudioRestoration />
            </div>
          </div>
        </div>
      )}

      {isPanelOpen.advancedPitch && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-background rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h2 className="font-semibold">Advanced Pitch Correction</h2>
                <Button size="sm" variant="ghost" onClick={() => useViewStore.getState().togglePanel('advancedPitch')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AdvancedPitchCorrection />
            </div>
          </div>
        </div>
      )}

      {isPanelOpen.audioToMIDI && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-background rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h2 className="font-semibold">Audio to MIDI Converter</h2>
                <Button size="sm" variant="ghost" onClick={() => useViewStore.getState().togglePanel('audioToMIDI')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AudioToMIDI 
                onMIDIGenerated={(notes) => {
                  console.log('MIDI notes generated:', notes);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {isPanelOpen.voiceIsolation && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-background rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h2 className="font-semibold">Voice Isolation & Removal</h2>
                <Button size="sm" variant="ghost" onClick={() => useViewStore.getState().togglePanel('voiceIsolation')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <VoiceIsolation />
            </div>
          </div>
        </div>
      )}

      {isPanelOpen.spectralEditor && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="bg-background rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h2 className="font-semibold">Spectral Editor</h2>
                <Button size="sm" variant="ghost" onClick={() => useViewStore.getState().togglePanel('spectralEditor')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SpectralEditor />
            </div>
          </div>
        </div>
      )}
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
