/**
 * Timeline container - main wrapper for advanced timeline view
 */

import { useRef, useEffect, useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { TimelineRuler } from './TimelineRuler';
import { GridOverlay } from './GridOverlay';
import { Playhead } from './Playhead';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimelineContainerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  bpm: number;
  onSeek: (time: number) => void;
  children?: React.ReactNode;
}

export function TimelineContainer({
  currentTime,
  duration,
  isPlaying,
  bpm,
  onSeek,
  children,
}: TimelineContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const { 
    setCurrentTime, 
    setDuration, 
    setIsPlaying,
    scrollX,
    setScrollX,
    zoom,
    setZoom,
    scrollMode,
    autoScrollEnabled,
    centerPlayhead,
  } = useTimelineStore();
  
  // Sync props to store
  useEffect(() => {
    setCurrentTime(currentTime);
  }, [currentTime, setCurrentTime]);
  
  useEffect(() => {
    setDuration(duration);
  }, [duration, setDuration]);
  
  useEffect(() => {
    setIsPlaying(isPlaying);
  }, [isPlaying, setIsPlaying]);
  
  // Auto-scroll during playback
  useEffect(() => {
    if (!isPlaying || !autoScrollEnabled) return;
    
    const animate = () => {
      const playheadX = currentTime * zoom;
      const containerWidth = dimensions.width;
      
      if (scrollMode === 'continuous' && centerPlayhead) {
        // Keep playhead centered
        const targetScrollX = Math.max(0, playheadX - (containerWidth / 2));
        setScrollX(targetScrollX);
      } else if (scrollMode === 'page') {
        // Page scroll when playhead reaches 90% of visible area
        const visibleRight = scrollX + containerWidth;
        if (playheadX > visibleRight * 0.9) {
          setScrollX(scrollX + containerWidth);
        }
      }
      // scrollMode === 'none' does nothing
    };
    
    const rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, currentTime, zoom, scrollX, dimensions.width, scrollMode, autoScrollEnabled, centerPlayhead, setScrollX]);
  
  // Measure container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollX(e.currentTarget.scrollLeft);
  };
  
  // Handle zoom (ctrl+wheel)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * delta);
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [zoom, setZoom]);
  
  const rulerHeight = 32;
  const contentHeight = dimensions.height - rulerHeight;
  const timelineWidth = Math.max(dimensions.width, duration * zoom);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full glass rounded-lg overflow-hidden"
    >
      {/* Ruler */}
      <div className="relative w-full" style={{ height: `${rulerHeight}px` }}>
        <TimelineRuler
          width={dimensions.width}
          height={rulerHeight}
          bpm={bpm}
          onSeek={onSeek}
        />
      </div>
      
      {/* Scrollable timeline content */}
      <div
        className="relative overflow-auto"
        style={{ height: `${contentHeight}px` }}
        onScroll={handleScroll}
      >
        <div
          className="relative bg-background/20"
          style={{
            width: `${timelineWidth}px`,
            height: `${contentHeight}px`,
          }}
        >
          {/* Grid overlay */}
          <GridOverlay
            width={timelineWidth}
            height={contentHeight}
            bpm={bpm}
          />
          
          {/* Track lanes and regions will go here */}
          {children}
          
          {/* Playhead */}
          <Playhead
            containerWidth={dimensions.width}
            containerHeight={contentHeight}
          />
        </div>
      </div>
      
    </div>
  );
}
