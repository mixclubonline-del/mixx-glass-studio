import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxPhaserProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxPhaser = ({ onParameterChange }: MixxPhaserProps) => {
  const [params, setParams] = useState({
    rate: 0.4,        // 0-1 (LFO rate)
    depth: 0.6,       // 0-1 (modulation depth)
    feedback: 0.3,    // 0-1 (feedback amount)
    stages: 0.5,      // 0-1 (4-12 stages)
    mix: 0.5,         // 0-1 (dry/wet)
    stereo: 0.5,      // 0-1 (stereo phase offset)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const numStages = Math.floor(4 + params.stages * 8);

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Phase Shifter</h3>
        <p className="text-xs text-muted-foreground">Vintage phaser with multi-stage filtering</p>
      </div>

      {/* Phaser Sweep Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Frequency sweep visualization */}
          {Array.from({ length: numStages }, (_, stage) => {
            const stageOffset = (stage / numStages) * 20;
            return (
              <path
                key={stage}
                d={Array.from({ length: 100 }, (_, i) => {
                  const x = i;
                  const phase = (i / 100) * Math.PI * 4 * (1 + params.rate);
                  const notchPos = 50 + Math.sin(phase + stageOffset) * params.depth * 40;
                  return `${i === 0 ? 'M' : 'L'} ${x},${notchPos}`;
                }).join(' ')}
                stroke={`hsl(${280 - stage * 10}, 70%, 60%)`}
                strokeWidth="2"
                fill="none"
                opacity={0.6 - stage * 0.05}
              />
            );
          })}
          
          {/* Center reference line */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" />
        </svg>
        
        {/* Stage count */}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-mono text-muted-foreground">Stages: </span>
          <span className="text-xs font-mono font-bold text-primary">{numStages}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.rate}
          onChange={(v) => handleChange('rate', v)}
          label="Rate"
          unit="Hz"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.depth}
          onChange={(v) => handleChange('depth', v)}
          label="Depth"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.feedback}
          onChange={(v) => handleChange('feedback', v)}
          label="Feedback"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.stages}
          onChange={(v) => handleChange('stages', v)}
          label="Stages"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.stereo}
          onChange={(v) => handleChange('stereo', v)}
          label="Stereo"
          unit="%"
          min={0}
          max={1}
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
      </div>
    </div>
  );
};
