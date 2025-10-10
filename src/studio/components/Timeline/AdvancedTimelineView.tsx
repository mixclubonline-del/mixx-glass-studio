/**
 * Advanced Timeline View - Revolutionary 2027 timeline with intelligent features
 */

import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackRow } from './TimelineTrackRow';
import { Playhead } from './Playhead';
import { GridOverlay } from './GridOverlay';
import { TimelineToolbar } from './TimelineToolbar';
import { AddTrackDialog, TrackConfig } from './AddTrackDialog';
import { CrossfadeRenderer } from './CrossfadeRenderer';
import { ArrangeBrowserPanel } from './ArrangeBrowserPanel';
import { ZoomIn, ZoomOut, Grid3x3, Maximize2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mixxclubLogo from '@/assets/mixxclub-logo.png';

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
    <div className="flex h-full bg-background">
      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col">
        {/* Timeline toolbar with tools */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 glass border-b border-border/30">
          <div className="flex items-center gap-4">
            <img 
              src={mixxclubLogo} 
              alt="MixxClub Studio" 
              className="h-10 w-auto logo-pulse logo-glow" 
            />
            <div className="border-l border-border/30 h-8 mx-2"></div>
            <TimelineToolbar />
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
        
        {/* Timeline ruler */}
        <div className="relative h-10">
          <TimelineRuler
            width={containerRef.current?.clientWidth || 800}
            height={40}
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
              height={tracks.length * 100}
              bpm={120}
            />
            
            {/* Playhead */}
            <Playhead
              containerWidth={containerRef.current?.clientWidth || 800}
              containerHeight={tracks.length * 100}
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

      {/* Right Browser Panel */}
      <ArrangeBrowserPanel
        selectedTrackId={selectedTrackId}
        onFileSelect={onFileSelect}
        onPluginSelect={onPluginSelect}
        isCollapsed={browserCollapsed}
        onToggleCollapse={() => setBrowserCollapsed(!browserCollapsed)}
      />

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={addTrackDialogOpen}
        onOpenChange={setAddTrackDialogOpen}
        onCreateTrack={handleCreateTrack}
      />
    </div>
  );
};
