/**
 * Professional Mixer View - Complete DAW-style mixer workspace
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMixerStore } from '@/store/mixerStore';
import { useTracksStore } from '@/store/tracksStore';
import { ProfessionalChannelStrip } from './ProfessionalChannelStrip';
import { ProfessionalMasterChannel } from './ProfessionalMasterChannel';
import { MixerSidePanels } from './MixerSidePanels';
import { Button } from '@/components/ui/button';
import { 
  Plus, ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Grid3x3, Settings, Save, FolderOpen
} from 'lucide-react';
import mixxclubLogo from '@/assets/mixxclub-logo.png';
import { cn } from '@/lib/utils';

interface ProfessionalMixerViewProps {
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

type ViewMode = 'narrow' | 'medium' | 'wide';

export const ProfessionalMixerView: React.FC<ProfessionalMixerViewProps> = ({
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
  const { 
    channels, 
    masterVolume, 
    masterPeakLevel, 
    selectedChannelId, 
    selectChannel, 
    updateChannel, 
    setMasterVolume, 
    buses 
  } = useMixerStore();
  
  const { setAddTrackDialogOpen, tracks: tracksArray } = useTracksStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('medium');
  const [showSections, setShowSections] = useState({
    inserts: true,
    sends: true,
    io: false,
    eq: false,
    dynamics: false
  });
  
  const channelArray = Array.from(channels.values());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  
  // Check scroll indicators
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftScroll(scrollLeft > 10);
        setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 10);
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
  }, [channelArray.length, viewMode]);
  
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

  const handleNameChange = (id: string, name: string) => {
    updateChannel(id, { name });
  };

  const cycleViewMode = () => {
    setViewMode(current => {
      if (current === 'narrow') return 'medium';
      if (current === 'medium') return 'wide';
      return 'narrow';
    });
  };

  const clearAllSolo = () => {
    channelArray.forEach(ch => {
      if (ch.solo) {
        updateChannel(ch.id, { solo: false });
        onSoloToggle(ch.id);
      }
    });
  };

  const clearAllMute = () => {
    channelArray.forEach(ch => {
      if (ch.muted) {
        updateChannel(ch.id, { muted: false });
        onMuteToggle(ch.id);
      }
    });
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="px-3 py-2 glass border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={mixxclubLogo} 
            alt="MixxClub Studio" 
            className="h-7 w-auto logo-glow" 
          />
          <div className="border-l border-border/30 h-6"></div>
          <div>
            <h2 className="text-sm font-bold gradient-flow">
              Professional Mixer
            </h2>
            <p className="text-[0.65rem] text-muted-foreground">
              {channelArray.length} channels • {viewMode.toUpperCase()} view
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={cycleViewMode}
            className="gap-1 h-8 text-[11px]"
            title="Toggle channel width"
          >
            {viewMode === 'narrow' && <Minimize2 size={14} />}
            {viewMode === 'medium' && <Grid3x3 size={14} />}
            {viewMode === 'wide' && <Maximize2 size={14} />}
            {viewMode.toUpperCase()}
          </Button>

          {/* Global Controls */}
          {channelArray.some(ch => ch.solo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllSolo}
              className="gap-1 h-8 text-[11px] bg-primary/10 text-primary"
            >
              Clear Solo
            </Button>
          )}
          
          {channelArray.some(ch => ch.muted) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllMute}
              className="gap-1 h-8 text-[11px] bg-destructive/10 text-destructive"
            >
              Clear Mute
            </Button>
          )}

          {/* Side Panels */}
          <MixerSidePanels
            buses={Array.from(buses.values())}
            loopEnabled={false}
            loopStart={0}
            loopEnd={0}
            onCreateBus={onCreateBus}
            onDeleteBus={(id) => {
              // Delete bus logic
            }}
            onLoopEnabledChange={() => {}}
            onLoopStartChange={() => {}}
            onLoopEndChange={() => {}}
          />

          {/* Add Channel */}
          <Button
            size="sm"
            onClick={() => setAddTrackDialogOpen(true)}
            className="gap-1 h-8 text-[11px] shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
          >
            <Plus size={14} />
            Add Channel
          </Button>
        </div>
      </div>
      
      {/* Mixer Content */}
      <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-background via-background to-muted/10">
        {channelArray.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="glass-glow rounded-lg p-8 max-w-md">
              <div className="text-4xl mb-4">🎚️</div>
              <p className="text-lg font-medium text-foreground mb-2">
                No Channels Loaded
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Load audio tracks from the Arrange view to see mixer channels
              </p>
              <Button
                onClick={() => setAddTrackDialogOpen(true)}
                className="gap-2"
              >
                <Plus size={16} />
                Add Your First Track
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex gap-3 p-3">
            {/* Master Channel - Fixed on Left */}
            <div className="flex-shrink-0">
              <ProfessionalMasterChannel
                volume={masterVolume}
                peakLevel={masterPeakLevel}
                viewMode={viewMode}
                onVolumeChange={setMasterVolume}
                onExport={onExport}
                isExporting={isExporting}
              />
            </div>

            {/* Vertical Divider */}
            <div className="w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            
            {/* Scrollable Channels Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden flex gap-3 scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30"
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
                const track = tracksArray.find(t => t.id === channel.id);
                
                return (
                  <ProfessionalChannelStrip
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannelId === channel.id}
                    inserts={track?.inserts}
                    buses={Array.from(buses.values())}
                    viewMode={viewMode}
                    sectionsExpanded={showSections}
                    onSelect={selectChannel}
                    onVolumeChange={handleVolumeChange}
                    onPanChange={handlePanChange}
                    onMuteToggle={handleMuteToggle}
                    onSoloToggle={handleSoloToggle}
                    onLoadPlugin={(slotNumber, pluginId) => onLoadPlugin(channel.id, slotNumber, pluginId)}
                    onUnloadPlugin={(slotNumber) => onUnloadPlugin(channel.id, slotNumber)}
                    onBypassPlugin={(slotNumber, bypass) => onBypassPlugin(channel.id, slotNumber, bypass)}
                    onSendChange={(busId, amount) => onSendChange(channel.id, busId, amount)}
                    onOpenPluginWindow={(slotNumber, pluginId) => onOpenPluginWindow(channel.id, slotNumber, pluginId)}
                    onOpenPluginBrowser={onOpenPluginBrowser ? (slotNumber) => onOpenPluginBrowser(channel.id, slotNumber) : undefined}
                    onSectionToggle={(section, expanded) => {
                      setShowSections(prev => ({ ...prev, [section]: expanded }));
                    }}
                    onNameChange={handleNameChange}
                  />
                );
              })}
            </div>
            
            {/* Scroll Indicators */}
            {showLeftScroll && (
              <div className="absolute left-[170px] top-0 bottom-0 w-16 bg-gradient-to-r from-background/90 via-background/50 to-transparent pointer-events-none flex items-center justify-start pl-2">
                <ChevronLeft className="text-primary animate-pulse drop-shadow-[0_0_8px_hsl(var(--primary))]" size={28} />
              </div>
            )}
            {showRightScroll && (
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background/90 via-background/50 to-transparent pointer-events-none flex items-center justify-end pr-2">
                <ChevronRight className="text-primary animate-pulse drop-shadow-[0_0_8px_hsl(var(--primary))]" size={28} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3 py-1.5 border-t border-border/30 glass flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Shift + Scroll for horizontal navigation</span>
          <span className="border-l border-border/30 h-3"></span>
          <span>Double-click channel name to rename</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary">{channelArray.filter(ch => ch.solo).length} Solo</span>
          <span className="border-l border-border/30 h-3"></span>
          <span className="text-destructive">{channelArray.filter(ch => ch.muted).length} Mute</span>
        </div>
      </div>
    </div>
  );
};