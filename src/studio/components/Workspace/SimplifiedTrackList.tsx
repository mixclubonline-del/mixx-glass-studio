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
      <div className="h-[80px] border-b border-border/30 flex items-center px-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
              "h-[48px] border-b border-border/20 flex items-center gap-3 px-4 cursor-pointer transition-colors",
              selectedTrackId === track.id
                ? "bg-primary/10 border-l-2 border-l-primary"
                : "hover:bg-muted/30"
            )}
          >
            {/* Color Indicator */}
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: track.color }}
            />

            {/* Track Name */}
            <div className="flex-1 text-sm font-medium truncate">
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
