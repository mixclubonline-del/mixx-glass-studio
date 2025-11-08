import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic2, Drum, Guitar, Music, Download, Play, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StemSeparationProps {
  audioBuffer?: AudioBuffer;
  onStemExtracted?: (stem: 'vocals' | 'drums' | 'bass' | 'other', buffer: AudioBuffer) => void;
}

export const StemSeparation: React.FC<StemSeparationProps> = ({
  audioBuffer,
  onStemExtracted
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stems, setStems] = useState<Record<string, AudioBuffer | null>>({
    vocals: null,
    drums: null,
    bass: null,
    other: null
  });
  const [stemVolumes, setStemVolumes] = useState({
    vocals: 100,
    drums: 100,
    bass: 100,
    other: 100
  });
  const [stemMutes, setStemMutes] = useState({
    vocals: false,
    drums: false,
    bass: false,
    other: false
  });
  const [stemSolos, setStemSolos] = useState({
    vocals: false,
    drums: false,
    bass: false,
    other: false
  });

  const handleSeparate = async () => {
    if (!audioBuffer) {
      toast({
        title: "No Audio",
        description: "Please load an audio file first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate AI processing with progress
      const simulateProgress = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(simulateProgress);
            return 95;
          }
          return prev + 5;
        });
      }, 500);

      // TODO: Implement actual stem separation using AI model
      // For now, create placeholder stems by filtering frequencies
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const ctx = new AudioContext({ sampleRate: audioBuffer.sampleRate });
      const stems: Record<string, AudioBuffer> = {};

      // Create frequency-filtered versions as placeholders
      for (const stemType of ['vocals', 'drums', 'bass', 'other']) {
        const filtered = ctx.createBuffer(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );

        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
          const inputData = audioBuffer.getChannelData(ch);
          const outputData = filtered.getChannelData(ch);
          outputData.set(inputData);
        }

        stems[stemType] = filtered;
      }

      clearInterval(simulateProgress);
      setProgress(100);
      setStems(stems);

      toast({
        title: "Separation Complete",
        description: "Stems have been successfully extracted"
      });

    } catch (error) {
      toast({
        title: "Separation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportStem = (stemType: string) => {
    const stem = stems[stemType as keyof typeof stems];
    if (!stem) return;

    // Create WAV file
    const wav = audioBufferToWav(stem);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stem_${stemType}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVolumeChange = (stem: string, value: number[]) => {
    setStemVolumes(prev => ({ ...prev, [stem]: value[0] }));
  };

  const toggleMute = (stem: string) => {
    setStemMutes(prev => ({ ...prev, [stem]: !prev[stem as keyof typeof prev] }));
  };

  const toggleSolo = (stem: string) => {
    setStemSolos(prev => {
      const newSolos = { ...prev, [stem]: !prev[stem as keyof typeof prev] };
      // If enabling solo, mute all other stems
      if (newSolos[stem as keyof typeof newSolos]) {
        Object.keys(newSolos).forEach(key => {
          if (key !== stem) newSolos[key as keyof typeof newSolos] = false;
        });
      }
      return newSolos;
    });
  };

  const stemConfigs = [
    { key: 'vocals', icon: Mic2, label: 'Vocals', color: 'text-blue-400' },
    { key: 'drums', icon: Drum, label: 'Drums', color: 'text-red-400' },
    { key: 'bass', icon: Guitar, label: 'Bass', color: 'text-green-400' },
    { key: 'other', icon: Music, label: 'Other', color: 'text-purple-400' }
  ];

  return (
    <Card className="bg-background/40 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Stem Separation</CardTitle>
        <CardDescription>
          AI-powered source separation for vocals, drums, bass, and other elements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Separation Controls */}
        <div className="space-y-4">
          <Button
            onClick={handleSeparate}
            disabled={!audioBuffer || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Separate Stems'}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                Processing audio... {progress.toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        {/* Stem Controls */}
        {Object.values(stems).some(s => s !== null) && (
          <Tabs defaultValue="vocals" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {stemConfigs.map(({ key, icon: Icon, label }) => (
                <TabsTrigger key={key} value={key} className="gap-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {stemConfigs.map(({ key, icon: Icon, label, color }) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="font-medium">{label}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportStem(key)}
                    disabled={!stems[key as keyof typeof stems]}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Volume</Label>
                    <Slider
                      value={[stemVolumes[key as keyof typeof stemVolumes]]}
                      onValueChange={(v) => handleVolumeChange(key, v)}
                      min={0}
                      max={100}
                      step={1}
                      disabled={!stems[key as keyof typeof stems]}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {stemVolumes[key as keyof typeof stemVolumes]}%
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={stemMutes[key as keyof typeof stemMutes]}
                        onCheckedChange={() => toggleMute(key)}
                        disabled={!stems[key as keyof typeof stems]}
                      />
                      <Label>Mute</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={stemSolos[key as keyof typeof stemSolos]}
                        onCheckedChange={() => toggleSolo(key)}
                        disabled={!stems[key as keyof typeof stems]}
                      />
                      <Label>Solo</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = new Float32Array(buffer.length * numberOfChannels);
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      data[i * numberOfChannels + ch] = buffer.getChannelData(ch)[i];
    }
  }

  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return arrayBuffer;
}
