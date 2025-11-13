import React, { useEffect } from 'react';
import { hexToRgba } from '../utils/ALS';

type GlowCuePosition = 'master' | 'prime' | 'bloom';

type GlowCuePulse = 'breath' | 'surge' | 'settle';

export interface GlowCue {
  id: string;
  position: GlowCuePosition;
  color: string;
  intensity: number; // 0..1
  pulse?: GlowCuePulse;
  radius?: number; // px
}

interface GlowCueLayerProps {
  cues: GlowCue[];
}

const positionStyles: Record<GlowCuePosition, React.CSSProperties> = {
  master: {
    bottom: '12%',
    right: '8%',
    width: '220px',
    height: '220px',
  },
  bloom: {
    bottom: '6%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '260px',
    height: '260px',
  },
  prime: {
    top: '8%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '240px',
    height: '240px',
  },
};

const keyframeCss = `
@keyframes glow-breath {
  0%, 100% { transform: scale(0.92); opacity: 0.55; }
  50% { transform: scale(1.05); opacity: 0.85; }
}
@keyframes glow-surge {
  0% { transform: scale(0.7); opacity: 0.0; }
  30% { transform: scale(1.08); opacity: 0.9; }
  100% { transform: scale(1.25); opacity: 0.0; }
}
@keyframes glow-settle {
  0% { opacity: 0.0; }
  30% { opacity: 0.5; }
  100% { opacity: 0.25; }
}`;

function ensureKeyframesInjected() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('glow-cue-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'glow-cue-keyframes';
  style.textContent = keyframeCss;
  document.head.appendChild(style);
}

const animationMap: Record<GlowCuePulse, string> = {
  breath: 'glow-breath 3.4s ease-in-out infinite',
  surge: 'glow-surge 1.6s ease-out forwards',
  settle: 'glow-settle 4.2s ease-in forwards',
};

export const GlowCueLayer: React.FC<GlowCueLayerProps> = ({ cues }) => {
  useEffect(() => {
    ensureKeyframesInjected();
  }, []);

  const visible = cues.filter((cue) => cue.intensity > 0.01);
  if (!visible.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {visible.map((cue) => {
        const { position, color, intensity, pulse = 'breath', radius } = cue;
        const baseStyle = positionStyles[position];
        const width = typeof baseStyle?.width === 'string' ? parseFloat(baseStyle.width) : baseStyle?.width ?? 220;
        const height = typeof baseStyle?.height === 'string' ? parseFloat(baseStyle.height) : baseStyle?.height ?? 220;
        const size = radius ?? Math.min(width, height);
        const style: React.CSSProperties = {
          ...baseStyle,
          opacity: Math.min(1, Math.max(0, intensity)),
          borderRadius: '50%',
          background: `radial-gradient(circle, ${hexToRgba(color, 0.58)} 0%, ${hexToRgba(color, 0.05)} 60%, transparent 100%)`,
          boxShadow: `0 0 ${size * 0.35}px ${hexToRgba(color, 0.45)}`,
          animation: animationMap[pulse],
          mixBlendMode: 'screen',
          position: 'absolute',
          transition: 'opacity 280ms ease',
        };
        return <div key={cue.id} style={style} />;
      })}
    </div>
  );
};

export default GlowCueLayer;
