/**
 * Crossfade Renderer - Visual and audio crossfade between overlapping regions
 * Phase 3: Advanced region editing
 */

import React from 'react';
import { Region } from '@/types/timeline';

interface CrossfadeRendererProps {
  region1: Region;
  region2: Region;
  pixelsPerSecond: number;
}

export const CrossfadeRenderer: React.FC<CrossfadeRendererProps> = ({
  region1,
  region2,
  pixelsPerSecond
}) => {
  // Calculate overlap
  const region1End = region1.startTime + region1.duration;
  const region2Start = region2.startTime;
  
  if (region1End <= region2Start) {
    // No overlap
    return null;
  }
  
  const overlapStart = region2Start;
  const overlapEnd = Math.min(region1End, region2Start + region2.duration);
  const overlapDuration = overlapEnd - overlapStart;
  
  if (overlapDuration <= 0) return null;
  
  const left = overlapStart * pixelsPerSecond;
  const width = overlapDuration * pixelsPerSecond;
  
  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        borderLeft: '1px dashed rgba(255,255,255,0.3)',
        borderRight: '1px dashed rgba(255,255,255,0.3)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-[10px] font-mono text-white/60 bg-black/40 px-2 py-0.5 rounded">
          X-FADE {overlapDuration.toFixed(2)}s
        </div>
      </div>
    </div>
  );
};
