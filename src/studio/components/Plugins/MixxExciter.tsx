import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxExciterProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxExciter = ({ onParameterChange }: MixxExciterProps) => {
  const [params, setParams] = useState({
    amount: 0.4,      // 0-1 (exciter intensity)
    frequency: 0.6,   // 0-1 (center frequency)
    harmonics: 0.5,   // 0-1 (even/odd harmonics)
    mix: 0.5,         // 0-1 (dry/wet)
    mode: 0.5,        // 0-1 (retro/modern/air)
    output: 0.5,      // 0-1 (output level)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const getModeLabel = () => {
    if (params.mode < 0.33) return 'RETRO';
    if (params.mode < 0.66) return 'MODERN';
    return 'AIR';
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Harmonic Exciter</h3>
        <p className="text-xs text-muted-foreground">Add brightness and presence with harmonic generation</p>
      </div>

      {/* Harmonic Content Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Fundamental + harmonics */}
          {Array.from({ length: 8 }, (_, i) => {
            const harmonic = i + 1;
            const x = (params.frequency * 30) + (harmonic - 1) * 10;
            const amplitude = 80 - (harmonic - 1) * 10;
            const harmonicLevel = params.amount * (1 - harmonic * 0.1);
            const height = amplitude * harmonicLevel;
            
            // Even/odd harmonic emphasis
            const isEven = harmonic % 2 === 0;
            const emphasis = isEven ? params.harmonics : (1 - params.harmonics);
            const finalHeight = height * (0.3 + emphasis * 0.7);
            
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1="100%"
                  x2={x}
                  y2={`${100 - finalHeight}%`}
                  stroke={harmonic === 1 ? 'hsl(var(--primary))' : `hsl(${40 + i * 20}, 70%, 60%)`}
                  strokeWidth={harmonic === 1 ? '4' : '3'}
                  opacity={0.8 - i * 0.08}
                />
                <circle
                  cx={x}
                  cy={`${100 - finalHeight}%`}
                  r="3"
                  fill={harmonic === 1 ? 'hsl(var(--primary))' : `hsl(${40 + i * 20}, 70%, 60%)`}
                />
              </g>
            );
          })}
          
          {/* Frequency labels */}
          <text x="5" y="95" fill="hsl(var(--muted-foreground))" fontSize="8" opacity="0.5">
            Low
          </text>
          <text x="90" y="95" fill="hsl(var(--muted-foreground))" fontSize="8" opacity="0.5">
            High
          </text>
        </svg>
        
        {/* Mode indicator */}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-mono font-bold text-primary">{getModeLabel()}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.amount}
          onChange={(v) => handleChange('amount', v)}
          label="Amount"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.frequency}
          onChange={(v) => handleChange('frequency', v)}
          label="Frequency"
          unit="kHz"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.harmonics}
          onChange={(v) => handleChange('harmonics', v)}
          label="Harmonics"
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
          value={params.mix}
          onChange={(v) => handleChange('mix', v)}
          label="Mix"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.output}
          onChange={(v) => handleChange('output', v)}
          label="Output"
          unit="dB"
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
};
