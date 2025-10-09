/**
 * Timeline Region - Individual audio region with waveform and handles
 */

import React, { useState } from 'react';
import { Region } from '@/types/timeline';
import { WaveformRenderer } from './WaveformRenderer';
import { useTimelineStore } from '@/store/timelineStore';

interface TimelineRegionProps {
  region: Region;
  audioBuffer: AudioBuffer | null;
  zoom: number;
  onUpdate: (id: string, updates: Partial<Region>) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export const TimelineRegion: React.FC<TimelineRegionProps> = ({
  region,
  audioBuffer,
  zoom,
  onUpdate,
  onSelect,
  isSelected
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  
  const left = region.startTime * zoom;
  const width = region.duration * zoom;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart(e.clientX - left);
      onSelect(region.id);
      e.stopPropagation();
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newLeft = e.clientX - dragStart;
      const newStartTime = Math.max(0, newLeft / zoom);
      onUpdate(region.id, { startTime: newStartTime });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, zoom]);
  
  return (
    <div
      className={`absolute h-full rounded-md overflow-hidden cursor-move transition-all ${
        isSelected 
          ? 'ring-2 ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]' 
          : 'hover:ring-1 hover:ring-primary/50'
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: region.color + '20',
        borderLeft: `2px solid ${region.color}`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Waveform */}
      {audioBuffer && (
        <WaveformRenderer
          audioBuffer={audioBuffer}
          width={width}
          height={80}
          color={region.color}
          startTime={region.bufferOffset}
          duration={region.bufferDuration}
        />
      )}
      
      {/* Region name */}
      <div className="absolute top-1 left-2 text-xs font-medium text-foreground/90 pointer-events-none mix-blend-difference">
        {region.name}
      </div>
      
      {/* Fade handles */}
      {region.fadeIn > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 pointer-events-none"
          style={{
            width: `${region.fadeIn * zoom}px`,
            background: `linear-gradient(to right, transparent, ${region.color}40)`
          }}
        />
      )}
      
      {region.fadeOut > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 pointer-events-none"
          style={{
            width: `${region.fadeOut * zoom}px`,
            background: `linear-gradient(to left, transparent, ${region.color}40)`
          }}
        />
      )}
    </div>
  );
};
