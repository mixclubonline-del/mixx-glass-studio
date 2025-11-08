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
    
    // Clear - transparent for glass effect
    ctx.clearRect(0, 0, width, height);
    
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
        const barNumber = bar + 1;
        const is4BarMark = barNumber % 4 === 0;
        const is8BarMark = barNumber % 8 === 0;
        
        // Bar line with emphasis on 4/8-bar marks
        if (is8BarMark) {
          ctx.strokeStyle = 'hsl(320, 100%, 50%)';
          ctx.lineWidth = 3;
        } else if (is4BarMark) {
          ctx.strokeStyle = 'hsl(191, 100%, 50%)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'hsl(0, 0%, 40%)';
          ctx.lineWidth = 1;
        }
        ctx.beginPath();
        ctx.moveTo(x, height * 0.3);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Bar number with emphasis on 4/8-bar marks
        let fontSize = '11px';
        let fontWeight = '';
        if (is8BarMark) {
          fontSize = '14px';
          fontWeight = 'bold ';
          ctx.fillStyle = 'hsl(320 100% 70%)';
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'hsl(320 100% 60%)';
        } else if (is4BarMark) {
          fontSize = '12px';
          fontWeight = 'bold ';
          ctx.fillStyle = 'hsl(191 100% 60%)';
          ctx.shadowBlur = 2;
          ctx.shadowColor = 'hsl(191 100% 60%)';
        } else {
          const gradient = ctx.createLinearGradient(x, 0, x + 50, 0);
          gradient.addColorStop(0, 'hsl(275 100% 70%)');
          gradient.addColorStop(1, 'hsl(191 100% 60%)');
          ctx.fillStyle = gradient;
          ctx.shadowBlur = 0;
        }
        ctx.font = `${fontWeight}${fontSize} Inter`;
        ctx.fillText(`${barNumber}`, x + 4, height / 2);
        ctx.shadowBlur = 0;
        ctx.font = '11px Inter';
        
        // Beat subdivisions (show beats 2, 3, 4) - dimmed
        for (let beat = 1; beat < 4; beat++) {
          const beatTime = barTime + (beat * secondsPerBeat);
          const beatX = (beatTime * zoom) - scrollX;
          
          if (beatX >= 0 && beatX <= width) {
            ctx.strokeStyle = 'hsl(0, 0%, 15%)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(beatX, height * 0.6);
            ctx.lineTo(beatX, height);
            ctx.stroke();
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
      className="cursor-pointer glass-light border-b border-border/30"
      style={{
        backdropFilter: 'blur(40px) saturate(180%)',
      }}
    />
  );
}
