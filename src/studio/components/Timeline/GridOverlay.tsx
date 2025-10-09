/**
 * Grid overlay - renders bar/beat grid lines
 */

import { useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';

interface GridOverlayProps {
  width: number;
  height: number;
  bpm: number;
}

export function GridOverlay({ width, height, bpm }: GridOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoom, scrollX, gridSnap, gridResolution } = useTimelineStore();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    if (!gridSnap) return;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    const beatsPerSecond = bpm / 60;
    const secondsPerBeat = 1 / beatsPerSecond;
    const secondsPerBar = secondsPerBeat * 4;
    
    // Calculate subdivision interval
    let subdivisionInterval = secondsPerBeat;
    switch (gridResolution) {
      case '1/8': subdivisionInterval = secondsPerBeat / 2; break;
      case '1/16': subdivisionInterval = secondsPerBeat / 4; break;
      case '1/32': subdivisionInterval = secondsPerBeat / 8; break;
      case '1/64': subdivisionInterval = secondsPerBeat / 16; break;
    }
    
    const startTime = scrollX / zoom;
    const endTime = (scrollX + width) / zoom;
    
    const startIndex = Math.floor(startTime / subdivisionInterval);
    const endIndex = Math.ceil(endTime / subdivisionInterval);
    
    for (let i = startIndex; i <= endIndex; i++) {
      const time = i * subdivisionInterval;
      const x = (time * zoom) - scrollX;
      
      if (x >= 0 && x <= width) {
        // Determine line strength
        const isBar = Math.abs(time % secondsPerBar) < 0.001;
        const isBeat = Math.abs(time % secondsPerBeat) < 0.001;
        
        if (isBar) {
          ctx.strokeStyle = 'hsl(0, 0%, 30%)';
          ctx.lineWidth = 1;
        } else if (isBeat) {
          ctx.strokeStyle = 'hsl(0, 0%, 20%)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'hsl(0, 0%, 12%)';
          ctx.lineWidth = 1;
        }
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  }, [width, height, zoom, scrollX, bpm, gridSnap, gridResolution]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
