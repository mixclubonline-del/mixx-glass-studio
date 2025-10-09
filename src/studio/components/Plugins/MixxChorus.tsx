import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxChorusProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxChorus = ({ onParameterChange }: MixxChorusProps) => {
  const [params, setParams] = useState({
    rate: 0.3,        // 0-1 (LFO rate)
    depth: 0.5,       // 0-1 (modulation depth)
    feedback: 0.2,    // 0-1 (feedback amount)
    mix: 0.5,         // 0-1 (dry/wet)
    voices: 0.33,     // 0-1 (2-4 voices)
    stereo: 0.7,      // 0-1 (stereo width)
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  const numVoices = Math.floor(2 + params.voices * 2);

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Dimension</h3>
        <p className="text-xs text-muted-foreground">Multi-voice chorus with stereo imaging</p>
      </div>

      {/* LFO Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Center line */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
          
          {/* Multiple LFO waves for voices */}
          {Array.from({ length: numVoices }, (_, voiceIndex) => {
            const phaseOffset = (voiceIndex / numVoices) * Math.PI * 2;
            const stereoSpread = (voiceIndex / numVoices - 0.5) * params.stereo;
            return (
              <path
                key={voiceIndex}
                d={Array.from({ length: 100 }, (_, i) => {
                  const x = i;
                  const phase = (i / 100) * Math.PI * 2 * (1 + params.rate * 4) + phaseOffset;
                  const y = 50 + Math.sin(phase) * params.depth * 30 + stereoSpread * 20;
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                stroke={`hsl(${200 + voiceIndex * 40}, 70%, 60%)`}
                strokeWidth="2"
                fill="none"
                opacity={0.7}
              />
            );
          })}
          
          {/* Voice indicators */}
          {Array.from({ length: numVoices }, (_, i) => (
            <circle
              key={i}
              cx={`${(i / (numVoices - 1)) * 100}%`}
              cy="50%"
              r="4"
              fill={`hsl(${200 + i * 40}, 70%, 60%)`}
              opacity="0.8"
            />
          ))}
        </svg>
        
        {/* Voice count */}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-mono text-muted-foreground">Voices: </span>
          <span className="text-xs font-mono font-bold text-primary">{numVoices}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6">
        <RotaryKnob
          value={params.rate}
          onChange={(v) => handleChange('rate', v)}
          label="Rate"
          unit="Hz"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.depth}
          onChange={(v) => handleChange('depth', v)}
          label="Depth"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.feedback}
          onChange={(v) => handleChange('feedback', v)}
          label="Feedback"
          unit="%"
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.voices}
          onChange={(v) => handleChange('voices', v)}
          label="Voices"
          unit=""
          min={0}
          max={1}
          step={0.01}
        />
        <RotaryKnob
          value={params.stereo}
          onChange={(v) => handleChange('stereo', v)}
          label="Stereo"
          unit="%"
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
      </div>
    </div>
  );
};
