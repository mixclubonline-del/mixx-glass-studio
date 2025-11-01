/**
 * Timeline Region - Individual audio region with waveform and handles
 */

import React, { useState, useRef } from 'react';
import { Region } from '@/types/timeline';
import { WaveformRenderer } from './WaveformRenderer';
import { useTimelineStore } from '@/store/timelineStore';
import { RegionContextMenu } from './RegionContextMenu';
import { Scissors } from 'lucide-react';

interface TimelineRegionProps {
  region: Region;
  audioBuffer: AudioBuffer | null;
  zoom: number;
  onUpdate: (id: string, updates: Partial<Region>) => void;
  onSelect: (id: string) => void;
  onSplit: (id: string, splitTime: number) => void;
  isSelected: boolean;
}

export const TimelineRegion: React.FC<TimelineRegionProps> = ({
  region,
  audioBuffer,
  zoom,
  onUpdate,
  onSelect,
  onSplit,
  isSelected
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isTrimming, setIsTrimming] = useState<'left' | 'right' | null>(null);
  const [isFading, setIsFading] = useState<'in' | 'out' | null>(null);
  const [dragStart, setDragStart] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const { currentTool } = useTimelineStore();
  
  const left = region.startTime * zoom;
  const width = region.duration * zoom;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    
    const rect = regionRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const edgeTolerance = 8;
    
    onSelect(region.id);
    e.stopPropagation();
    
    // Split tool
    if (currentTool === 'split') {
      const splitTime = region.startTime + (clickX / zoom);
      onSplit(region.id, splitTime);
      return;
    }
    
    // Trim tool or edge detection
    if (currentTool === 'select' && clickX < edgeTolerance) {
      setIsTrimming('left');
      setDragStart(e.clientX);
    } else if (currentTool === 'select' && clickX > width - edgeTolerance) {
      setIsTrimming('right');
      setDragStart(e.clientX);
    }
    // Fade tool or fade handle detection
    else if (currentTool === 'fade') {
      if (clickX < width / 2) {
        setIsFading('in');
        setDragStart(e.clientX);
      } else {
        setIsFading('out');
        setDragStart(e.clientX);
      }
    }
    // Default: move
    else {
      setIsDragging(true);
      setDragStart(e.clientX - left);
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newLeft = e.clientX - dragStart;
      const newStartTime = Math.max(0, newLeft / zoom);
      onUpdate(region.id, { startTime: newStartTime });
    } else if (isTrimming) {
      const delta = (e.clientX - dragStart) / zoom;
      
      if (isTrimming === 'left') {
        const newStartTime = Math.max(0, region.startTime + delta);
        const newDuration = Math.max(0.1, region.duration - delta);
        const newBufferOffset = region.bufferOffset + delta;
        
        onUpdate(region.id, {
          startTime: newStartTime,
          duration: newDuration,
          bufferOffset: newBufferOffset,
        });
      } else {
        const newDuration = Math.max(0.1, region.duration + delta);
        onUpdate(region.id, { duration: newDuration });
      }
      
      setDragStart(e.clientX);
    } else if (isFading) {
      const delta = (e.clientX - dragStart) / zoom;
      
      if (isFading === 'in') {
        const newFadeIn = Math.max(0, Math.min(region.duration / 2, region.fadeIn + delta));
        onUpdate(region.id, { fadeIn: newFadeIn });
      } else {
        const newFadeOut = Math.max(0, Math.min(region.duration / 2, region.fadeOut - delta));
        onUpdate(region.id, { fadeOut: newFadeOut });
      }
      
      setDragStart(e.clientX);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsTrimming(null);
    setIsFading(null);
  };
  
  const handleRegionMouseMove = (e: React.MouseEvent) => {
    const rect = regionRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverX(e.clientX - rect.left);
    }
  };
  
  const getCursor = () => {
    if (currentTool === 'split') return 'text';
    if (currentTool === 'fade') return 'col-resize';
    
    if (hoverX !== null) {
      const edgeTolerance = 8;
      if (hoverX < edgeTolerance || hoverX > width - edgeTolerance) {
        return 'ew-resize';
      }
    }
    return 'move';
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
    <RegionContextMenu
      region={region}
      onDuplicate={() => console.log('Duplicate region:', region.id)}
      onSplit={() => onSplit(region.id, region.startTime + region.duration / 2)}
      onNormalize={() => console.log('Normalize region:', region.id)}
      onReverse={() => console.log('Reverse region:', region.id)}
      onLock={(_, locked) => onUpdate(region.id, { locked })}
      onColorChange={(_, color) => onUpdate(region.id, { color })}
      onExport={() => console.log('Export region:', region.id)}
      onRename={() => console.log('Rename region:', region.id)}
    >
      <div
        ref={regionRef}
        className={`absolute h-full rounded-md overflow-hidden transition-all group ${
          isSelected 
            ? 'region-selected animate-pulse-slow' 
            : 'hover:ring-1 hover:ring-white/20'
        }`}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          background: `linear-gradient(135deg, ${region.color}15, ${region.color}08)`,
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '0.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isSelected
            ? `var(--shadow-float), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px ${region.color}40`
            : `var(--shadow-float), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
          cursor: getCursor(),
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleRegionMouseMove}
        onMouseLeave={() => setHoverX(null)}
      >
      {/* Gradient accent border */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px] pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${region.color}FF 0%, ${region.color}80 50%, ${region.color}40 100%)`,
          filter: 'blur(1px)',
        }}
      />
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
      
      {/* Trim handles (visible on hover) */}
      {currentTool === 'select' && isSelected && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize" />
        </>
      )}
      
      {/* Split indicator */}
      {currentTool === 'split' && hoverX !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none animate-pulse"
          style={{ left: `${hoverX}px` }}
        >
          <Scissors size={14} className="absolute -top-5 -left-2 text-accent" />
        </div>
      )}
      </div>
    </RegionContextMenu>
  );
};
