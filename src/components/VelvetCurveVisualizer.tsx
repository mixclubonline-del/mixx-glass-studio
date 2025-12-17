/**
 * Velvet Curve Visualizer
 * 
 * Audio processing visualizer with AURA Design System styling.
 * Displays waveform analysis with warmth, silk, emotion, and power controls.
 */

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { VelvetCurveState } from '../audio/VelvetCurveEngine';
import { VisualizerProps } from '../App';
import { 
  AuraPalette, 
  AuraColors, 
  AuraEffects,
  auraAlpha 
} from '../theme/aura-tokens';
import { listen } from '@tauri-apps/api/event';

// Extract palette colors
const { violet, cyan, magenta, amber, indigo } = AuraPalette;

const VelvetCurveVisualizer: React.FC<VisualizerProps<VelvetCurveState>> = ({ 
  connectedColor, 
  params, 
  onChange, 
  isPlaying, 
  currentTime = 0 
}) => {
  const [analysisData, setAnalysisData] = useState<number[]>([]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen<number[]>('analysis-data', (event) => {
        const raw = event.payload;
        if (raw && raw.length > 0) {
          // Simple decimation for visualization
          const stride = Math.ceil(raw.length / 100);
          const decimated = [];
          for (let i = 0; i < raw.length; i += stride) {
            decimated.push(raw[i]);
          }
          setAnalysisData(decimated);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Map connected colors to AURA palette
  const color = useMemo(() => {
    switch (connectedColor) {
      case 'cyan': return cyan.DEFAULT;
      case 'magenta': return magenta.DEFAULT;
      case 'blue': return indigo.DEFAULT;
      case 'green': return '#10b981'; // Emerald
      case 'purple': return violet.DEFAULT;
      default: return '#6b7280'; // Gray
    }
  }, [connectedColor]);

  const isConnectedAndPlaying = isPlaying && connectedColor;
  const animationPhase = isConnectedAndPlaying ? currentTime * 2 : 0;
  
  const createPath = (baseY: number, freq: number, amp: number, modulation: number, data: number[] = []) => {
    let d = "M 0 " + baseY;
    const width = 220;
    
    if (data.length > 0 && isConnectedAndPlaying) {
      // Use real analysis data
      const points = data.length;
      const stepX = width / points;
      
      for (let i = 0; i < points; i++) {
        const x = i * stepX;
        const sample = data[i];
        const y = baseY + sample * (amp * 20);
        d += ` L ${x} ${y}`;
      }
    } else {
      // Fallback to simulation
      for (let x = 0; x <= width; x += 4) {
        const y = baseY + Math.sin(x * freq + animationPhase) * amp * (1 + Math.sin(x * 0.05 + animationPhase * 0.5) * modulation);
        d += ` L ${x} ${y}`;
      }
    }
    return d;
  };

  const warmthPath = createPath(75, 0.05, params.warmth * 22, params.emotion * 0.5, analysisData);
  const silkPath = createPath(50, 0.08, params.silkEdge * 18, params.emotion * 0.35, []); 
  const powerPath = createPath(25, 0.03, params.power * 14, params.emotion * 0.8, analysisData);

  // Slider style with AURA colors
  const sliderStyle = (accentColor: string): React.CSSProperties => ({
    accentColor,
    background: `linear-gradient(to right, 
      ${auraAlpha(accentColor, 0.2)} 0%, 
      ${auraAlpha(accentColor, 0.4)} 100%
    )`,
  });

  return (
    <div 
      className="p-4 flex flex-col items-center justify-between h-full text-xs font-mono"
      style={{
        color: auraAlpha(violet[300], 0.6),
        background: `linear-gradient(180deg, 
          ${AuraColors.space} 0%, 
          ${auraAlpha(indigo[900], 0.4)} 100%
        )`,
      }}
    >
      <svg viewBox="0 0 210 100" className="w-full h-20 overflow-visible">
        <defs>
          <filter id="velvetGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* AURA gradient for the glow */}
          <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={violet.DEFAULT} />
            <stop offset="50%" stopColor={cyan.DEFAULT} />
            <stop offset="100%" stopColor={magenta.DEFAULT} />
          </linearGradient>
        </defs>
        
        <g style={{ transform: `scaleY(${1 + params.power * 0.15})`, transformOrigin: 'center' }}>
          {/* Warmth Layer (Base) */}
          <path 
            d={warmthPath} 
            stroke={connectedColor ? color : auraAlpha(violet[600], 0.3)} 
            fill="none" 
            strokeWidth={2 + params.warmth * 5} 
            opacity="0.5" 
            style={{ 
              filter: connectedColor ? `drop-shadow(0 0 12px ${color})` : 'none', 
              transition: 'stroke 0.3s, d 0.05s linear' 
            }} 
          />
          
          {/* Silk Layer (High Freq details) */}
          <path 
            d={silkPath} 
            stroke={connectedColor ? "white" : auraAlpha(cyan[400], 0.4)} 
            fill="none" 
            strokeWidth={1 + params.silkEdge * 2} 
            opacity="0.85" 
            style={{ 
              filter: connectedColor ? `drop-shadow(0 0 6px rgba(255,255,255,0.8))` : 'none', 
              transition: 'd 0.05s linear' 
            }} 
          />
          
          {/* Power Layer (Low Freq drive) */}
          <path 
            d={powerPath} 
            stroke={connectedColor ? color : auraAlpha(magenta[500], 0.3)} 
            fill="none" 
            strokeWidth={1.5} 
            opacity="0.5" 
            style={{ 
              filter: connectedColor ? `drop-shadow(0 0 4px ${color})` : 'none', 
              transition: 'stroke 0.3s, d 0.05s linear' 
            }} 
          />
        </g>
      </svg>
      
      {/* Controls */}
      <div className="w-full grid grid-cols-4 gap-3 mt-3 px-2">
        {/* Warmth */}
        <div className="flex flex-col items-center gap-1">
          <input 
            id="warmth-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.warmth} 
            onChange={(e) => onChange('warmth', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none rounded-full cursor-pointer"
            style={sliderStyle(amber.DEFAULT)}
          />
          <label 
            htmlFor="warmth-range" 
            className="text-[10px] tracking-wider uppercase"
            style={{ color: auraAlpha(amber[300], 0.7) }}
          >
            Warmth
          </label>
        </div>
        
        {/* Silk */}
        <div className="flex flex-col items-center gap-1">
          <input 
            id="silk-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.silkEdge} 
            onChange={(e) => onChange('silkEdge', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none rounded-full cursor-pointer"
            style={sliderStyle(cyan.DEFAULT)}
          />
          <label 
            htmlFor="silk-range" 
            className="text-[10px] tracking-wider uppercase"
            style={{ color: auraAlpha(cyan[300], 0.7) }}
          >
            Silk
          </label>
        </div>
        
        {/* Emotion */}
        <div className="flex flex-col items-center gap-1">
          <input 
            id="emotion-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.emotion} 
            onChange={(e) => onChange('emotion', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none rounded-full cursor-pointer"
            style={sliderStyle(violet.DEFAULT)}
          />
          <label 
            htmlFor="emotion-range" 
            className="text-[10px] tracking-wider uppercase"
            style={{ color: auraAlpha(violet[300], 0.7) }}
          >
            Emotion
          </label>
        </div>
        
        {/* Power */}
        <div className="flex flex-col items-center gap-1">
          <input 
            id="power-range" 
            type="range" 
            min="0" max="1" step="0.01" 
            value={params.power} 
            onChange={(e) => onChange('power', parseFloat(e.target.value))} 
            className="w-full h-1 appearance-none rounded-full cursor-pointer"
            style={sliderStyle(magenta.DEFAULT)}
          />
          <label 
            htmlFor="power-range" 
            className="text-[10px] tracking-wider uppercase"
            style={{ color: auraAlpha(magenta[300], 0.7) }}
          >
            Power
          </label>
        </div>
      </div>
    </div>
  );
};

export default VelvetCurveVisualizer;