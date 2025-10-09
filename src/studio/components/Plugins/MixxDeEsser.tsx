import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxDeEsserProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxDeEsser = ({ onParameterChange }: MixxDeEsserProps) => {
  const [params, setParams] = useState({
    threshold: 0.6,   // 0-1 (detection threshold)
    frequency: 0.75,  // 0-1 (target frequency)
    range: 0.5,       // 0-1 (processing range)
    speed: 0.5,       // 0-1 (attack/release)
    mode: 0.5,        // 0-1 (wide/split)
    amount: 0.5,      // 0-1 (reduction amount)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const freqHz = 3000 + params.frequency * 12000;
  const modeLabel = params.mode < 0.5 ? 'WIDE' : 'SPLIT';

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">De-Esser</h3>
        <p className="text-xs text-muted-foreground">Intelligent sibilance reduction for vocals</p>
      </div>

      {/* Frequency Response & Activity Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Full spectrum */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const y = 50;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          
          {/* Target frequency band with reduction */}
          <ellipse
            cx={`${params.frequency * 100}%`}
            cy="50%"
            rx={`${params.range * 15}%`}
            ry="30%"
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
            opacity="0.6"
          />
          
          {/* Reduction notch */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const centerX = params.frequency * 100;
              const distance = Math.abs(i - centerX);
              const inRange = distance < params.range * 15;
              const reduction = inRange ? params.amount * 30 * (1 - distance / (params.range * 15)) : 0;
              const y = 50 + (i > params.threshold * 100 ? reduction : 0);
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Threshold line */}
          <line
            x1="0"
            y1={`${params.threshold * 100}%`}
            x2="100%"
            y2={`${params.threshold * 100}%`}
            stroke="hsl(var(--warning))"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          
          {/* Sibilance detection indicator */}
          <circle
            cx={`${params.frequency * 100}%`}
            cy="20%"
            r="6"
            fill="hsl(var(--destructive))"
            opacity={params.amount > 0.3 ? '0.8' : '0.2'}
          >
            <animate
              attributeName="opacity"
              values="0.8;0.3;0.8"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        
        {/* Info display */}
        <div className="absolute top-2 left-2 space-y-1 text-xs font-mono">
          <div>
            <span className="text-muted-foreground">FREQ: </span>
            <span className="text-primary">{freqHz.toFixed(0)} Hz</span>
          </div>
          <div>
            <span className="text-muted-foreground">GR: </span>
            <span className="text-destructive">-{(params.amount * 12).toFixed(1)} dB</span>
          </div>
        </div>
        
        {/* Mode indicator */}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-mono font-bold text-primary">{modeLabel}</span>
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
          value={params.frequency}
          onChange={(v) => handleChange('frequency', v)}
          label="Frequency"
          unit="Hz"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.range}
          onChange={(v) => handleChange('range', v)}
          label="Range"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.speed}
          onChange={(v) => handleChange('speed', v)}
          label="Speed"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.mode}
          onChange={(v) => handleChange('mode', v)}
          label="Mode"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.amount}
          onChange={(v) => handleChange('amount', v)}
          label="Amount"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
};
