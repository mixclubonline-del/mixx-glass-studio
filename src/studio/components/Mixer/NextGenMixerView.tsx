/**
 * Next-Gen Mixer View - Revolutionary spatial mixing environment
 * ALIGNED: Using standard header height and panel widths
 */

import React from 'react';
import { useMixerStore } from '@/store/mixerStore';
import { useTracksStore } from '@/store/tracksStore';
import { useTimelineStore } from '@/store/timelineStore';
import { GlassChannelStrip } from './GlassChannelStrip';
import { MasterChannelStrip } from './MasterChannelStrip';
import { MixerSidePanels } from './MixerSidePanels';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import mixxclubLogo from '@/assets/mixxclub-logo.png';
import { HEADER_HEIGHT, SPACING, MASTER_CHANNEL_WIDTH } from '@/lib/layout-constants';

interface NextGenMixerViewProps {
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

export const NextGenMixerView: React.FC<NextGenMixerViewProps> = ({
  engineRef,
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
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = React.useState(false);
  const [showRightScroll, setShowRightScroll] = React.useState(false);
  
  // Check scroll indicators
  React.useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };
    
    checkScroll();
    const ref = scrollRef.current;
    ref?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    return () => {
      ref?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [channelArray]);
  
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
    <div className="h-full flex flex-col bg-background">
      {/* Header - STANDARDIZED to 72px */}
      <div 
        className="px-4 glass border-b border-border/30 flex items-center justify-between"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <div className="flex items-center gap-4">
          <img 
            src={mixxclubLogo} 
            alt="MixxClub Studio" 
            className="h-10 w-auto logo-glow" 
          />
          <div className="border-l border-border/30 h-10"></div>
          <div>
            <h2 className="text-lg font-bold gradient-flow">
              Mix View
            </h2>
            <p className="text-xs text-muted-foreground">
              {channelArray.length} channels • Pro Metering
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
      
      {/* Mixer Content with horizontal scroll */}
      <div className="flex-1 overflow-hidden relative">
        {channelArray.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="glass-glow rounded-lg p-8">
              <p className="text-muted-foreground mb-2">No channels loaded</p>
              <p className="text-sm text-muted-foreground">
                Load audio tracks to see mixer channels
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Master channel - Fixed on left with STANDARD WIDTH */}
            <div 
              className="flex-shrink-0 border-r border-border/30"
              style={{ 
                width: `${MASTER_CHANNEL_WIDTH}px`,
                padding: `${SPACING.sm}px`
              }}
            >
              <MasterChannelStrip
                volume={masterVolume}
                analysers={engineRef?.current?.getMasterAnalysers()}
                onVolumeChange={setMasterVolume}
                onExport={onExport}
                isExporting={isExporting}
              />
            </div>
            
            {/* Scrollable channels area with STANDARD SPACING */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden flex scroll-smooth"
              style={{ 
                padding: `${SPACING.sm}px`,
                gap: `${SPACING.xs}px`
              }}
              onWheel={(e) => {
                if (e.shiftKey) {
                  e.preventDefault();
                  if (scrollRef.current) {
                    scrollRef.current.scrollLeft += e.deltaY;
                  }
                }
              }}
            >
              {channelArray.map((channel) => {
                // Get inserts from tracks store
                const { tracks: tracksArray } = useTracksStore.getState();
                const track = tracksArray.find(t => t.id === channel.id);
                
                return (
                  <GlassChannelStrip
                    key={channel.id}
                    channel={channel}
                    analysers={engineRef?.current?.getTrackAnalysers(channel.id)}
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
            
            {/* Scroll Indicators - ADJUSTED for new master width */}
            {showLeftScroll && (
              <div 
                className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-background/80 to-transparent pointer-events-none flex items-center justify-start pl-2"
                style={{ left: `${MASTER_CHANNEL_WIDTH}px` }}
              >
                <ChevronLeft className="text-primary animate-pulse" size={24} />
              </div>
            )}
            {showRightScroll && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background/80 to-transparent pointer-events-none flex items-center justify-end pr-2">
                <ChevronRight className="text-primary animate-pulse" size={24} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
