import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxEQProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxEQ = ({ onParameterChange }: MixxEQProps) => {
  const [params, setParams] = useState({
    lowGain: 0.5,      // 0-1 (-12 to +12 dB)
    lowFreq: 0.2,      // 0-1 (100-500 Hz)
    midGain: 0.5,      // 0-1 (-12 to +12 dB)
    midFreq: 0.5,      // 0-1 (500-5000 Hz)
    midQ: 0.7,         // 0-1 (Q factor)
    highGain: 0.5,     // 0-1 (-12 to +12 dB)
    highFreq: 0.8,     // 0-1 (5k-20k Hz)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  // Convert 0-1 to -12 to +12 dB for display
  const gainToDb = (gain: number) => (gain - 0.5) * 24;

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Channel EQ</h3>
        <p className="text-xs text-muted-foreground">3-band parametric equalizer with shelving filters</p>
      </div>

      {/* EQ Curve Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Grid lines */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
          
          {/* EQ curve approximation */}
          <path
            d={`M 0,${50 - gainToDb(params.lowGain) * 1.5} 
                Q ${params.lowFreq * 100},${50 - gainToDb(params.lowGain) * 1.5}
                  ${params.midFreq * 100},${50 - gainToDb(params.midGain) * 1.5}
                Q ${params.midFreq * 100},${50 - gainToDb(params.midGain) * 1.5}
                  ${params.highFreq * 100},${50 - gainToDb(params.highGain) * 1.5}
                L 100,${50 - gainToDb(params.highGain) * 1.5}`}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Band markers */}
          {[
            { x: params.lowFreq * 100, y: 50 - gainToDb(params.lowGain) * 1.5, color: 'hsl(var(--chart-1))' },
            { x: params.midFreq * 100, y: 50 - gainToDb(params.midGain) * 1.5, color: 'hsl(var(--chart-2))' },
            { x: params.highFreq * 100, y: 50 - gainToDb(params.highGain) * 1.5, color: 'hsl(var(--chart-3))' },
          ].map((band, i) => (
            <circle key={i} cx={`${band.x}%`} cy={`${band.y}%`} r="5" fill={band.color} opacity="0.8" />
          ))}
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground text-center">LOW</p>
          <RotaryKnob
            value={params.lowGain}
            onChange={(v) => handleChange('lowGain', v)}
            label="Gain"
            unit="dB"
            min={0}
            max={1}
            step={0.01}
            color="hsl(var(--chart-1))"
          />
          <RotaryKnob
            value={params.lowFreq}
            onChange={(v) => handleChange('lowFreq', v)}
            label="Freq"
            unit="Hz"
            min={0}
            max={1}
            step={0.01}
            color="hsl(var(--chart-1))"
          />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground text-center">MID</p>
          <RotaryKnob
            value={params.midGain}
            onChange={(v) => handleChange('midGain', v)}
            label="Gain"
            unit="dB"
            min={0}
            max={1}
            step={0.01}
            color="hsl(var(--chart-2))"
          />
          <RotaryKnob
            value={params.midFreq}
            onChange={(v) => handleChange('midFreq', v)}
            label="Freq"
            unit="Hz"
            min={0}
            max={1}
            step={0.01}
            color="hsl(var(--chart-2))"
          />
          <RotaryKnob
            value={params.midQ}
            onChange={(v) => handleChange('midQ', v)}
            label="Q"
            unit=""
            min={0}
            max={1}
            step={0.01}
            color="hsl(var(--chart-2))"
          />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground text-center">HIGH</p>
          <RotaryKnob
            value={params.highGain}
            onChange={(v) => handleChange('highGain', v)}
            label="Gain"
            unit="dB"
            min={0}
            max={1}
            step={0.01}
            color="hsl(var(--chart-3))"
          />
          <RotaryKnob
            value={params.highFreq}
            onChange={(v) => handleChange('highFreq', v)}
            label="Freq"
            unit="Hz"
            min={0}
            max={1}
            step={0.01}
            color="hsl(var(--chart-3))"
          />
        </div>
      </div>
    </div>
  );
};
