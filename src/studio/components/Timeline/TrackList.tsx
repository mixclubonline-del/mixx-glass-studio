/**
 * TrackList - left sidebar showing track names and controls
 */

import { Volume2, VolumeX, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
}

interface TrackListProps {
  tracks: Track[];
  trackHeight: number;
  onTrackSelect: (id: string) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle?: (id: string) => void;
  selectedTrackId?: string;
}

export function TrackList({
  tracks,
  trackHeight,
  onTrackSelect,
  onMuteToggle,
  onSoloToggle,
  selectedTrackId,
}: TrackListProps) {
  return (
    <div className="glass border-r border-border">
      {/* Header */}
      <div 
        className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center justify-between"
        style={{ height: '32px' }}
      >
        <span className="text-xs font-medium text-muted-foreground">TRACKS</span>
      </div>
      
      {/* Track rows */}
      <div className="select-none">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={cn(
              "flex items-center gap-2 px-2 py-1 border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer",
              selectedTrackId === track.id && "bg-secondary/50"
            )}
            style={{ height: `${trackHeight}px` }}
            onClick={() => onTrackSelect(track.id)}
          >
            {/* Color indicator */}
            <Circle
              className="w-2 h-2 shrink-0"
              fill={track.color}
              stroke={track.color}
            />
            
            {/* Track name */}
            <span className="flex-1 text-sm truncate">{track.name}</span>
            
            {/* Mute button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onMuteToggle(track.id);
              }}
            >
              {track.muted ? (
                <VolumeX className="w-3 h-3 text-destructive" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </Button>
            
            {/* Solo button (if handler provided) */}
            {onSoloToggle && (
              <Button
                variant={track.solo ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "w-6 h-6 shrink-0 text-xs font-bold",
                  track.solo && "bg-primary text-primary-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onSoloToggle(track.id);
                }}
              >
                S
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
