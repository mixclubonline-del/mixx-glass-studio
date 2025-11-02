/**
 * Compact Studio Header - Single 64px unified header
 * Combines global controls, transport, and view switching in minimal space
 */

import { Play, Pause, Square, Circle, RotateCcw, MoreVertical, Maximize2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IceFireFader } from '@/studio/components/Controls/IceFireFader';
import { useProject } from '@/contexts/ProjectContext';
import { useTransport } from '@/contexts/ProjectContext';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface CompactStudioHeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  transportHidden?: boolean;
  transportFloating?: boolean;
  onToggleTransportHide?: () => void;
  onToggleTransportFloat?: () => void;
}

export const CompactStudioHeader = ({ 
  currentView, 
  onViewChange,
  transportHidden = false,
  transportFloating = false,
  onToggleTransportHide = () => {},
  onToggleTransportFloat = () => {}
}: CompactStudioHeaderProps) => {
  const { bpm, setBpm, timeSignature, setTimeSignature } = useProject();
  const { transport, play, pause, stop, seek, toggleRecord } = useTransport();
  
  const togglePlay = () => {
    if (transport.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };
  
  const { isPlaying, isRecording, currentTime } = transport;

  return (
    <div className="h-16 border-b border-border/30 px-4 flex items-center justify-between bg-black/95 backdrop-blur-sm">
      {/* LEFT: Project info & time */}
      <div className="flex items-center gap-6">
        <div className="text-sm font-medium text-primary/80">THE ELASTIC TIMELINE</div>
        
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">BPM</span>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-14 h-6 px-1.5 bg-background/50 border border-border/30 rounded text-center focus:outline-none focus:border-primary/50"
              min={60}
              max={200}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Time</span>
            <input
              type="text"
              value={`${timeSignature.numerator}/${timeSignature.denominator}`}
              className="w-12 h-6 px-1.5 bg-background/50 border border-border/30 rounded text-center focus:outline-none focus:border-primary/50"
              readOnly
            />
          </div>
          
          <div className="text-foreground/70 font-mono">{formatTime(currentTime)}</div>
        </div>
      </div>

      {/* CENTER: Transport */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={() => seek(0)}
          title="Return to Zero"
        >
          <RotateCcw size={16} />
        </Button>

        <Button
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className={cn("w-8 h-8", isRecording && "animate-pulse")}
          onClick={toggleRecord}
          title="Record"
        >
          <Circle size={16} className={cn(isRecording && "fill-current")} />
        </Button>

        <Button
          variant={isPlaying ? "default" : "ghost"}
          size="icon"
          className="w-10 h-10"
          onClick={togglePlay}
          title="Play/Pause (Space)"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={stop}
          title="Stop"
        >
          <Square size={16} />
        </Button>

        {/* Transport Options Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 ml-1"
              title="Transport Options"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-background/95 backdrop-blur-sm">
            <DropdownMenuItem onClick={onToggleTransportHide} className="gap-2">
              <EyeOff size={14} />
              <span>{transportHidden ? "Show" : "Hide"} Transport</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleTransportFloat} className="gap-2">
              <Maximize2 size={14} />
              <span>{transportFloating ? "Dock" : "Float"} Transport</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* RIGHT: View switcher & master volume */}
      <div className="flex items-center gap-4">
        <Select value={currentView} onValueChange={onViewChange}>
          <SelectTrigger className="w-32 h-8 text-xs bg-background/50 border-border/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arrange">Arrange</SelectItem>
            <SelectItem value="mix">Mix</SelectItem>
            <SelectItem value="edit">Edit</SelectItem>
            <SelectItem value="produce">Produce</SelectItem>
            <SelectItem value="ai">AI Studio</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Master</span>
          <div className="w-24">
            <IceFireFader
              value={0}
              onChange={() => {}}
              label=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};
