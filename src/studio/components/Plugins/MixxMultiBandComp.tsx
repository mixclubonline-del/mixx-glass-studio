import { useState } from 'react';
import { RotaryKnob } from './RotaryKnob';

interface MixxMultiBandCompProps {
  onParameterChange?: (params: Record<string, number>) => void;
}

export const MixxMultiBandComp = ({ onParameterChange }: MixxMultiBandCompProps) => {
  const [params, setParams] = useState({
    lowThreshold: 0.6,   // 0-1
    lowRatio: 0.3,       // 0-1
    midThreshold: 0.6,   // 0-1
    midRatio: 0.3,       // 0-1
    highThreshold: 0.6,  // 0-1
    highRatio: 0.3,      // 0-1
    attack: 0.3,         // 0-1 (global)
    release: 0.5,        // 0-1 (global)
    crossover1: 0.2,     // 0-1 (low-mid)
    crossover2: 0.8,     // 0-1 (mid-high)
    lowGain: 0.5,        // 0-1
    midGain: 0.5,        // 0-1
    highGain: 0.5,       // 0-1
    output: 0.5,         // 0-1
  });

  const handleChange = (param: string, value: number) => {
    const newParams = { ...params, [param]: value };
    setParams(newParams);
    onParameterChange?.(newParams);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Multiband Dynamics</h3>
        <p className="text-xs text-muted-foreground">3-band compressor for mastering and bus processing</p>
      </div>

      {/* Frequency Bands Visualization */}
      <div className="mb-8 h-40 bg-black/20 rounded-lg border border-primary/20 p-4 relative">
        <svg width="100%" height="100%" className="opacity-70">
          {/* Frequency bands */}
          <rect
            x="0"
            y="0"
            width={`${params.crossover1 * 100}%`}
            height="100%"
            fill="hsl(var(--chart-1))"
            opacity="0.2"
          />
          <rect
            x={`${params.crossover1 * 100}%`}
            y="0"
            width={`${(params.crossover2 - params.crossover1) * 100}%`}
            height="100%"
            fill="hsl(var(--chart-2))"
            opacity="0.2"
          />
          <rect
            x={`${params.crossover2 * 100}%`}
            y="0"
            width={`${(1 - params.crossover2) * 100}%`}
            height="100%"
            fill="hsl(var(--chart-3))"
            opacity="0.2"
          />
          
          {/* Crossover lines */}
          <line
            x1={`${params.crossover1 * 100}%`}
            y1="0"
            x2={`${params.crossover1 * 100}%`}
            y2="100%"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <line
            x1={`${params.crossover2 * 100}%`}
            y1="0"
            x2={`${params.crossover2 * 100}%`}
            y2="100%"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          
          {/* Compression activity per band */}
          {[
            { x: params.crossover1 * 50, threshold: params.lowThreshold, color: 'hsl(var(--chart-1))' },
            { x: params.crossover1 * 100 + (params.crossover2 - params.crossover1) * 50, threshold: params.midThreshold, color: 'hsl(var(--chart-2))' },
            { x: params.crossover2 * 100 + (1 - params.crossover2) * 50, threshold: params.highThreshold, color: 'hsl(var(--chart-3))' },
          ].map((band, i) => (
            <g key={i}>
              <line
                x1={band.x}
                y1={band.threshold * 100}
                x2={band.x}
                y2="100%"
                stroke={band.color}
                strokeWidth="4"
                opacity="0.6"
              />
              <circle cx={band.x} cy={band.threshold * 100} r="4" fill={band.color} />
            </g>
          ))}
        </svg>
        
        {/* GR meters */}
        <div className="absolute top-2 left-2 space-y-1 text-xs font-mono">
          <div><span className="text-chart-1">LOW GR: -1.2 dB</span></div>
          <div><span className="text-chart-2">MID GR: -2.8 dB</span></div>
          <div><span className="text-chart-3">HIGH GR: -0.5 dB</span></div>
        </div>
      </div>

      {/* Band Controls */}
      <div className="space-y-6">
        {/* Low Band */}
        <div>
          <p className="text-xs font-semibold text-chart-1 mb-3">LOW BAND</p>
          <div className="grid grid-cols-4 gap-4">
            <RotaryKnob
              value={params.lowThreshold}
              onChange={(v) => handleChange('lowThreshold', v)}
              label="Thresh"
              unit="dB"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-1))"
            />
            <RotaryKnob
              value={params.lowRatio}
              onChange={(v) => handleChange('lowRatio', v)}
              label="Ratio"
              unit=":1"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-1))"
            />
            <RotaryKnob
              value={params.lowGain}
              onChange={(v) => handleChange('lowGain', v)}
              label="Gain"
              unit="dB"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-1))"
            />
            <RotaryKnob
              value={params.crossover1}
              onChange={(v) => handleChange('crossover1', v)}
              label="X-Over"
              unit="Hz"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-1))"
            />
          </div>
        </div>

        {/* Mid Band */}
        <div>
          <p className="text-xs font-semibold text-chart-2 mb-3">MID BAND</p>
          <div className="grid grid-cols-4 gap-4">
            <RotaryKnob
              value={params.midThreshold}
              onChange={(v) => handleChange('midThreshold', v)}
              label="Thresh"
              unit="dB"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-2))"
            />
            <RotaryKnob
              value={params.midRatio}
              onChange={(v) => handleChange('midRatio', v)}
              label="Ratio"
              unit=":1"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-2))"
            />
            <RotaryKnob
              value={params.midGain}
              onChange={(v) => handleChange('midGain', v)}
              label="Gain"
              unit="dB"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-2))"
            />
            <RotaryKnob
              value={params.crossover2}
              onChange={(v) => handleChange('crossover2', v)}
              label="X-Over"
              unit="Hz"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-2))"
            />
          </div>
        </div>

        {/* High Band */}
        <div>
          <p className="text-xs font-semibold text-chart-3 mb-3">HIGH BAND</p>
          <div className="grid grid-cols-3 gap-4">
            <RotaryKnob
              value={params.highThreshold}
              onChange={(v) => handleChange('highThreshold', v)}
              label="Thresh"
              unit="dB"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-3))"
            />
            <RotaryKnob
              value={params.highRatio}
              onChange={(v) => handleChange('highRatio', v)}
              label="Ratio"
              unit=":1"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-3))"
            />
            <RotaryKnob
              value={params.highGain}
              onChange={(v) => handleChange('highGain', v)}
              label="Gain"
              unit="dB"
              min={0}
              max={1}
              step={0.01}
              size={50}
              color="hsl(var(--chart-3))"
            />
          </div>
        </div>

        {/* Global Controls */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">GLOBAL</p>
          <div className="grid grid-cols-4 gap-4">
            <RotaryKnob
              value={params.attack}
              onChange={(v) => handleChange('attack', v)}
              label="Attack"
              unit="ms"
              min={0}
              max={1}
              step={0.01}
              size={50}
            />
            <RotaryKnob
              value={params.release}
              onChange={(v) => handleChange('release', v)}
              label="Release"
              unit="ms"
              min={0}
              max={1}
              step={0.01}
              size={50}
            />
            <RotaryKnob
              value={params.output}
              onChange={(v) => handleChange('output', v)}
              label="Output"
              unit="dB"
              min={0}
              max={1}
              step={0.01}
              size={50}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
