import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxDelayProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxDelay = ({ onParameterChange }: MixxDelayProps) => {
  const [params, setParams] = useState({
    time: 0.5,      // 0-2 seconds
    feedback: 0.3,  // 0-0.95
    mix: 0.3,       // 0-1
    lowCut: 0.2,    // 0-1 (filter)
    highCut: 0.8,   // 0-1 (filter)
    sync: 0,        // 0=off, 1=on
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Echo Designer</h3>
        <p className="text-xs text-muted-foreground">Stereo delay with filtering and tempo sync</p>
      </div>

      {/* Visualization */}
      <div className="mb-8 h-32 bg-black/20 rounded-lg border border-primary/20 p-4">
        <svg width="100%" height="100%" className="opacity-60">
          {/* Delay taps visualization */}
          {[0, 1, 2, 3, 4].map((i) => {
            const x = (i / 4) * 100;
            const height = Math.pow(params.feedback, i) * 80;
            return (
              <g key={i}>
                <line
                  x1={`${x}%`}
                  y1="100%"
                  x2={`${x}%`}
                  y2={`${100 - height}%`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  opacity={0.7 - i * 0.1}
                />
                <circle
                  cx={`${x}%`}
                  cy={`${100 - height}%`}
                  r="4"
                  fill="hsl(var(--primary))"
                  opacity={0.9 - i * 0.15}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.time}
          onChange={(v) => handleChange('time', v)}
          label="Time"
          unit="s"
          min={0}
          max={2}
          step={0.01}
        />
        <RotaryKnob
          value={params.feedback}
          onChange={(v) => handleChange('feedback', v)}
          label="Feedback"
          unit="%"
          min={0}
          max={0.95}
          step={0.01}
        />
        <RotaryKnob
          value={params.mix}
          onChange={(v) => handleChange('mix', v)}
          label="Mix"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.lowCut}
          onChange={(v) => handleChange('lowCut', v)}
          label="Low Cut"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.highCut}
          onChange={(v) => handleChange('highCut', v)}
          label="High Cut"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.sync}
          onChange={(v) => handleChange('sync', v)}
          label="Sync"
          unit=""
          min={0}
          max={1}
          step={1}
        />
      </div>
    </div>
  );
};
