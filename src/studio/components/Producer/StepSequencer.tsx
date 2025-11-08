/**
 * Step Sequencer - FL Studio-style step sequencer for drums and melodies
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Grid3x3,
  Play,
  Square,
  Copy,
  Trash2,
  Shuffle,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Step {
  active: boolean;
  velocity: number; // 0-1
  pan: number; // -1 to 1
  pitch: number; // -12 to 12 semitones
  probability: number; // 0-1
}

interface StepSequencerProps {
  trackId: string;
  onTrigger?: (step: number, velocity: number, pan: number, pitch: number) => void;
}

export const StepSequencer: React.FC<StepSequencerProps> = ({
  trackId,
  onTrigger,
}) => {
  const [numSteps, setNumSteps] = useState(16);
  const [steps, setSteps] = useState<Step[]>(
    Array.from({ length: 64 }, () => ({
      active: false,
      velocity: 0.8,
      pan: 0,
      pitch: 0,
      probability: 1.0,
    }))
  );
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editMode, setEditMode] = useState<'velocity' | 'pan' | 'pitch' | 'probability'>('velocity');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const STEP_WIDTH = 48;
  const STEP_HEIGHT = 48;

  const toggleStep = (index: number) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], active: !newSteps[index].active };
      return newSteps;
    });
  };

  const handleStepClick = (index: number) => {
    if (index < numSteps) {
      toggleStep(index);
      setSelectedStep(index);
    }
  };

  const updateStepParameter = (index: number, param: keyof Step, value: number) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], [param]: value };
      return newSteps;
    });
  };

  const randomizeVelocity = () => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i < numSteps && step.active
          ? { ...step, velocity: Math.random() * 0.5 + 0.5 }
          : step
      )
    );
    toast.success('Velocity randomized');
  };

  const euclideanRhythm = (steps: number, pulses: number) => {
    const pattern = Array(steps).fill(false);
    const bucket = Array(steps).fill(0);
    
    for (let i = 0; i < steps; i++) {
      bucket[i] = Math.floor((i * pulses) / steps);
    }
    
    for (let i = 0; i < steps; i++) {
      if (i === 0 || bucket[i] !== bucket[i - 1]) {
        pattern[i] = true;
      }
    }
    
    return pattern;
  };

  const generateEuclidean = () => {
    const pulses = Math.floor(numSteps / 3);
    const pattern = euclideanRhythm(numSteps, pulses);
    
    setSteps((prev) => {
      const newSteps = [...prev];
      for (let i = 0; i < numSteps; i++) {
        newSteps[i] = { ...newSteps[i], active: pattern[i] };
      }
      return newSteps;
    });
    toast.success('Euclidean rhythm generated');
  };

  const clearPattern = () => {
    setSteps((prev) =>
      prev.map((step, i) => (i < numSteps ? { ...step, active: false } : step))
    );
    toast.info('Pattern cleared');
  };

  const shiftPattern = (direction: 1 | -1) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      const pattern = newSteps.slice(0, numSteps);
      
      if (direction === 1) {
        const last = pattern[pattern.length - 1];
        pattern.unshift(last);
        pattern.pop();
      } else {
        const first = pattern[0];
        pattern.shift();
        pattern.push(first);
      }
      
      for (let i = 0; i < numSteps; i++) {
        newSteps[i] = pattern[i];
      }
      
      return newSteps;
    });
  };

  const getParameterValue = (step: Step): number => {
    switch (editMode) {
      case 'velocity':
        return step.velocity;
      case 'pan':
        return (step.pan + 1) / 2; // Convert -1..1 to 0..1
      case 'pitch':
        return (step.pitch + 12) / 24; // Convert -12..12 to 0..1
      case 'probability':
        return step.probability;
      default:
        return 0;
    }
  };

  const getParameterColor = (): string => {
    switch (editMode) {
      case 'velocity':
        return 'hsl(191 100% 50%)';
      case 'pan':
        return 'hsl(280 100% 60%)';
      case 'pitch':
        return 'hsl(45 100% 60%)';
      case 'probability':
        return 'hsl(320 100% 60%)';
      default:
        return 'hsl(191 100% 50%)';
    }
  };

  return (
    <div className="border border-border/30 rounded-lg bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Step Sequencer</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={isPlaying ? 'destructive' : 'secondary'}
            className="h-7"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => shiftPattern(-1)}
          >
            ←
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => shiftPattern(1)}
          >
            →
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={generateEuclidean}
          >
            <Target className="h-3 w-3 mr-1" />
            Euclidean
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={randomizeVelocity}
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Random
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={clearPattern}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 border-b border-border/30 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Steps:</Label>
          {[16, 32, 64].map((count) => (
            <Button
              key={count}
              size="sm"
              variant={numSteps === count ? 'secondary' : 'outline'}
              className="h-6 px-2"
              onClick={() => setNumSteps(count)}
            >
              {count}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-full justify-between"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="text-xs">Advanced Parameters</span>
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {/* Step Grid */}
      <div className="p-3 space-y-3">
        {/* Main Steps */}
        <div className="flex flex-wrap gap-1">
          {steps.slice(0, numSteps).map((step, index) => {
            const isCurrent = currentStep === index && isPlaying;
            const isSelected = selectedStep === index;
            
            return (
              <div key={index} className="relative">
                {/* Step Button */}
                <button
                  className={cn(
                    "relative transition-all",
                    "border-2 rounded",
                    step.active
                      ? isCurrent
                        ? "bg-primary border-primary scale-110 shadow-lg"
                        : "bg-primary/60 border-primary"
                      : "bg-muted/20 border-border/30 hover:border-primary/50",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{
                    width: `${STEP_WIDTH}px`,
                    height: `${STEP_HEIGHT}px`,
                  }}
                  onClick={() => handleStepClick(index)}
                >
                  {/* Step Number */}
                  <span
                    className={cn(
                      "absolute top-1 left-1 text-[9px] font-mono",
                      step.active ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>

                  {/* Parameter Bar */}
                  {step.active && showAdvanced && (
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all"
                      style={{
                        height: `${getParameterValue(step) * 100}%`,
                        backgroundColor: getParameterColor(),
                        opacity: 0.3,
                      }}
                    />
                  )}

                  {/* Probability Indicator */}
                  {step.active && step.probability < 1 && (
                    <div className="absolute top-1 right-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-yellow-400"
                        style={{ opacity: step.probability }}
                      />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Advanced Parameters */}
        {showAdvanced && selectedStep !== null && steps[selectedStep].active && (
          <div className="border border-border/30 rounded-md p-3 space-y-3 bg-muted/10">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-xs">Edit Mode:</Label>
              {(['velocity', 'pan', 'pitch', 'probability'] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={editMode === mode ? 'secondary' : 'outline'}
                  className="h-6 px-2 text-xs"
                  onClick={() => setEditMode(mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              {/* Velocity */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Velocity</span>
                  <span className="text-muted-foreground">
                    {Math.round(steps[selectedStep].velocity * 100)}%
                  </span>
                </Label>
                <Slider
                  value={[steps[selectedStep].velocity]}
                  onValueChange={([v]) => updateStepParameter(selectedStep, 'velocity', v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              {/* Pan */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Pan</span>
                  <span className="text-muted-foreground">
                    {steps[selectedStep].pan === 0
                      ? 'C'
                      : steps[selectedStep].pan < 0
                      ? `L${Math.abs(Math.round(steps[selectedStep].pan * 100))}`
                      : `R${Math.round(steps[selectedStep].pan * 100)}`}
                  </span>
                </Label>
                <Slider
                  value={[steps[selectedStep].pan]}
                  onValueChange={([v]) => updateStepParameter(selectedStep, 'pan', v)}
                  min={-1}
                  max={1}
                  step={0.01}
                />
              </div>

              {/* Pitch */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Pitch</span>
                  <span className="text-muted-foreground">
                    {steps[selectedStep].pitch > 0 ? '+' : ''}
                    {steps[selectedStep].pitch} st
                  </span>
                </Label>
                <Slider
                  value={[steps[selectedStep].pitch]}
                  onValueChange={([v]) =>
                    updateStepParameter(selectedStep, 'pitch', Math.round(v))
                  }
                  min={-12}
                  max={12}
                  step={1}
                />
              </div>

              {/* Probability */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Probability</span>
                  <span className="text-muted-foreground">
                    {Math.round(steps[selectedStep].probability * 100)}%
                  </span>
                </Label>
                <Slider
                  value={[steps[selectedStep].probability]}
                  onValueChange={([v]) => updateStepParameter(selectedStep, 'probability', v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/30 bg-muted/10">
        {steps.slice(0, numSteps).filter((s) => s.active).length} / {numSteps} steps active
        {selectedStep !== null && ` • Step ${selectedStep + 1} selected`}
      </div>
    </div>
  );
};
