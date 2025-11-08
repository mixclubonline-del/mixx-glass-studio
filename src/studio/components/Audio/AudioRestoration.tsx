import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Volume2, Zap, Radio, AudioLines } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRestorationProps {
  audioBuffer?: AudioBuffer;
  onProcessed?: (buffer: AudioBuffer) => void;
}

export const AudioRestoration: React.FC<AudioRestorationProps> = ({
  audioBuffer,
  onProcessed
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // De-noise settings
  const [deNoiseEnabled, setDeNoiseEnabled] = useState(true);
  const [noiseThreshold, setNoiseThreshold] = useState(40);
  const [noiseReduction, setNoiseReduction] = useState(50);
  
  // De-click settings
  const [deClickEnabled, setDeClickEnabled] = useState(false);
  const [clickSensitivity, setClickSensitivity] = useState(50);
  const [clickRepair, setClickRepair] = useState(70);
  
  // De-hum settings
  const [deHumEnabled, setDeHumEnabled] = useState(false);
  const [humFrequency, setHumFrequency] = useState(60); // 50Hz or 60Hz
  const [humReduction, setHumReduction] = useState(80);
  
  // Spectral repair settings
  const [spectralEnabled, setSpectralEnabled] = useState(false);
  const [spectralThreshold, setSpectralThreshold] = useState(60);
  const [spectralBandwidth, setSpectralBandwidth] = useState(40);

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
      const ctx = new AudioContext({ sampleRate: audioBuffer.sampleRate });
      const processed = ctx.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Copy and process audio
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const inputData = audioBuffer.getChannelData(ch);
        const outputData = processed.getChannelData(ch);
        
        // Apply de-noise
        if (deNoiseEnabled) {
          applyDeNoise(inputData, outputData, noiseThreshold / 100, noiseReduction / 100);
        } else {
          outputData.set(inputData);
        }
        
        // Apply de-click
        if (deClickEnabled) {
          applyDeClick(outputData, clickSensitivity / 100, clickRepair / 100);
        }
        
        // Apply de-hum
        if (deHumEnabled) {
          applyDeHum(outputData, humFrequency, humReduction / 100, audioBuffer.sampleRate);
        }
        
        // Apply spectral repair
        if (spectralEnabled) {
          applySpectralRepair(outputData, spectralThreshold / 100, spectralBandwidth / 100);
        }
      }

      if (onProcessed) {
        onProcessed(processed);
      }

      toast({
        title: "Processing Complete",
        description: "Audio restoration has been applied"
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
        <CardTitle className="text-lg font-semibold">Audio Restoration</CardTitle>
        <CardDescription>
          Remove noise, clicks, hum, and repair damaged audio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="denoise" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="denoise">
              <Volume2 className="w-4 h-4 mr-2" />
              De-noise
            </TabsTrigger>
            <TabsTrigger value="declick">
              <Zap className="w-4 h-4 mr-2" />
              De-click
            </TabsTrigger>
            <TabsTrigger value="dehum">
              <Radio className="w-4 h-4 mr-2" />
              De-hum
            </TabsTrigger>
            <TabsTrigger value="spectral">
              <AudioLines className="w-4 h-4 mr-2" />
              Spectral
            </TabsTrigger>
          </TabsList>

          {/* De-noise */}
          <TabsContent value="denoise" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable De-noise</Label>
              <Switch checked={deNoiseEnabled} onCheckedChange={setDeNoiseEnabled} />
            </div>
            
            <div className="space-y-2">
              <Label>Noise Threshold</Label>
              <Slider
                value={[noiseThreshold]}
                onValueChange={(v) => setNoiseThreshold(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={!deNoiseEnabled}
              />
              <div className="text-xs text-muted-foreground text-right">
                {noiseThreshold}%
              </div>
            </div>

            <div className="space-y-2">
              <Label>Noise Reduction</Label>
              <Slider
                value={[noiseReduction]}
                onValueChange={(v) => setNoiseReduction(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={!deNoiseEnabled}
              />
              <div className="text-xs text-muted-foreground text-right">
                {noiseReduction}%
              </div>
            </div>
          </TabsContent>

          {/* De-click */}
          <TabsContent value="declick" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable De-click</Label>
              <Switch checked={deClickEnabled} onCheckedChange={setDeClickEnabled} />
            </div>

            <div className="space-y-2">
              <Label>Click Sensitivity</Label>
              <Slider
                value={[clickSensitivity]}
                onValueChange={(v) => setClickSensitivity(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={!deClickEnabled}
              />
              <div className="text-xs text-muted-foreground text-right">
                {clickSensitivity}%
              </div>
            </div>

            <div className="space-y-2">
              <Label>Click Repair Strength</Label>
              <Slider
                value={[clickRepair]}
                onValueChange={(v) => setClickRepair(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={!deClickEnabled}
              />
              <div className="text-xs text-muted-foreground text-right">
                {clickRepair}%
              </div>
            </div>
          </TabsContent>

          {/* De-hum */}
          <TabsContent value="dehum" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable De-hum</Label>
              <Switch checked={deHumEnabled} onCheckedChange={setDeHumEnabled} />
            </div>

            <div className="space-y-2">
              <Label>Hum Frequency</Label>
              <div className="flex gap-2">
                <Button
                  variant={humFrequency === 50 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHumFrequency(50)}
                  disabled={!deHumEnabled}
                  className="flex-1"
                >
                  50 Hz
                </Button>
                <Button
                  variant={humFrequency === 60 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHumFrequency(60)}
                  disabled={!deHumEnabled}
                  className="flex-1"
                >
                  60 Hz
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hum Reduction</Label>
              <Slider
                value={[humReduction]}
                onValueChange={(v) => setHumReduction(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={!deHumEnabled}
              />
              <div className="text-xs text-muted-foreground text-right">
                {humReduction}%
              </div>
            </div>
          </TabsContent>

          {/* Spectral Repair */}
          <TabsContent value="spectral" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Spectral Repair</Label>
              <Switch checked={spectralEnabled} onCheckedChange={setSpectralEnabled} />
            </div>

            <div className="space-y-2">
              <Label>Detection Threshold</Label>
              <Slider
                value={[spectralThreshold]}
                onValueChange={(v) => setSpectralThreshold(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={!spectralEnabled}
              />
              <div className="text-xs text-muted-foreground text-right">
                {spectralThreshold}%
              </div>
            </div>

            <div className="space-y-2">
              <Label>Repair Bandwidth</Label>
              <Slider
                value={[spectralBandwidth]}
                onValueChange={(v) => setSpectralBandwidth(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={!spectralEnabled}
              />
              <div className="text-xs text-muted-foreground text-right">
                {spectralBandwidth}%
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleProcess}
          disabled={!audioBuffer || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Apply Restoration'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Audio processing functions
function applyDeNoise(
  input: Float32Array,
  output: Float32Array,
  threshold: number,
  reduction: number
) {
  // Simple noise gate implementation
  for (let i = 0; i < input.length; i++) {
    const sample = input[i];
    const magnitude = Math.abs(sample);
    
    if (magnitude < threshold) {
      output[i] = sample * (1 - reduction);
    } else {
      output[i] = sample;
    }
  }
}

function applyDeClick(
  data: Float32Array,
  sensitivity: number,
  repair: number
) {
  // Detect and repair clicks
  const windowSize = 3;
  
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const next = data[i + 1];
    
    const diff = Math.abs(curr - (prev + next) / 2);
    
    if (diff > sensitivity) {
      // Interpolate to repair click
      data[i] = data[i] * (1 - repair) + ((prev + next) / 2) * repair;
    }
  }
}

function applyDeHum(
  data: Float32Array,
  frequency: number,
  reduction: number,
  sampleRate: number
) {
  // Simple notch filter for hum frequency
  const omega = (2 * Math.PI * frequency) / sampleRate;
  const cos_omega = Math.cos(omega);
  const alpha = Math.sin(omega) / (2 * 0.707); // Q = 0.707
  
  const b0 = 1;
  const b1 = -2 * cos_omega;
  const b2 = 1;
  const a0 = 1 + alpha;
  const a1 = -2 * cos_omega;
  const a2 = 1 - alpha;
  
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i];
    const y0 = (b0/a0) * x0 + (b1/a0) * x1 + (b2/a0) * x2 - (a1/a0) * y1 - (a2/a0) * y2;
    
    data[i] = data[i] * (1 - reduction) + y0 * reduction;
    
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
}

function applySpectralRepair(
  data: Float32Array,
  threshold: number,
  bandwidth: number
) {
  // Simple spectral interpolation
  const windowSize = Math.floor(bandwidth * 10);
  
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const magnitude = Math.abs(data[i]);
    
    if (magnitude > threshold) {
      let sum = 0;
      let count = 0;
      
      for (let j = -windowSize; j <= windowSize; j++) {
        if (j !== 0 && i + j >= 0 && i + j < data.length) {
          sum += data[i + j];
          count++;
        }
      }
      
      const average = sum / count;
      data[i] = average;
    }
  }
}
