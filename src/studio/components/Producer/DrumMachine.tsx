/**
 * Drum Machine - Pattern-based drum sequencer
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Save, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrumPattern {
  name: string;
  steps: boolean[][];
  bpm: number;
}

const DRUM_KITS = {
  classic: ['Kick', 'Snare', 'Hi-Hat', 'Tom', 'Clap', 'Rim', 'Crash', 'Ride'],
  trap: ['808 Kick', 'Clap', 'Hi-Hat', 'Open Hat', 'Snare', 'Rim', 'Crash', 'Perc'],
  house: ['Kick', 'Snare', 'Closed Hat', 'Open Hat', 'Clap', 'Shaker', 'Ride', 'Tom'],
};

export const DrumMachine: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedKit, setSelectedKit] = useState<keyof typeof DRUM_KITS>('classic');
  const [steps, setSteps] = useState<boolean[][]>(
    Array(8).fill(null).map(() => Array(16).fill(false))
  );
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(0.75);
  
  const drums = DRUM_KITS[selectedKit];
  
  // Playback logic
  React.useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 16);
    }, (60 / bpm) * 250); // 16th notes
    
    return () => clearInterval(interval);
  }, [isPlaying, bpm]);
  
  const toggleStep = (drumIndex: number, stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[drumIndex][stepIndex] = !newSteps[drumIndex][stepIndex];
    setSteps(newSteps);
  };
  
  const clearPattern = () => {
    setSteps(Array(8).fill(null).map(() => Array(16).fill(false)));
    setCurrentStep(0);
  };
  
  const loadPreset = (preset: 'basic' | 'techno' | 'funk') => {
    const presets = {
      basic: [
        [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
        [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // Hi-Hat
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Rim
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Ride
      ],
      techno: [
        [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
        [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true], // Hi-Hat
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Clap
        [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], // Rim
        [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Ride
      ],
      funk: [
        [true, false, false, true, false, false, true, false, false, false, true, false, false, false, false, false], // Kick
        [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false], // Snare
        [true, false, true, true, false, true, true, false, true, false, true, true, false, true, true, false], // Hi-Hat
        [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false], // Tom
        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Clap
        [false, false, true, false, false, false, false, true, false, false, true, false, false, false, false, false], // Rim
        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
        [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], // Ride
      ],
    };
    
    setSteps(presets[preset]);
    setCurrentStep(0);
  };
  
  return (
    <Card className="glass border-primary/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold gradient-flow">Drum Machine</h3>
          <p className="text-xs text-muted-foreground">16-Step Pattern Sequencer</p>
        </div>
        <Badge variant="outline" className="text-primary">
          {bpm} BPM
        </Badge>
      </div>
      
      {/* Transport */}
      <div className="flex items-center gap-2">
        <Button
          variant={isPlaying ? "default" : "outline"}
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="gap-2"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
        <Button variant="outline" size="sm" onClick={clearPattern} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Clear
        </Button>
        <div className="flex-1" />
        <select
          value={selectedKit}
          onChange={(e) => setSelectedKit(e.target.value as keyof typeof DRUM_KITS)}
          className="text-xs glass border border-border rounded px-2 py-1"
        >
          {Object.keys(DRUM_KITS).map((kit) => (
            <option key={kit} value={kit}>{kit.charAt(0).toUpperCase() + kit.slice(1)}</option>
          ))}
        </select>
      </div>
      
      {/* Presets */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => loadPreset('basic')} className="text-xs">
          Basic Beat
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset('techno')} className="text-xs">
          Techno
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset('funk')} className="text-xs">
          Funk
        </Button>
      </div>
      
      {/* BPM & Volume */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">BPM</label>
          <Slider
            value={[bpm]}
            onValueChange={([value]) => setBpm(value)}
            min={60}
            max={200}
            step={1}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Volume</label>
          <Slider
            value={[volume * 100]}
            onValueChange={([value]) => setVolume(value / 100)}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>
      
      {/* Sequencer Grid */}
      <div className="space-y-1">
        {drums.map((drum, drumIndex) => (
          <div key={drumIndex} className="flex items-center gap-1">
            <div className="w-20 text-xs text-muted-foreground truncate">
              {drum}
            </div>
            <div className="flex gap-0.5 flex-1">
              {steps[drumIndex].map((active, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => toggleStep(drumIndex, stepIndex)}
                  className={cn(
                    "flex-1 h-8 rounded border transition-all",
                    active 
                      ? "bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" 
                      : "bg-background/50 border-border hover:border-primary/50",
                    currentStep === stepIndex && isPlaying && "ring-2 ring-accent"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Step Indicators */}
      <div className="flex gap-0.5 ml-20 pl-1">
        {Array(16).fill(null).map((_, i) => (
          <div key={i} className="flex-1 text-center text-[0.6rem] text-muted-foreground">
            {i + 1}
          </div>
        ))}
      </div>
    </Card>
  );
};
