/**
 * Advanced Timeline View - Revolutionary 2027 timeline with intelligent features
 * ALIGNED: Using standard header height and panel widths
 */

import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackRow } from './TimelineTrackRow';
import { ProfessionalTrackHeader } from './ProfessionalTrackHeader';
import { ContextualBloomWrapper, EdgeBloomTrigger } from '@/components/Bloom';
import { Playhead } from './Playhead';
import { GridOverlay } from './GridOverlay';
import { SnapGuide } from './SnapGuide';
import { TimelineToolbar } from './TimelineToolbar';
import { AddTrackDialog, TrackConfig } from './AddTrackDialog';
import { CrossfadeRenderer } from './CrossfadeRenderer';
import { ArrangeBrowserPanel } from './ArrangeBrowserPanel';
import { RippleEditIndicator } from './RippleEditIndicator';
import { KeyboardShortcutsHelper } from './KeyboardShortcutsHelper';
import { TrackGroupManager } from './TrackGroupManager';
import { TrackTemplateManager } from './TrackTemplateManager';
import { ProductionSidebar } from './ProductionSidebar';
import { useRegionClipboard } from '@/hooks/useRegionClipboard';
import { useTimelineKeyboardShortcuts } from '@/hooks/useTimelineKeyboardShortcuts';
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
  const [browserCollapsed, setBrowserCollapsed] = useState(false); // Default to expanded
  
  const [trackListCollapsed, setTrackListCollapsed] = useState(() => {
    const saved = localStorage.getItem('trackListCollapsed');
    return saved === 'false'; // Default to expanded
  });
  
  // Track session time for dynamic encouragement
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());
  const [snapGuidePositions, setSnapGuidePositions] = useState<number[]>([]);
  
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
  
  // Clipboard functionality
  const { handleCopy, handlePaste, handleDuplicate, hasClipboard } = useRegionClipboard();
  
  // Timeline keyboard shortcuts
  useTimelineKeyboardShortcuts(
    onSeek,
    undefined, // play/pause handled by parent
    undefined, // stop handled by parent
    undefined  // record handled by parent
  );
  
  const { 
    tracks, 
    regions, 
    selectedTrackId,
    selectedRegionIds,
    selectTrack,
    selectRegion,
    updateTrack,
    getTrackRegions,
    addRegion,
    removeRegion,
    updateRegion,
    trackGroups,
    trackTemplates,
    createTrackGroup,
    deleteTrackGroup,
    toggleGroupCollapse,
    updateGroupVCA,
    saveTrackTemplate,
    loadTrackTemplate,
    deleteTrackTemplate,
    setAddTrackDialogOpen,
    addTrackDialogOpen,
  } = useTracksStore();
  
  // Track control handlers
  const handleMuteToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { muted: !track.muted });
    }
  };
  
  const handleSoloToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { solo: !track.solo });
    }
  };
  
  const handleRecordArmToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { recordArmed: !track.recordArmed });
    }
  };
  
  const handleLockToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { locked: !track.locked });
    }
  };
  
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
  
  const handleSelectRegion = (id: string, multi?: boolean) => {
    const region = regions.find(r => r.id === id);
    if (region && !multi) {
      selectTrack(region.trackId);
    }
    selectRegion(id, multi);
  };
  
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
  
  // Browser panel keyboard shortcut (B key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'b' || e.key === 'B') {
        setBrowserCollapsed(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
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
      {/* Ripple Edit Indicator */}
      <RippleEditIndicator active={rippleEdit} />
      
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
          className="flex-shrink-0 border-r border-gradient flex flex-col"
          style={{ 
            width: `${TRACK_LIST_WIDTH}px`,
            background: `
              radial-gradient(circle at 20% 50%, hsl(275 100% 65% / 0.03) 0%, transparent 50%),
              var(--gradient-mesh),
              linear-gradient(135deg, hsl(var(--glass-medium)), hsl(var(--glass-ultra)))
            `,
            backdropFilter: 'blur(80px) saturate(220%)',
            boxShadow: 'inset 1px 0 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Sidebar Header - STANDARDIZED to 72px */}
          <div 
            className="flex items-center justify-end px-4 glass-ultra border-b border-gradient"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
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
            {tracks.map((track) => (
              <ProfessionalTrackHeader
                key={track.id}
                id={track.id}
                name={track.name}
                color={track.color}
                muted={track.muted}
                solo={track.solo}
                recordArmed={track.recordArmed}
                locked={track.locked}
                isSelected={selectedTrackId === track.id}
                height={TRACK_HEIGHT}
                onSelect={handleSelectTrack}
                onMuteToggle={handleMuteToggle}
                onSoloToggle={handleSoloToggle}
                onRecordArmToggle={handleRecordArmToggle}
                onLockToggle={handleLockToggle}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Collapsed Track List Toggle Button - STANDARD COLLAPSED WIDTH */}
      {trackListCollapsed && (
        <div 
          className="flex-shrink-0 glass-light border-r border-gradient flex flex-col items-center justify-center"
          style={{ 
            width: `${TRACK_LIST_COLLAPSED}px`,
            backdropFilter: 'blur(60px) saturate(200%)'
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTrackListCollapsed(false)}
            className="h-8 w-8 p-0 micro-interact chromatic-hover"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
      
      {/* Main Timeline Area with Browser */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline toolbar with tools - STANDARDIZED to 72px */}
        <div 
          className="flex items-center justify-between px-6 glass-ultra border-b border-gradient"
          style={{ 
            height: `${HEADER_HEIGHT}px`,
            gap: `${SPACING.md}px`,
            backdropFilter: 'blur(60px) saturate(200%)',
            background: 'linear-gradient(135deg, hsl(var(--glass-light)), hsl(var(--glass-ultra)))'
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
            
            <KeyboardShortcutsHelper />
            
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
        
        {/* Timeline content area with ruler, tracks, and browser */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Production Features */}
          {!trackListCollapsed && (
            <ProductionSidebar
              trackGroups={trackGroups}
              selectedTrackIds={selectedRegionIds}
              onCreateGroup={createTrackGroup}
              onDeleteGroup={deleteTrackGroup}
              onToggleCollapse={toggleGroupCollapse}
              onVCAChange={updateGroupVCA}
              templates={trackTemplates}
              onSaveTemplate={saveTrackTemplate}
              onLoadTemplate={loadTrackTemplate}
              onDeleteTemplate={deleteTrackTemplate}
            />
          )}
          {/* Timeline area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Timeline ruler - STANDARD HEIGHT */}
            <div 
              className="relative glass-light border-b border-gradient"
              style={{ 
                height: `${RULER_HEIGHT}px`,
                backdropFilter: 'blur(40px) saturate(180%)'
              }}
            >
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
              style={{
                background: 'linear-gradient(180deg, hsl(240 15% 4% / 0.8) 0%, hsl(240 10% 2% / 0.6) 100%)',
                backdropFilter: 'blur(20px)',
                minHeight: 0
              }}
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
                
                {/* Snap guides */}
                <SnapGuide
                  snapPositions={snapGuidePositions}
                  zoom={zoom}
                  height={tracks.length * TRACK_HEIGHT}
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
                    onSelectRegion={handleSelectRegion}
                    onSplitRegion={handleSplitRegion}
                    selectedRegionIds={new Set(selectedRegionIds)}
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

          {/* Right Browser Panel - Aligned with timeline content */}
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
        </div>
      </div>

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={addTrackDialogOpen}
        onOpenChange={setAddTrackDialogOpen}
        onCreateTrack={handleCreateTrack}
      />
    </div>
  );
};
