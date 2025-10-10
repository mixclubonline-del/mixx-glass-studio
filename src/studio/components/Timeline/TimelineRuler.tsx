/**
 * Timeline ruler - shows bars:beats or timecode
 */

import { useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';

interface TimelineRulerProps {
  width: number;
  height: number;
  bpm: number;
  onSeek: (time: number) => void;
}

export function TimelineRuler({ width, height, bpm, onSeek }: TimelineRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoom, scrollX, viewMode } = useTimelineStore();
  
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
    
    // Clear
    ctx.fillStyle = 'hsl(240, 10%, 8%)';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate time range visible
    const startTime = scrollX / zoom;
    const endTime = (scrollX + width) / zoom;
    
    if (viewMode === 'bars') {
      drawBarsBeats(ctx, startTime, endTime, bpm);
    } else {
      drawSeconds(ctx, startTime, endTime);
    }
  }, [width, height, zoom, scrollX, bpm, viewMode]);
  
  const drawBarsBeats = (ctx: CanvasRenderingContext2D, startTime: number, endTime: number, bpm: number) => {
    const beatsPerSecond = bpm / 60;
    const secondsPerBeat = 1 / beatsPerSecond;
    const secondsPerBar = secondsPerBeat * 4; // 4/4 time signature
    
    const startBar = Math.floor(startTime / secondsPerBar);
    const endBar = Math.ceil(endTime / secondsPerBar);
    
    ctx.font = '11px Inter';
    ctx.textBaseline = 'middle';
    
    for (let bar = startBar; bar <= endBar; bar++) {
      const barTime = bar * secondsPerBar;
      const x = (barTime * zoom) - scrollX;
      
      if (x >= 0 && x <= width) {
        // Bar line
        ctx.strokeStyle = 'hsl(0, 0%, 40%)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, height * 0.3);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Bar number (start at 1, not 0)
        ctx.fillStyle = 'hsl(0, 0%, 70%)';
        ctx.fillText(`${bar + 1}`, x + 4, height / 2);
        
        // Beat subdivisions (show beats 2, 3, 4)
        for (let beat = 1; beat < 4; beat++) {
          const beatTime = barTime + (beat * secondsPerBeat);
          const beatX = (beatTime * zoom) - scrollX;
          
          if (beatX >= 0 && beatX <= width) {
            ctx.strokeStyle = 'hsl(0, 0%, 20%)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(beatX, height * 0.5);
            ctx.lineTo(beatX, height);
            ctx.stroke();
            
            // Show beat numbers for clarity
            ctx.fillStyle = 'hsl(0, 0%, 40%)';
            ctx.font = '9px Inter';
            ctx.fillText(`${beat + 1}`, beatX + 2, height * 0.7);
            ctx.font = '11px Inter';
          }
        }
      }
    }
  };
  
  const drawSeconds = (ctx: CanvasRenderingContext2D, startTime: number, endTime: number) => {
    const startSecond = Math.floor(startTime);
    const endSecond = Math.ceil(endTime);
    
    ctx.font = '11px Inter';
    ctx.textBaseline = 'middle';
    
    for (let second = startSecond; second <= endSecond; second++) {
      const x = (second * zoom) - scrollX;
      
      if (x >= 0 && x <= width) {
        ctx.strokeStyle = 'hsl(0, 0%, 40%)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, height * 0.3);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        const mins = Math.floor(second / 60);
        const secs = second % 60;
        ctx.fillStyle = 'hsl(0, 0%, 70%)';
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, x + 4, height / 2);
      }
    }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x + scrollX) / zoom;
    onSeek(time);
  };
  
  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="cursor-pointer border-b border-border"
    />
  );
}
