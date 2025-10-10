/**
 * Next-Gen Mixer View - Revolutionary spatial mixing environment
 */

import React from 'react';
import { useMixerStore } from '@/store/mixerStore';
import { GlassChannelStrip } from './GlassChannelStrip';
import { MasterChannelStrip } from './MasterChannelStrip';
import { MasterMeteringPanel } from '../Metering/MasterMeteringPanel';
import { MixerSidePanels } from './MixerSidePanels';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTracksStore } from '@/store/tracksStore';
import { useTimelineStore } from '@/store/timelineStore';
import { Layers, ChevronRight } from 'lucide-react';
import mixxclubLogo from '@/assets/mixxclub-logo.png';

interface NextGenMixerViewProps {
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

export const NextGenMixerView: React.FC<NextGenMixerViewProps> = ({
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onExport,
  isExporting = false,
  onLoadPlugin,
  onUnloadPlugin,
  onBypassPlugin,
  onSendChange,
  onCreateBus,
  onOpenPluginWindow,
  onOpenPluginBrowser
}) => {
  const { channels, masterVolume, masterPeakLevel, selectedChannelId, selectChannel, updateChannel, setMasterVolume, buses } = useMixerStore();
  const { setAddTrackDialogOpen } = useTracksStore();
  const { loopEnabled, loopStart, loopEnd, setLoopEnabled, setLoopStart, setLoopEnd } = useTimelineStore();
  const channelArray = Array.from(channels.values());
  
  const handleVolumeChange = (id: string, volume: number) => {
    updateChannel(id, { volume });
    onVolumeChange(id, volume);
  };
  
  const handlePanChange = (id: string, pan: number) => {
    updateChannel(id, { pan });
    onPanChange(id, pan);
  };
  
  const handleMuteToggle = (id: string) => {
    const ch = channels.get(id);
    if (ch) {
      updateChannel(id, { muted: !ch.muted });
      onMuteToggle(id);
    }
  };
  
  const handleSoloToggle = (id: string) => {
    const ch = channels.get(id);
    if (ch) {
      updateChannel(id, { solo: !ch.solo });
      onSoloToggle(id);
    }
  };
  
  return (
    <div className="h-full flex bg-background">
      {/* Mixer channels */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 glass border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={mixxclubLogo} alt="MixxClub Studio" className="h-8 w-auto" />
            <div>
              <h2 className="text-xl font-bold neon-text">MixxClub Studio</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {channelArray.length} channels • ITU-R BS.1770-5 Metering
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MixerSidePanels
              buses={Array.from(buses.values())}
              loopEnabled={loopEnabled}
              loopStart={loopStart}
              loopEnd={loopEnd}
              onCreateBus={onCreateBus}
              onDeleteBus={(id) => {
                // Delete bus logic
              }}
              onLoopEnabledChange={setLoopEnabled}
              onLoopStartChange={setLoopStart}
              onLoopEndChange={setLoopEnd}
            />
            <Button
              size="sm"
              onClick={() => setAddTrackDialogOpen(true)}
              className="gap-1 shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
            >
              <Plus size={14} />
              Add Channel
            </Button>
          </div>
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
              {channelArray.map((channel) => {
                // Get inserts from tracks store
                const { tracks: tracksArray } = useTracksStore.getState();
                const track = tracksArray.find(t => t.id === channel.id);
                
                return (
                  <GlassChannelStrip
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannelId === channel.id}
                    inserts={track?.inserts}
                    onSelect={selectChannel}
                    onVolumeChange={handleVolumeChange}
                    onPanChange={handlePanChange}
                    onMuteToggle={handleMuteToggle}
                    onSoloToggle={handleSoloToggle}
                    buses={Array.from(buses.values())}
                    onLoadPlugin={(slotNumber, pluginId) => onLoadPlugin(channel.id, slotNumber, pluginId)}
                    onUnloadPlugin={(slotNumber) => onUnloadPlugin(channel.id, slotNumber)}
                    onBypassPlugin={(slotNumber, bypass) => onBypassPlugin(channel.id, slotNumber, bypass)}
                    onSendChange={(busId, amount) => onSendChange(channel.id, busId, amount)}
                    onOpenPluginWindow={(slotNumber, pluginId) => onOpenPluginWindow(channel.id, slotNumber, pluginId)}
                    onOpenPluginBrowser={onOpenPluginBrowser ? (slotNumber) => onOpenPluginBrowser(channel.id, slotNumber) : undefined}
                  />
                );
              })}
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
