import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Paintbrush, Eraser, MousePointer, Wand2, Undo, Redo } from 'lucide-react';

interface SpectralEditorProps {
  audioBuffer?: AudioBuffer;
  onProcessed?: (buffer: AudioBuffer) => void;
}

type Tool = 'select' | 'paint' | 'erase' | 'harmonic';

interface EditAction {
  type: 'paint' | 'erase';
  frequencies: number[];
  times: number[];
  values: number[];
}

export const SpectralEditor: React.FC<SpectralEditorProps> = ({
  audioBuffer,
  onProcessed
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [brushSize, setBrushSize] = useState([20]);
  const [brushStrength, setBrushStrength] = useState([100]);
  const [fftSize, setFFTSize] = useState<number>(2048);
  const [colormap, setColormap] = useState<'viridis' | 'magma' | 'plasma'>('viridis');
  const [spectralData, setSpectralData] = useState<Float32Array[]>([]);
  const [editedData, setEditedData] = useState<Float32Array[]>([]);
  const [undoStack, setUndoStack] = useState<EditAction[]>([]);
  const [redoStack, setRedoStack] = useState<EditAction[]>([]);
  const [harmonicFreq, setHarmonicFreq] = useState([440]);
  const [numHarmonics, setNumHarmonics] = useState([8]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  useEffect(() => {
    if (audioBuffer) {
      analyzeSpectrum();
    }
  }, [audioBuffer, fftSize]);

  useEffect(() => {
    if (spectralData.length > 0) {
      renderSpectrogram();
    }
  }, [spectralData, editedData, colormap, selectedRegion]);

  const analyzeSpectrum = async () => {
    if (!audioBuffer) return;

    setIsProcessing(true);
    try {
      const channelData = audioBuffer.getChannelData(0);
      const context = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
      const analyser = context.createAnalyser();
      analyser.fftSize = fftSize;
      
      const hopSize = Math.floor(fftSize / 4);
      const numFrames = Math.floor(channelData.length / hopSize);
      const spectrogram: Float32Array[] = [];

      for (let frame = 0; frame < numFrames; frame++) {
        const startIdx = frame * hopSize;
        const frameData = channelData.slice(startIdx, startIdx + fftSize);
        
        // Apply Hann window
        const windowed = frameData.map((sample, i) => {
          const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / fftSize));
          return sample * windowValue;
        });

        // Compute FFT (simplified - in production use actual FFT library)
        const magnitudes = new Float32Array(fftSize / 2);
        for (let k = 0; k < fftSize / 2; k++) {
          let real = 0;
          let imag = 0;
          for (let n = 0; n < windowed.length; n++) {
            const angle = -2 * Math.PI * k * n / fftSize;
            real += windowed[n] * Math.cos(angle);
            imag += windowed[n] * Math.sin(angle);
          }
          magnitudes[k] = Math.sqrt(real * real + imag * imag);
        }

        spectrogram.push(magnitudes);
      }

      setSpectralData(spectrogram);
      setEditedData(spectrogram.map(frame => new Float32Array(frame)));
      
      toast({
        title: "Analysis Complete",
        description: `Generated ${numFrames} spectral frames`,
      });
    } catch (error) {
      console.error('Spectral analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getColormapColor = (value: number, colormap: string): [number, number, number] => {
    const normalized = Math.max(0, Math.min(1, value));
    
    if (colormap === 'viridis') {
      return [
        Math.floor(68 + normalized * 187),
        Math.floor(1 + normalized * 254),
        Math.floor(84 + normalized * 171)
      ];
    } else if (colormap === 'magma') {
      return [
        Math.floor(0 + normalized * 252),
        Math.floor(0 + normalized * 196),
        Math.floor(4 + normalized * 251)
      ];
    } else {
      return [
        Math.floor(13 + normalized * 240),
        Math.floor(8 + normalized * 247),
        Math.floor(135 + normalized * 120)
      ];
    }
  };

  const renderSpectrogram = () => {
    const canvas = canvasRef.current;
    if (!canvas || editedData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);

    const numFrames = editedData.length;
    const numFreqs = editedData[0].length;

    // Normalize and render
    let maxMag = 0;
    editedData.forEach(frame => {
      frame.forEach(mag => {
        maxMag = Math.max(maxMag, mag);
      });
    });

    for (let x = 0; x < width; x++) {
      const frameIdx = Math.floor((x / width) * numFrames);
      if (frameIdx >= numFrames) continue;

      for (let y = 0; y < height; y++) {
        const freqIdx = Math.floor(((height - y) / height) * numFreqs);
        if (freqIdx >= numFreqs) continue;

        const magnitude = editedData[frameIdx][freqIdx] / maxMag;
        const dbValue = magnitude > 0 ? 20 * Math.log10(magnitude) : -100;
        const normalized = (dbValue + 100) / 100; // -100 to 0 dB range

        const [r, g, b] = getColormapColor(normalized, colormap);
        const idx = (y * width + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw selection region
    if (selectedRegion) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectedRegion.startX,
        selectedRegion.startY,
        selectedRegion.endX - selectedRegion.startX,
        selectedRegion.endY - selectedRegion.startY
      );
    }

    // Draw harmonic lines if harmonic tool is active
    if (activeTool === 'harmonic') {
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
      ctx.lineWidth = 1;
      const fundamentalFreq = harmonicFreq[0];
      const nyquist = audioBuffer ? audioBuffer.sampleRate / 2 : 22050;
      
      for (let h = 1; h <= numHarmonics[0]; h++) {
        const freq = fundamentalFreq * h;
        if (freq > nyquist) break;
        const y = height - (freq / nyquist) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectedRegion({ startX: x, startY: y, endX: x, endY: y });
      setIsDrawing(true);
    } else if (activeTool === 'paint' || activeTool === 'erase') {
      setIsDrawing(true);
      applyBrush(e);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    if (activeTool === 'select' && selectedRegion) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectedRegion({ ...selectedRegion, endX: x, endY: y });
    } else if (activeTool === 'paint' || activeTool === 'erase') {
      applyBrush(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const applyBrush = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || editedData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const frameIdx = Math.floor((x / canvas.width) * editedData.length);
    const freqIdx = Math.floor(((canvas.height - y) / canvas.height) * editedData[0].length);

    const brushRadius = brushSize[0] / 2;
    const strength = brushStrength[0] / 100;

    const newData = editedData.map((frame, fIdx) => {
      if (Math.abs(fIdx - frameIdx) > brushRadius) return frame;
      
      return frame.map((mag, freqI) => {
        if (Math.abs(freqI - freqIdx) > brushRadius) return mag;
        
        const dist = Math.sqrt(
          Math.pow(fIdx - frameIdx, 2) + 
          Math.pow(freqI - freqIdx, 2)
        );
        
        if (dist > brushRadius) return mag;
        
        const falloff = 1 - (dist / brushRadius);
        
        if (activeTool === 'paint') {
          return mag * (1 + strength * falloff);
        } else {
          return mag * (1 - strength * falloff);
        }
      });
    });

    setEditedData(newData);
  };

  const selectHarmonics = () => {
    if (!audioBuffer || editedData.length === 0) return;

    const fundamentalFreq = harmonicFreq[0];
    const nyquist = audioBuffer.sampleRate / 2;
    const freqBinSize = nyquist / editedData[0].length;

    const harmonicBins: number[] = [];
    for (let h = 1; h <= numHarmonics[0]; h++) {
      const freq = fundamentalFreq * h;
      if (freq > nyquist) break;
      const bin = Math.floor(freq / freqBinSize);
      harmonicBins.push(bin);
    }

    const newData = editedData.map(frame => {
      return frame.map((mag, idx) => {
        const isHarmonic = harmonicBins.some(bin => Math.abs(idx - bin) < 3);
        return isHarmonic ? mag * 1.5 : mag * 0.3;
      });
    });

    setEditedData(newData);
    toast({
      title: "Harmonics Selected",
      description: `Enhanced ${harmonicBins.length} harmonic frequencies`,
    });
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    // Implement undo logic
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    // Implement redo logic
  };

  const exportProcessed = () => {
    if (!audioBuffer || editedData.length === 0) {
      toast({
        title: "Cannot Export",
        description: "No processed audio available",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement inverse FFT and audio buffer reconstruction
    toast({
      title: "Export Started",
      description: "Reconstructing audio from spectral data...",
    });
  };

  return (
    <Card className="p-6 bg-background/95 backdrop-blur border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Spectral Editor</h3>
          <p className="text-sm text-muted-foreground">
            Surgical frequency editing with painting and harmonic selection
          </p>
        </div>

        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="harmonics">Harmonics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={activeTool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('select')}
              >
                <MousePointer className="w-4 h-4 mr-1" />
                Select
              </Button>
              <Button
                variant={activeTool === 'paint' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('paint')}
              >
                <Paintbrush className="w-4 h-4 mr-1" />
                Paint
              </Button>
              <Button
                variant={activeTool === 'erase' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('erase')}
              >
                <Eraser className="w-4 h-4 mr-1" />
                Erase
              </Button>
              <Button
                variant={activeTool === 'harmonic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('harmonic')}
              >
                <Wand2 className="w-4 h-4 mr-1" />
                Harmonic
              </Button>
            </div>

            {(activeTool === 'paint' || activeTool === 'erase') && (
              <>
                <div className="space-y-2">
                  <Label>Brush Size: {brushSize[0]}px</Label>
                  <Slider
                    value={brushSize}
                    onValueChange={setBrushSize}
                    min={5}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brush Strength: {brushStrength[0]}%</Label>
                  <Slider
                    value={brushStrength}
                    onValueChange={setBrushStrength}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={undo} disabled={undoStack.length === 0}>
                <Undo className="w-4 h-4 mr-1" />
                Undo
              </Button>
              <Button size="sm" variant="outline" onClick={redo} disabled={redoStack.length === 0}>
                <Redo className="w-4 h-4 mr-1" />
                Redo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="harmonics" className="space-y-4">
            <div className="space-y-2">
              <Label>Fundamental Frequency: {harmonicFreq[0]} Hz</Label>
              <Slider
                value={harmonicFreq}
                onValueChange={setHarmonicFreq}
                min={20}
                max={4000}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Number of Harmonics: {numHarmonics[0]}</Label>
              <Slider
                value={numHarmonics}
                onValueChange={setNumHarmonics}
                min={1}
                max={16}
                step={1}
              />
            </div>

            <Button onClick={selectHarmonics} className="w-full">
              <Wand2 className="w-4 h-4 mr-2" />
              Select Harmonics
            </Button>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <Label>FFT Size</Label>
              <Select value={fftSize.toString()} onValueChange={(v) => setFFTSize(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1024</SelectItem>
                  <SelectItem value="2048">2048</SelectItem>
                  <SelectItem value="4096">4096</SelectItem>
                  <SelectItem value="8192">8192</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Colormap</Label>
              <Select value={colormap} onValueChange={(v: any) => setColormap(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viridis">Viridis</SelectItem>
                  <SelectItem value="magma">Magma</SelectItem>
                  <SelectItem value="plasma">Plasma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={analyzeSpectrum} 
              disabled={!audioBuffer || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Reanalyze Spectrum'
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="border border-border rounded-lg overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={exportProcessed} disabled={editedData.length === 0} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export Processed Audio
          </Button>
        </div>
      </div>
    </Card>
  );
};
