/**
 * Auto-Punch Ghost Region
 * 
 * Displays a ghost red punch region where the Studio predicts you want to punch.
 * This is the visual indicator that Auto-Punch has detected a pattern.
 */

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    __mixx_autoPunch?: {
      start: number;
      end: number;
      duration: number;
      confidence: number;
    };
  }
}

interface AutoPunchGhostProps {
  pixelsPerSecond: number;
  scrollX: number;
  viewportWidth: number;
  timelineHeight: number;
}

export function AutoPunchGhost({
  pixelsPerSecond,
  scrollX,
  viewportWidth,
  timelineHeight,
}: AutoPunchGhostProps) {
  const [ghost, setGhost] = useState<{
    start: number;
    end: number;
    duration: number;
    confidence: number;
  } | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const ap = window.__mixx_autoPunch;
      if (ap && ap.confidence >= 0.4) {
        setGhost(ap);
      } else {
        setGhost(null);
      }
    }, 50); // Update every 50ms (same as Flow Loop)
    
    return () => clearInterval(interval);
  }, []);
  
  if (!ghost) return null;
  
  // Convert timeline position to pixels
  const startPx = ghost.start * pixelsPerSecond - scrollX;
  const widthPx = ghost.duration * pixelsPerSecond;
  
  // Only render if visible in viewport (with some padding for smooth transitions)
  const padding = 100; // Pixels
  if (startPx + widthPx < -padding || startPx > viewportWidth + padding) {
    return null;
  }
  
  // Opacity based on confidence (0.4-1.0 maps to 0.25-0.45)
  const opacity = 0.25 + (ghost.confidence - 0.4) * (0.45 - 0.25) / (1.0 - 0.4);
  
  // ALS: Confidence to prediction quality (doctrine-compliant, no raw numbers)
  const confidenceToLabel = (c: number): string => {
    if (c >= 0.8) return 'Strong';
    if (c >= 0.6) return 'Likely';
    return 'Possible';
  };
  
  return (
    <div
      className="auto-punch-ghost"
      style={{
        position: 'absolute',
        left: `${startPx}px`,
        width: `${widthPx}px`,
        top: 0,
        height: `${timelineHeight}px`,
        background: `rgba(255, 0, 0, ${opacity})`,
        border: `1px solid rgba(255, 0, 0, ${opacity * 1.8})`,
        borderLeft: `2px solid rgba(255, 0, 0, ${Math.min(1.0, opacity * 2)})`,
        borderRight: `2px solid rgba(255, 0, 0, ${Math.min(1.0, opacity * 2)})`,
        pointerEvents: 'none',
        zIndex: 5, // Above clips, below selection/playhead
        boxShadow: `inset 0 0 20px rgba(255, 0, 0, ${opacity * 0.3}), 0 0 ${6 + ghost.confidence * 10}px rgba(255, 0, 0, ${opacity * 0.4})`,
        transition: 'opacity 0.2s ease-out, border-color 0.2s ease-out, left 0.1s linear, width 0.1s linear, box-shadow 0.2s ease-out',
        animation: ghost.confidence >= 0.7 ? 'punch-pulse 1.5s ease-in-out infinite' : undefined,
      }}
      title={`Auto-Punch: ${confidenceToLabel(ghost.confidence)} prediction`}
    />
  );
}

