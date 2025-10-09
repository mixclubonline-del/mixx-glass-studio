import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxLimiterProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxLimiter = ({ onParameterChange }: MixxLimiterProps) => {
  const [params, setParams] = useState({
    threshold: 0.95,  // 0-1 (-12 to 0 dB)
    ceiling: 0.98,    // 0-1 (-1 to 0 dB)
    release: 0.5,     // 0-1 (auto to 1s)
    gain: 0.5,        // 0-1 (0 to +12 dB input)
    mode: 0.5,        // 0-1 (transparent to aggressive)
    link: 1,          // 0-1 (stereo link)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Maximizer</h3>
        <p className="text-xs text-muted-foreground">True peak limiter for mastering and final output</p>
      </div>

      {/* Limiting Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Ceiling line */}
          <line
            x1="0"
            y1={`${(1 - params.ceiling) * 100}%`}
            x2="100%"
            y2={`${(1 - params.ceiling) * 100}%`}
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          
          {/* Threshold line */}
          <line
            x1="0"
            y1={`${(1 - params.threshold) * 100}%`}
            x2="100%"
            y2={`${(1 - params.threshold) * 100}%`}
            stroke="hsl(var(--warning))"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          
          {/* Input signal (before limiting) */}
          <path
            d={Array.from({ length: 50 }, (_, i) => {
              const x = i * 2;
              const amplitude = Math.random() * (0.3 + params.gain * 0.7);
              const y = (1 - amplitude) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          
          {/* Output signal (after limiting) */}
          <path
            d={Array.from({ length: 50 }, (_, i) => {
              const x = i * 2;
              const inputLevel = Math.random() * (0.3 + params.gain * 0.7);
              const limited = Math.min(inputLevel, params.ceiling);
              const y = (1 - limited) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
        </svg>
        
        {/* Meters */}
        <div className="absolute bottom-2 left-2 space-y-1 text-xs font-mono">
          <div>
            <span className="text-muted-foreground">PEAK: </span>
            <span className="text-primary">-0.1 dB</span>
          </div>
          <div>
            <span className="text-muted-foreground">GR: </span>
            <span className="text-destructive">-2.3 dB</span>
          </div>
        </div>
        
        {/* True Peak label */}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-bold text-primary">TRUE PEAK</span>
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
          value={params.ceiling}
          onChange={(v) => handleChange('ceiling', v)}
          label="Ceiling"
          unit="dB"
          min={0}
          max={1}
          step={0.001}
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
          value={params.gain}
          onChange={(v) => handleChange('gain', v)}
          label="Gain"
          unit="dB"
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
          value={params.link}
          onChange={(v) => handleChange('link', v)}
          label="Stereo Link"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
};
