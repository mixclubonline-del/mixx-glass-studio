import React, { useState, useEffect } from 'react';
import { TrackData } from '../../App';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

type TrackColor = TrackData['trackColor'];

interface EnergyPillarProps {
    level: number; // 0 to 1
    transient: boolean;
    isPlaying: boolean;
    color: TrackColor;
}

interface Shockwave {
    id: number;
}

const colorMap: { [key in TrackColor]: { glow: string; base: string } } = {
  cyan: { glow: 'rgba(6, 182, 212, 0.7)', base: '#06b6d4' },
  magenta: { glow: 'rgba(217, 70, 239, 0.7)', base: '#d946ef' },
  blue: { glow: 'rgba(59, 130, 246, 0.7)', base: '#3b82f6' },
  green: { glow: 'rgba(34, 197, 94, 0.7)', base: '#22c55e' },
  purple: { glow: 'rgba(139, 92, 246, 0.7)', base: '#8b5cf6' },
  crimson: { glow: 'rgba(244, 63, 94, 0.7)', base: '#f43f5e' },
};

const EnergyPillar: React.FC<EnergyPillarProps> = ({ level, transient, isPlaying, color }) => {
    const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);

    useEffect(() => {
        if (transient && isPlaying) {
            const newShockwave = { id: Date.now() };
            setShockwaves(prev => [...prev, newShockwave]);
        }
    }, [transient, isPlaying]);

    const handleAnimationEnd = (id: number) => {
        setShockwaves(prev => prev.filter(sw => sw.id !== id));
    };

    const height = Math.pow(level, 0.5) * 100; // Use power to make lower levels more visible
    const selectedColor = colorMap[color];
    const glowColor = selectedColor.glow;
    const baseColor = selectedColor.base;

    return (
        <div style={composeStyles(
          layout.position.relative,
          layout.width.full,
          { height: '100%' },
          layout.flex.container('col'),
          layout.flex.justify.end,
          layout.flex.align.center
        )}>
             {/* Shockwave Container */}
            <div style={composeStyles(
              layout.position.absolute,
              { bottom: 0 },
              layout.width.full,
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.center,
              { height: '64px' }
            )}>
                 {shockwaves.map(sw => (
                    <div
                        key={sw.id}
                        style={composeStyles(
                          layout.position.absolute,
                          layout.width.full,
                          layout.height.full,
                          effects.border.radius.full,
                          {
                            border: `2px solid ${baseColor}`,
                            animation: 'shockwave-animate 0.6s ease-out forwards',
                          }
                        )}
                        onAnimationEnd={() => handleAnimationEnd(sw.id)}
                    />
                ))}
            </div>

            {/* Main Pillar */}
            <div
                style={composeStyles(
                  effects.border.radius.custom('8px 8px 0 0'),
                  transitions.transition.standard('all', 75, 'ease-out'),
                  {
                    width: '16px',
                    height: `${height}%`,
                    background: `linear-gradient(to top, ${baseColor}, transparent)`,
                    boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`,
                  }
                )}
            />
            {/* Base Glow */}
            <div 
                style={composeStyles(
                  layout.position.absolute,
                  { bottom: 0 },
                  effects.border.radius.full,
                  transitions.transition.standard('opacity', 200, 'ease-out'),
                  {
                    width: '24px',
                    height: '8px',
                    background: baseColor,
                    filter: 'blur(5px)',
                    opacity: level > 0.1 ? 0.8 : 0,
                  }
                )}
            />
        </div>
    );
};

export default EnergyPillar;