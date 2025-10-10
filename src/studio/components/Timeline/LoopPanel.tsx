/**
 * Loop Panel - Professional loop/cycle controls
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Repeat, SkipBack } from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';

interface LoopPanelProps {
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  preRoll: number;
  countInBars: number;
  punchIn: number;
  punchOut: number;
  onLoopEnabledChange: (enabled: boolean) => void;
  onLoopStartChange: (time: number) => void;
  onLoopEndChange: (time: number) => void;
  onPreRollChange: (bars: number) => void;
  onCountInChange: (bars: number) => void;
  onPunchInChange: (time: number) => void;
  onPunchOutChange: (time: number) => void;
  onSetLoopFromSelection: () => void;
}

export const LoopPanel: React.FC<LoopPanelProps> = ({
  loopEnabled,
  loopStart,
  loopEnd,
  preRoll,
  countInBars,
  punchIn,
  punchOut,
  onLoopEnabledChange,
  onLoopStartChange,
  onLoopEndChange,
  onPreRollChange,
  onCountInChange,
  onPunchInChange,
  onPunchOutChange,
  onSetLoopFromSelection,
}) => {
  const { currentTime } = useTimelineStore();
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };
  
  return (
    <div className="glass-glow rounded-lg p-4 space-y-4">
      {/* Loop Enable */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat size={16} className="text-primary" />
          <Label className="text-sm font-semibold">Loop/Cycle</Label>
        </div>
        <Switch
          checked={loopEnabled}
          onCheckedChange={onLoopEnabledChange}
        />
      </div>
      
      {/* Loop Points */}
      {loopEnabled && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loop Start</Label>
              <Input
                type="number"
                value={loopStart.toFixed(2)}
                onChange={(e) => onLoopStartChange(parseFloat(e.target.value))}
                step={0.1}
                className="glass h-9 text-xs font-mono"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loop End</Label>
              <Input
                type="number"
                value={loopEnd.toFixed(2)}
                onChange={(e) => onLoopEndChange(parseFloat(e.target.value))}
                step={0.1}
                className="glass h-9 text-xs font-mono"
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSetLoopFromSelection}
            className="w-full text-xs"
          >
            Set from Selection
          </Button>
        </>
      )}
      
      {/* Pre-roll */}
      <div className="space-y-2 border-t border-border/30 pt-3">
        <Label className="text-xs font-medium">Pre-roll (bars)</Label>
        <Input
          type="number"
          value={preRoll}
          onChange={(e) => onPreRollChange(parseInt(e.target.value))}
          min={0}
          max={8}
          className="glass h-9 text-xs"
        />
      </div>
      
      {/* Count-in */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Count-in (bars)</Label>
        <Input
          type="number"
          value={countInBars}
          onChange={(e) => onCountInChange(parseInt(e.target.value))}
          min={0}
          max={4}
          className="glass h-9 text-xs"
        />
      </div>
      
      {/* Punch Recording */}
      <div className="space-y-2 border-t border-border/30 pt-3">
        <Label className="text-xs font-medium flex items-center gap-2">
          <SkipBack size={14} />
          Punch Recording
        </Label>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Punch In</Label>
            <Input
              type="number"
              value={punchIn.toFixed(2)}
              onChange={(e) => onPunchInChange(parseFloat(e.target.value))}
              step={0.1}
              className="glass h-9 text-xs font-mono"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Punch Out</Label>
            <Input
              type="number"
              value={punchOut.toFixed(2)}
              onChange={(e) => onPunchOutChange(parseFloat(e.target.value))}
              step={0.1}
              className="glass h-9 text-xs font-mono"
            />
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onPunchInChange(currentTime);
          }}
          className="w-full text-xs"
        >
          Set Punch In at Playhead
        </Button>
      </div>
    </div>
  );
};
