/**
 * Comp Ghost Region
 * 
 * Displays a semi-transparent green overlay for the BEST take so far.
 * This is the visual indicator that Comping Brain has identified a high-quality take.
 */

import { useEffect, useState } from 'react';
import { getBestTake, type CompTake } from '../../core/performance/compBrain';

interface CompGhostProps {
  pixelsPerSecond: number;
  scrollX: number;
  viewportWidth: number;
  timelineHeight: number;
}

export function CompGhost({
  pixelsPerSecond,
  scrollX,
  viewportWidth,
  timelineHeight,
}: CompGhostProps) {
  const [bestTake, setBestTake] = useState<CompTake | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const best = getBestTake();
      // Only show if score is above threshold (0.6 = good take)
      if (best && best.score >= 0.6) {
        setBestTake(best);
      } else {
        setBestTake(null);
      }
    }, 150); // Update every 150ms (smooth but not excessive)
    
    return () => clearInterval(interval);
  }, []);
  
  if (!bestTake) return null;
  
  // Convert timeline position to pixels
  const startPx = bestTake.phrasing.start * pixelsPerSecond - scrollX;
  const durationPx = (bestTake.phrasing.end - bestTake.phrasing.start) * pixelsPerSecond;
  
  // Only render if visible in viewport (with padding for smooth transitions)
  const padding = 100; // Pixels
  if (startPx + durationPx < -padding || startPx > viewportWidth + padding) {
    return null;
  }
  
  // Opacity based on score (0.6-1.0 maps to 0.15-0.35)
  const opacity = 0.15 + (bestTake.score - 0.6) * (0.35 - 0.15) / (1.0 - 0.6);
  
  // Color shifts from green to brighter green based on score
  const greenIntensity = Math.floor(100 + (bestTake.score * 155)); // 100-255
  
  return (
    <div
      className="comp-ghost"
      style={{
        position: 'absolute',
        left: `${startPx}px`,
        width: `${durationPx}px`,
        top: 0,
        height: `${timelineHeight}px`,
        background: `rgba(0, ${greenIntensity}, 0, ${opacity})`,
        border: `1px solid rgba(0, ${greenIntensity}, 0, ${opacity * 2.5})`,
        borderLeft: `2px solid rgba(0, ${greenIntensity}, 0, ${Math.min(1.0, opacity * 3)})`,
        borderRight: `2px solid rgba(0, ${greenIntensity}, 0, ${Math.min(1.0, opacity * 3)})`,
        pointerEvents: 'none',
        zIndex: 4, // Above clips, below auto-punch and selection/playhead
        boxShadow: `inset 0 0 20px rgba(0, ${greenIntensity}, 0, ${opacity * 0.4})`,
        transition: 'opacity 0.3s ease-out, border-color 0.3s ease-out, left 0.1s linear, width 0.1s linear',
      }}
      title={`Best Take (Score: ${(bestTake.score * 100).toFixed(0)}%)`}
    />
  );
}

