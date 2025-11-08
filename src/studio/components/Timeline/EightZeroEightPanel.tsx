/**
 * 808 Workflow Panel - Trap-focused bass programming
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Music, ArrowUp, ArrowDown, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EightZeroEightPanelProps {
  regionId?: string;
  onOpenPianoRoll?: (regionId: string) => void;
}

export const EightZeroEightPanel: React.FC<EightZeroEightPanelProps> = ({
  regionId,
  onOpenPianoRoll,
}) => {
  const [pitchSlide, setPitchSlide] = useState(50); // ms
  const [octaveShift, setOctaveShift] = useState(0);
  const [slideAmount, setSlideAmount] = useState(12); // semitones

  const handleOctaveShift = (direction: number) => {
    const newShift = Math.max(-2, Math.min(2, octaveShift + direction));
    setOctaveShift(newShift);
  };

  return (
    <div className="p-4 space-y-4 glass-ultra rounded-lg border border-gradient">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-[hsl(280_90%_65%)]" />
          <h3 className="font-semibold text-sm">808 Controls</h3>
        </div>
        {regionId && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenPianoRoll?.(regionId)}
            className="h-7"
          >
            <Music className="h-3 w-3 mr-1" />
            Piano Roll
          </Button>
        )}
      </div>

      {/* Octave Shifter */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Octave Shift</Label>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOctaveShift(-1)}
            disabled={octaveShift <= -2}
            className="flex-1 h-8"
          >
            <ArrowDown className="h-3 w-3 mr-1" />
            -1
          </Button>
          <div
            className="flex-1 h-8 rounded flex items-center justify-center font-medium text-sm"
            style={{
              backgroundColor: 'hsl(280 90% 65% / 0.2)',
              color: 'hsl(280 90% 65%)',
            }}
          >
            {octaveShift > 0 ? '+' : ''}{octaveShift}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOctaveShift(1)}
            disabled={octaveShift >= 2}
            className="flex-1 h-8"
          >
            <ArrowUp className="h-3 w-3 mr-1" />
            +1
          </Button>
        </div>
      </div>

      {/* Pitch Slide Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Slide Time</Label>
          <span className="text-xs font-medium">{pitchSlide}ms</span>
        </div>
        <Slider
          value={[pitchSlide]}
          onValueChange={([value]) => setPitchSlide(value)}
          min={10}
          max={500}
          step={10}
          className="cursor-pointer"
        />
      </div>

      {/* Slide Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Slide Amount</Label>
          <span className="text-xs font-medium">{slideAmount} semitones</span>
        </div>
        <Slider
          value={[slideAmount]}
          onValueChange={([value]) => setSlideAmount(value)}
          min={1}
          max={24}
          step={1}
          className="cursor-pointer"
        />
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Quick Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPitchSlide(50);
              setSlideAmount(12);
            }}
            className="h-8 text-xs"
          >
            Classic 808
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPitchSlide(100);
              setSlideAmount(24);
            }}
            className="h-8 text-xs"
          >
            Long Slide
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPitchSlide(20);
              setSlideAmount(7);
            }}
            className="h-8 text-xs"
          >
            Quick Hit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPitchSlide(200);
              setSlideAmount(12);
            }}
            className="h-8 text-xs"
          >
            Slow Roll
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t border-border/30">
        <div>• Double-click region for piano roll</div>
        <div>• Shift+↑/↓ for octave shift</div>
        <div>• Draw slides with mouse in piano roll</div>
      </div>
    </div>
  );
};
