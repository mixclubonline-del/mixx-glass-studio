/**
 * Time Stretch Dialog - Real-time time stretching and pitch shifting interface
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Clock,
  Music2,
  Play,
  Square,
  X,
  Zap,
  Settings,
  Save
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TimeStretchEngine, type StretchAlgorithm } from '@/audio/timestretch/TimeStretchEngine';

interface TimeStretchDialogProps {
  regionId: string;
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
  onClose: () => void;
  onApply: (stretchedBuffer: AudioBuffer) => void;
}

export const TimeStretchDialog: React.FC<TimeStretchDialogProps> = ({
  regionId,
  audioBuffer,
  audioContext,
  onClose,
  onApply,
}) => {
  const [timeStretch, setTimeStretch] = useState(100); // percentage
  const [pitchShift, setPitchShift] = useState(0); // semitones
  const [algorithm, setAlgorithm] = useState<StretchAlgorithm>('psola');
  const [preserveFormants, setPreserveFormants] = useState(true);
  const [quality, setQuality] = useState<'fast' | 'balanced' | 'best'>('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewBuffer, setPreviewBuffer] = useState<AudioBuffer | null>(null);

  const stretchEngine = new TimeStretchEngine(audioContext);

  const originalDuration = audioBuffer.duration;
  const newDuration = (originalDuration * 100) / timeStretch;
  const originalBPM = 120; // Would come from project
  const newBPM = (originalBPM * timeStretch) / 100;

  const processAudio = useCallback(async () => {
    setIsProcessing(true);
    toast.info('Processing audio...');

    try {
      const stretchFactor = timeStretch / 100;
      let result: AudioBuffer;

      if (algorithm === 'psola') {
        result = await stretchEngine.psolaTimeStretch(audioBuffer, stretchFactor, pitchShift);
      } else if (algorithm === 'phase_vocoder') {
        result = await stretchEngine.phaseVocoderTimeStretch(audioBuffer, stretchFactor, pitchShift);
      } else {
        // Rubber Band algorithm (placeholder - would use actual library)
        result = await stretchEngine.phaseVocoderTimeStretch(audioBuffer, stretchFactor, pitchShift);
      }

      setPreviewBuffer(result);
      toast.success('Processing complete');
    } catch (error) {
      console.error('Time stretch error:', error);
      toast.error('Processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, [audioBuffer, timeStretch, pitchShift, algorithm, audioContext]);

  const playPreview = useCallback(async () => {
    if (!previewBuffer) {
      await processAudio();
      return;
    }

    setIsPreviewing(true);
    const source = audioContext.createBufferSource();
    source.buffer = previewBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    source.onended = () => {
      setIsPreviewing(false);
    };

    toast.info('Playing preview...');
  }, [previewBuffer, audioContext, processAudio]);

  const stopPreview = useCallback(() => {
    // Would need to store source ref to actually stop
    setIsPreviewing(false);
  }, []);

  const handleApply = useCallback(async () => {
    if (!previewBuffer) {
      await processAudio();
      return;
    }

    onApply(previewBuffer);
    onClose();
    toast.success('Time stretch applied');
  }, [previewBuffer, onApply, onClose, processAudio]);

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'half_speed':
        setTimeStretch(50);
        setPitchShift(-12);
        break;
      case 'double_speed':
        setTimeStretch(200);
        setPitchShift(12);
        break;
      case 'pitch_up':
        setTimeStretch(100);
        setPitchShift(12);
        break;
      case 'pitch_down':
        setTimeStretch(100);
        setPitchShift(-12);
        break;
      case 'octave_up':
        setTimeStretch(50);
        setPitchShift(0);
        break;
      case 'octave_down':
        setTimeStretch(200);
        setPitchShift(0);
        break;
    }
    toast.info(`Applied ${preset.replace('_', ' ')} preset`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[600px] bg-background rounded-lg border border-gradient shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Time Stretch & Pitch Shift</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6">
          {/* Info Display */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="text-lg font-mono">
                {originalDuration.toFixed(2)}s → {newDuration.toFixed(2)}s
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">BPM</div>
              <div className="text-lg font-mono">
                {originalBPM} → {newBPM.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Time Stretch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Time Stretch
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {timeStretch}%
              </span>
            </div>
            <Slider
              value={[timeStretch]}
              onValueChange={([v]) => setTimeStretch(v)}
              min={25}
              max={400}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.25x</span>
              <span>1.0x</span>
              <span>4.0x</span>
            </div>
          </div>

          {/* Pitch Shift */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Music2 className="h-4 w-4 text-primary" />
                Pitch Shift
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {pitchShift > 0 ? '+' : ''}{pitchShift} st
              </span>
            </div>
            <Slider
              value={[pitchShift]}
              onValueChange={([v]) => setPitchShift(Math.round(v))}
              min={-24}
              max={24}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-2 octaves</span>
              <span>0</span>
              <span>+2 octaves</span>
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="space-y-3 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Algorithm</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    {algorithm.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border-border z-[60]">
                  <DropdownMenuItem onClick={() => setAlgorithm('psola')}>
                    PSOLA (Fast, Best for vocals)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAlgorithm('phase_vocoder')}>
                    Phase Vocoder (Balanced)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAlgorithm('rubber_band')}>
                    Rubber Band (Best quality)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formants"
                  checked={preserveFormants}
                  onChange={(e) => setPreserveFormants(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="formants" className="text-xs cursor-pointer">
                  Preserve Formants
                </Label>
              </div>

              <div className="flex gap-1">
                {(['fast', 'balanced', 'best'] as const).map((q) => (
                  <Button
                    key={q}
                    size="sm"
                    variant={quality === q ? 'secondary' : 'ghost'}
                    className="h-6 px-2 text-xs"
                    onClick={() => setQuality(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2 pt-3 border-t border-border/30">
            <Label className="text-xs text-muted-foreground">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset('half_speed')}
              >
                Half Speed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset('double_speed')}
              >
                Double Speed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset('pitch_up')}
              >
                Pitch +12
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset('pitch_down')}
              >
                Pitch -12
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset('octave_up')}
              >
                Octave Up
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset('octave_down')}
              >
                Octave Down
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/10">
          <Button
            size="sm"
            variant="outline"
            onClick={isProcessing ? undefined : processAudio}
            disabled={isProcessing}
          >
            <Zap className="h-3 w-3 mr-1" />
            {isProcessing ? 'Processing...' : 'Process'}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={isPreviewing ? stopPreview : playPreview}
              disabled={isProcessing}
            >
              {isPreviewing ? (
                <>
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Preview
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="default"
              onClick={handleApply}
              disabled={isProcessing}
            >
              <Save className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
