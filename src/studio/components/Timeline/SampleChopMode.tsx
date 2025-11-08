/**
 * Sample Chop Mode - Visual sample chopping with transient detection
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  X, 
  Scissors, 
  Grid3x3, 
  Wand2, 
  Trash2,
  Layers,
  Check,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransientDetector, Transient } from '@/audio/analysis/TransientDetector';
import { Region } from '@/types/timeline';
import { toast } from 'sonner';

interface SampleChopModeProps {
  region: Region;
  audioBuffer: AudioBuffer;
  zoom: number;
  scrollX: number;
  onClose: () => void;
  onCreateSlices: (slicePoints: number[]) => void;
  onConvertToPattern: (slicePoints: number[]) => void;
}

export const SampleChopMode: React.FC<SampleChopModeProps> = ({
  region,
  audioBuffer,
  zoom,
  scrollX,
  onClose,
  onCreateSlices,
  onConvertToPattern,
}) => {
  const [sliceMarkers, setSliceMarkers] = useState<number[]>([]);
  const [transients, setTransients] = useState<Transient[]>([]);
  const [threshold, setThreshold] = useState(0.3);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [showTransients, setShowTransients] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      audioContextRef.current?.close();
    };
  }, []);

  // Detect transients on load
  useEffect(() => {
    if (!audioBuffer) return;
    
    const detected = TransientDetector.detect(audioBuffer, {
      threshold,
      sensitivity,
    });
    
    setTransients(detected);
  }, [audioBuffer, threshold, sensitivity]);

  // Keyboard handler for space bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (isPlaying) {
          stopPreview();
        } else {
          playPreview();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, sliceMarkers, audioBuffer]);

  // Draw waveform and markers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = region.duration * zoom;
    const height = 100;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / width);

    ctx.fillStyle = 'hsl(191 100% 50% / 0.3)';
    ctx.strokeStyle = 'hsl(191 100% 50%)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let x = 0; x < width; x++) {
      const start = Math.floor(x * samplesPerPixel);
      const end = Math.floor((x + 1) * samplesPerPixel);

      let min = 1;
      let max = -1;

      for (let i = start; i < end && i < channelData.length; i++) {
        const sample = channelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      const y1 = (1 - max) * height / 2;
      const y2 = (1 - min) * height / 2;

      ctx.lineTo(x, y1);
      ctx.lineTo(x, y2);
    }

    ctx.stroke();

    // Draw transients (if enabled)
    if (showTransients) {
      transients.forEach((transient) => {
        const x = transient.time * zoom;
        const alpha = transient.strength * 0.5;

        ctx.strokeStyle = `hsla(45, 100%, 60%, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      });
    }

    // Draw slice markers
    sliceMarkers.forEach((marker, index) => {
      const x = marker * zoom;
      const isCurrentSlice = index === currentSliceIndex;

      // Marker line
      ctx.strokeStyle = isCurrentSlice ? 'hsl(142 100% 60%)' : 'hsl(320 100% 60%)';
      ctx.lineWidth = isCurrentSlice ? 4 : 3;
      ctx.shadowBlur = isCurrentSlice ? 12 : 8;
      ctx.shadowColor = isCurrentSlice ? 'hsl(142 100% 60%)' : 'hsl(320 100% 60%)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Marker handle
      ctx.fillStyle = isCurrentSlice ? 'hsl(142 100% 60%)' : 'hsl(320 100% 60%)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, 0, isCurrentSlice ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  }, [region, audioBuffer, zoom, sliceMarkers, transients, showTransients, currentSliceIndex]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / zoom;

    // Check if clicking near existing marker to remove it
    const clickThreshold = 5 / zoom;
    const nearbyMarkerIndex = sliceMarkers.findIndex(
      (marker) => Math.abs(marker - time) < clickThreshold
    );

    if (nearbyMarkerIndex !== -1) {
      // Remove marker
      setSliceMarkers((prev) => prev.filter((_, i) => i !== nearbyMarkerIndex));
    } else {
      // Add marker
      setSliceMarkers((prev) => [...prev, time].sort((a, b) => a - b));
    }
  };

  const handleAutoSliceTransients = () => {
    const slicePoints = transients.map((t) => t.time);
    setSliceMarkers(slicePoints);
    toast.success(`Added ${slicePoints.length} slice markers at transients`);
  };

  const handleAutoSliceGrid = () => {
    const bpm = 120; // TODO: Get from project
    const slicePoints = TransientDetector.sliceToGrid(audioBuffer, bpm, 16);
    setSliceMarkers(slicePoints);
    toast.success(`Added ${slicePoints.length} grid-aligned slices`);
  };

  const handleClearMarkers = () => {
    setSliceMarkers([]);
    toast.info('Cleared all slice markers');
  };

  const handleApplySlices = () => {
    if (sliceMarkers.length === 0) {
      toast.error('Add slice markers first');
      return;
    }
    onCreateSlices(sliceMarkers);
    onClose();
    toast.success(`Created ${sliceMarkers.length} slices`);
  };

  const handleConvertToPattern = () => {
    if (sliceMarkers.length === 0) {
      toast.error('Add slice markers first');
      return;
    }
    onConvertToPattern(sliceMarkers);
    onClose();
    toast.success(`Converted to pattern with ${sliceMarkers.length} slices`);
  };

  const playPreview = useCallback(() => {
    if (!audioBuffer || !audioContextRef.current) return;

    stopPreview();

    if (sliceMarkers.length === 0) {
      // Play entire sample if no slices
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      source.onended = () => {
        setIsPlaying(false);
        setCurrentSliceIndex(-1);
      };
      sourceNodeRef.current = source;
      setIsPlaying(true);
      return;
    }

    // Play slices sequentially
    setIsPlaying(true);
    let sliceIndex = 0;

    const playNextSlice = () => {
      if (sliceIndex >= sliceMarkers.length && !audioContextRef.current) {
        setIsPlaying(false);
        setCurrentSliceIndex(-1);
        return;
      }

      setCurrentSliceIndex(sliceIndex);

      const startTime = sliceMarkers[sliceIndex];
      const endTime = sliceIndex < sliceMarkers.length - 1 
        ? sliceMarkers[sliceIndex + 1] 
        : audioBuffer.duration;
      const duration = endTime - startTime;

      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);
      source.start(0, startTime, duration);
      
      sourceNodeRef.current = source;
      sliceIndex++;

      source.onended = () => {
        if (sliceIndex < sliceMarkers.length) {
          playNextSlice();
        } else {
          setIsPlaying(false);
          setCurrentSliceIndex(-1);
          sourceNodeRef.current = null;
        }
      };
    };

    playNextSlice();
  }, [audioBuffer, sliceMarkers]);

  const stopPreview = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setCurrentSliceIndex(-1);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[90vw] h-[80vh] bg-background rounded-lg border border-gradient shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Sample Chop Mode</h2>
            <span className="text-xs text-muted-foreground">
              {region.name}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 border-b border-border/30 space-y-3">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={isPlaying ? "secondary" : "outline"}
              onClick={isPlaying ? stopPreview : playPreview}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Preview (Space)
                </>
              )}
            </Button>
            <div className="h-4 w-px bg-border/30" />
            <Button size="sm" onClick={handleAutoSliceTransients}>
              <Wand2 className="h-3 w-3 mr-1" />
              Auto-Slice Transients
            </Button>
            <Button size="sm" variant="outline" onClick={handleAutoSliceGrid}>
              <Grid3x3 className="h-3 w-3 mr-1" />
              Slice to Grid
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearMarkers}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="secondary" onClick={handleConvertToPattern}>
              <Layers className="h-3 w-3 mr-1" />
              Convert to Pattern
            </Button>
            <Button size="sm" variant="default" onClick={handleApplySlices}>
              <Check className="h-3 w-3 mr-1" />
              Apply Slices
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Threshold */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Threshold</Label>
                <span className="text-xs text-muted-foreground">
                  {(threshold * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={([v]) => setThreshold(v)}
                min={0.1}
                max={0.9}
                step={0.05}
              />
            </div>

            {/* Sensitivity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Sensitivity</Label>
                <span className="text-xs text-muted-foreground">
                  {(sensitivity * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[sensitivity]}
                onValueChange={([v]) => setSensitivity(v)}
                min={0.1}
                max={1.0}
                step={0.05}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>• Click waveform to add slice markers</span>
            <span>• Click marker to remove</span>
            <span>• Press Space to preview</span>
            <span>• {sliceMarkers.length} markers</span>
            <span>• {transients.length} transients detected</span>
          </div>
        </div>

        {/* Waveform Canvas */}
        <div className="flex-1 overflow-auto p-4">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair border border-border/30 rounded"
          />
        </div>
      </div>
    </div>
  );
};
