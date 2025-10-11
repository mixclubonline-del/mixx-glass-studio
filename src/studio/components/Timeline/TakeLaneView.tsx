/**
 * TakeLaneView - Comping system for recording takes
 */

import { useState } from 'react';
import { Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WaveformRenderer } from './WaveformRenderer';

interface Take {
  id: string;
  name: string;
  audioBuffer: AudioBuffer;
  isFavorite: boolean;
  startTime: number;
  duration: number;
}

interface CompSegment {
  takeId: string;
  startTime: number;
  duration: number;
}

interface TakeLaneViewProps {
  regionId: string;
  takes: Take[];
  activeComp: CompSegment[];
  zoom: number;
  onCompChange: (regionId: string, comp: CompSegment[]) => void;
  onTakeFavorite: (takeId: string) => void;
  onTakeDelete: (takeId: string) => void;
  onFlattenComp: (regionId: string) => void;
}

export function TakeLaneView({
  regionId,
  takes,
  activeComp,
  zoom,
  onCompChange,
  onTakeFavorite,
  onTakeDelete,
  onFlattenComp,
}: TakeLaneViewProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedTakeId, setSelectedTakeId] = useState<string | null>(null);
  const [compSelectionStart, setCompSelectionStart] = useState<number | null>(null);

  if (takes.length === 0) return null;

  const handleTakeClick = (takeId: string, time: number, e: React.MouseEvent) => {
    if (e.shiftKey && compSelectionStart !== null) {
      // Create comp segment
      const duration = Math.abs(time - compSelectionStart);
      const startTime = Math.min(time, compSelectionStart);
      
      const newSegment: CompSegment = {
        takeId,
        startTime,
        duration,
      };

      onCompChange(regionId, [...activeComp, newSegment]);
      setCompSelectionStart(null);
    } else {
      // Start comp selection
      setCompSelectionStart(time);
      setSelectedTakeId(takeId);
    }
  };

  return (
    <div className="glass border-t border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-secondary/20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            TAKES ({takes.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onFlattenComp(regionId)}
            disabled={activeComp.length === 0}
          >
            Flatten Comp
          </Button>
        </div>
      </div>

      {/* Take lanes */}
      {expanded && (
        <div className="space-y-1 p-2">
          {takes.map((take, index) => (
            <div
              key={take.id}
              className={cn(
                "relative h-16 rounded border border-border/30 bg-background/50 overflow-hidden cursor-crosshair hover:ring-1 hover:ring-primary/50 transition-all",
                selectedTakeId === take.id && "ring-2 ring-primary"
              )}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickTime = clickX / zoom;
                handleTakeClick(take.id, clickTime, e);
              }}
            >
              {/* Take waveform */}
              <WaveformRenderer
                audioBuffer={take.audioBuffer}
                width={take.duration * zoom}
                height={64}
                color={take.isFavorite ? 'hsl(var(--fire-red))' : 'hsl(var(--prime-purple))'}
                startTime={0}
                duration={take.duration}
              />

              {/* Take info */}
              <div className="absolute top-1 left-2 flex items-center gap-2 pointer-events-none">
                <span className="text-xs font-medium text-foreground/90 mix-blend-difference">
                  Take {index + 1}: {take.name}
                </span>
              </div>

              {/* Actions */}
              <div className="absolute top-1 right-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-6 h-6",
                    take.isFavorite && "text-[hsl(var(--fire-red))]"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTakeFavorite(take.id);
                  }}
                >
                  <Star className={cn("w-3 h-3", take.isFavorite && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTakeDelete(take.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Comp segments overlay */}
              {activeComp
                .filter(seg => seg.takeId === take.id)
                .map((seg, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 bg-primary/30 border-l-2 border-r-2 border-primary pointer-events-none"
                    style={{
                      left: `${seg.startTime * zoom}px`,
                      width: `${seg.duration * zoom}px`,
                    }}
                  />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
