/**
 * Unified Transport Bar - Global transport control visible across all views
 */

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
  Circle,
  Repeat,
  Volume2
} from 'lucide-react';
import { useProject, useTransport } from '@/contexts/ProjectContext';
import { IceFireFader } from '../Controls/IceFireFader';

export const UnifiedTransportBar = () => {
  const { bpm, setBpm, timeSignature, setTimeSignature, masterVolume, setMasterVolume } = useProject();
  const { transport, play, pause, stop, toggleLoop, toggleRecord, prevBar, nextBar, getBarPosition } = useTransport();
  
  const { bar, beat, tick } = getBarPosition();
  
  return (
    <div className="glass rounded-lg px-4 py-3 border-b border-border/30">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Transport Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={stop}
            className="hover:bg-secondary h-9 w-9"
            title="Return to start"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={prevBar}
            className="hover:bg-secondary h-9 w-9"
            title="Previous bar"
          >
            <StepBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant={transport.isPlaying ? 'default' : 'outline'}
            size="icon"
            onClick={transport.isPlaying ? pause : () => play()}
            className={transport.isPlaying 
              ? 'bg-[hsl(var(--prime-500))] hover:bg-[hsl(var(--prime-500))]/90 shadow-[0_0_20px_hsl(var(--prime-500)/0.5)] h-10 w-10' 
              : 'hover:bg-secondary h-10 w-10'
            }
            title="Play/Pause (Space)"
          >
            {transport.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextBar}
            className="hover:bg-secondary h-9 w-9"
            title="Next bar"
          >
            <StepForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={stop}
            className="hover:bg-secondary h-9 w-9"
            title="Skip to end"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant={transport.isRecording ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleRecord}
            className={`h-9 w-9 ${transport.isRecording ? 'animate-pulse' : ''}`}
            title="Record (Shift+Space)"
          >
            <Circle className={`h-4 w-4 ${transport.isRecording ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        {/* Center: Bar/Beat Display, BPM and Time Signature */}
        <div className="flex items-center gap-4">
          {/* Bar/Beat/Tick Display */}
          <div className="flex flex-col items-center">
            <Label className="text-xs text-muted-foreground mb-0.5">Position</Label>
            <div className="text-lg font-mono font-bold tabular-nums h-8 flex items-center gap-1">
              <span className="w-8 text-right">{bar}</span>
              <span className="text-muted-foreground">.</span>
              <span className="w-5 text-center">{beat}</span>
              <span className="text-muted-foreground">.</span>
              <span className="w-10 text-left text-sm text-muted-foreground">{String(tick).padStart(3, '0')}</span>
            </div>
          </div>
          
          <div className="w-px h-10 bg-border/50" />
          
          <div className="flex flex-col items-center">
            <Label className="text-xs text-muted-foreground mb-0.5">BPM</Label>
            <Input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(parseFloat(e.target.value) || 120)}
              className="w-16 text-center text-lg font-bold h-8 bg-background/50 border-border/50"
              min={20}
              max={300}
            />
          </div>
          
          <div className="flex flex-col items-center">
            <Label className="text-xs text-muted-foreground mb-0.5">Time</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={timeSignature.numerator}
                onChange={(e) => setTimeSignature({
                  ...timeSignature,
                  numerator: parseInt(e.target.value) || 4
                })}
                className="w-10 text-center font-bold h-8 bg-background/50 border-border/50"
                min={1}
                max={16}
              />
              <span className="text-lg text-muted-foreground">/</span>
              <Input
                type="number"
                value={timeSignature.denominator}
                onChange={(e) => setTimeSignature({
                  ...timeSignature,
                  denominator: parseInt(e.target.value) || 4
                })}
                className="w-10 text-center font-bold h-8 bg-background/50 border-border/50"
                min={1}
                max={32}
              />
            </div>
          </div>
          
          <Button
            variant={transport.loopEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={toggleLoop}
            className={transport.loopEnabled 
              ? 'bg-accent hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent)/0.4)] h-8' 
              : 'h-8'
            }
            title="Loop/Cycle (Ctrl+L)"
          >
            <Repeat className="h-4 w-4 mr-1" />
            Loop
          </Button>
        </div>

        {/* Right: Master Volume */}
        <div className="flex items-center gap-3">
          <Volume2 size={16} className="text-muted-foreground" />
          <div className="w-20">
            <IceFireFader
              value={masterVolume}
              onChange={setMasterVolume}
              height={36}
              width={18}
              showScale={false}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground w-9 text-right">
            {(masterVolume * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
