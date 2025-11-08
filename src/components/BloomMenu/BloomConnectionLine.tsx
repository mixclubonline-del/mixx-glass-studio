/**
 * Bloom Connection Line - SVG path from center to item
 */

import React from 'react';

interface BloomConnectionLineProps {
  x: number;
  y: number;
  angle: number;
  index: number;
  isHovered?: boolean;
}

export const BloomConnectionLine: React.FC<BloomConnectionLineProps> = ({
  x,
  y,
  angle,
  index,
  isHovered = false
}) => {
  const getZoneColor = (angle: number) => {
    const normalized = ((angle + 90) % 360 + 360) % 360;
    if (normalized < 90) return 'hsl(var(--primary))';
    if (normalized < 180) return 'hsl(var(--accent))';
    if (normalized < 270) return 'hsl(var(--secondary))';
    return 'hsl(var(--primary))';
  };

  const centerX = '50%';
  const centerY = '50%';
  const color = getZoneColor(angle);

  return (
    <g
      className="bloom-connection-line"
      style={{
        opacity: isHovered ? 1 : 0.3,
        transition: 'opacity 0.3s ease-out'
      }}
    >
      {/* Main line */}
      <line
        x1={centerX}
        y1={centerY}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth={isHovered ? "2" : "1"}
        strokeDasharray="4 4"
        className="bloom-line-path"
        style={{
          animationDelay: `${index * 80}ms`,
          filter: `drop-shadow(0 0 ${isHovered ? 6 : 3}px ${color})`
        }}
      />
      
      {/* Animated node traveling along line */}
      <circle
        cx={centerX}
        cy={centerY}
        r="2"
        fill={color}
        className="bloom-line-node"
        style={{
          transform: `translate(${x}, ${y})`,
          animationDelay: `${index * 80}ms`,
          filter: `drop-shadow(0 0 4px ${color})`
        }}
      />
    </g>
  );
};
