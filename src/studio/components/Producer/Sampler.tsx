/**
 * Sampler - Load and manipulate audio samples
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Upload, Play, Pause, RotateCcw, Save, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Sample {
  id: string;
  name: string;
  duration: number;
  size: number;
}

export const Sampler: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [volume, setVolume] = useState(75);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [startPoint, setStartPoint] = useState(0);
  const [endPoint, setEndPoint] = useState(100);
  const { toast } = useToast();
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const newSample: Sample = {
        id: `sample-${Date.now()}-${Math.random()}`,
        name: file.name,
        duration: 0, // Would be set after loading
        size: file.size,
      };
      
      setSamples((prev) => [...prev, newSample]);
      
      toast({
        title: "Sample Loaded",
        description: `${file.name} added to sampler`,
      });
    });
    
    e.target.value = '';
  };
  
  const loadPreset = (type: 'drums' | 'bass' | 'vocals') => {
    const presets = {
      drums: [
        { id: '1', name: 'Kick 808.wav', duration: 1.2, size: 52000 },
        { id: '2', name: 'Snare Tight.wav', duration: 0.8, size: 38000 },
        { id: '3', name: 'Hi-Hat Closed.wav', duration: 0.3, size: 15000 },
      ],
      bass: [
        { id: '4', name: 'Bass Deep.wav', duration: 2.5, size: 112000 },
        { id: '5', name: 'Bass Wobble.wav', duration: 3.2, size: 145000 },
      ],
      vocals: [
        { id: '6', name: 'Vocal Chop 1.wav', duration: 1.8, size: 87000 },
        { id: '7', name: 'Vocal Chop 2.wav', duration: 2.1, size: 95000 },
      ],
    };
    
    setSamples(presets[type]);
    toast({
      title: "Preset Loaded",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} samples loaded`,
    });
  };
  
  const selectedSampleData = samples.find((s) => s.id === selectedSample);
  
  return (
    <Card className="glass border-primary/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold gradient-flow">Sampler</h3>
          <p className="text-xs text-muted-foreground">Audio Sample Playback Engine</p>
        </div>
        <Badge variant="outline" className="text-primary">
          {samples.length} Sample{samples.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Upload */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('sample-upload')?.click()}
          className="gap-2 flex-1"
        >
          <Upload className="w-4 h-4" />
          Load Samples
        </Button>
        <input
          id="sample-upload"
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
      
      {/* Presets */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => loadPreset('drums')} className="text-xs flex-1">
          Drums
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset('bass')} className="text-xs flex-1">
          Bass
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset('vocals')} className="text-xs flex-1">
          Vocals
        </Button>
      </div>
      
      {/* Sample List */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {samples.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No samples loaded
          </div>
        ) : (
          samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => setSelectedSample(sample.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded border transition-all text-xs",
                selectedSample === sample.id
                  ? "bg-primary/20 border-primary"
                  : "bg-background/50 border-border hover:border-primary/50"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="truncate">{sample.name}</span>
                <span className="text-muted-foreground text-[0.65rem]">
                  {(sample.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </button>
          ))
        )}
      </div>
      
      {/* Controls */}
      {selectedSampleData && (
        <>
          <div className="pt-2 border-t border-border/30 space-y-4">
            {/* Transport */}
            <div className="flex items-center gap-2">
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPitch(0);
                  setSpeed(100);
                  setStartPoint(0);
                  setEndPoint(100);
                  setReverse(false);
                }}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Loop</span>
                <Switch checked={loopEnabled} onCheckedChange={setLoopEnabled} />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Reverse</span>
                <Switch checked={reverse} onCheckedChange={setReverse} />
              </div>
            </div>
            
            {/* Waveform Display */}
            <div className="h-16 glass-glow rounded p-2 relative">
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 50" className="w-full h-full">
                  {/* Simplified waveform */}
                  <path
                    d="M 0 25 Q 20 10, 40 25 T 80 25 T 120 25 T 160 25 T 200 25"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                  {/* Selection Range */}
                  <rect
                    x={`${startPoint * 2}%`}
                    y="0"
                    width={`${(endPoint - startPoint) * 2}%`}
                    height="50"
                    fill="hsl(var(--primary))"
                    opacity="0.2"
                  />
                </svg>
              </div>
            </div>
            
            {/* Start/End Points */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Start</span>
                  <span className="text-primary">{startPoint}%</span>
                </div>
                <Slider
                  value={[startPoint]}
                  onValueChange={([value]) => setStartPoint(Math.min(value, endPoint - 1))}
                  min={0}
                  max={99}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">End</span>
                  <span className="text-primary">{endPoint}%</span>
                </div>
                <Slider
                  value={[endPoint]}
                  onValueChange={([value]) => setEndPoint(Math.max(value, startPoint + 1))}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>
            
            {/* Pitch & Speed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pitch</span>
                  <span className="text-primary">{pitch > 0 ? '+' : ''}{pitch} semitones</span>
                </div>
                <Slider
                  value={[pitch]}
                  onValueChange={([value]) => setPitch(value)}
                  min={-24}
                  max={24}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="text-primary">{speed}%</span>
                </div>
                <Slider
                  value={[speed]}
                  onValueChange={([value]) => setSpeed(value)}
                  min={50}
                  max={200}
                  step={1}
                />
              </div>
            </div>
            
            {/* Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Volume</span>
                <span className="text-primary">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={([value]) => setVolume(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
