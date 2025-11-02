/**
 * Timeline Status Bar - Shows contextual info and performance stats
 */

import React from 'react';
import { Clock, Zap, Layers, MousePointer } from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { cn } from '@/lib/utils';

interface TimelineStatusBarProps {
  currentTime: number;
  totalDuration?: number;
  renderTime?: number;
}

export const TimelineStatusBar: React.FC<TimelineStatusBarProps> = ({
  currentTime,
  totalDuration,
  renderTime,
}) => {
  const { currentTool, snapMode, rippleEdit, zoom } = useTimelineStore();
  const { tracks, regions, selectedRegionIds } = useTracksStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const toolLabels = {
    select: 'Select',
    range: 'Range',
    split: 'Split',
    trim: 'Trim',
    fade: 'Fade',
  };

  const snapLabels = {
    off: 'No Snap',
    grid: 'Grid Snap',
    magnetic: 'Magnetic',
    'zero-crossing': 'Zero-Cross',
  };

  return (
    <div className="flex items-center justify-between px-4 py-1 border-t border-border/50 bg-background/80 backdrop-blur-sm text-xs">
      {/* Left section - Time info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{formatTime(currentTime)}</span>
          {totalDuration && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono text-muted-foreground">
                {formatTime(totalDuration)}
              </span>
            </>
          )}
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Layers className="h-3 w-3 text-muted-foreground" />
          <span>{tracks.length} tracks</span>
          <span className="text-muted-foreground">·</span>
          <span>{regions.length} regions</span>
          {selectedRegionIds.length > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-primary">{selectedRegionIds.length} selected</span>
            </>
          )}
        </div>
      </div>

      {/* Center section - Tool info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <MousePointer className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{toolLabels[currentTool]}</span>
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            snapMode !== 'off' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {snapLabels[snapMode]}
          </span>
          
          {rippleEdit && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-500">
              Ripple
            </span>
          )}
        </div>
      </div>

      {/* Right section - Performance */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Zoom:</span>
          <span className="font-mono">{Math.round(zoom)}px/s</span>
        </div>
        
        {renderTime !== undefined && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono">
                {renderTime.toFixed(1)}ms
              </span>
              <span className={cn(
                'w-2 h-2 rounded-full',
                renderTime < 16 ? 'bg-green-500' : renderTime < 33 ? 'bg-yellow-500' : 'bg-red-500'
              )} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
