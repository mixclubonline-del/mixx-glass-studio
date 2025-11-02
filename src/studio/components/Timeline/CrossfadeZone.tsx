/**
 * Crossfade Zone - Enhanced crossfade visualization
 */

import React from 'react';
import { Blend } from 'lucide-react';

interface CrossfadeZoneProps {
  region1EndTime: number;
  region2StartTime: number;
  duration: number;
  zoom: number;
  trackHeight: number;
  color1: string;
  color2: string;
}

export const CrossfadeZone: React.FC<CrossfadeZoneProps> = ({
  region1EndTime,
  region2StartTime,
  duration,
  zoom,
  trackHeight,
  color1,
  color2
}) => {
  // Only render if regions overlap
  if (region2StartTime >= region1EndTime) return null;

  const overlapStart = region2StartTime;
  const overlapEnd = Math.min(region1EndTime, region2StartTime + duration);
  const overlapDuration = overlapEnd - overlapStart;

  if (overlapDuration <= 0) return null;

  const left = overlapStart * zoom;
  const width = overlapDuration * zoom;

  return (
    <div
      className="absolute top-0 pointer-events-none z-10"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: `${trackHeight}px`
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, 
            ${color1}20 0%, 
            ${color2}20 100%
          )`,
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* X pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="100" y2="100" stroke={color1} strokeWidth="2" />
        <line x1="0" y1="100" x2="100" y2="0" stroke={color2} strokeWidth="2" />
      </svg>

      {/* Icon indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-ultra p-1 rounded">
        <Blend size={12} className="text-foreground/80" />
      </div>

      {/* Border highlight */}
      <div
        className="absolute inset-0 border-2 rounded animate-pulse"
        style={{
          borderColor: `${color1}80`
        }}
      />
    </div>
  );
};
