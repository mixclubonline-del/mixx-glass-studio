/**
 * Professional Peak Meter - Slim, long, industry-standard meter
 * True Peak + RMS with color-coded zones
 */

import React, { useMemo } from 'react';

interface ProfessionalPeakMeterProps {
  level: { left: number; right: number }; // dB values
  height?: number;
  width?: number;
  stereo?: boolean;
  showRMS?: boolean;
  rmsLevel?: { left: number; right: number };
  clipIndicator?: boolean;
  onResetClip?: () => void;
}

export const ProfessionalPeakMeter: React.FC<ProfessionalPeakMeterProps> = ({
  level,
  height = 300,
  width = 16,
  stereo = true,
  showRMS = true,
  rmsLevel,
  clipIndicator = true,
  onResetClip
}) => {
  const [leftClip, setLeftClip] = React.useState(false);
  const [rightClip, setRightClip] = React.useState(false);
  
  // Check for clipping
  React.useEffect(() => {
    if (level.left >= 0) setLeftClip(true);
    if (level.right >= 0) setRightClip(true);
  }, [level]);
  
  const handleResetClip = () => {
    setLeftClip(false);
    setRightClip(false);
    onResetClip?.();
  };
  
  const MeterBar = ({ db, rmsDb, channel }: { db: number; rmsDb?: number; channel: 'left' | 'right' }) => {
    // Convert dB to percentage (-60dB = 0%, 0dB = 100%, +12dB = 120%)
    const dbToPercent = (value: number) => {
      const minDb = -60;
      const maxDb = 12;
      return Math.max(0, Math.min(120, ((value - minDb) / (maxDb - minDb)) * 100));
    };
    
    const percent = dbToPercent(db);
    const rmsPercent = rmsDb ? dbToPercent(rmsDb) : 0;
    
    // Color zones based on dB level
    const getSegmentColor = (segmentPercent: number) => {
      const segmentDb = -60 + (segmentPercent / 100) * 72; // -60 to +12
      
      if (segmentDb < -18) return 'hsl(130 100% 50%)'; // Green - safe
      if (segmentDb < -6) return 'hsl(45 100% 55%)'; // Yellow - caution
      if (segmentDb < -3) return 'hsl(25 100% 60%)'; // Orange - warning
      return 'hsl(0 100% 60%)'; // Red - danger
    };
    
    // Generate gradient stops
    const gradientStops = useMemo(() => {
      const stops: string[] = [];
      for (let i = 0; i <= 100; i += 5) {
        stops.push(`${getSegmentColor(i)} ${i}%`);
      }
      return stops.join(', ');
    }, []);
    
    const isClipping = channel === 'left' ? leftClip : rightClip;
    
    return (
      <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
        {/* Background */}
        <div
          className="absolute inset-0 rounded-sm"
          style={{
            background: 'rgba(10, 10, 15, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        />
        
        {/* RMS level (background bar) */}
        {showRMS && rmsDb !== undefined && (
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-100"
            style={{
              height: `${rmsPercent}%`,
              background: `linear-gradient(to top, ${gradientStops})`,
              opacity: 0.4
            }}
          />
        )}
        
        {/* Peak level (foreground bar) */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-75"
          style={{
            height: `${percent}%`,
            background: `linear-gradient(to top, ${gradientStops})`,
            boxShadow: percent > 85 ? `0 0 8px ${getSegmentColor(percent)}` : 'none'
          }}
        />
        
        {/* 0dB marker line */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
          style={{
            bottom: `${dbToPercent(0)}%`,
            transform: 'translateY(50%)'
          }}
        />
        
        {/* Clip indicator */}
        {clipIndicator && isClipping && (
          <div
            className="absolute top-0 left-0 right-0 h-2 bg-destructive rounded-t-sm cursor-pointer animate-pulse"
            onClick={handleResetClip}
            title="Click to reset clip indicator"
          />
        )}
      </div>
    );
  };
  
  return (
    <div className="flex items-center gap-1">
      {stereo ? (
        <>
          <MeterBar 
            db={level.left} 
            rmsDb={rmsLevel?.left} 
            channel="left" 
          />
          <MeterBar 
            db={level.right} 
            rmsDb={rmsLevel?.right} 
            channel="right" 
          />
        </>
      ) : (
        <MeterBar 
          db={level.left} 
          rmsDb={rmsLevel?.left} 
          channel="left" 
        />
      )}
      
      {/* Peak value display */}
      <div className="ml-1 text-[9px] font-mono text-muted-foreground">
        <div>{level.left > 0 ? `+${level.left.toFixed(1)}` : level.left.toFixed(1)}</div>
        {stereo && (
          <div>{level.right > 0 ? `+${level.right.toFixed(1)}` : level.right.toFixed(1)}</div>
        )}
      </div>
    </div>
  );
};
