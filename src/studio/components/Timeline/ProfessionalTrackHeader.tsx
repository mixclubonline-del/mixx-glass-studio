/**
 * Professional Track Header - Enhanced track header with all controls
 */

import React from 'react';
import { 
  Circle, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Snowflake,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TrackHeaderProps {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  recordArmed: boolean;
  locked?: boolean;
  frozen?: boolean;
  expanded?: boolean;
  automationMode?: 'off' | 'read' | 'write' | 'latch' | 'touch';
  inputMonitor?: boolean;
  isSelected: boolean;
  height: number;
  onSelect: (id: string) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onRecordArmToggle: (id: string) => void;
  onLockToggle?: (id: string) => void;
  onFreezeToggle?: (id: string) => void;
  onExpandToggle?: (id: string) => void;
  onAutomationModeChange?: (id: string, mode: string) => void;
  onInputMonitorToggle?: (id: string) => void;
  onSettings?: (id: string) => void;
}

export const ProfessionalTrackHeader: React.FC<TrackHeaderProps> = ({
  id,
  name,
  color,
  muted,
  solo,
  recordArmed,
  locked = false,
  frozen = false,
  expanded = true,
  automationMode = 'off',
  inputMonitor = false,
  isSelected,
  height,
  onSelect,
  onMuteToggle,
  onSoloToggle,
  onRecordArmToggle,
  onLockToggle,
  onFreezeToggle,
  onExpandToggle,
  onAutomationModeChange,
  onInputMonitorToggle,
  onSettings,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 px-2 py-1.5 border-b border-border/20 transition-all duration-300 cursor-pointer select-none",
        isSelected 
          ? "bg-background/30" 
          : isHovered 
            ? "bg-background/10" 
            : "bg-transparent"
      )}
      style={{ height: `${height}px` }}
      onClick={() => onSelect(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Colored indicator strip */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: color }}
      />
      {/* Track name only - clean and minimal */}
      <div className="flex items-center gap-2">
        {/* Track name */}
        <span className="flex-1 text-xs font-medium truncate text-foreground/90">{name}</span>

        {/* Status indicators - always visible */}
        {locked && <Lock size={10} className="text-muted-foreground/50" />}
        {frozen && <Snowflake size={10} className="text-blue-400/50" />}
      </div>

      {/* Controls - only show on hover */}
      <div 
        className={cn(
          "flex items-center gap-1 transition-all duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Record Arm */}
        <Button
          variant={recordArmed ? "destructive" : "ghost"}
          size="icon"
          className={cn(
            "w-5 h-5 shrink-0 p-0",
            recordArmed && "animate-pulse"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onRecordArmToggle(id);
          }}
          title="Record Arm (R)"
        >
          <Circle className={cn("w-2.5 h-2.5", recordArmed && "fill-current")} />
        </Button>

        {/* Input Monitor */}
        {onInputMonitorToggle && (
          <Button
            variant={inputMonitor ? "default" : "ghost"}
            size="icon"
            className="w-5 h-5 shrink-0 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onInputMonitorToggle(id);
            }}
            title="Input Monitor"
          >
            {inputMonitor ? <Mic size={12} /> : <MicOff size={12} />}
          </Button>
        )}

        {/* Mute */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-5 h-5 shrink-0 p-0",
            muted && "text-destructive"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle(id);
          }}
          title="Mute (M)"
        >
          {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </Button>
        
        {/* Solo */}
        <Button
          variant={solo ? "default" : "ghost"}
          size="icon"
          className={cn(
            "w-5 h-5 shrink-0 p-0 text-[10px] font-bold",
            solo && "bg-accent text-accent-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSoloToggle(id);
          }}
          title="Solo (S)"
        >
          S
        </Button>

        <div className="flex-1" />

        {/* Automation Mode */}
        {onAutomationModeChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5 shrink-0 p-0 text-[9px] font-medium"
                onClick={(e) => e.stopPropagation()}
                title="Automation Mode"
              >
                {automationMode === 'off' && '•'}
                {automationMode === 'read' && 'R'}
                {automationMode === 'write' && 'W'}
                {automationMode === 'latch' && 'L'}
                {automationMode === 'touch' && 'T'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onAutomationModeChange(id, 'off')}>
                Off
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAutomationModeChange(id, 'read')}>
                Read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAutomationModeChange(id, 'write')}>
                Write
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAutomationModeChange(id, 'latch')}>
                Latch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAutomationModeChange(id, 'touch')}>
                Touch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Lock/Unlock */}
        {onLockToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 shrink-0 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle(id);
            }}
            title="Lock Track"
          >
            {locked ? <Lock size={11} /> : <Unlock size={11} />}
          </Button>
        )}

        {/* Settings */}
        {onSettings && (
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 shrink-0 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onSettings(id);
            }}
            title="Track Settings"
          >
            <Settings size={11} />
          </Button>
        )}
      </div>
    </div>
  );
};
