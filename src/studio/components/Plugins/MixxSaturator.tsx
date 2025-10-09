import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxSaturatorProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxSaturator = ({ onParameterChange }: MixxSaturatorProps) => {
  const [params, setParams] = useState({
    drive: 0.3,       // 0-1 (amount of saturation)
    type: 0.33,       // 0-1 (tube, tape, digital)
    tone: 0.5,        // 0-1 (dark to bright)
    mix: 0.5,         // 0-1 (dry/wet)
    output: 0.5,      // 0-1 (output gain)
    harmonics: 0.5,   // 0-1 (harmonic content)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const getTypeLabel = () => {
    if (params.type < 0.33) return 'TUBE';
    if (params.type < 0.66) return 'TAPE';
    return 'DIGITAL';
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Color Box</h3>
        <p className="text-xs text-muted-foreground">Analog-style saturation and harmonic enhancement</p>
      </div>

      {/* Waveform Distortion Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Clean sine wave */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const y = 50 + Math.sin((i / 100) * Math.PI * 4) * 20;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          
          {/* Saturated wave */}
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = i;
              const cleanY = Math.sin((i / 100) * Math.PI * 4);
              const saturatedY = Math.tanh(cleanY * (1 + params.drive * 5));
              const harmonicY = saturatedY + Math.sin((i / 100) * Math.PI * 8) * params.harmonics * 0.2;
              const y = 50 + harmonicY * 20;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ')}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
        </svg>
        
        {/* Type indicator */}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-mono font-bold text-primary">{getTypeLabel()}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.drive}
          onChange={(v) => handleChange('drive', v)}
          label="Drive"
          unit=""
          min={0}
          max={1}
          step={0.01}
          color="hsl(var(--destructive))"
        />
        <RotaryKnob
          value={params.type}
          onChange={(v) => handleChange('type', v)}
          label="Type"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.tone}
          onChange={(v) => handleChange('tone', v)}
          label="Tone"
          unit=""
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
