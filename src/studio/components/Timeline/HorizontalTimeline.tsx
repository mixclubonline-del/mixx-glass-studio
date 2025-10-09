/**
 * Horizontal Bar-Based Timeline
 */

import { useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { cn } from '@/lib/utils';

interface AudioRegion {
  id: string;
  trackId: string;
  startBar: number;
  durationBars: number;
  color: string;
  name: string;
}

const MOCK_REGIONS: AudioRegion[] = [
  { id: 'r1', trackId: 'track-met', startBar: 2, durationBars: 1.5, color: 'hsl(180, 50%, 50%)', name: 'Region 1' },
  { id: 'r2', trackId: 'track-met', startBar: 5, durationBars: 2.5, color: 'hsl(180, 50%, 50%)', name: 'Region 2' },
  { id: 'r3', trackId: 'track-1', startBar: 1.5, durationBars: 2, color: 'hsl(210, 60%, 50%)', name: 'Region 3' },
  { id: 'r4', trackId: 'track-1', startBar: 6.5, durationBars: 4, color: 'hsl(40, 60%, 50%)', name: 'Region 4' },
  { id: 'r5', trackId: 'track-2', startBar: 3, durationBars: 2.5, color: 'hsl(180, 50%, 50%)', name: 'Region 5' },
  { id: 'r6', trackId: 'track-2', startBar: 6.5, durationBars: 2, color: 'hsl(180, 50%, 50%)', name: 'Region 6' },
  { id: 'r7', trackId: 'track-2', startBar: 8.5, durationBars: 3, color: 'hsl(30, 60%, 50%)', name: 'Region 7' },
  { id: 'r8', trackId: 'track-4', startBar: 3.5, durationBars: 1.5, color: 'hsl(280, 50%, 45%)', name: 'Region 8' },
];

const TRACKS = [
  { id: 'track-met', name: 'Track met', color: 'hsl(180, 50%, 50%)' },
  { id: 'track-1', name: 'Track 1', color: 'hsl(210, 60%, 50%)' },
  { id: 'track-2', name: 'Track 2', color: 'hsl(180, 50%, 50%)' },
  { id: 'track-4', name: 'Track 4', color: 'hsl(280, 50%, 45%)', selected: true },
  { id: 'track-5', name: 'Track 5', color: 'hsl(200, 50%, 50%)' },
];

export function HorizontalTimeline() {
  const { isPlaying, currentTime } = useTimelineStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const barWidth = 90; // pixels per bar
  const trackHeight = 64;
  const totalBars = 16;
  
  const getRegionStyle = (region: AudioRegion) => {
    const left = region.startBar * barWidth;
    const width = region.durationBars * barWidth;
    
    return {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: region.color,
    };
  };
  
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Bar Numbers */}
      <div className="flex border-b border-border/50">
        <div className="w-[260px] flex-shrink-0 border-r border-border/50 bg-muted/30" />
        <div className="flex-1 overflow-x-auto" ref={timelineRef}>
          <div className="flex h-12 items-center" style={{ width: `${totalBars * barWidth}px` }}>
            {Array.from({ length: totalBars }, (_, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-sm text-muted-foreground border-r border-border/30"
                style={{ width: `${barWidth}px` }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tracks */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Names */}
        <div className="w-[260px] flex-shrink-0 border-r border-border/50 bg-muted/30">
          {TRACKS.map((track) => (
            <div
              key={track.id}
              className={cn(
                "h-16 px-4 flex items-center border-b border-border/30 text-sm font-medium",
                track.selected && "bg-primary/20 border-l-4 border-l-primary"
              )}
            >
              {track.name}
            </div>
          ))}
        </div>
        
        {/* Timeline Grid */}
        <div className="flex-1 overflow-auto">
          <div className="relative" style={{ width: `${totalBars * barWidth}px` }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: totalBars }, (_, i) => (
                <div
                  key={i}
                  className="border-r border-border/20"
                  style={{ width: `${barWidth}px` }}
                />
              ))}
            </div>
            
            {/* Tracks with Regions */}
            {TRACKS.map((track, idx) => (
              <div
                key={track.id}
                className="relative border-b border-border/30"
                style={{ height: `${trackHeight}px` }}
              >
                {/* Regions for this track */}
                {MOCK_REGIONS.filter(r => r.trackId === track.id).map((region) => (
                  <div
                    key={region.id}
                    className="absolute top-2 bottom-2 rounded border border-white/20 hover:border-white/40 cursor-pointer transition-all"
                    style={getRegionStyle(region)}
                  >
                    <div className="h-full px-2 flex items-center text-xs font-medium text-white/90 truncate">
                      {region.name}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {/* Playhead */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none"
                style={{ left: `${(currentTime / 4) * barWidth}px` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
