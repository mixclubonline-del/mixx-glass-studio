/**
 * Central Command Hub - The heart of the DAW interface
 * Combines transport controls, view navigation, and quick actions in one compact bar
 */

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  StepBack,
  StepForward,
  Circle,
  Upload,
  Grid3x3,
  Bot,
  Volume2,
  Layout,
  Sliders,
  Edit3
} from 'lucide-react';
import { useTransport, useProject } from '@/contexts/ProjectContext';
import { useViewStore, ViewType } from '@/store/viewStore';
import { IceFireFader } from '../Controls/IceFireFader';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface CentralCommandHubProps {
  onImport: () => void;
  onTogglePluginBrowser: () => void;
  onToggleAIAssistant: () => void;
}

export const CentralCommandHub = ({ 
  onImport, 
  onTogglePluginBrowser,
  onToggleAIAssistant 
}: CentralCommandHubProps) => {
  const { masterVolume, setMasterVolume, bpm, setBpm, timeSignature, getBarPosition } = useProject();
  const { transport, play, pause, stop, toggleRecord, prevBar, nextBar, toggleLoop } = useTransport();
  const { currentView, setView } = useViewStore();
  
  // BPM editing
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState(bpm.toString());
  
  // Update bpmInput when bpm changes externally
  useEffect(() => {
    if (!isEditingBpm) {
      setBpmInput(bpm.toString());
    }
  }, [bpm, isEditingBpm]);
  
  const handleBpmSubmit = () => {
    const newBpm = parseFloat(bpmInput);
    if (!isNaN(newBpm) && newBpm >= 20 && newBpm <= 300) {
      setBpm(newBpm);
    } else {
      setBpmInput(bpm.toString());
    }
    setIsEditingBpm(false);
  };
  
  // Get current position
  const position = getBarPosition();
  const formatPosition = () => {
    return `${position.bar}.${position.beat}.${position.tick.toString().padStart(3, '0')}`;
  };
  
  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'arrange', label: 'Arrange', icon: <Layout size={18} /> },
    { id: 'mix', label: 'Mix', icon: <Sliders size={18} /> },
    { id: 'edit', label: 'Edit', icon: <Edit3 size={18} /> },
  ];
  
  return (
    <div className="glass-ultra border-gradient px-6 py-3 rounded-lg shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between gap-6">
        {/* LEFT: Project Info & Utilities */}
        <div className="flex items-center gap-3">
          {/* Time Display */}
          <div className="flex flex-col items-center gap-0.5 min-w-[90px]">
            <span className="text-[10px] text-muted-foreground font-medium">POSITION</span>
            <span className="text-sm font-mono text-foreground tabular-nums">
              {formatPosition()}
            </span>
          </div>
          
          <div className="w-px h-10 bg-border/50" />
          
          {/* BPM Display/Editor */}
          <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
            <span className="text-[10px] text-muted-foreground font-medium">BPM</span>
            {isEditingBpm ? (
              <Input
                type="number"
                value={bpmInput}
                onChange={(e) => setBpmInput(e.target.value)}
                onBlur={handleBpmSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBpmSubmit();
                  if (e.key === 'Escape') {
                    setBpmInput(bpm.toString());
                    setIsEditingBpm(false);
                  }
                }}
                className="h-6 w-16 text-sm font-mono text-center p-0 bg-muted/50"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingBpm(true)}
                className="text-sm font-mono text-foreground hover:text-primary transition-colors tabular-nums"
                title="Click to edit tempo"
              >
                {bpm.toFixed(1)}
              </button>
            )}
          </div>
          
          <div className="w-px h-10 bg-border/50" />
          
          {/* Time Signature */}
          <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
            <span className="text-[10px] text-muted-foreground font-medium">TIME</span>
            <span className="text-sm font-mono text-foreground tabular-nums">
              {timeSignature.numerator}/{timeSignature.denominator}
            </span>
          </div>
          
          <div className="w-px h-10 bg-border/50" />
          
          {/* Import & Plugins */}
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            className="gap-2 h-9 micro-interact"
            title="Import Audio Files"
          >
            <Upload className="w-4 h-4" />
            <span className="text-xs">Import</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePluginBrowser}
            className="gap-2 h-9 micro-interact"
            title="Open Plugin Suite"
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="text-xs">Plugins</span>
          </Button>
        </div>
        
        {/* CENTER: Transport Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={stop}
            className="h-9 w-9 hover:bg-muted"
            title="Return to Start"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={prevBar}
            className="h-9 w-9 hover:bg-muted"
            title="Previous Bar"
          >
            <StepBack className="h-4 w-4" />
          </Button>
          
          {/* HERO PLAY/PAUSE BUTTON */}
          <Button
            variant={transport.isPlaying ? 'default' : 'outline'}
            size="icon"
            onClick={transport.isPlaying ? pause : () => play()}
            className={transport.isPlaying 
              ? 'bg-[hsl(var(--prime-500))] hover:bg-[hsl(var(--prime-500))]/90 shadow-[var(--glow-intense)] h-14 w-14 scale-110 chromatic-hover' 
              : 'hover:bg-muted h-14 w-14 scale-110 micro-interact'
            }
            title="Play/Pause (Space)"
          >
            {transport.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={nextBar}
            className="h-9 w-9 hover:bg-muted"
            title="Next Bar"
          >
            <StepForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={stop}
            className="h-9 w-9 hover:bg-muted"
            title="Skip to End"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-8 bg-border/50 mx-1" />
          
          <Button
            variant={transport.isRecording ? 'destructive' : 'ghost'}
            size="icon"
            onClick={toggleRecord}
            className={`h-9 w-9 ${transport.isRecording ? 'animate-pulse' : 'hover:bg-muted'}`}
            title="Record (Shift+Space)"
          >
            <Circle className={`h-4 w-4 ${transport.isRecording ? 'fill-current' : ''}`} />
          </Button>
          
          <div className="w-px h-8 bg-border/50 mx-1" />
          
          {/* Loop Toggle */}
          <Button
            variant={transport.loopEnabled ? 'default' : 'ghost'}
            size="icon"
            onClick={toggleLoop}
            className={`h-9 w-9 ${transport.loopEnabled ? 'bg-primary/80 shadow-[var(--glow-medium)]' : 'hover:bg-muted'}`}
            title="Toggle Loop (L)"
          >
            <span className="text-xs font-bold">⟲</span>
          </Button>
        </div>
        
        {/* RIGHT: Navigation & AI */}
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex gap-1 glass-light rounded-lg p-1">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setView(view.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-sm micro-interact ${
                  currentView === view.id
                    ? 'bg-primary text-primary-foreground shadow-[var(--glow-medium)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={`${view.label} View`}
              >
                {view.icon}
                <span className="text-xs font-medium">{view.label}</span>
              </button>
            ))}
          </div>
          
          <div className="w-px h-8 bg-border/50 mx-1" />
          
          {/* AI Assistant */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAIAssistant}
            className="gap-2 h-9 micro-interact chromatic-hover"
            title="AI Assistant"
          >
            <Bot className="w-4 h-4" />
            <span className="text-xs">AI</span>
          </Button>
          
          {/* Master Volume Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted"
                title="Master Volume"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-24 p-3" align="end">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">Master</span>
                <IceFireFader
                  value={masterVolume}
                  onChange={setMasterVolume}
                  height={120}
                  width={24}
                  showScale={true}
                />
                <span className="text-xs font-mono">
                  {(masterVolume * 100).toFixed(0)}%
                </span>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
