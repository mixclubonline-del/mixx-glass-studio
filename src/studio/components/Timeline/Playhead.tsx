/**
 * Playhead component - vertical line following playback
 */

import { useTimelineStore } from '@/store/timelineStore';

interface PlayheadProps {
  containerWidth: number;
  containerHeight: number;
}

export function Playhead({ containerWidth, containerHeight }: PlayheadProps) {
  const { currentTime, duration, zoom, scrollX, isPlaying } = useTimelineStore();
  
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
      {/* Glow effect with enhanced trail */}
      <div
        className="absolute top-0 w-[80px] h-full transition-all"
        style={{
          left: '-40px',
          background: isPlaying
            ? 'radial-gradient(ellipse at center, hsl(var(--neon-pink) / 0.5) 0%, hsl(var(--neon-pink) / 0.2) 30%, transparent 70%)'
            : 'radial-gradient(ellipse at center, hsl(var(--neon-blue) / 0.4) 0%, transparent 70%)',
        }}
      />
      
      {/* Motion blur trail when playing */}
      {isPlaying && (
        <div
          className="absolute top-0 h-full animate-playhead-trail"
          style={{
            left: '-40px',
            right: '100%',
            background: 'linear-gradient(90deg, transparent 0%, hsl(var(--neon-pink) / 0.3) 100%)',
            filter: 'blur(8px)',
          }}
        />
      )}
      
      {/* Playhead line with glow */}
      <div
        className="absolute top-0 w-[3px] h-full"
        style={{
          left: '-1.5px',
          background: isPlaying 
            ? 'linear-gradient(180deg, hsl(var(--neon-pink)) 0%, hsl(var(--neon-pink) / 0.8) 100%)' 
            : 'linear-gradient(180deg, hsl(var(--neon-blue)) 0%, hsl(var(--neon-blue) / 0.8) 100%)',
          boxShadow: isPlaying
            ? '0 0 15px hsl(var(--neon-pink)), 0 0 30px hsl(var(--neon-pink) / 0.5), 0 0 60px hsl(var(--neon-pink) / 0.2)'
            : '0 0 15px hsl(var(--neon-blue)), 0 0 30px hsl(var(--neon-blue) / 0.5)',
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
