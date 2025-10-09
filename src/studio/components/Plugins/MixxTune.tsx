import { useState, useEffect } from 'react';
import { PluginWindow } from './PluginWindow';
import { PluginKnob } from '../PluginKnob';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MixxTuneSettings, PitchData, MusicalContext } from '@/types/mixxtune';

interface MixxTuneProps {
  onClose: () => void;
  parameters: Record<string, number>;
  onChange: (parameters: Record<string, number>) => void;
}

export function MixxTune({ onClose, parameters, onChange }: MixxTuneProps) {
  const [settings, setSettings] = useState<MixxTuneSettings>({
    speed: parameters.speed || 50,
    strength: parameters.strength || 80,
    tolerance: parameters.tolerance || 30,
    preserveVibrato: true,
    preserveSlides: true,
    detectPassingTones: true,
    humanize: true,
    useAIContext: true,
    adaptToMelody: true,
    algorithm: 'hybrid',
    style: 'natural'
  });
  
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [context, setContext] = useState<MusicalContext | null>(null);
  const [activeStyle, setActiveStyle] = useState<string>('natural');
  
  const handleKnobChange = (param: string, value: number) => {
    setSettings(prev => ({ ...prev, [param]: value }));
    onChange({ ...parameters, [param]: value });
  };
  
  const handleSwitchChange = (param: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [param]: checked }));
  };
  
  const loadPreset = (style: 'future' | 'drake' | 'natural' | 't-pain') => {
    const presets = {
      future: { speed: 85, strength: 95, tolerance: 15 },
      drake: { speed: 60, strength: 85, tolerance: 25 },
      natural: { speed: 30, strength: 60, tolerance: 40 },
      't-pain': { speed: 100, strength: 100, tolerance: 5 }
    };
    
    const preset = presets[style];
    setSettings(prev => ({ ...prev, ...preset, style }));
    setActiveStyle(style);
    onChange({ ...parameters, ...preset });
  };
  
  const getNoteNameFromMidi = (midi: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[Math.floor(midi) % 12];
    return `${note}${octave}`;
  };
  
  return (
    <PluginWindow title="MixxTune AI" onClose={onClose}>
      <div className="space-y-6 p-6">
        {/* Header with AI Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">AI-Powered Pitch Correction</h3>
            <p className="text-sm text-muted-foreground">Context-aware auto-tune for modern vocals</p>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
            AI Active
          </Badge>
        </div>
        
        <Separator className="bg-white/10" />
        
        {/* Real-time Pitch Display */}
        <div className="bg-black/40 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">DETECTED PITCH</span>
            {currentPitch && (
              <span className="text-xs text-cyan-400">
                {currentPitch.confidence > 0.8 ? 'Locked' : 'Detecting...'}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">
                {currentPitch ? getNoteNameFromMidi(currentPitch.midiNote) : '--'}
              </div>
              <div className="text-xs text-muted-foreground">Note</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {currentPitch ? `${currentPitch.cents > 0 ? '+' : ''}${Math.round(currentPitch.cents)}` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">Cents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {currentPitch ? `${Math.round(currentPitch.frequency)}Hz` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">Frequency</div>
            </div>
          </div>
          
          {currentPitch && (
            <div className="mt-3 flex gap-2">
              {currentPitch.isVibrato && (
                <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                  Vibrato
                </Badge>
              )}
              {currentPitch.isSlide && (
                <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                  Slide
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Musical Context Display */}
        {context && settings.useAIContext && (
          <div className="bg-black/40 rounded-lg p-4 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">AI CONTEXT ANALYSIS</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-lg font-bold text-white">{context.key}</div>
                <div className="text-xs text-muted-foreground">Key</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{context.chord}</div>
                <div className="text-xs text-muted-foreground">Chord</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{context.scale}</div>
                <div className="text-xs text-muted-foreground">Scale</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Style Presets */}
        <div>
          <Label className="text-xs text-muted-foreground mb-3 block">STYLE PRESETS</Label>
          <div className="grid grid-cols-4 gap-2">
            {(['future', 'drake', 'natural', 't-pain'] as const).map((style) => (
              <Button
                key={style}
                variant={activeStyle === style ? 'default' : 'outline'}
                size="sm"
                onClick={() => loadPreset(style)}
                className="capitalize"
              >
                {style === 't-pain' ? 'T-Pain' : style}
              </Button>
            ))}
          </div>
        </div>
        
        <Separator className="bg-white/10" />
        
        {/* Main Controls */}
        <div>
          <Label className="text-xs text-muted-foreground mb-4 block">CORRECTION SETTINGS</Label>
          <div className="grid grid-cols-3 gap-6">
            <PluginKnob
              label="Speed"
              value={settings.speed}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(value) => handleKnobChange('speed', value)}
              color="blue"
            />
            <PluginKnob
              label="Strength"
              value={settings.strength}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(value) => handleKnobChange('strength', value)}
              color="blue"
            />
            <PluginKnob
              label="Tolerance"
              value={settings.tolerance}
              min={0}
              max={100}
              step={1}
              unit="¢"
              onChange={(value) => handleKnobChange('tolerance', value)}
              color="blue"
            />
          </div>
        </div>
        
        <Separator className="bg-white/10" />
        
        {/* Advanced Toggles */}
        <div>
          <Label className="text-xs text-muted-foreground mb-4 block">INTELLIGENT FEATURES</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="vibrato" className="text-sm">Preserve Vibrato</Label>
              <Switch
                id="vibrato"
                checked={settings.preserveVibrato}
                onCheckedChange={(checked) => handleSwitchChange('preserveVibrato', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="slides" className="text-sm">Preserve Slides</Label>
              <Switch
                id="slides"
                checked={settings.preserveSlides}
                onCheckedChange={(checked) => handleSwitchChange('preserveSlides', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="passing" className="text-sm">Detect Passing Tones</Label>
              <Switch
                id="passing"
                checked={settings.detectPassingTones}
                onCheckedChange={(checked) => handleSwitchChange('detectPassingTones', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="humanize" className="text-sm">Humanize</Label>
              <Switch
                id="humanize"
                checked={settings.humanize}
                onCheckedChange={(checked) => handleSwitchChange('humanize', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="aicontext" className="text-sm font-medium text-cyan-400">
                AI Context Analysis
              </Label>
              <Switch
                id="aicontext"
                checked={settings.useAIContext}
                onCheckedChange={(checked) => handleSwitchChange('useAIContext', checked)}
              />
            </div>
          </div>
        </div>
        
        {/* Info Footer */}
        <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/30">
          <p className="text-xs text-cyan-400">
            <span className="font-semibold">AI Mode Active:</span> MixxTune listens to your full mix 
            to understand chords, key, and melody—adapting pitch correction in real-time for 
            natural, musical results.
          </p>
        </div>
      </div>
    </PluginWindow>
  );
}
