/**
 * Synth Rack - Virtual synthesizer with oscillators
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Sparkles, Filter, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
type FilterType = 'lowpass' | 'highpass' | 'bandpass';

export const SynthRack: React.FC = () => {
  const [osc1Type, setOsc1Type] = useState<WaveformType>('sawtooth');
  const [osc2Type, setOsc2Type] = useState<WaveformType>('square');
  const [osc1Level, setOsc1Level] = useState(75);
  const [osc2Level, setOsc2Level] = useState(50);
  const [osc2Detune, setOsc2Detune] = useState(7);
  const [filterType, setFilterType] = useState<FilterType>('lowpass');
  const [filterCutoff, setFilterCutoff] = useState(2000);
  const [filterResonance, setFilterResonance] = useState(0.5);
  const [attack, setAttack] = useState(0.1);
  const [decay, setDecay] = useState(0.3);
  const [sustain, setSustain] = useState(0.7);
  const [release, setRelease] = useState(0.5);
  const [masterVolume, setMasterVolume] = useState(75);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [reverbMix, setReverbMix] = useState(30);
  const [delayMix, setDelayMix] = useState(20);
  
  const waveforms: { type: WaveformType; label: string }[] = [
    { type: 'sine', label: 'Sine' },
    { type: 'square', label: 'Square' },
    { type: 'sawtooth', label: 'Saw' },
    { type: 'triangle', label: 'Tri' },
  ];
  
  return (
    <Card className="glass border-primary/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold gradient-flow">Synth Rack</h3>
          <p className="text-xs text-muted-foreground">Virtual Analog Synthesizer</p>
        </div>
        <Badge variant="outline" className="text-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      </div>
      
      <Tabs defaultValue="oscillators" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="oscillators" className="text-xs">
            <Radio className="w-3 h-3 mr-1" />
            OSC
          </TabsTrigger>
          <TabsTrigger value="filter" className="text-xs">
            <Filter className="w-3 h-3 mr-1" />
            Filter
          </TabsTrigger>
          <TabsTrigger value="envelope" className="text-xs">
            Envelope
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            FX
          </TabsTrigger>
        </TabsList>
        
        {/* Oscillators Tab */}
        <TabsContent value="oscillators" className="space-y-4 mt-4">
          {/* Oscillator 1 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Oscillator 1</label>
            <div className="flex gap-2">
              {waveforms.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setOsc1Type(type)}
                  className={cn(
                    "flex-1 py-2 text-xs rounded border transition-all",
                    osc1Type === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/50 border-border hover:border-primary/50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Level</span>
                <span className="text-primary">{osc1Level}%</span>
              </div>
              <Slider
                value={[osc1Level]}
                onValueChange={([value]) => setOsc1Level(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
          
          {/* Oscillator 2 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Oscillator 2</label>
            <div className="flex gap-2">
              {waveforms.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setOsc2Type(type)}
                  className={cn(
                    "flex-1 py-2 text-xs rounded border transition-all",
                    osc2Type === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/50 border-border hover:border-primary/50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Level</span>
                  <span className="text-primary">{osc2Level}%</span>
                </div>
                <Slider
                  value={[osc2Level]}
                  onValueChange={([value]) => setOsc2Level(value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Detune</span>
                  <span className="text-primary">{osc2Detune} cents</span>
                </div>
                <Slider
                  value={[osc2Detune]}
                  onValueChange={([value]) => setOsc2Detune(value)}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Filter Tab */}
        <TabsContent value="filter" className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('lowpass')}
                className={cn(
                  "flex-1 py-2 text-xs rounded border transition-all",
                  filterType === 'lowpass'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/50 border-border hover:border-primary/50"
                )}
              >
                Low Pass
              </button>
              <button
                onClick={() => setFilterType('highpass')}
                className={cn(
                  "flex-1 py-2 text-xs rounded border transition-all",
                  filterType === 'highpass'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/50 border-border hover:border-primary/50"
                )}
              >
                High Pass
              </button>
              <button
                onClick={() => setFilterType('bandpass')}
                className={cn(
                  "flex-1 py-2 text-xs rounded border transition-all",
                  filterType === 'bandpass'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/50 border-border hover:border-primary/50"
                )}
              >
                Band Pass
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cutoff Frequency</span>
              <span className="text-primary">{filterCutoff} Hz</span>
            </div>
            <Slider
              value={[filterCutoff]}
              onValueChange={([value]) => setFilterCutoff(value)}
              min={20}
              max={20000}
              step={10}
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Resonance</span>
              <span className="text-primary">{(filterResonance * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[filterResonance * 100]}
              onValueChange={([value]) => setFilterResonance(value / 100)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </TabsContent>
        
        {/* Envelope Tab */}
        <TabsContent value="envelope" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Attack</span>
                <span className="text-primary">{attack.toFixed(2)}s</span>
              </div>
              <Slider
                value={[attack * 100]}
                onValueChange={([value]) => setAttack(value / 100)}
                min={0}
                max={200}
                step={1}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Decay</span>
                <span className="text-primary">{decay.toFixed(2)}s</span>
              </div>
              <Slider
                value={[decay * 100]}
                onValueChange={([value]) => setDecay(value / 100)}
                min={0}
                max={200}
                step={1}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sustain</span>
                <span className="text-primary">{(sustain * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[sustain * 100]}
                onValueChange={([value]) => setSustain(value / 100)}
                min={0}
                max={100}
                step={1}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Release</span>
                <span className="text-primary">{release.toFixed(2)}s</span>
              </div>
              <Slider
                value={[release * 100]}
                onValueChange={([value]) => setRelease(value / 100)}
                min={0}
                max={300}
                step={1}
              />
            </div>
          </div>
          
          {/* ADSR Visualization */}
          <div className="h-32 glass-glow rounded p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d={`M 0 100 L ${attack * 20} 0 L ${attack * 20 + decay * 15} ${(1 - sustain) * 100} L ${attack * 20 + decay * 15 + 30} ${(1 - sustain) * 100} L ${attack * 20 + decay * 15 + 30 + release * 20} 100`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                className="drop-shadow-[0_0_10px_hsl(var(--primary))]"
              />
            </svg>
          </div>
        </TabsContent>
        
        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Effects Enabled</span>
            <Switch
              checked={effectsEnabled}
              onCheckedChange={setEffectsEnabled}
            />
          </div>
          
          {effectsEnabled && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reverb</span>
                  <span className="text-primary">{reverbMix}%</span>
                </div>
                <Slider
                  value={[reverbMix]}
                  onValueChange={([value]) => setReverbMix(value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Delay</span>
                  <span className="text-primary">{delayMix}%</span>
                </div>
                <Slider
                  value={[delayMix]}
                  onValueChange={([value]) => setDelayMix(value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Master Volume */}
      <div className="space-y-1 pt-2 border-t border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Master Volume</span>
          </div>
          <span className="text-xs text-primary">{masterVolume}%</span>
        </div>
        <Slider
          value={[masterVolume]}
          onValueChange={([value]) => setMasterVolume(value)}
          min={0}
          max={100}
          step={1}
        />
      </div>
    </Card>
  );
};
