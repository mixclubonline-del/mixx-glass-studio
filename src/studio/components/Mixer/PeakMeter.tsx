/**
 * Peak Meter Component - Optimized version
 * Real-time stereo peak metering with color zones
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PeakLevel } from '@/types/audio';

interface PeakMeterProps {
  level: PeakLevel;
  height?: number;
  stereo?: boolean;
}

export function PeakMeter({ level, height = 200, stereo = true }: PeakMeterProps) {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftPeakRef = useRef<number>(-60);
  const rightPeakRef = useRef<number>(-60);
  const leftPeakHoldRef = useRef<number>(0);
  const rightPeakHoldRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  // Convert dB to percentage (0-100)
  const dbToPercent = (db: number): number => {
    const clamped = Math.max(-60, Math.min(6, db));
    return ((clamped + 60) / 66) * 100;
  };
  
  // Get color for dB level
  const getColor = (db: number): string => {
    if (db > -3) return '#ff4444'; // Red zone
    if (db > -18) return '#ffaa00'; // Yellow zone
    return '#44ff44'; // Green zone (safe)
  };
  
  useEffect(() => {
    const drawMeter = (
      canvas: HTMLCanvasElement | null,
      db: number,
      peakRef: { current: number },
      peakHoldRef: { current: number }
    ) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, width, height);
      
      // Update peak hold (60fps = 1 frame per call)
      if (db > peakRef.current) {
        peakRef.current = db;
        peakHoldRef.current = 60; // Hold for 60 frames (~1 second at 60fps)
      } else {
        peakRef.current = Math.max(db, peakRef.current - 1.0); // Faster decay
        peakHoldRef.current = Math.max(0, peakHoldRef.current - 1);
      }
      
      const percent = dbToPercent(db);
      const meterHeight = (percent / 100) * height;
      
      // Draw gradient meter
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#44ff44');
      gradient.addColorStop(0.7, '#ffaa00');
      gradient.addColorStop(1, '#ff4444');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - meterHeight, width, meterHeight);
      
      // Draw peak hold line
      if (peakHoldRef.current > 0) {
        const peakPercent = dbToPercent(peakRef.current);
        const peakY = height - (peakPercent / 100) * height;
        ctx.fillStyle = getColor(peakRef.current);
        ctx.fillRect(0, peakY - 1, width, 2);
      }
      
      // Draw dB markers every 6dB
      const markers = [0, -6, -12, -18, -24, -30, -40, -50, -60];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      
      markers.forEach(markerDb => {
        const y = height - (dbToPercent(markerDb) / 100) * height;
        ctx.fillRect(0, y, width / 2, 1);
      });
    };
    
    // Redraw when level changes
    drawMeter(leftCanvasRef.current, level.left, leftPeakRef, leftPeakHoldRef);
    if (stereo) {
      drawMeter(rightCanvasRef.current, level.right, rightPeakRef, rightPeakHoldRef);
    }
    
    frameCountRef.current++;
  }, [level, stereo, height]);
  
  return (
    <div className={cn("flex gap-1", stereo ? "w-10" : "w-5")}>
      <canvas
        ref={leftCanvasRef}
        width={16}
        height={height}
        className="rounded-sm border border-border/50"
      />
      {stereo && (
        <canvas
          ref={rightCanvasRef}
          width={16}
          height={height}
          className="rounded-sm border border-border/50"
        />
      )}
    </div>
  );
}