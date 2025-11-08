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

interface SliceMarker {
  time: number;
  velocity: number; // 0.0 to 1.0
}

interface SampleChopModeProps {
  region: Region;
  audioBuffer: AudioBuffer;
  zoom: number;
  scrollX: number;
  onClose: () => void;
  onCreateSlices: (slicePoints: number[], velocities?: number[]) => void;
  onConvertToPattern: (slicePoints: number[], velocities?: number[]) => void;
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
  const [sliceMarkers, setSliceMarkers] = useState<SliceMarker[]>([]);
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
      const x = marker.time * zoom;
      const isCurrentSlice = index === currentSliceIndex;
      const velocityPercent = Math.round(marker.velocity * 100);

      // Color based on velocity (red = high, yellow = medium, cyan = low)
      let hue = 320; // Default magenta
      if (isCurrentSlice) {
        hue = 142; // Green when playing
      } else if (marker.velocity > 0.7) {
        hue = 0; // Red for high velocity
      } else if (marker.velocity > 0.4) {
        hue = 45; // Yellow for medium velocity
      } else {
        hue = 191; // Cyan for low velocity
      }

      const color = `hsl(${hue} 100% 60%)`;

      // Marker line with alpha based on velocity
      ctx.strokeStyle = color;
      ctx.lineWidth = isCurrentSlice ? 4 : 2 + (marker.velocity * 2);
      ctx.shadowBlur = isCurrentSlice ? 12 : 4 + (marker.velocity * 8);
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Marker handle
      ctx.fillStyle = color;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      const radius = isCurrentSlice ? 8 : 4 + (marker.velocity * 4);
      ctx.arc(x, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Velocity label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${velocityPercent}`, x, height - 5);
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
      (marker) => Math.abs(marker.time - time) < clickThreshold
    );

    if (nearbyMarkerIndex !== -1) {
      // Remove marker
      setSliceMarkers((prev) => prev.filter((_, i) => i !== nearbyMarkerIndex));
    } else {
      // Add marker with calculated velocity based on waveform amplitude
      const sampleIndex = Math.floor((time / audioBuffer.duration) * audioBuffer.length);
      const channelData = audioBuffer.getChannelData(0);
      
      // Calculate RMS in a small window around this point
      const windowSize = 512;
      const start = Math.max(0, sampleIndex - windowSize / 2);
      const end = Math.min(channelData.length, sampleIndex + windowSize / 2);
      
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / (end - start));
      const velocity = Math.min(1, rms * 3); // Scale and clamp to 0-1

      setSliceMarkers((prev) => 
        [...prev, { time, velocity }].sort((a, b) => a.time - b.time)
      );
    }
  };

  const handleAutoSliceTransients = () => {
    const slicePoints: SliceMarker[] = transients.map((t) => ({
      time: t.time,
      velocity: t.strength, // Use transient strength as velocity
    }));
    setSliceMarkers(slicePoints);
    toast.success(`Added ${slicePoints.length} slice markers with velocity from transients`);
  };

  const handleAutoSliceGrid = () => {
    const bpm = 120; // TODO: Get from project
    const sliceTimes = TransientDetector.sliceToGrid(audioBuffer, bpm, 16);
    
    // Calculate velocity for each grid slice based on RMS
    const channelData = audioBuffer.getChannelData(0);
    const slicePoints: SliceMarker[] = sliceTimes.map((time) => {
      const sampleIndex = Math.floor((time / audioBuffer.duration) * audioBuffer.length);
      const windowSize = 1024;
      const start = Math.max(0, sampleIndex);
      const end = Math.min(channelData.length, sampleIndex + windowSize);
      
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / (end - start));
      const velocity = Math.min(1, rms * 3);
      
      return { time, velocity };
    });
    
    setSliceMarkers(slicePoints);
    toast.success(`Added ${slicePoints.length} grid-aligned slices with velocity`);
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
    const times = sliceMarkers.map(m => m.time);
    const velocities = sliceMarkers.map(m => m.velocity);
    onCreateSlices(times, velocities);
    onClose();
    toast.success(`Created ${sliceMarkers.length} slices with velocity`);
  };

  const handleConvertToPattern = () => {
    if (sliceMarkers.length === 0) {
      toast.error('Add slice markers first');
      return;
    }
    const times = sliceMarkers.map(m => m.time);
    const velocities = sliceMarkers.map(m => m.velocity);
    onConvertToPattern(times, velocities);
    onClose();
    toast.success(`Converted to pattern with ${sliceMarkers.length} slices and velocity`);
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

      const startTime = sliceMarkers[sliceIndex].time;
      const endTime = sliceIndex < sliceMarkers.length - 1 
        ? sliceMarkers[sliceIndex + 1].time
        : audioBuffer.duration;
      const duration = endTime - startTime;
      const velocity = sliceMarkers[sliceIndex].velocity;

      const source = audioContextRef.current!.createBufferSource();
      const gainNode = audioContextRef.current!.createGain();
      
      source.buffer = audioBuffer;
      gainNode.gain.value = velocity; // Apply velocity as gain
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current!.destination);
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
            <span>• Color: <span className="text-red-400">Red</span> = high velocity, <span className="text-yellow-400">Yellow</span> = medium, <span className="text-cyan-400">Cyan</span> = low</span>
            <span>• {sliceMarkers.length} markers</span>
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
