/**
 * Next-Gen Mixer View - Revolutionary spatial mixing environment
 */

import React from 'react';
import { useMixerStore } from '@/store/mixerStore';
import { GlassChannelStrip } from './GlassChannelStrip';
import { MasterChannelStrip } from './MasterChannelStrip';
import { MasterMeteringPanel } from '../Metering/MasterMeteringPanel';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTracksStore } from '@/store/tracksStore';
import { Layers, ChevronRight } from 'lucide-react';

interface NextGenMixerViewProps {
  onExport: () => void;
  isExporting: boolean;
}

export const NextGenMixerView: React.FC<NextGenMixerViewProps> = ({
  onExport,
  isExporting
}) => {
  const { channels, masterVolume, masterPeakLevel, selectedChannelId, selectChannel, updateChannel, setMasterVolume } = useMixerStore();
  const { setAddTrackDialogOpen } = useTracksStore();
  const channelArray = Array.from(channels.values());
  
  return (
    <div className="h-full flex bg-background">
      {/* Mixer channels */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 glass border-b border-border/30 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold neon-text">Professional Mixer</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {channelArray.length} channels • ITU-R BS.1770-5 Metering
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setAddTrackDialogOpen(true)}
            className="gap-1 shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
          >
            <Plus size={14} />
            Add Channel
          </Button>
        </div>
        
        {/* Mixer content */}
        <div className="flex-1 flex items-start gap-4 p-4 overflow-x-auto">
          {/* Master channel (fixed on left) */}
          <div className="flex-shrink-0">
            <MasterChannelStrip
              volume={masterVolume}
              peakLevel={masterPeakLevel}
              onVolumeChange={setMasterVolume}
              onExport={onExport}
              isExporting={isExporting}
            />
          </div>
          
          {/* Channel strips */}
          {channelArray.length > 0 ? (
            <div className="flex gap-3">
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
            <div className="flex items-center justify-center flex-1 text-center">
              <div className="glass-glow rounded-lg p-8">
                <p className="text-muted-foreground mb-2">No channels loaded</p>
                <p className="text-sm text-muted-foreground">
                  Load audio tracks to see mixer channels
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Master Metering Panel (right side) */}
      <MasterMeteringPanel />
    </div>
  );
};
