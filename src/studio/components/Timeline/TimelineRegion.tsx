/**
 * Timeline Region - Individual audio region with waveform and handles
 */

import React, { useState, useRef } from 'react';
import { Region } from '@/types/timeline';
import { WaveformRenderer } from './WaveformRenderer';
import { useTimelineStore } from '@/store/timelineStore';
import { RegionContextMenu } from './RegionContextMenu';
import { useTracksStore } from '@/store/tracksStore';
import { Scissors } from 'lucide-react';

interface TimelineRegionProps {
  region: Region;
  audioBuffer: AudioBuffer | null;
  zoom: number;
  onUpdate: (id: string, updates: Partial<Region>) => void;
  onSelect: (id: string, multi?: boolean) => void;
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
  const [isSlipping, setIsSlipping] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const { currentTool, rippleEdit } = useTimelineStore();
  const { duplicateRegion, deleteRegionWithRipple } = useTracksStore();
  
  const left = region.startTime * zoom;
  const width = region.duration * zoom;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    
    const rect = regionRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const edgeTolerance = 8;
    const fadeHandleSize = 20;
    
    // Multi-select with Cmd/Ctrl
    const isMultiSelect = e.metaKey || e.ctrlKey;
    
    // Alt+drag to duplicate
    if (e.altKey && currentTool === 'select') {
      setIsDuplicating(true);
      setDragStart(e.clientX - left);
      onSelect(region.id, false);
      e.stopPropagation();
      return;
    }
    
    onSelect(region.id, isMultiSelect);
    e.stopPropagation();
    
    // Split tool
    if (currentTool === 'split') {
      const splitTime = region.startTime + (clickX / zoom);
      onSplit(region.id, splitTime);
      return;
    }
    
    // Fade handles (top corners)
    const clickY = e.clientY - rect.top;
    const isFadeHandleArea = clickY < fadeHandleSize;
    
    if (isFadeHandleArea && clickX < fadeHandleSize) {
      setIsFading('in');
      setDragStart(e.clientX);
      return;
    } else if (isFadeHandleArea && clickX > width - fadeHandleSize) {
      setIsFading('out');
      setDragStart(e.clientX);
      return;
    }
    
    // Trim handles (edges)
    if (currentTool === 'select' && clickX < edgeTolerance) {
      setIsTrimming('left');
      setDragStart(e.clientX);
    } else if (currentTool === 'select' && clickX > width - edgeTolerance) {
      setIsTrimming('right');
      setDragStart(e.clientX);
    }
    // Slip editing (Cmd+drag center)
    else if (currentTool === 'select' && (e.metaKey || e.ctrlKey)) {
      setIsSlipping(true);
      setDragStart(e.clientX);
    }
    // Default: move
    else {
      setIsDragging(true);
      setDragStart(e.clientX - left);
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDuplicating) {
      // Create duplicate and start dragging it
      const newRegion = {
        ...region,
        id: `${region.id}-dup-${Date.now()}`,
        startTime: Math.max(0, (e.clientX - dragStart) / zoom),
        name: `${region.name} (copy)`
      };
      onUpdate(newRegion.id, newRegion);
      setIsDuplicating(false);
      setIsDragging(true);
      return;
    }
    
    if (isDragging) {
      const newLeft = e.clientX - dragStart;
      const newStartTime = Math.max(0, newLeft / zoom);
      onUpdate(region.id, { startTime: newStartTime });
    } else if (isSlipping) {
      // Slip editing - shift audio within fixed region boundaries
      const delta = (e.clientX - dragStart) / zoom;
      const newBufferOffset = Math.max(0, Math.min(
        audioBuffer?.duration ?? region.bufferOffset,
        region.bufferOffset + delta
      ));
      onUpdate(region.id, { bufferOffset: newBufferOffset });
      setDragStart(e.clientX);
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
    setIsDuplicating(false);
    setIsTrimming(null);
    setIsFading(null);
    setIsSlipping(false);
  };
  
  const handleRegionMouseMove = (e: React.MouseEvent) => {
    const rect = regionRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverX(e.clientX - rect.left);
    }
  };
  
  const getCursor = () => {
    if (currentTool === 'split') return 'text';
    if (isSlipping) return 'grab';
    
    if (hoverX !== null) {
      const rect = regionRef.current?.getBoundingClientRect();
      const edgeTolerance = 8;
      const fadeHandleSize = 20;
      
      // Check if over fade handles
      if (rect && hoverX < fadeHandleSize) return 'nw-resize';
      if (rect && hoverX > width - fadeHandleSize) return 'ne-resize';
      
      // Check if over trim edges
      if (hoverX < edgeTolerance || hoverX > width - edgeTolerance) {
        return 'ew-resize';
      }
    }
    return 'move';
  };
  
  React.useEffect(() => {
    if (isDragging || isTrimming || isFading || isSlipping || isDuplicating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isTrimming, isFading, isSlipping, isDuplicating, dragStart, zoom]);
  
  return (
    <RegionContextMenu
      region={region}
      onDuplicate={() => {
        duplicateRegion(region.id);
      }}
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
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          setHoverX(null);
          setShowTooltip(false);
        }}
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
          zoom={zoom}
          displayMode="peak"
        />
      )}
      
      {/* Region name */}
      <div className="absolute top-1 left-2 text-xs font-medium text-foreground/90 pointer-events-none mix-blend-difference">
        {region.name}
      </div>
      
      {/* Enhanced fade handles with visible controls */}
      {region.fadeIn > 0 && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-0 pointer-events-none"
            style={{
              width: `${region.fadeIn * zoom}px`,
              background: `linear-gradient(to right, rgba(0,0,0,0.4), transparent)`
            }}
          />
          {isSelected && (
            <div 
              className="absolute left-0 top-0 w-4 h-4 bg-primary/80 rounded-br cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity"
              title="Drag to adjust fade-in"
            />
          )}
        </>
      )}
      
      {region.fadeOut > 0 && (
        <>
          <div 
            className="absolute right-0 top-0 bottom-0 pointer-events-none"
            style={{
              width: `${region.fadeOut * zoom}px`,
              background: `linear-gradient(to left, rgba(0,0,0,0.4), transparent)`
            }}
          />
          {isSelected && (
            <div 
              className="absolute right-0 top-0 w-4 h-4 bg-primary/80 rounded-bl cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity"
              title="Drag to adjust fade-out"
            />
          )}
        </>
      )}
      
      {/* Selection info tooltip */}
      {showTooltip && isSelected && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 glass-ultra px-3 py-2 rounded-lg text-xs pointer-events-none z-50 min-w-[180px]">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start:</span>
              <span className="font-mono text-foreground">{region.startTime.toFixed(3)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-mono text-foreground">{region.duration.toFixed(3)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End:</span>
              <span className="font-mono text-foreground">{(region.startTime + region.duration).toFixed(3)}s</span>
            </div>
            {region.gain !== 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gain:</span>
                <span className="font-mono text-foreground">{(region.gain * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Trim handles (visible on hover) */}
      {currentTool === 'select' && isSelected && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize rounded-l-md" />
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize rounded-r-md" />
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
