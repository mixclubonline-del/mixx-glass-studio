/**
 * Creative Header - BPM, Time Signature, and Position Display
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProject, useTransport } from '@/contexts/ProjectContext';

export const CreativeHeader = () => {
  const { bpm, setBpm, timeSignature, setTimeSignature } = useProject();
  const { getBarPosition } = useTransport();
  
  const { bar, beat, tick } = getBarPosition();
  
  return (
    <div className="glass rounded-lg px-4 py-2 border border-border/30 backdrop-blur-xl">
      <div className="flex items-center justify-center gap-6">
        {/* Position Display */}
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
        
        {/* BPM Control */}
        <div className="flex flex-col items-center">
          <Label className="text-xs text-muted-foreground mb-0.5">BPM</Label>
          <Input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseFloat(e.target.value) || 120)}
            className="w-16 text-center text-lg font-bold h-8 bg-background/50 border-border/50 rounded-md"
            min={20}
            max={300}
          />
        </div>
        
        {/* Time Signature Control */}
        <div className="flex flex-col items-center">
          <Label className="text-xs text-muted-foreground mb-0.5">Time Signature</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={timeSignature.numerator}
              onChange={(e) => setTimeSignature({
                ...timeSignature,
                numerator: parseInt(e.target.value) || 4
              })}
              className="w-10 text-center font-bold h-8 bg-background/50 border-border/50 rounded-md"
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
              className="w-10 text-center font-bold h-8 bg-background/50 border-border/50 rounded-md"
              min={1}
              max={32}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
