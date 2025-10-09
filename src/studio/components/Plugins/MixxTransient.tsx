import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxTransientProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxTransient = ({ onParameterChange }: MixxTransientProps) => {
  const [params, setParams] = useState({
    attack: 0.5,      // 0-1 (-12 to +12 dB)
    sustain: 0.5,     // 0-1 (-12 to +12 dB)
    speed: 0.5,       // 0-1 (envelope speed)
    highEmphasis: 0.3,// 0-1 (high freq focus)
    clipGuard: 0.8,   // 0-1 (soft clipping)
    output: 0.5,      // 0-1 (output gain)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const attackDb = (params.attack - 0.5) * 24;
  const sustainDb = (params.sustain - 0.5) * 24;

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Transient Designer</h3>
        <p className="text-xs text-muted-foreground">Shape attack and sustain independently</p>
      </div>

      {/* Transient Shaping Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Original envelope */}
          <path
            d={`M 0,100 
                L 10,90 
                L 20,${100 - 70} 
                L 30,${100 - 60}
                L 50,${100 - 40}
                L 70,${100 - 20}
                L 100,100`}
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          
          {/* Processed envelope */}
          <path
            d={`M 0,100 
                L ${10 / (1 + (1 - params.speed) * 0.5)},90 
                L ${20 / (1 + (1 - params.speed) * 0.5)},${100 - 70 * (1 + (params.attack - 0.5) * 1.5)} 
                L 30,${100 - 60 * (1 + (params.attack - 0.5) * 0.8)}
                L 50,${100 - 40 * (1 + (params.sustain - 0.5) * 1.5)}
                L 70,${100 - 20 * (1 + (params.sustain - 0.5) * 1.5)}
                L 100,100`}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Attack/Sustain regions */}
          <rect x="0" y="0" width="30" height="100" fill="hsl(var(--chart-1))" opacity="0.1" />
          <rect x="30" y="0" width="70" height="100" fill="hsl(var(--chart-2))" opacity="0.1" />
          
          {/* Labels */}
          <text x="15" y="15" fill="hsl(var(--chart-1))" fontSize="10" opacity="0.7" textAnchor="middle">
            ATTACK
          </text>
          <text x="65" y="15" fill="hsl(var(--chart-2))" fontSize="10" opacity="0.7" textAnchor="middle">
            SUSTAIN
          </text>
        </svg>
        
        {/* Gain display */}
        <div className="absolute bottom-2 left-2 space-y-1 text-xs font-mono">
          <div>
            <span className="text-chart-1">ATK: {attackDb > 0 ? '+' : ''}{attackDb.toFixed(1)} dB</span>
          </div>
          <div>
            <span className="text-chart-2">SUS: {sustainDb > 0 ? '+' : ''}{sustainDb.toFixed(1)} dB</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.attack}
          onChange={(v) => handleChange('attack', v)}
          label="Attack"
          unit="dB"
          min={0}
          max={1}
          step={0.01}
          color="hsl(var(--chart-1))"
        />
        <RotaryKnob
          value={params.sustain}
          onChange={(v) => handleChange('sustain', v)}
          label="Sustain"
          unit="dB"
          min={0}
          max={1}
          step={0.01}
          color="hsl(var(--chart-2))"
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
          value={params.highEmphasis}
          onChange={(v) => handleChange('highEmphasis', v)}
          label="Hi Emphasis"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.clipGuard}
          onChange={(v) => handleChange('clipGuard', v)}
          label="Clip Guard"
          unit=""
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
