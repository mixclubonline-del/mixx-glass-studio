import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxStereoImagerProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxStereoImager = ({ onParameterChange }: MixxStereoImagerProps) => {
  const [params, setParams] = useState({
    width: 0.5,       // 0-1 (0% to 200% width)
    mono: 0.5,        // 0-1 (low freq mono fold)
    balance: 0.5,     // 0-1 (L/R balance)
    rotation: 0.5,    // 0-1 (stereo rotation)
    lowWidth: 0.3,    // 0-1 (independent low freq width)
    highWidth: 0.7,   // 0-1 (independent high freq width)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const widthPercent = params.width * 200;
  const rotation = (params.rotation - 0.5) * 180;

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Stereo Imager</h3>
        <p className="text-xs text-muted-foreground">Advanced stereo width and spatial control</p>
      </div>

      {/* Stereo Field Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" viewBox="0 0 200 100" className="opacity-70">
          {/* Center mono reference */}
          <line x1="100" y1="0" x2="100" y2="100" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
          <circle cx="100" cy="50" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" />
          
          {/* Stereo field ellipse */}
          <ellipse
            cx="100"
            cy="50"
            rx={20 + params.width * 60}
            ry={20}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            opacity="0.6"
            transform={`rotate(${rotation} 100 50)`}
          />
          
          {/* L/R indicators with balance offset */}
          <circle
            cx={100 - (40 + params.width * 40) * (1 - params.balance)}
            cy="50"
            r="6"
            fill="hsl(var(--chart-1))"
            opacity="0.8"
          />
          <circle
            cx={100 + (40 + params.width * 40) * params.balance}
            cy="50"
            r="6"
            fill="hsl(var(--chart-3))"
            opacity="0.8"
          />
          
          {/* Frequency-dependent width visualization */}
          <ellipse
            cx="100"
            cy="70"
            rx={20 + params.lowWidth * 40}
            ry="8"
            fill="hsl(var(--chart-2))"
            opacity="0.3"
          />
          <ellipse
            cx="100"
            cy="30"
            rx={20 + params.highWidth * 60}
            ry="8"
            fill="hsl(var(--chart-4))"
            opacity="0.3"
          />
        </svg>
        
        {/* Width display */}
        <div className="absolute bottom-2 right-2 text-xs font-mono">
          <span className="text-muted-foreground">WIDTH: </span>
          <span className="text-primary font-bold">{widthPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.width}
          onChange={(v) => handleChange('width', v)}
          label="Width"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.mono}
          onChange={(v) => handleChange('mono', v)}
          label="Mono Low"
          unit="Hz"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.balance}
          onChange={(v) => handleChange('balance', v)}
          label="Balance"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.rotation}
          onChange={(v) => handleChange('rotation', v)}
          label="Rotation"
          unit="°"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.lowWidth}
          onChange={(v) => handleChange('lowWidth', v)}
          label="Low Width"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.highWidth}
          onChange={(v) => handleChange('highWidth', v)}
          label="High Width"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
};
