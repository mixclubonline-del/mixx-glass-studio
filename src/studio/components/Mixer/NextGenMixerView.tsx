/**
 * Next-Gen Mixer View - Revolutionary spatial mixing environment
 */

import React from 'react';
import { useMixerStore } from '@/store/mixerStore';
import { GlassChannelStrip } from './GlassChannelStrip';
import { MasterChannelStrip } from './MasterChannelStrip';
import { Layers, ChevronRight } from 'lucide-react';

interface NextGenMixerViewProps {
  onExport: () => void;
  isExporting: boolean;
}

export const NextGenMixerView: React.FC<NextGenMixerViewProps> = ({
  onExport,
  isExporting
}) => {
  const {
    channels,
    masterVolume,
    masterPeakLevel,
    selectedChannelId,
    updateChannel,
    selectChannel,
    setMasterVolume
  } = useMixerStore();
  
  const channelArray = Array.from(channels.values());
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mixer header */}
      <div className="flex items-center gap-3 px-4 py-3 glass border-b border-border/30">
        <Layers className="text-primary" size={20} />
        <h2 className="text-lg font-bold neon-text">Spatial Mixer</h2>
        <div className="text-xs text-muted-foreground ml-auto">
          {channelArray.length} channels
        </div>
      </div>
      
      {/* Mixer content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-min">
          {/* Master channel (fixed left) */}
          <MasterChannelStrip
            volume={masterVolume}
            peakLevel={masterPeakLevel}
            onVolumeChange={setMasterVolume}
            onExport={onExport}
            isExporting={isExporting}
          />
          
          {/* Separator */}
          <div className="w-px bg-gradient-to-b from-transparent via-border to-transparent" />
          
          {/* Channel strips */}
          {channelArray.length > 0 ? (
            <div className="flex gap-3 h-full">
              {channelArray.map((channel) => (
                <GlassChannelStrip
                  key={channel.id}
                  channel={channel}
                  isSelected={selectedChannelId === channel.id}
                  onSelect={selectChannel}
                  onVolumeChange={(id, volume) => updateChannel(id, { volume })}
                  onPanChange={(id, pan) => updateChannel(id, { pan })}
                  onMuteToggle={(id) => {
                    const ch = channels.get(id);
                    if (ch) updateChannel(id, { muted: !ch.muted });
                  }}
                  onSoloToggle={(id) => {
                    const ch = channels.get(id);
                    if (ch) updateChannel(id, { solo: !ch.solo });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">No channels</p>
                <p className="text-sm">Load tracks to see mixer channels</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
