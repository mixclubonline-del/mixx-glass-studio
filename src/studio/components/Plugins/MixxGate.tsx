import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxGateProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxGate = ({ onParameterChange }: MixxGateProps) => {
  const [params, setParams] = useState({
    threshold: 0.3,   // 0-1 (-60 to 0 dB)
    range: 0.5,       // 0-1 (0 to -60 dB reduction)
    attack: 0.2,      // 0-1 (0.1ms to 100ms)
    hold: 0.3,        // 0-1 (0 to 1000ms)
    release: 0.4,     // 0-1 (10ms to 2s)
    ratio: 0.2,       // 0-1 (expander ratio)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Gate/Expander</h3>
        <p className="text-xs text-muted-foreground">Noise gate with expander mode for clean recordings</p>
      </div>

      {/* Gate Activity Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Threshold line */}
          <line
            x1="0"
            y1={`${params.threshold * 100}%`}
            x2="100%"
            y2={`${params.threshold * 100}%`}
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          
          {/* Input signal */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const envelope = Math.sin((i / 100) * Math.PI) * 0.8;
              const y = (1 - envelope) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          
          {/* Gated output */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const envelope = Math.sin((i / 100) * Math.PI) * 0.8;
              const gated = envelope > params.threshold ? envelope : envelope * (1 - params.range);
              const y = (1 - gated) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Gate state indicators */}
          <rect
            x="10%"
            y="5%"
            width="8"
            height="8"
            fill={params.threshold > 0.4 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            opacity="0.8"
          />
        </svg>
        
        {/* State display */}
        <div className="absolute top-2 left-2 text-xs font-mono">
          <span className="text-muted-foreground">STATE: </span>
          <span className="text-primary font-bold">OPEN</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.threshold}
          onChange={(v) => handleChange('threshold', v)}
          label="Threshold"
          unit="dB"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.range}
          onChange={(v) => handleChange('range', v)}
          label="Range"
          unit="dB"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.attack}
          onChange={(v) => handleChange('attack', v)}
          label="Attack"
          unit="ms"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.hold}
          onChange={(v) => handleChange('hold', v)}
          label="Hold"
          unit="ms"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.release}
          onChange={(v) => handleChange('release', v)}
          label="Release"
          unit="ms"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.ratio}
          onChange={(v) => handleChange('ratio', v)}
          label="Ratio"
          unit=":1"
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
};
