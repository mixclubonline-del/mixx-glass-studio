/**
 * Unified Transport Bar - Global transport control visible across all views
 */

import { Button } from '@/components/ui/button';
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
  const { masterVolume, setMasterVolume } = useProject();
  const { transport, play, pause, stop, toggleLoop, toggleRecord, prevBar, nextBar } = useTransport();
  
  return (
    <div className="glass rounded-lg px-4 py-3 border border-border/30 backdrop-blur-xl">
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
        
        {/* Center: Loop Control */}
        <div className="flex items-center gap-2">
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
