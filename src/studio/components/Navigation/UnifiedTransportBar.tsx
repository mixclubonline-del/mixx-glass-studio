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
        <div className="flex items-center gap-1">
          <Button
            variant="glass"
            size="icon"
            onClick={stop}
            title="Return to start"
          >
            <SkipBack size={16} />
          </Button>
          
          <Button
            variant="glass"
            size="icon"
            onClick={prevBar}
            title="Previous bar"
          >
            <StepBack size={16} />
          </Button>
          
          <Button
            variant={transport.isPlaying ? 'prime' : 'glass'}
            size="icon-lg"
            onClick={transport.isPlaying ? pause : () => play()}
            title="Play/Pause (Space)"
          >
            {transport.isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          
          <Button
            variant="glass"
            size="icon"
            onClick={nextBar}
            title="Next bar"
          >
            <StepForward size={16} />
          </Button>
          
          <Button
            variant="glass"
            size="icon"
            onClick={stop}
            title="Skip to end"
          >
            <SkipForward size={16} />
          </Button>
          
          <Button
            variant={transport.isRecording ? 'destructive' : 'glass'}
            size="icon"
            onClick={toggleRecord}
            className={transport.isRecording ? 'animate-pulse' : ''}
            title="Record (Shift+Space)"
          >
            <Circle size={16} className={transport.isRecording ? 'fill-current' : ''} />
          </Button>
        </div>
        
        {/* Center: Loop Control */}
        <div className="flex items-center gap-2">
          <Button
            variant={transport.loopEnabled ? 'neon' : 'glass'}
            size="sm"
            onClick={toggleLoop}
            title="Loop/Cycle (Ctrl+L)"
          >
            <Repeat size={14} className="mr-1" />
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
