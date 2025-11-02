/**
 * Floating Mini Transport - Compact floating transport controls
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Square,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransportFloatingMiniProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleFloat: () => void;
  isFloating: boolean;
  currentTime?: number;
}

export const TransportFloatingMini: React.FC<TransportFloatingMiniProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onToggleFloat,
  isFloating,
  currentTime = 0
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "glass border border-border/50 bg-background/80 backdrop-blur rounded-lg p-2 flex items-center gap-2 transition-all",
        isFloating && "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 shadow-xl"
      )}
    >
      {/* Time display */}
      <div className="text-xs font-mono text-muted-foreground px-2">
        {formatTime(currentTime)}
      </div>

      {/* Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        onClick={isPlaying ? onPause : onPlay}
        className="w-8 h-8"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </Button>

      {/* Stop */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onStop}
        className="w-8 h-8"
      >
        <Square size={16} />
      </Button>

      {/* Float toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFloat}
        className="w-8 h-8 ml-1"
        title={isFloating ? "Dock transport" : "Float transport"}
      >
        {isFloating ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </Button>
    </div>
  );
};
