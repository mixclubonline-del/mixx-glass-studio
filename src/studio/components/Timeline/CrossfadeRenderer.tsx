/**
 * Crossfade Renderer - Detects and visualizes crossfades between overlapping regions
 */

import React from 'react';
import { Region } from '@/types/timeline';

interface CrossfadeRendererProps {
  regions: Region[];
  zoom: number;
  trackHeight: number;
}

interface Crossfade {
  region1Id: string;
  region2Id: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export const CrossfadeRenderer: React.FC<CrossfadeRendererProps> = ({
  regions,
  zoom,
  trackHeight,
}) => {
  // Detect overlapping regions
  const detectCrossfades = (): Crossfade[] => {
    const crossfades: Crossfade[] = [];
    
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const r1 = regions[i];
        const r2 = regions[j];
        
        const r1End = r1.startTime + r1.duration;
        const r2End = r2.startTime + r2.duration;
        
        // Check for overlap
        if (r1.startTime < r2End && r2.startTime < r1End) {
          const startTime = Math.max(r1.startTime, r2.startTime);
          const endTime = Math.min(r1End, r2End);
          
          crossfades.push({
            region1Id: r1.id,
            region2Id: r2.id,
            startTime,
            endTime,
            duration: endTime - startTime,
          });
        }
      }
    }
    
    return crossfades;
  };
  
  const crossfades = detectCrossfades();
  
  return (
    <>
      {crossfades.map((fade, index) => {
        const left = fade.startTime * zoom;
        const width = fade.duration * zoom;
        
        return (
          <div
            key={`crossfade-${index}`}
            className="absolute pointer-events-none"
            style={{
              left: `${left}px`,
              width: `${width}px`,
              height: `${trackHeight}px`,
              top: 0,
            }}
          >
            {/* Crossfade curve visualization */}
            <svg
              width="100%"
              height="100%"
              className="opacity-60"
              style={{ mixBlendMode: 'overlay' }}
            >
              {/* Fade out curve (left) */}
              <path
                d={`M 0,0 Q ${width / 2},${trackHeight / 2} ${width},${trackHeight}`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                opacity="0.8"
              />
              
              {/* Fade in curve (right) */}
              <path
                d={`M 0,${trackHeight} Q ${width / 2},${trackHeight / 2} ${width},0`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                opacity="0.8"
              />
              
              {/* Crossfade zone indicator */}
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="hsl(var(--primary) / 0.1)"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>
            
            {/* Label */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-primary bg-background/80 px-1.5 py-0.5 rounded">
              X-Fade {(fade.duration * 1000).toFixed(0)}ms
            </div>
          </div>
        );
      })}
    </>
  );
};
