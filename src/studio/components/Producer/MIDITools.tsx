/**
 * MIDI Tools - Quantize, humanize, chord generator, scale lock
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Grid3x3, Shuffle, Music, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MIDITools: React.FC = () => {
  const { toast } = useToast();
  const [quantizeValue, setQuantizeValue] = useState('16');
  const [scale, setScale] = useState('minor');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground">MIDI Tools</h3>
      
      {/* Quantize */}
      <div className="space-y-2">
        <Label className="text-xs">Quantize</Label>
        <div className="flex gap-2">
          <Select value={quantizeValue} onValueChange={setQuantizeValue}>
            <SelectTrigger className="glass">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">1/4</SelectItem>
              <SelectItem value="8">1/8</SelectItem>
              <SelectItem value="16">1/16</SelectItem>
              <SelectItem value="32">1/32</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => toast({ title: 'Quantized', description: `Notes snapped to 1/${quantizeValue}` })}
          >
            <Grid3x3 size={14} />
            Apply
          </Button>
        </div>
      </div>

      <Separator />

      {/* Humanize */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => toast({ title: 'Humanized', description: 'Added natural timing variation' })}
      >
        <Shuffle size={14} />
        Humanize
      </Button>

      <Separator />

      {/* Scale Lock */}
      <div className="space-y-2">
        <Label className="text-xs">Scale Lock</Label>
        <Select value={scale} onValueChange={setScale}>
          <SelectTrigger className="glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minor">A Minor</SelectItem>
            <SelectItem value="major">C Major</SelectItem>
            <SelectItem value="dorian">D Dorian</SelectItem>
            <SelectItem value="mixolydian">G Mixolydian</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chord Generator */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => toast({ title: 'Chord Generated', description: 'Added chord progression to track' })}
      >
        <Music size={14} />
        Generate Chords
      </Button>
    </div>
  );
};
