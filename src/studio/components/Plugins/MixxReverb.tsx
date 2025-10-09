/**
 * MixxReverb - "Atmos Designer" reverb plugin
 */

import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxReverbProps {
  onParameterChange?: (param: string, value: number) => void;
}

export function MixxReverb({ onParameterChange }: MixxReverbProps) {
  const [params, setParams] = useState({
    mix: 0.3,
    decay: 0.5,
    preDelay: 0.2,
    size: 0.6,
    damping: 0.4,
    diffusion: 0.7,
  });
  
  const handleChange = (param: string, value: number) => {
    setParams(prev => ({ ...prev, [param]: value }));
    onParameterChange?.(param, value);
  };
  
  return (
    <div className="space-y-6">
      {/* Impulse response visualization */}
      <div className="h-24 rounded-lg bg-secondary/30 border border-border p-3">
        <svg className="w-full h-full" viewBox="0 0 300 60">
          <defs>
            <linearGradient id="reverbGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--neon-blue))" stopOpacity="0.8" />
              <stop offset="30%" stopColor="hsl(var(--prime-500))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--neon-pink))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {/* Early reflections */}
          {Array.from({ length: 20 }).map((_, i) => {
            const x = (i / 20) * 100;
            const height = Math.random() * 40 * (params.size + 0.2);
            return (
              <rect
                key={`early-${i}`}
                x={x}
                y={30 - height / 2}
                width="2"
                height={height}
                fill="url(#reverbGradient)"
              />
            );
          })}
          
          {/* Tail */}
          <path
            d={`M 100 30 ${Array.from({ length: 50 }).map((_, i) => {
              const x = 100 + (i / 50) * 200;
              const decay = Math.exp(-i * params.decay * 0.1);
              const noise = (Math.random() - 0.5) * 20 * decay;
              return `L ${x} ${30 + noise}`;
            }).join(' ')}`}
            stroke="url(#reverbGradient)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
        
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Early</span>
          <span>Tail</span>
        </div>
      </div>
      
      {/* Knobs */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          label="Mix"
          value={params.mix}
          onChange={(v) => handleChange('mix', v)}
          unit="%"
          max={100}
          color="hsl(var(--neon-blue))"
        />
        <RotaryKnob
          label="Decay"
          value={params.decay}
          onChange={(v) => handleChange('decay', v)}
          unit="s"
          max={10}
          color="hsl(var(--prime-500))"
        />
        <RotaryKnob
          label="Pre-Delay"
          value={params.preDelay}
          onChange={(v) => handleChange('preDelay', v)}
          unit="ms"
          max={200}
          color="hsl(var(--neon-pink))"
        />
        <RotaryKnob
          label="Size"
          value={params.size}
          onChange={(v) => handleChange('size', v)}
          unit="%"
          max={100}
          color="hsl(var(--neon-blue))"
        />
        <RotaryKnob
          label="Damping"
          value={params.damping}
          onChange={(v) => handleChange('damping', v)}
          unit="%"
          max={100}
          color="hsl(var(--prime-500))"
        />
        <RotaryKnob
          label="Diffusion"
          value={params.diffusion}
          onChange={(v) => handleChange('diffusion', v)}
          unit="%"
          max={100}
          color="hsl(var(--neon-pink))"
        />
      </div>
    </div>
  );
}
