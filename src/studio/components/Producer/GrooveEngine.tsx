/**
 * Groove Engine - Swing, shuffle, and humanization for natural feel
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Waves,
  Shuffle,
  Clock,
  TrendingUp,
  Save,
  Download,
  Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GrooveTemplate {
  id: string;
  name: string;
  swing: number;
  shuffle: number;
  humanize: {
    timing: number;
    velocity: number;
  };
  pattern: number[]; // Timing adjustments per 16th note
}

const GROOVE_TEMPLATES: GrooveTemplate[] = [
  {
    id: 'none',
    name: 'No Groove',
    swing: 0,
    shuffle: 0,
    humanize: { timing: 0, velocity: 0 },
    pattern: Array(16).fill(0),
  },
  {
    id: 'classic_swing',
    name: 'Classic Swing',
    swing: 66,
    shuffle: 0,
    humanize: { timing: 3, velocity: 5 },
    pattern: [0, 8, 0, 8, 0, 8, 0, 8, 0, 8, 0, 8, 0, 8, 0, 8],
  },
  {
    id: 'mpc_swing',
    name: 'MPC Swing',
    swing: 60,
    shuffle: 0,
    humanize: { timing: 5, velocity: 8 },
    pattern: [0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6],
  },
  {
    id: 'dilla_swing',
    name: 'J Dilla Feel',
    swing: 70,
    shuffle: 15,
    humanize: { timing: 10, velocity: 12 },
    pattern: [0, 10, -2, 12, 0, 9, -3, 11, 0, 10, -2, 12, 0, 9, -3, 11],
  },
  {
    id: 'shuffle_hard',
    name: 'Hard Shuffle',
    swing: 75,
    shuffle: 30,
    humanize: { timing: 2, velocity: 3 },
    pattern: [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12],
  },
  {
    id: 'triplet_feel',
    name: 'Triplet Feel',
    swing: 66,
    shuffle: 0,
    humanize: { timing: 4, velocity: 6 },
    pattern: [0, 11, -1, 11, -1, 11, -1, 11, -1, 11, -1, 11, -1, 11, -1, 11],
  },
  {
    id: 'drunk',
    name: 'Drunk/Humanized',
    swing: 55,
    shuffle: 5,
    humanize: { timing: 20, velocity: 25 },
    pattern: [0, 5, -2, 7, 3, 4, -3, 8, 2, 6, -1, 5, 4, 3, -2, 7],
  },
  {
    id: 'quantized',
    name: 'Perfect Quantize',
    swing: 50,
    shuffle: 0,
    humanize: { timing: 0, velocity: 0 },
    pattern: Array(16).fill(0),
  },
];

interface GrooveEngineProps {
  onApply: (groove: GrooveTemplate) => void;
}

export const GrooveEngine: React.FC<GrooveEngineProps> = ({ onApply }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<GrooveTemplate>(
    GROOVE_TEMPLATES[0]
  );
  const [swing, setSwing] = useState(50); // 50-75%
  const [shuffle, setShuffle] = useState(0); // 0-50%
  const [humanizeTiming, setHumanizeTiming] = useState(0); // 0-50ms
  const [humanizeVelocity, setHumanizeVelocity] = useState(0); // 0-50%
  const [grooveAmount, setGrooveAmount] = useState(100); // Overall strength

  const applyTemplate = (template: GrooveTemplate) => {
    setSelectedTemplate(template);
    setSwing(template.swing);
    setShuffle(template.shuffle);
    setHumanizeTiming(template.humanize.timing);
    setHumanizeVelocity(template.humanize.velocity);
    toast.success(`Applied ${template.name} groove`);
  };

  const handleApplyGroove = () => {
    const groove: GrooveTemplate = {
      id: 'custom',
      name: 'Custom Groove',
      swing,
      shuffle,
      humanize: {
        timing: humanizeTiming,
        velocity: humanizeVelocity,
      },
      pattern: selectedTemplate.pattern,
    };

    onApply(groove);
    toast.success('Groove applied to selected regions');
  };

  const exportGroove = () => {
    const groove = {
      ...selectedTemplate,
      swing,
      shuffle,
      humanize: {
        timing: humanizeTiming,
        velocity: humanizeVelocity,
      },
    };

    const json = JSON.stringify(groove, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groove-template.json';
    a.click();
    toast.success('Groove template exported');
  };

  return (
    <div className="border border-border/30 rounded-lg bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-gradient-to-r from-purple-500/20 to-primary/20">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Groove Engine</h2>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" />
                Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border-border z-[60] max-h-[300px] overflow-y-auto">
              {GROOVE_TEMPLATES.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                >
                  {template.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" variant="outline" onClick={exportGroove}>
            <Upload className="h-3 w-3 mr-1" />
            Export
          </Button>

          <Button size="sm" variant="default" onClick={handleApplyGroove}>
            <Save className="h-3 w-3 mr-1" />
            Apply
          </Button>
        </div>
      </div>

      {/* Current Template */}
      <div className="px-4 py-3 border-b border-border/30 bg-muted/10">
        <div className="text-xs text-muted-foreground">Current Template</div>
        <div className="text-sm font-medium text-primary">{selectedTemplate.name}</div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-6">
        {/* Swing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-primary" />
              Swing
            </Label>
            <span className="text-sm text-muted-foreground font-mono">
              {swing}%
            </span>
          </div>
          <Slider
            value={[swing]}
            onValueChange={([v]) => setSwing(v)}
            min={50}
            max={75}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Straight (50%)</span>
            <span>Medium (62%)</span>
            <span>Hard (75%)</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Delays off-beat 16th notes to create swing feel
          </div>
        </div>

        {/* Shuffle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Shuffle Amount
            </Label>
            <span className="text-sm text-muted-foreground font-mono">
              {shuffle}%
            </span>
          </div>
          <Slider
            value={[shuffle]}
            onValueChange={([v]) => setShuffle(v)}
            min={0}
            max={50}
            step={1}
          />
          <div className="text-xs text-muted-foreground">
            Additional triplet-like feel on top of swing
          </div>
        </div>

        {/* Humanize Section */}
        <div className="pt-4 border-t border-border/30 space-y-4">
          <Label className="text-sm font-medium">Humanization</Label>

          {/* Timing Humanize */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Timing Variation</Label>
              <span className="text-xs text-muted-foreground font-mono">
                ±{humanizeTiming}ms
              </span>
            </div>
            <Slider
              value={[humanizeTiming]}
              onValueChange={([v]) => setHumanizeTiming(v)}
              min={0}
              max={50}
              step={1}
            />
            <div className="text-xs text-muted-foreground">
              Randomly shifts note timing for natural feel
            </div>
          </div>

          {/* Velocity Humanize */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Velocity Variation</Label>
              <span className="text-xs text-muted-foreground font-mono">
                ±{humanizeVelocity}%
              </span>
            </div>
            <Slider
              value={[humanizeVelocity]}
              onValueChange={([v]) => setHumanizeVelocity(v)}
              min={0}
              max={50}
              step={1}
            />
            <div className="text-xs text-muted-foreground">
              Randomly varies note velocity for dynamics
            </div>
          </div>
        </div>

        {/* Groove Amount */}
        <div className="space-y-3 pt-4 border-t border-border/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Groove Strength</Label>
            <span className="text-sm text-muted-foreground font-mono">
              {grooveAmount}%
            </span>
          </div>
          <Slider
            value={[grooveAmount]}
            onValueChange={([v]) => setGrooveAmount(v)}
            min={0}
            max={100}
            step={1}
          />
          <div className="text-xs text-muted-foreground">
            Overall amount of groove effect applied
          </div>
        </div>

        {/* Visual Groove Pattern */}
        <div className="pt-4 border-t border-border/30">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Groove Pattern (16th notes)
          </Label>
          <div className="flex gap-1">
            {selectedTemplate.pattern.map((value, index) => {
              const isOnBeat = index % 4 === 0;
              const isOffBeat = index % 2 === 1;
              const height = 50 + value * 2;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      "w-full rounded transition-all",
                      isOnBeat && "bg-primary/60",
                      isOffBeat && !isOnBeat && "bg-primary/30",
                      !isOnBeat && !isOffBeat && "bg-muted/40"
                    )}
                    style={{ height: `${Math.abs(height)}px` }}
                  />
                  <div className="text-[8px] text-muted-foreground font-mono">
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="px-4 py-3 border-t border-border/30 bg-muted/10 space-y-2">
        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">Tips:</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Start with a template, then adjust to taste</li>
            <li>Swing affects off-beat 16th notes (2, 4, 6, 8...)</li>
            <li>Humanization adds random variation for realism</li>
            <li>Apply to MIDI or audio regions in timeline</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
