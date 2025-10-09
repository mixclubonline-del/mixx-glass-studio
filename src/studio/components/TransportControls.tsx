import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  StepBack,
  StepForward,
  FileDown, 
  Loader2,
  Circle
} from 'lucide-react';
import { useState } from 'react';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onExport: () => void;
  isExporting?: boolean;
  bpm?: number;
  timeSignature?: { numerator: number; denominator: number };
  onBpmChange?: (bpm: number) => void;
  onTimeSignatureChange?: (sig: { numerator: number; denominator: number }) => void;
}

export function TransportControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onExport,
  isExporting = false,
  bpm = 120,
  timeSignature = { numerator: 4, denominator: 4 },
  onBpmChange,
  onTimeSignatureChange,
}: TransportControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  
  return (
    <div className="glass rounded-xl p-4 border border-border shadow-lg">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Transport Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onStop}
            className="hover:bg-secondary"
            title="Return to start"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-secondary"
            title="Previous bar"
          >
            <StepBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="icon"
            onClick={isPlaying ? onPause : onPlay}
            className={isPlaying ? 'bg-[hsl(var(--prime-500))] hover:bg-[hsl(var(--prime-500))]/90 shadow-[0_0_20px_hsl(var(--prime-500)/0.5)]' : 'hover:bg-secondary'}
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-secondary"
            title="Next bar"
          >
            <StepForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onStop}
            className="hover:bg-secondary"
            title="Skip to end"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isRecording ? 'destructive' : 'outline'}
            size="icon"
            onClick={() => setIsRecording(!isRecording)}
            className={isRecording ? 'animate-pulse' : ''}
            title="Record (Shift+Space)"
          >
            <Circle className={`h-4 w-4 ${isRecording ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        {/* Center: BPM and Time Signature */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <Label className="text-xs text-muted-foreground mb-1">BPM</Label>
            <Input
              type="number"
              value={bpm}
              onChange={(e) => onBpmChange?.(parseFloat(e.target.value))}
              className="w-20 text-center text-2xl font-bold h-12 bg-background/50"
              min={20}
              max={300}
            />
          </div>
          
          <div className="flex flex-col items-center">
            <Label className="text-xs text-muted-foreground mb-1">Time</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={timeSignature.numerator}
                onChange={(e) => onTimeSignatureChange?.({
                  ...timeSignature,
                  numerator: parseInt(e.target.value)
                })}
                className="w-12 text-center font-bold h-12 bg-background/50"
                min={1}
                max={16}
              />
              <span className="text-xl text-muted-foreground">/</span>
              <Input
                type="number"
                value={timeSignature.denominator}
                onChange={(e) => onTimeSignatureChange?.({
                  ...timeSignature,
                  denominator: parseInt(e.target.value)
                })}
                className="w-12 text-center font-bold h-12 bg-background/50"
                min={1}
                max={32}
              />
            </div>
          </div>
          
          <Button
            variant={isLooping ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsLooping(!isLooping)}
            title="Loop/Cycle"
          >
            Loop
          </Button>
        </div>

        {/* Right: Export */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onExport}
            disabled={isExporting}
            className="hover:bg-secondary"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
