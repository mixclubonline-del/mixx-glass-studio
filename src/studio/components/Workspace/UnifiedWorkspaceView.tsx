/**
 * Unified Workspace View - Single view that replaces separate arrange/mix/edit
 */

import React, { useState } from 'react';
import { MinimalTransportBar } from './MinimalTransportBar';
import { FullWidthSpectrumBar } from './FullWidthSpectrumBar';
import { SimplifiedTrackList } from './SimplifiedTrackList';
import { AlwaysVisibleAIPanel } from './AlwaysVisibleAIPanel';
import { ContextActionBar } from './ContextActionBar';
import { ContextualMixerPanel } from './ContextualMixerPanel';
import { AdvancedTimelineView } from '@/studio/components/Timeline/AdvancedTimelineView';
import { PluginWindowManager } from '@/studio/components/Plugins/PluginWindowManager';
import { BloomHUD } from '@/components/BloomMenu/BloomHUD';
import { createMenuConfig } from '@/components/BloomMenu/menuConfig';
import { useViewStore } from '@/store/viewStore';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/contexts/ProjectContext';

export const UnifiedWorkspaceView: React.FC = () => {
  const [isBloomMenuOpen, setIsBloomMenuOpen] = useState(false);
  const [audioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const [openPluginWindows, setOpenPluginWindows] = useState<Map<string, { trackId: string; slotNumber: number; pluginId: string }>>(new Map());
  const { toast } = useToast();
  const { audioEngine } = useProject();
  const togglePanel = useViewStore((state) => state.togglePanel);
  const setExportDialogOpen = useViewStore((state) => state.setExportDialogOpen);

  const handleClosePluginWindow = (windowId: string) => {
    setOpenPluginWindows(prev => {
      const newMap = new Map(prev);
      newMap.delete(windowId);
      return newMap;
    });
  };

  const handlePluginParameterChange = (trackId: string, slotNumber: number, paramName: string, value: number) => {
    if (audioEngine) {
      const pluginInstance = audioEngine.getPluginInstance?.(trackId, slotNumber);
      if (pluginInstance && 'setParams' in pluginInstance) {
        (pluginInstance as any).setParams({ [paramName]: value });
      }
    }
  };

  const menuConfig = createMenuConfig({
    onImport: () => {
      togglePanel('browser');
      toast({ title: "File Browser", description: "Import audio files" });
    },
    onExport: () => {
      setExportDialogOpen(true);
    },
    onSave: () => {
      toast({ title: "Saved", description: "Project saved successfully" });
    },
    onLoad: () => {
      toast({ title: "Load", description: "Load project" });
    },
    onTogglePluginBrowser: () => {
      togglePanel('effects');
    },
    onToggleAIAssistant: () => {
      toast({ title: "AI Assistant", description: "PrimeBrain ready" });
    },
    onPlay: () => {},
    onPause: () => {},
    onStop: () => {},
    onRecord: () => {},
    onSwitchView: () => {
      toast({ title: "View", description: "Unified workspace" });
    },
  });

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* Transport Bar */}
      <MinimalTransportBar onMenuClick={() => setIsBloomMenuOpen(!isBloomMenuOpen)} />

      {/* Spectrum Bar */}
      <FullWidthSpectrumBar />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Track List */}
        <SimplifiedTrackList />

        {/* Timeline/Waveform View */}
        <div className="flex-1 min-w-0 relative">
          <AdvancedTimelineView 
            audioBuffers={audioBuffers}
            onSeek={(time) => audioEngine?.seek?.(time)}
          />
        </div>

        {/* AI Panel */}
        <AlwaysVisibleAIPanel />
      </div>

      {/* Context Action Bar */}
      <ContextActionBar onBloomMenuClick={() => setIsBloomMenuOpen(!isBloomMenuOpen)} />

      {/* Contextual Mixer Panel (slides up when needed) */}
      <ContextualMixerPanel />

      {/* Plugin Windows */}
      <PluginWindowManager
        openWindows={openPluginWindows}
        onCloseWindow={handleClosePluginWindow}
        onParameterChange={handlePluginParameterChange}
      />

      {/* Bloom Menu */}
      {isBloomMenuOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto">
            <BloomHUD
              menuConfig={menuConfig}
              onAction={(action: any) => {
                try {
                  if (action && typeof action === 'function') {
                    action();
                  }
                } catch (error) {
                  console.error('Bloom action error:', error);
                }
                setIsBloomMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
