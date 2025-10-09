import { Play, Pause, Square, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function TransportControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onExport,
  isExporting = false
}: TransportControlsProps) {
  return (
    <div className="glass-glow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <Button
              onClick={onPlay}
              size="lg"
              className={cn(
                "bg-gradient-to-r from-[hsl(var(--prime-500))] to-[hsl(var(--neon-pink))]",
                "hover:shadow-[0_0_30px_hsl(var(--prime-500)/0.5)]",
                "transition-all hover:scale-105"
              )}
            >
              <Play className="w-5 h-5 mr-2" />
              Play
            </Button>
          ) : (
            <Button
              onClick={onPause}
              size="lg"
              variant="outline"
              className="border-[hsl(var(--neon-blue)/0.5)] hover-glow"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}

          <Button
            onClick={onStop}
            size="lg"
            variant="outline"
            className="border-[hsl(var(--prime-500)/0.5)]"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop
          </Button>
        </div>

        <Button
          onClick={onExport}
          disabled={isExporting}
          size="lg"
          variant="outline"
          className={cn(
            "border-[hsl(var(--neon-blue)/0.5)]",
            "hover:bg-[hsl(var(--neon-blue)/0.1)]",
            "hover:shadow-[0_0_20px_hsl(var(--neon-blue)/0.4)]",
            "transition-all"
          )}
        >
          <Download className="w-5 h-5 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Mix'}
        </Button>
      </div>
    </div>
  );
}