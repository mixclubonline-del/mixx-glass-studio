import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxFlangerProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxFlanger = ({ onParameterChange }: MixxFlangerProps) => {
  const [params, setParams] = useState({
    rate: 0.3,        // 0-1 (LFO rate)
    depth: 0.5,       // 0-1 (delay time modulation)
    feedback: 0.4,    // 0-1 (feedback amount)
    delay: 0.2,       // 0-1 (base delay time)
    mix: 0.5,         // 0-1 (dry/wet)
    invert: 0,        // 0-1 (phase invert)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Jet Flanger</h3>
        <p className="text-xs text-muted-foreground">Classic flanging effect with feedback control</p>
      </div>

      {/* Flanger Comb Filter Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Comb filter notches */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const lfoPhase = (i / 100) * Math.PI * 3 * (1 + params.rate);
              const delayMod = params.delay + Math.sin(lfoPhase) * params.depth * 0.3;
              const combFreq = 8 + delayMod * 20;
              const combPhase = (i / 100) * Math.PI * combFreq;
              const amplitude = 50 + Math.cos(combPhase) * 30 * (1 + params.feedback * 0.5);
              return `${i === 0 ? 'M' : 'L'} ${x},${amplitude}`;
            }).join(' ')}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* LFO wave */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const phase = (i / 100) * Math.PI * 3 * (1 + params.rate);
              const y = 80 + Math.sin(phase) * params.depth * 15;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--chart-2))"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
            strokeDasharray="3 3"
          />
        </svg>
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
          value={params.delay}
          onChange={(v) => handleChange('delay', v)}
          label="Delay"
          unit="ms"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.invert}
          onChange={(v) => handleChange('invert', v)}
          label="Invert"
          unit=""
          min={0}
          max={1}
          step={1}
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
