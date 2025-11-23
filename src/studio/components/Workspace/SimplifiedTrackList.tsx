/**
 * Simplified Track List - Clean track names and basic controls
 */

import React from 'react';
import { Circle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTracksStore } from '@/store/tracksStore';
import { cn } from '@/lib/utils';

export const SimplifiedTrackList: React.FC = () => {
  const tracks = useTracksStore((state) => state.tracks);
  const selectedTrackId = useTracksStore((state) => state.selectedTrackId);
  const selectTrack = useTracksStore((state) => state.selectTrack);
  const updateTrack = useTracksStore((state) => state.updateTrack);

  return (
    <div className="w-[280px] border-r border-border/50 bg-background/60 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="h-[80px] border-b border-border/30 flex items-center px-6 bg-gradient-to-b from-background/80 to-background/40">
        <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-[0.2em]">
          Tracks
        </h3>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            onClick={() => selectTrack(track.id)}
            className={cn(
              "h-[56px] border-b border-border/10 flex items-center gap-4 px-6 cursor-pointer transition-all duration-200",
              selectedTrackId === track.id
                ? "bg-gradient-to-r from-primary/15 to-primary/5 border-l-4 border-l-primary shadow-lg shadow-primary/20"
                : "hover:bg-gradient-to-r hover:from-muted/20 hover:to-transparent"
            )}
          >
            {/* Color Indicator */}
            <div
              className="w-4 h-4 rounded-full shrink-0 shadow-lg ring-2 ring-background/50"
              style={{ 
                backgroundColor: track.color,
                boxShadow: `0 0 12px ${track.color}40`
              }}
            />

            {/* Track Name */}
            <div className="flex-1 text-base font-medium truncate tracking-wide">
              {track.name}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle record arm
                }}
              >
                <Mic className={cn("h-3 w-3", track.recordArmed && "text-destructive")} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  updateTrack(track.id, { solo: !track.solo });
                }}
              >
                <span className={cn("text-[10px] font-bold", track.solo && "text-primary")}>
                  S
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  updateTrack(track.id, { muted: !track.muted });
                }}
              >
                <span className={cn("text-[10px] font-bold", track.muted && "text-muted-foreground")}>
                  M
                </span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
