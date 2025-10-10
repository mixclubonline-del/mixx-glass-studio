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
  Circle,
  Repeat,
  Volume2
} from 'lucide-react';
import { useState } from 'react';
import { IceFireFader } from '../../studio/components/Controls/IceFireFader';

interface TransportControlsProps {
  isPlaying: boolean;
  isRecording?: boolean;
  isLooping?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecord?: () => void;
  onLoopToggle?: () => void;
  onExport: () => void;
  isExporting?: boolean;
  bpm?: number;
  timeSignature?: { numerator: number; denominator: number };
  onBpmChange?: (bpm: number) => void;
  onTimeSignatureChange?: (sig: { numerator: number; denominator: number }) => void;
  onPrevBar?: () => void;
  onNextBar?: () => void;
  currentTime?: number;
  masterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
}

export function TransportControls({
  isPlaying,
  isRecording: externalIsRecording,
  isLooping: externalIsLooping,
  onPlay,
  onPause,
  onStop,
  onRecord,
  onLoopToggle,
  onExport,
  isExporting = false,
  bpm = 120,
  timeSignature = { numerator: 4, denominator: 4 },
  onBpmChange,
  onTimeSignatureChange,
  onPrevBar,
  onNextBar,
  currentTime = 0,
  masterVolume = 0.75,
  onMasterVolumeChange,
}: TransportControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  
  const handleRecordToggle = () => {
    if (onRecord) {
      onRecord();
    } else {
      setIsRecording(!isRecording);
    }
  };
  
  const handleLoopToggle = () => {
    if (onLoopToggle) {
      onLoopToggle();
    } else {
      setIsLooping(!isLooping);
    }
  };
  
  const activeIsRecording = externalIsRecording !== undefined ? externalIsRecording : isRecording;
  const activeIsLooping = externalIsLooping !== undefined ? externalIsLooping : isLooping;

  // Calculate bar/beat/tick from current time
  const secondsPerBeat = 60 / bpm;
  const beatsPerBar = timeSignature.numerator;
  const totalBeats = currentTime / secondsPerBeat;
  const bars = Math.floor(totalBeats / beatsPerBar) + 1;
  const beats = Math.floor(totalBeats % beatsPerBar) + 1;
  const ticks = Math.floor((totalBeats % 1) * 960);
  
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
            onClick={onPrevBar}
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
            onClick={onNextBar}
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
            variant={activeIsRecording ? 'destructive' : 'outline'}
            size="icon"
            onClick={handleRecordToggle}
            className={activeIsRecording ? 'animate-pulse' : ''}
            title="Record (Shift+Space)"
          >
            <Circle className={`h-4 w-4 ${activeIsRecording ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        {/* Center: Bar/Beat Display, BPM and Time Signature */}
        <div className="flex items-center gap-4">
          {/* Bar/Beat/Tick Display */}
          <div className="flex flex-col items-center">
            <Label className="text-xs text-muted-foreground mb-1">Position</Label>
            <div className="text-xl font-mono font-bold tabular-nums h-12 flex items-center gap-1">
              <span className="w-10 text-right">{bars}</span>
              <span className="text-muted-foreground">.</span>
              <span className="w-6 text-center">{beats}</span>
              <span className="text-muted-foreground">.</span>
              <span className="w-12 text-left text-sm text-muted-foreground">{String(ticks).padStart(3, '0')}</span>
            </div>
          </div>
          
          <div className="w-px h-12 bg-border/50" />
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
            variant={activeIsLooping ? 'default' : 'outline'}
            size="sm"
            onClick={handleLoopToggle}
            className={activeIsLooping ? 'bg-accent hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent)/0.4)]' : ''}
            title="Loop/Cycle (Ctrl+L)"
          >
            <Repeat className="h-4 w-4 mr-1" />
            Loop
          </Button>
        </div>

        {/* Right: Master Volume & Export */}
        <div className="flex items-center gap-4">
          {/* Master Volume */}
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-muted-foreground" />
            <div className="w-24">
              <IceFireFader
                value={masterVolume}
                onChange={(value) => onMasterVolumeChange?.(value)}
                height={40}
                width={20}
                showScale={false}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-10">
              {(masterVolume * 100).toFixed(0)}%
            </span>
          </div>

          <div className="w-px h-12 bg-border/50" />

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
