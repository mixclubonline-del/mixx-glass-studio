/**
 * Professional Peak Meter - Real-time audio-driven metering
 * Reads directly from AnalyserNode with internal animation loop
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProfessionalPeakMeterProps {
  analysers?: { left: AnalyserNode; right: AnalyserNode } | null;
  height?: number;
  width?: number;
  stereo?: boolean;
  showRMS?: boolean;
  clipIndicator?: boolean;
  onResetClip?: () => void;
}

export const ProfessionalPeakMeter: React.FC<ProfessionalPeakMeterProps> = ({
  analysers,
  height = 200,
  width = 6,
  stereo = true,
  showRMS = false,
  clipIndicator = true,
  onResetClip
}) => {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const [leftClip, setLeftClip] = useState(false);
  const [rightClip, setRightClip] = useState(false);
  
  // Convert dB to percentage (0-100) for rendering
  const dbToPercent = (db: number): number => {
    const clamped = Math.max(-60, Math.min(6, db));
    return ((clamped + 60) / 66) * 100;
  };
  
  // Get color for dB level
  const getSegmentColor = (db: number): string => {
    if (db > 0) return '#ff0000'; // Red (clipping)
    if (db > -3) return '#ff4444'; // Red zone
    if (db > -12) return '#ffaa00'; // Yellow zone
    return '#44ff44'; // Green zone (safe)
  };
  
  useEffect(() => {
    if (!analysers) return;
    
    const leftCanvas = leftCanvasRef.current;
    const rightCanvas = rightCanvasRef.current;
    if (!leftCanvas || (stereo && !rightCanvas)) return;
    
    const leftCtx = leftCanvas.getContext('2d');
    const rightCtx = stereo ? rightCanvas?.getContext('2d') : null;
    if (!leftCtx || (stereo && !rightCtx)) return;
    
    // Initialize data arrays
    const leftData = new Float32Array(analysers.left.frequencyBinCount);
    const rightData = stereo ? new Float32Array(analysers.right.frequencyBinCount) : null;
    
    // Peak hold state
    let leftPeak = -60, rightPeak = -60;
    let leftPeakHold = -60, rightPeakHold = -60;
    let leftHoldFrames = 0, rightHoldFrames = 0;
    
    let animationFrameId: number;
    
    const drawMeter = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      db: number,
      peakHold: number,
      showClip: boolean
    ) => {
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, w, h);
      
      // Draw background grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const markers = [0, -3, -6, -12, -18, -24, -36, -48, -60];
      markers.forEach(markerDb => {
        const y = h - (dbToPercent(markerDb) / 100) * h;
        ctx.fillRect(0, y, w / 2, 1);
      });
      
      // Draw meter bar with gradient
      const percent = dbToPercent(db);
      const meterHeight = (percent / 100) * h;
      
      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, '#44ff44'); // Green
      gradient.addColorStop(0.7, '#ffaa00'); // Yellow
      gradient.addColorStop(0.9, '#ff4444'); // Red
      gradient.addColorStop(1, '#ff0000'); // Clip red
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, h - meterHeight, w, meterHeight);
      
      // Draw peak hold line
      if (peakHold > -60) {
        const peakY = h - (dbToPercent(peakHold) / 100) * h;
        ctx.fillStyle = getSegmentColor(peakHold);
        ctx.fillRect(0, peakY - 2, w, 2);
      }
      
      // Draw 0dB marker
      const zeroY = h - (dbToPercent(0) / 100) * h;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(0, zeroY - 1, w, 2);
      
      // Draw clip indicator at top
      if (showClip && clipIndicator) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, w, 3);
      }
    };
    
    const animate = () => {
      // Read from analysers
      analysers.left.getFloatTimeDomainData(leftData);
      if (rightData && stereo) {
        analysers.right.getFloatTimeDomainData(rightData);
      }
      
      // Calculate peak levels
      let leftMax = 0;
      for (let i = 0; i < leftData.length; i++) {
        leftMax = Math.max(leftMax, Math.abs(leftData[i]));
      }
      const leftDb = leftMax > 0.0001 ? 20 * Math.log10(leftMax) : -60;
      
      let rightDb = leftDb; // Default to same as left for mono
      if (rightData && stereo) {
        let rightMax = 0;
        for (let i = 0; i < rightData.length; i++) {
          rightMax = Math.max(rightMax, Math.abs(rightData[i]));
        }
        rightDb = rightMax > 0.0001 ? 20 * Math.log10(rightMax) : -60;
      }
      
      // Update peak hold (left)
      if (leftDb > leftPeak) {
        leftPeak = leftDb;
        leftPeakHold = leftDb;
        leftHoldFrames = 60; // Hold for 1 second at 60fps
      } else {
        leftPeak = Math.max(leftDb, leftPeak - 1.0);
        leftHoldFrames = Math.max(0, leftHoldFrames - 1);
        if (leftHoldFrames === 0) {
          leftPeakHold = Math.max(-60, leftPeakHold - 0.5);
        }
      }
      
      // Update peak hold (right)
      if (rightDb > rightPeak) {
        rightPeak = rightDb;
        rightPeakHold = rightDb;
        rightHoldFrames = 60;
      } else {
        rightPeak = Math.max(rightDb, rightPeak - 1.0);
        rightHoldFrames = Math.max(0, rightHoldFrames - 1);
        if (rightHoldFrames === 0) {
          rightPeakHold = Math.max(-60, rightPeakHold - 0.5);
        }
      }
      
      // Clip detection
      if (leftDb > 0 && !leftClip) {
        setLeftClip(true);
      }
      if (rightDb > 0 && !rightClip) {
        setRightClip(true);
      }
      
      // Draw meters
      drawMeter(leftCtx, leftCanvas, leftDb, leftPeakHold, leftClip);
      if (rightCtx && rightCanvas && stereo) {
        drawMeter(rightCtx, rightCanvas, rightDb, rightPeakHold, rightClip);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [analysers, stereo, clipIndicator, leftClip, rightClip]);
  
  const handleResetClip = () => {
    setLeftClip(false);
    setRightClip(false);
    onResetClip?.();
  };
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("flex gap-1", stereo ? "w-auto" : "w-auto")}>
        <canvas
          ref={leftCanvasRef}
          width={width}
          height={height}
          className="rounded-sm border border-border/50 cursor-pointer"
          onClick={handleResetClip}
          title="Click to reset clip indicators"
        />
        {stereo && (
          <canvas
            ref={rightCanvasRef}
            width={width}
            height={height}
            className="rounded-sm border border-border/50 cursor-pointer"
            onClick={handleResetClip}
            title="Click to reset clip indicators"
          />
        )}
      </div>
      {clipIndicator && (leftClip || rightClip) && (
        <div 
          className="text-[8px] text-destructive font-bold cursor-pointer"
          onClick={handleResetClip}
        >
          CLIP
        </div>
      )}
    </div>
  );
};
