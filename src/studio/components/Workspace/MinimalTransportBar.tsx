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
    <div className="h-[60px] border-b border-border/50 flex items-center justify-between px-6 bg-background/95 backdrop-blur-xl">
      {/* Left: Menu + Transport */}
      <div className="flex items-center gap-4">
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
      <div className="text-lg font-medium text-foreground">
        Untitled Project
      </div>

      {/* Right: BPM + Time Signature */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <span className="text-primary font-mono text-base">120.0</span> bpm
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          4/4
        </div>
      </div>
    </div>
  );
};
