/**
 * Advanced Timeline View - Revolutionary 2027 timeline with intelligent features
 */

import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackRow } from './TimelineTrackRow';
import { Playhead } from './Playhead';
import { GridOverlay } from './GridOverlay';
import { ZoomIn, ZoomOut, Grid3x3, Maximize2 } from 'lucide-react';

interface AdvancedTimelineViewProps {
  audioBuffers: Map<string, AudioBuffer>;
  onSeek: (time: number) => void;
}

export const AdvancedTimelineView: React.FC<AdvancedTimelineViewProps> = ({
  audioBuffers,
  onSeek
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { 
    currentTime, 
    zoom, 
    scrollX,
    gridSnap,
    setZoom,
    setScrollX,
    selectedRegions,
    toggleRegionSelection,
    clearSelection
  } = useTimelineStore();
  
  const {
    tracks,
    regions,
    selectedTrackId,
    selectTrack,
    updateRegion,
    getTrackRegions
  } = useTracksStore();
  
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
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Timeline controls */}
      <div className="flex items-center gap-2 px-4 py-2 glass border-b border-border/30">
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
          className={`p-1.5 rounded transition-colors ${
            gridSnap ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50'
          }`}
          title="Grid Snap"
        >
          <Grid3x3 size={16} />
        </button>
        
        <button 
          className="p-1.5 rounded hover:bg-muted/50 transition-colors ml-auto"
          title="Fit to Window"
        >
          <Maximize2 size={16} />
        </button>
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
          
          {/* Tracks */}
          {tracks.map((track) => (
            <TimelineTrackRow
              key={track.id}
              track={track}
              regions={getTrackRegions(track.id)}
              audioBuffers={audioBuffers}
              zoom={zoom}
              isSelected={selectedTrackId === track.id}
              onSelectTrack={selectTrack}
              onUpdateRegion={updateRegion}
              onSelectRegion={toggleRegionSelection}
              selectedRegionIds={selectedRegions}
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
  );
};
