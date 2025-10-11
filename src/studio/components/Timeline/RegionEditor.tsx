/**
 * Region Editor - Advanced region editing tools (split, trim, fade, normalize)
 * Phase 3: Real-time waveform rendering + region editing
 */

import React from 'react';
import { Region } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Scissors, Maximize2, Minimize2, Volume2, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegionEditorProps {
  region: Region;
  onSplit: (time: number) => void;
  onTrim: (start: number, end: number) => void;
  onFade: (fadeIn: number, fadeOut: number) => void;
  onNormalize: () => void;
  onLock: (locked: boolean) => void;
}

export const RegionEditor: React.FC<RegionEditorProps> = ({
  region,
  onSplit,
  onTrim,
  onFade,
  onNormalize,
  onLock
}) => {
  const { toast } = useToast();
  
  const handleSplit = () => {
    const splitTime = region.startTime + (region.duration / 2);
    onSplit(splitTime);
    toast({
      title: 'Region Split',
      description: `Split at ${splitTime.toFixed(2)}s`,
    });
  };
  
  const handleFadeIn = () => {
    const fadeInDuration = Math.min(0.05, region.duration / 4); // 50ms or 25% of duration
    onFade(fadeInDuration, region.fadeOut || 0);
  };
  
  const handleFadeOut = () => {
    const fadeOutDuration = Math.min(0.05, region.duration / 4);
    onFade(region.fadeIn || 0, fadeOutDuration);
  };
  
  const handleNormalize = () => {
    onNormalize();
    toast({
      title: 'Normalized',
      description: 'Region gain normalized to 0dB peak',
    });
  };
  
  return (
    <div className="glass rounded-lg p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Region Editor</h3>
        <div className="text-xs text-muted-foreground">
          {region.name} • {region.duration.toFixed(2)}s
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={handleSplit}
          disabled={region.locked}
        >
          <Scissors size={14} />
          Split
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={handleNormalize}
          disabled={region.locked}
        >
          <Volume2 size={14} />
          Normalize
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={handleFadeIn}
          disabled={region.locked}
        >
          <Minimize2 size={14} />
          Fade In
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={handleFadeOut}
          disabled={region.locked}
        >
          <Maximize2 size={14} className="rotate-180" />
          Fade Out
        </Button>
      </div>
      
      <div className="pt-2 border-t border-border">
        <Button
          size="sm"
          variant={region.locked ? 'default' : 'outline'}
          className="w-full gap-2"
          onClick={() => onLock(!region.locked)}
        >
          {region.locked ? <Lock size={14} /> : <Unlock size={14} />}
          {region.locked ? 'Unlock' : 'Lock'} Region
        </Button>
      </div>
    </div>
  );
};
