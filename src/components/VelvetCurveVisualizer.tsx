import React from 'react';
import { VelvetCurveState } from '../audio/VelvetCurveEngine';
import { VisualizerProps } from '../App';


const VelvetCurveVisualizer: React.FC<VisualizerProps<VelvetCurveState>> = ({ connectedColor, params, onChange, isPlaying, currentTime = 0 }) => {
  const color = connectedColor === 'cyan' ? '#06b6d4' : connectedColor === 'magenta' ? '#d946ef' : connectedColor === 'blue' ? '#3b82f6' : connectedColor === 'green' ? '#22c55e' : connectedColor === 'purple' ? '#8b5cf6' : 'grey'; // Default to grey if undefined or 'default'
  const isConnectedAndPlaying = isPlaying && connectedColor;
  
  const animationPhase = isConnectedAndPlaying ? currentTime * 2 : 0;
  
  const createPath = (baseY: number, freq: number, amp: number, modulation: number) => {
    let d = "M 0 " + baseY;
    for (let x = 0; x <= 210; x += 5) {
      const y = baseY + Math.sin(x * freq + animationPhase) * amp * (1 + Math.sin(x * 0.05 + animationPhase * 0.5) * modulation);
      d += ` L ${x} ${y}`;
    }
    return d;
  };

  const warmthPath = createPath(75, 0.05, params.warmth * 20, params.emotion * 0.5);
  const silkPath = createPath(50, 0.1, params.silkEdge * 15, params.emotion * 0.3);
  const powerPath = createPath(25, 0.02, params.power * 10, params.emotion * 0.8);

  return (
    <div className="p-4 flex flex-col items-center justify-between h-full text-xs text-gray-400">
      <svg viewBox="0 0 210 100" className="w-full h-20">
         <defs>
          <filter id="visualizerGlow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          </filter>
        </defs>
        <g style={{ transform: `scaleY(${1 + params.power * 0.2})`, transformOrigin: 'center' }}>
            <path d={warmthPath} stroke={connectedColor ? color : 'grey'} fill="none" strokeWidth={2 + params.warmth * 4} opacity="0.6" style={{ filter: connectedColor ? `drop-shadow(0 0 8px ${color})` : 'none', transition: 'd 0.1s linear' }} />
            <path d={silkPath} stroke={connectedColor ? "white" : 'grey'} fill="none" strokeWidth={1 + params.silkEdge * 1.5} opacity="0.8" style={{ filter: connectedColor ? `drop-shadow(0 0 5px #fff)` : 'none', transition: 'd 0.1s linear' }} />
            <path d={powerPath} stroke={connectedColor ? color : 'grey'} fill="none" strokeWidth="1" opacity="0.4" style={{ filter: connectedColor ? `drop-shadow(0 0 3px ${color})` : 'none', transition: 'd 0.1s linear' }} />
        </g>
      </svg>
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
         <div className="flex flex-col items-center">
          <label htmlFor="warmth-range">Warmth</label>
          <input id="warmth-range" type="range" min="0" max="1" step="0.01" value={params.warmth} onChange={(e) => onChange('warmth', parseFloat(e.target.value))} className="w-full h-1 accent-violet-500" />
        </div>
        <div className="flex flex-col items-center">
          <label htmlFor="silk-range">Silk Edge</label>
          <input id="silk-range" type="range" min="0" max="1" step="0.01" value={params.silkEdge} onChange={(e) => onChange('silkEdge', parseFloat(e.target.value))} className="w-full h-1 accent-cyan-400" />
        </div>
        <div className="flex flex-col items-center">
          <label htmlFor="emotion-range">Emotion</label>
          <input id="emotion-range" type="range" min="0" max="1" step="0.01" value={params.emotion} onChange={(e) => onChange('emotion', parseFloat(e.target.value))} className="w-full h-1 accent-fuchsia-500" />
        </div>
        <div className="flex flex-col items-center">
          <label htmlFor="power-range">Power</label>
          <input id="power-range" type="range" min="0" max="1" step="0.01" value={params.power} onChange={(e) => onChange('power', parseFloat(e.target.value))} className="w-full h-1 accent-yellow-500" />
        </div>
      </div>
    </div>
  );
};

export default VelvetCurveVisualizer;