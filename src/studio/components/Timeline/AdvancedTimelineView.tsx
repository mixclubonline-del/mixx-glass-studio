/**
 * Advanced Timeline View - Revolutionary 2027 timeline with intelligent features
 * ALIGNED: Using standard header height and panel widths
 */

import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackRow } from './TimelineTrackRow';
import { ContextualBloomWrapper, EdgeBloomTrigger } from '@/components/Bloom';
import { Playhead } from './Playhead';
import { GridOverlay } from './GridOverlay';
import { TimelineToolbar } from './TimelineToolbar';
import { AddTrackDialog, TrackConfig } from './AddTrackDialog';
import { CrossfadeRenderer } from './CrossfadeRenderer';
import { ArrangeBrowserPanel } from './ArrangeBrowserPanel';
import { ZoomIn, ZoomOut, Grid3x3, Maximize2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import mixxclubLogo from '@/assets/mixxclub-logo.png';
import { HEADER_HEIGHT, RULER_HEIGHT, TRACK_HEIGHT, TRACK_LIST_WIDTH, TRACK_LIST_COLLAPSED, SPACING } from '@/lib/layout-constants';

// Dynamic hip-hop encouragement messages based on session time
const getHipHopEncouragement = (minutes: number): string => {
  if (minutes < 5) return "Let's Get It Started 🔥";
  if (minutes < 15) return "Keep Cookin' 🎵";
  if (minutes < 30) return "Heat Rising! 🌡️";
  if (minutes < 45) return "You're In The Zone! ⚡";
  if (minutes < 60) return "This Beat Is Fire! 🔥";
  if (minutes < 90) return "Legendary Session! 👑";
  if (minutes < 120) return "You're On Fire! 💯";
  return "Classic In The Making! 🏆";
};

interface AdvancedTimelineViewProps {
  audioBuffers: Map<string, AudioBuffer>;
  onSeek: (time: number) => void;
  onFileSelect?: (file: File) => void;
  onPluginSelect?: (pluginId: string) => void;
  selectedTrackId?: string | null;
  onTrackSelect?: (trackId: string | null) => void;
}

export const AdvancedTimelineView: React.FC<AdvancedTimelineViewProps> = ({
  audioBuffers,
  onSeek,
  onFileSelect,
  onPluginSelect,
  selectedTrackId: externalSelectedTrackId,
  onTrackSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [browserCollapsed, setBrowserCollapsed] = useState(() => {
    const saved = localStorage.getItem('browserCollapsed');
    return saved === 'true';
  });
  
  const [trackListCollapsed, setTrackListCollapsed] = useState(() => {
    const saved = localStorage.getItem('trackListCollapsed');
    return saved === 'false'; // Default to expanded
  });
  
  // Track session time for dynamic encouragement
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
      setSessionMinutes(elapsed);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [sessionStartTime]);
  
  const { 
    currentTime, 
    zoom, 
    scrollX,
    gridSnap,
    currentTool,
    snapMode,
    rippleEdit,
    setZoom,
    setScrollX,
    setSnapMode,
    clearSelection,
  } = useTimelineStore();
  
  const { 
    tracks, 
    regions, 
    selectedTrackId,
    selectTrack,
    getTrackRegions,
    addRegion,
    removeRegion,
    updateRegion,
  } = useTracksStore();
  
  const [addTrackDialogOpen, setAddTrackDialogOpen] = useState(false);
  
  // Handler for creating new tracks
  const handleCreateTrack = (config: TrackConfig) => {
    console.log('Creating track:', config);
    // Will be implemented later
  };

  // Sync selected track with external prop
  const handleSelectTrack = (trackId: string) => {
    selectTrack(trackId);
    onTrackSelect?.(trackId);
  };
  
  // Sync external track selection with internal store
  useEffect(() => {
    if (externalSelectedTrackId !== undefined && externalSelectedTrackId !== selectedTrackId) {
      selectTrack(externalSelectedTrackId);
    }
  }, [externalSelectedTrackId, selectedTrackId, selectTrack]);
  
  const handleSplitRegion = (regionId: string, splitTime: number) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    
    const splitDuration = splitTime - region.startTime;
    
    // Create two new regions
    const region1 = {
      ...region,
      id: `${region.id}-1`,
      duration: splitDuration,
      bufferDuration: splitDuration,
      fadeOut: 0
    };
    
    const region2 = {
      ...region,
      id: `${region.id}-2`,
      startTime: splitTime,
      duration: region.duration - splitDuration,
      bufferOffset: region.bufferOffset + splitDuration,
      bufferDuration: region.bufferDuration - splitDuration,
      fadeIn: 0
    };
    
    // Remove original and add two new regions
    removeRegion(regionId);
    addRegion(region1);
    addRegion(region2);
  };
  
  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollX(e.currentTarget.scrollLeft);
  };
  
  // Handle zoom with mouse wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * delta);
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, setZoom]);
  
  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (e.target === contentRef.current || (e.target as HTMLElement).classList.contains('grid-overlay')) {
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left + scrollX;
        const time = x / zoom;
        onSeek(time);
        clearSelection();
      }
    }
  };
  
  const totalWidth = Math.max(3000, currentTime * zoom + 1000);

  // Save browser collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('browserCollapsed', browserCollapsed.toString());
  }, [browserCollapsed]);
  
  // Save track list collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('trackListCollapsed', trackListCollapsed.toString());
  }, [trackListCollapsed]);
  
  // Auto-scroll follow playhead when enabled
  const { autoScrollEnabled } = useTimelineStore();
  useEffect(() => {
    if (!autoScrollEnabled || !containerRef.current) return;
    
    const playheadX = currentTime * zoom;
    const containerWidth = containerRef.current.clientWidth;
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;
    
    // If playhead is outside visible area, scroll to center it
    if (playheadX < scrollLeft + containerWidth * 0.2 || playheadX > scrollRight - containerWidth * 0.2) {
      containerRef.current.scrollLeft = playheadX - containerWidth * 0.4;
    }
  }, [currentTime, zoom, autoScrollEnabled]);
  
  return (
    <div className="flex h-full relative">
      {/* Background ambience */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(275 100% 65% / 0.08) 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'float 25s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(191 100% 50% / 0.06) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'float 30s ease-in-out infinite reverse'
          }}
        />
      </div>
      
      {/* Main background with gradient mesh */}
      <div 
        className="absolute inset-0 -z-20"
        style={{
          background: `
            var(--gradient-mesh),
            linear-gradient(180deg, 
              hsl(240 15% 4%) 0%, 
              hsl(240 10% 2%) 100%
            )
          `
        }}
      />
      
      {/* Left Track List Sidebar - STANDARD WIDTH */}
      {!trackListCollapsed && (
        <div 
          className="flex-shrink-0 glass-medium border-r border-border/50 flex flex-col"
          style={{ 
            width: `${TRACK_LIST_WIDTH}px`,
            background: `var(--gradient-mesh), hsl(var(--glass-medium))`,
            backdropFilter: 'blur(60px) saturate(200%)'
          }}
        >
          {/* Sidebar Header - STANDARDIZED to 72px */}
          <div 
            className="flex items-center justify-between px-4 glass-ultra float-card border-b border-gradient"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gradient-subtle uppercase">Tracks</h3>
              <p className="text-xs text-muted-foreground">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTrackListCollapsed(true)}
              className="h-8 w-8 p-0 micro-interact chromatic-hover"
            >
              <ChevronLeft size={16} />
            </Button>
          </div>
          
          {/* Track List */}
          <div className="flex-1 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                <p className="text-xs">No tracks yet</p>
              </div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track.id)}
                  className={cn(
                    "border-b border-border/30 cursor-pointer transition-all duration-300 glass-light float-card micro-interact",
                    selectedTrackId === track.id && "border-gradient animate-pulse-slow"
                  )}
                  style={{ height: `${TRACK_HEIGHT}px` }}
                >
                  <div className="h-full px-3 py-2 flex flex-col justify-between">
                    {/* Track Name and Color */}
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="text-sm font-medium truncate flex-1">
                        {track.name}
                      </span>
                    </div>
                    
                    {/* Track Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle mute - will be implemented
                        }}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-bold transition-colors",
                          track.muted 
                            ? "bg-orange-500/20 text-orange-500" 
                            : "bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                        title="Mute"
                      >
                        M
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle solo - will be implemented
                        }}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-bold transition-colors",
                          track.solo 
                            ? "bg-yellow-500/20 text-yellow-500" 
                            : "bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                        title="Solo"
                      >
                        S
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle record arm - will be implemented
                        }}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-bold transition-colors",
                          track.recordArmed 
                            ? "bg-red-500/20 text-red-500" 
                            : "bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                        title="Record Arm"
                      >
                        R
                      </button>
                    </div>
                    
                    {/* Volume Indicator */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all"
                          style={{ width: `${track.volume * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-8 text-right">
                        {Math.round(track.volume * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Collapsed Track List Toggle Button - STANDARD COLLAPSED WIDTH */}
      {trackListCollapsed && (
        <div 
          className="flex-shrink-0 glass border-r border-border/50 flex flex-col items-center py-4 gap-2"
          style={{ width: `${TRACK_LIST_COLLAPSED}px` }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTrackListCollapsed(false)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight size={16} />
          </Button>
          <div className="writing-mode-vertical text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Tracks
          </div>
        </div>
      )}
      
      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Timeline toolbar with tools - STANDARDIZED to 72px */}
        <div 
          className="flex items-center justify-between px-6 glass border-b-2 border-[#a855f7]/50 border-glow-hype bg-gradient-to-r from-[#a855f7]/5 via-[#ec4899]/5 to-[#3b82f6]/5"
          style={{ 
            height: `${HEADER_HEIGHT}px`,
            gap: `${SPACING.md}px`
          }}
        >
          <div className="flex items-center" style={{ gap: `${SPACING.lg}px` }}>
            <img 
              src={mixxclubLogo} 
              alt="MixxClub Studio" 
              className="h-10 w-auto logo-pulse logo-glow" 
            />
            <div className="flex flex-col">
              <h3 className="text-lg font-bold gradient-flow uppercase tracking-wide">
                Arrange View
              </h3>
              <p className="text-xs text-[#ec4899] font-bold text-glow-hype uppercase tracking-wider">
                {getHipHopEncouragement(sessionMinutes)}
              </p>
            </div>
            <div className="border-l-2 border-[#a855f7]/50 h-10"></div>
            <ContextualBloomWrapper config={{
              triggerZone: 'top',
              idleOpacity: 0.2,
              activeOpacity: 1,
              blurAmount: 8,
              preferenceKey: 'timeline-toolbar'
            }}>
              <TimelineToolbar />
            </ContextualBloomWrapper>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoom(zoom * 0.8)}
              className="p-1.5 rounded hover:bg-muted/50 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            
            <button 
              onClick={() => setZoom(zoom * 1.2)}
              className="p-1.5 rounded hover:bg-muted/50 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            
            <div className="text-xs text-muted-foreground px-2">
              {zoom.toFixed(0)}px/s
            </div>
            
            <div className="w-px h-4 bg-border/50 mx-2" />
            
            <button 
              onClick={() => setSnapMode(snapMode === 'off' ? 'grid' : 'off')}
              className={`p-1.5 rounded transition-colors ${
                snapMode !== 'off' ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50'
              }`}
              title={`Snap: ${snapMode}`}
            >
              <Grid3x3 size={16} />
            </button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddTrackDialogOpen(true)}
              className="gap-1"
            >
              <Plus size={14} />
              Add Track
            </Button>
          </div>
        </div>
        
        {/* Timeline ruler - STANDARD HEIGHT */}
        <div className="relative" style={{ height: `${RULER_HEIGHT}px` }}>
          <TimelineRuler
            width={containerRef.current?.clientWidth || 800}
            height={RULER_HEIGHT}
            bpm={120}
            onSeek={onSeek}
          />
        </div>
        
        {/* Scrollable timeline content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleScroll}
        >
          <div 
            ref={contentRef}
            className="relative"
            style={{ width: `${totalWidth}px` }}
            onClick={handleTimelineClick}
          >
            {/* Grid overlay */}
            <GridOverlay
              width={totalWidth}
              height={tracks.length * TRACK_HEIGHT}
              bpm={120}
            />
            
            {/* Playhead */}
            <Playhead
              containerWidth={containerRef.current?.clientWidth || 800}
              containerHeight={tracks.length * TRACK_HEIGHT}
            />

            {/* Crossfade Renderer */}
            <CrossfadeRenderer
              regions={regions}
              zoom={zoom}
              trackHeight={100}
            />
            
            {/* Tracks */}
            {tracks.map((track) => (
              <TimelineTrackRow
                key={track.id}
                track={track}
                regions={getTrackRegions(track.id)}
                audioBuffers={audioBuffers}
                zoom={zoom}
                isSelected={selectedTrackId === track.id}
                onSelectTrack={handleSelectTrack}
                onUpdateRegion={updateRegion}
                onSelectRegion={() => {}}
                onSplitRegion={handleSplitRegion}
                selectedRegionIds={new Set()}
              />
            ))}
            
            {tracks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg mb-2">No tracks loaded</p>
                  <p className="text-sm">Load audio files to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Browser Panel with Bloom */}
      <EdgeBloomTrigger 
        edge="right" 
        thickness={20}
        offset={0}
      />
      
      <ContextualBloomWrapper config={{
        triggerZone: 'right',
        idleOpacity: 0,
        activeOpacity: 1,
        blurAmount: 12,
        springConfig: { stiffness: 200, damping: 25 },
        preferenceKey: 'browser-panel'
      }}>
        <ArrangeBrowserPanel
          selectedTrackId={selectedTrackId}
          onFileSelect={onFileSelect}
          onPluginSelect={onPluginSelect}
          isCollapsed={browserCollapsed}
          onToggleCollapse={() => setBrowserCollapsed(!browserCollapsed)}
        />
      </ContextualBloomWrapper>

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={addTrackDialogOpen}
        onOpenChange={setAddTrackDialogOpen}
        onCreateTrack={handleCreateTrack}
      />
    </div>
  );
};
