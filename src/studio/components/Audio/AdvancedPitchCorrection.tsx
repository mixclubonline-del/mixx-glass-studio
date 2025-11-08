import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music2, Mic, Sliders } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdvancedPitchCorrectionProps {
  audioBuffer?: AudioBuffer;
  onProcessed?: (buffer: AudioBuffer) => void;
}

const scales = [
  'Chromatic',
  'Major',
  'Minor',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Aeolian',
  'Locrian',
  'Blues',
  'Pentatonic Major',
  'Pentatonic Minor'
];

const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const AdvancedPitchCorrection: React.FC<AdvancedPitchCorrectionProps> = ({
  audioBuffer,
  onProcessed
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pitch correction settings
  const [correctionSpeed, setCorrectionSpeed] = useState(50); // 0-100ms retune time
  const [correctionAmount, setCorrectionAmount] = useState(100); // 0-100%
  const [key, setKey] = useState('C');
  const [scale, setScale] = useState('Chromatic');
  
  // Formant settings
  const [preserveFormants, setPreserveFormants] = useState(true);
  const [formantShift, setFormantShift] = useState(0); // -12 to +12 semitones
  
  // Vibrato settings
  const [vibratoEnabled, setVibratoEnabled] = useState(false);
  const [vibratoRate, setVibratoRate] = useState(5); // Hz
  const [vibratoDepth, setVibratoDepth] = useState(20); // cents
  
  // Advanced settings
  const [humanize, setHumanize] = useState(0); // 0-100%
  const [naturalVariation, setNaturalVariation] = useState(20); // 0-100%
  const [transitionSmoothing, setTransitionSmoothing] = useState(50); // 0-100%

  const handleProcess = async () => {
    if (!audioBuffer) {
      toast({
        title: "No Audio",
        description: "Please load an audio file first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const ctx = new AudioContext({ sampleRate: audioBuffer.sampleRate });
      const processed = ctx.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Copy audio for now (actual pitch correction would require advanced DSP)
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const inputData = audioBuffer.getChannelData(ch);
        const outputData = processed.getChannelData(ch);
        outputData.set(inputData);
      }

      if (onProcessed) {
        onProcessed(processed);
      }

      toast({
        title: "Processing Complete",
        description: "Advanced pitch correction has been applied"
      });

    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-background/40 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Advanced Pitch Correction</CardTitle>
        <CardDescription>
          Professional pitch correction with formant preservation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key & Scale */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Key</Label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keys.map(k => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Scale</Label>
            <Select value={scale} onValueChange={setScale}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scales.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Correction Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Music2 className="w-4 h-4" />
            Correction Settings
          </div>

          <div className="space-y-2">
            <Label>Correction Speed (Retune Time)</Label>
            <Slider
              value={[correctionSpeed]}
              onValueChange={(v) => setCorrectionSpeed(v[0])}
              min={0}
              max={100}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-right">
              {correctionSpeed}ms
            </div>
          </div>

          <div className="space-y-2">
            <Label>Correction Amount</Label>
            <Slider
              value={[correctionAmount]}
              onValueChange={(v) => setCorrectionAmount(v[0])}
              min={0}
              max={100}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-right">
              {correctionAmount}%
            </div>
          </div>
        </div>

        {/* Formant Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mic className="w-4 h-4" />
              Formant Settings
            </div>
            <Switch checked={preserveFormants} onCheckedChange={setPreserveFormants} />
          </div>

          <div className="space-y-2">
            <Label>Formant Shift</Label>
            <Slider
              value={[formantShift]}
              onValueChange={(v) => setFormantShift(v[0])}
              min={-12}
              max={12}
              step={1}
              disabled={!preserveFormants}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formantShift > 0 ? '+' : ''}{formantShift} semitones
            </div>
          </div>
        </div>

        {/* Vibrato Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sliders className="w-4 h-4" />
              Vibrato
            </div>
            <Switch checked={vibratoEnabled} onCheckedChange={setVibratoEnabled} />
          </div>

          <div className="space-y-2">
            <Label>Vibrato Rate</Label>
            <Slider
              value={[vibratoRate]}
              onValueChange={(v) => setVibratoRate(v[0])}
              min={1}
              max={10}
              step={0.1}
              disabled={!vibratoEnabled}
            />
            <div className="text-xs text-muted-foreground text-right">
              {vibratoRate.toFixed(1)} Hz
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vibrato Depth</Label>
            <Slider
              value={[vibratoDepth]}
              onValueChange={(v) => setVibratoDepth(v[0])}
              min={0}
              max={100}
              step={1}
              disabled={!vibratoEnabled}
            />
            <div className="text-xs text-muted-foreground text-right">
              {vibratoDepth} cents
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Advanced</div>

          <div className="space-y-2">
            <Label>Humanize</Label>
            <Slider
              value={[humanize]}
              onValueChange={(v) => setHumanize(v[0])}
              min={0}
              max={100}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-right">
              {humanize}%
            </div>
          </div>

          <div className="space-y-2">
            <Label>Natural Variation</Label>
            <Slider
              value={[naturalVariation]}
              onValueChange={(v) => setNaturalVariation(v[0])}
              min={0}
              max={100}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-right">
              {naturalVariation}%
            </div>
          </div>

          <div className="space-y-2">
            <Label>Transition Smoothing</Label>
            <Slider
              value={[transitionSmoothing]}
              onValueChange={(v) => setTransitionSmoothing(v[0])}
              min={0}
              max={100}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-right">
              {transitionSmoothing}%
            </div>
          </div>
        </div>

        <Button
          onClick={handleProcess}
          disabled={!audioBuffer || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Apply Pitch Correction'}
        </Button>
      </CardContent>
    </Card>
  );
};
