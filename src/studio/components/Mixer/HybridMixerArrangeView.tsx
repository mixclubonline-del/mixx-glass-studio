/**
 * Hybrid Mixer/Arrange View - Split screen with timeline and mixer
 */

import React from 'react';
import { AdvancedTimelineView } from '../Timeline/AdvancedTimelineView';
import { NextGenMixerView } from './NextGenMixerView';
import { ResizableSplitView } from '../Navigation/ResizableSplitView';

interface HybridMixerArrangeViewProps {
  audioBuffers: Map<string, AudioBuffer>;
  onSeek: (time: number) => void;
  engineRef?: React.RefObject<any>;
  onVolumeChange: (id: string, volume: number) => void;
  onPanChange: (id: string, pan: number) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onExport: () => void;
  isExporting?: boolean;
  onLoadPlugin: (trackId: string, slotNumber: number, pluginId: string) => void;
  onUnloadPlugin: (trackId: string, slotNumber: number) => void;
  onBypassPlugin: (trackId: string, slotNumber: number, bypass: boolean) => void;
  onSendChange: (trackId: string, busId: string, amount: number) => void;
  onCreateBus: (name: string, color: string, type: 'aux' | 'group') => void;
  onOpenPluginWindow: (trackId: string, slotNumber: number, pluginId: string) => void;
  onOpenPluginBrowser?: (trackId: string, slotNumber: number) => void;
}

export const HybridMixerArrangeView: React.FC<HybridMixerArrangeViewProps> = ({
  audioBuffers,
  onSeek,
  engineRef,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onExport,
  isExporting,
  onLoadPlugin,
  onUnloadPlugin,
  onBypassPlugin,
  onSendChange,
  onCreateBus,
  onOpenPluginWindow,
  onOpenPluginBrowser
}) => {
  return (
    <ResizableSplitView
      storageKey="hybridMixerArrange"
      defaultTopSize={60}
      minTopSize={20}
      minBottomSize={20}
      topPanel={
        <AdvancedTimelineView
          audioBuffers={audioBuffers}
          onSeek={onSeek}
        />
      }
      bottomPanel={
        <NextGenMixerView
          engineRef={engineRef}
          onVolumeChange={onVolumeChange}
          onPanChange={onPanChange}
          onMuteToggle={onMuteToggle}
          onSoloToggle={onSoloToggle}
          onExport={onExport}
          isExporting={isExporting}
          onLoadPlugin={onLoadPlugin}
          onUnloadPlugin={onUnloadPlugin}
          onBypassPlugin={onBypassPlugin}
          onSendChange={onSendChange}
          onCreateBus={onCreateBus}
          onOpenPluginWindow={onOpenPluginWindow}
          onOpenPluginBrowser={onOpenPluginBrowser}
        />
      }
    />
  );
};
