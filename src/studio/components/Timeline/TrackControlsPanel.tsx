/**
 * Track Controls Panel - Horizontal track controls docked above mixer
 */

import React from 'react';
import { 
  Circle, 
  Volume2, 
  VolumeX, 
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Track {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  recordArmed: boolean;
  locked?: boolean;
}

interface TrackControlsPanelProps {
  tracks: Track[];
  selectedTrackId?: string | null;
  onTrackSelect: (id: string) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle?: (id: string) => void;
  onRecordArmToggle?: (id: string) => void;
  onLockToggle?: (id: string) => void;
}

export const TrackControlsPanel: React.FC<TrackControlsPanelProps> = ({
  tracks,
  selectedTrackId,
  onTrackSelect,
  onMuteToggle,
  onSoloToggle,
  onRecordArmToggle,
  onLockToggle,
}) => {
  return (
    <div className="glass border-b border-border/30">
      <ScrollArea className="w-full">
        <div className="flex gap-2 px-4 py-2 min-w-max">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer min-w-[200px]",
                selectedTrackId === track.id
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "bg-background/50 border-border/50 hover:bg-secondary/30"
              )}
              onClick={() => onTrackSelect(track.id)}
            >
              {/* Color indicator */}
              <Circle
                className="w-3 h-3 shrink-0"
                fill={track.color}
                stroke={track.color}
              />

              {/* Track name */}
              <span className="flex-1 text-sm font-medium truncate max-w-[120px]">
                {track.name}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {/* Record Arm */}
                <Button
                  variant={track.recordArmed ? "destructive" : "ghost"}
                  size="icon"
                  className={cn(
                    "w-6 h-6 shrink-0 p-0",
                    track.recordArmed && "animate-pulse"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecordArmToggle?.(track.id);
                  }}
                  title="Record Arm"
                >
                  <Circle className={cn("w-2.5 h-2.5", track.recordArmed && "fill-current")} />
                </Button>

                {/* Solo */}
                <Button
                  variant={track.solo ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "w-6 h-6 shrink-0 p-0 text-[10px] font-bold",
                    track.solo && "bg-accent text-accent-foreground"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSoloToggle?.(track.id);
                  }}
                  title="Solo"
                >
                  S
                </Button>

                {/* Mute */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-6 h-6 shrink-0 p-0",
                    track.muted && "text-destructive"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMuteToggle(track.id);
                  }}
                  title="Mute"
                >
                  {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </Button>

                {/* Lock */}
                {onLockToggle && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 shrink-0 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLockToggle(track.id);
                    }}
                    title="Lock Track"
                  >
                    {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
