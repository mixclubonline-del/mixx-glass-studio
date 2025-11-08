/**
 * Bloom Orbital Rings - SVG ring system with color zones
 */

import React from 'react';

interface BloomOrbitalRingsProps {
  isOpen: boolean;
  rings: number[];
}

export const BloomOrbitalRings: React.FC<BloomOrbitalRingsProps> = ({ isOpen, rings }) => {
  const getZoneColor = (angle: number) => {
    if (angle < 90) return 'hsl(var(--primary))';
    if (angle < 180) return 'hsl(var(--accent))';
    if (angle < 270) return 'hsl(var(--secondary))';
    return 'hsl(var(--primary))';
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.6s ease-out'
      }}
    >
      <defs>
        <radialGradient id="ringGradient">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      {rings.map((radius, index) => (
        <g key={`ring-${index}`}>
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="0.5"
            className="bloom-orbital-ring"
            style={{
              animationDelay: `${index * 0.2}s`,
              filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.15))'
            }}
          />
        </g>
      ))}
    </svg>
  );
};
