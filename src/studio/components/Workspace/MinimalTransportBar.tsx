/**
 * Minimal Transport Bar - Clean, modern transport controls
 */

import React from 'react';
import { Play, Pause, Square, Circle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransport } from '@/contexts/ProjectContext';

interface MinimalTransportBarProps {
  onMenuClick?: () => void;
}

export const MinimalTransportBar: React.FC<MinimalTransportBarProps> = ({ onMenuClick }) => {
  const { transport, play, pause, stop } = useTransport();
  const isPlaying = transport.isPlaying;

  return (
    <div className="h-[60px] border-b border-border/50 flex items-center justify-between px-8 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl shadow-lg">
      {/* Left: Menu + Transport */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="hover:bg-primary/10"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => isPlaying ? pause() : play()}
            className="hover:bg-primary/10"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => stop()}
            className="hover:bg-destructive/10"
          >
            <Square className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10"
          >
            <Circle className="h-4 w-4 fill-destructive text-destructive" />
          </Button>
        </div>
      </div>

      {/* Center: Project Name */}
      <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
        Untitled Project
      </div>

      {/* Right: BPM + Time Signature */}
      <div className="flex items-center gap-6">
        <div className="text-sm text-muted-foreground tracking-wide">
          <span className="text-primary font-mono text-lg font-bold">120.0</span>
          <span className="ml-1 text-xs">bpm</span>
        </div>
        <div className="text-base text-muted-foreground font-mono font-semibold tracking-wider">
          4/4
        </div>
      </div>
    </div>
  );
};
