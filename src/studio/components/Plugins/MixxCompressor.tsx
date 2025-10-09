import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxCompressorProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxCompressor = ({ onParameterChange }: MixxCompressorProps) => {
  const [params, setParams] = useState({
    threshold: 0.7,   // 0-1 (-60 to 0 dB)
    ratio: 0.25,      // 0-1 (1:1 to 20:1)
    attack: 0.3,      // 0-1 (0.1ms to 100ms)
    release: 0.5,     // 0-1 (10ms to 1s)
    knee: 0.3,        // 0-1 (hard to soft)
    makeup: 0.5,      // 0-1 (0 to +24 dB)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const thresholdDb = (params.threshold - 1) * 60;
  const ratioValue = 1 + params.ratio * 19;

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Dynamics Processor</h3>
        <p className="text-xs text-muted-foreground">Professional compressor with adaptive response</p>
      </div>

      {/* Compression Curve Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Grid */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
          
          {/* Threshold line */}
          <line
            x1={`${params.threshold * 100}%`}
            y1="0"
            x2={`${params.threshold * 100}%`}
            y2="100%"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          
          {/* Compression curve */}
          <path
            d={`M 0,100 L ${params.threshold * 100},${100 - params.threshold * 100}
                Q ${params.threshold * 100 + params.knee * 20},${100 - params.threshold * 100 - params.knee * 10}
                  ${params.threshold * 100 + 30},${100 - (params.threshold * 100 + 30 / ratioValue)}
                L 100,${100 - (100 - (1 - params.threshold) * 100) / ratioValue - params.threshold * 100}`}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* 1:1 reference line */}
          <line x1="0" y1="100%" x2="100%" y2="0%" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" strokeDasharray="2 2" />
        </svg>
        
        {/* GR Meter */}
        <div className="absolute bottom-2 right-2 text-xs">
          <span className="text-muted-foreground">GR: </span>
          <span className="text-primary font-mono">0.0 dB</span>
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
          value={params.ratio}
          onChange={(v) => handleChange('ratio', v)}
          label="Ratio"
          unit=":1"
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
          value={params.release}
          onChange={(v) => handleChange('release', v)}
          label="Release"
          unit="ms"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.knee}
          onChange={(v) => handleChange('knee', v)}
          label="Knee"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.makeup}
          onChange={(v) => handleChange('makeup', v)}
          label="Makeup"
          unit="dB"
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
};
