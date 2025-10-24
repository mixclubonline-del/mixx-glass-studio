/**
 * Playhead component - vertical line following playback
 * Synced directly to Prime Brain Master Clock
 */

import { useEffect, useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { primeBrain } from '@/ai/primeBrain';

interface PlayheadProps {
  containerWidth: number;
  containerHeight: number;
}

export function Playhead({ containerWidth, containerHeight }: PlayheadProps) {
  const { duration, zoom, scrollX } = useTimelineStore();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Subscribe directly to Prime Brain for time updates
  useEffect(() => {
    const unsubscribe = primeBrain.subscribe((time) => {
      setCurrentTime(time);
    });
    
    // Sync playing state
    const syncPlayingState = () => {
      setIsPlaying(primeBrain.getIsRunning());
    };
    
    syncPlayingState();
    const interval = setInterval(syncPlayingState, 100);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  if (duration === 0) return null;
  
  // Calculate playhead position
  const playheadX = (currentTime * zoom) - scrollX;
  
  // Don't render if off-screen
  if (playheadX < -50 || playheadX > containerWidth + 50) return null;
  
  return (
    <div
      className="absolute top-0 pointer-events-none z-30"
      style={{
        left: `${playheadX}px`,
        height: `${containerHeight}px`,
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute top-0 w-[60px] h-full"
        style={{
          left: '-30px',
          background: isPlaying
            ? 'radial-gradient(circle at center, hsl(var(--neon-pink) / 0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, hsl(var(--neon-blue) / 0.4) 0%, transparent 70%)',
        }}
      />
      
      {/* Playhead line */}
      <div
        className="absolute top-0 w-[2px] h-full"
        style={{
          left: '-1px',
          background: isPlaying ? 'hsl(var(--neon-pink))' : 'hsl(var(--neon-blue))',
          boxShadow: isPlaying
            ? '0 0 10px hsl(var(--neon-pink)), 0 0 20px hsl(var(--neon-pink) / 0.5)'
            : '0 0 10px hsl(var(--neon-blue)), 0 0 20px hsl(var(--neon-blue) / 0.5)',
        }}
      />
      
      {/* Top handle */}
      <div
        className="absolute -top-1 left-0 w-3 h-3 -translate-x-1/2 rounded-full"
        style={{
          background: isPlaying ? 'hsl(var(--neon-pink))' : 'hsl(var(--neon-blue))',
          boxShadow: isPlaying
            ? '0 0 6px hsl(var(--neon-pink))'
            : '0 0 6px hsl(var(--neon-blue))',
        }}
      />
    </div>
  );
}
