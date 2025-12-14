import React, { useMemo } from 'react';
import { VelvetCurveState } from '../audio/VelvetCurveEngine';
import { VisualizerProps } from '../App';
import { AuraColors } from '../theme/aura-tokens';

const VelvetCurveVisualizer: React.FC<VisualizerProps<VelvetCurveState>> = ({ connectedColor, params, onChange, isPlaying, currentTime = 0 }) => {
  const color = useMemo(() => {
    switch (connectedColor) {
      case 'cyan': return AuraColors.thermal.cold;
      case 'magenta': return AuraColors.violet;
      case 'blue': return AuraColors.blue;
      case 'green': return '#10b981'; // Emerald
      case 'purple': return AuraColors.velvet;
      default: return '#6b7280'; // Gray
    }
  }, [connectedColor]);

  const isConnectedAndPlaying = isPlaying && connectedColor;
  
  const animationPhase = isConnectedAndPlaying ? currentTime * 2 : 0;
  
  const createPath = (baseY: number, freq: number, amp: number, modulation: number) => {
    let d = "M 0 " + baseY;
    for (let x = 0; x <= 220; x += 4) {
      const y = baseY + Math.sin(x * freq + animationPhase) * amp * (1 + Math.sin(x * 0.05 + animationPhase * 0.5) * modulation);
      // Smooth curve command could be better but Line To is performant
      d += ` L ${x} ${y}`;
    }
    return d;
  };

  const warmthPath = createPath(75, 0.05, params.warmth * 22, params.emotion * 0.5);
  const silkPath = createPath(50, 0.08, params.silkEdge * 18, params.emotion * 0.35);
  const powerPath = createPath(25, 0.03, params.power * 14, params.emotion * 0.8);

  const getAccentClass = (type: 'warmth' | 'silk' | 'emotion' | 'power') => {
      // Mapping to Tailwind accent classes that match Aura tokens roughly
      // We can use style={{ accentColor: ... }} for exact matches
      return '';
  };

  return (
    <div className="p-4 flex flex-col items-center justify-between h-full text-xs text-slate-400 font-mono">
      <svg viewBox="0 0 210 100" className="w-full h-20 overflow-visible">
         <defs>
          <filter id="visualizerGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g style={{ transform: `scaleY(${1 + params.power * 0.15})`, transformOrigin: 'center' }}>
            {/* Warmth Layer (Base) */}
            <path d={warmthPath} stroke={connectedColor ? color : '#374151'} fill="none" strokeWidth={2 + params.warmth * 5} opacity="0.5" 
                style={{ 
                    filter: connectedColor ? `drop-shadow(0 0 12px ${color})` : 'none', 
                    transition: 'stroke 0.3s, d 0.05s linear' 
                }} 
            />
            {/* Silk Layer (High Freq details) */}
            <path d={silkPath} stroke={connectedColor ? "white" : '#4b5563'} fill="none" strokeWidth={1 + params.silkEdge * 2} opacity="0.85" 
                style={{ 
                    filter: connectedColor ? `drop-shadow(0 0 6px rgba(255,255,255,0.8))` : 'none', 
                    transition: 'd 0.05s linear' 
                }} 
            />
            {/* Power Layer (Low Freq drive) */}
            <path d={powerPath} stroke={connectedColor ? color : '#374151'} fill="none" strokeWidth={1.5} opacity="0.5" 
                style={{ 
                    filter: connectedColor ? `drop-shadow(0 0 4px ${color})` : 'none', 
                    transition: 'stroke 0.3s, d 0.05s linear' 
                }} 
            />
        </g>
      </svg>
      <div className="w-full grid grid-cols-4 gap-3 mt-3 px-2">
         <div className="flex flex-col items-center gap-1">
          <input 
            id="warmth-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.warmth} 
            onChange={(e) => onChange('warmth', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none bg-slate-700/50 rounded-full cursor-pointer hover:bg-slate-600"
            style={{ accentColor: AuraColors.velvet }}
          />
          <label htmlFor="warmth-range" className="text-[10px] tracking-wider uppercase text-slate-500">Warmth</label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <input 
            id="silk-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.silkEdge} 
            onChange={(e) => onChange('silkEdge', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none bg-slate-700/50 rounded-full cursor-pointer hover:bg-slate-600"
            style={{ accentColor: AuraColors.thermal.cold }}
          />
          <label htmlFor="silk-range" className="text-[10px] tracking-wider uppercase text-slate-500">Silk</label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <input 
            id="emotion-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.emotion} 
            onChange={(e) => onChange('emotion', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none bg-slate-700/50 rounded-full cursor-pointer hover:bg-slate-600"
            style={{ accentColor: AuraColors.violet }}
          />
          <label htmlFor="emotion-range" className="text-[10px] tracking-wider uppercase text-slate-500">Emotion</label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <input 
            id="power-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.power} 
            onChange={(e) => onChange('power', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none bg-slate-700/50 rounded-full cursor-pointer hover:bg-slate-600"
             style={{ accentColor: AuraColors.thermal.warm }}
          />
          <label htmlFor="power-range" className="text-[10px] tracking-wider uppercase text-slate-500">Power</label>
        </div>
      </div>
    </div>
  );
};

export default VelvetCurveVisualizer;