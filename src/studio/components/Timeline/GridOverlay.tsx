/**
 * Grid overlay - renders bar/beat grid lines
 */

import { useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';

interface GridOverlayProps {
  width: number;
  height: number;
  bpm: number;
  timeSignature?: [number, number];
}

export function GridOverlay({ width, height, bpm, timeSignature = [4, 4] }: GridOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoom, scrollX, gridSnap, gridResolution, gridMode } = useTimelineStore();
  
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
    ctx.clearRect(0, 0, width, height);
    
    if (!gridSnap) return;
    
    // Get computed primary color for accent
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary').trim();
    const primaryHsl = `hsl(${primaryColor})`;
    
    const beatsPerSecond = bpm / 60;
    const secondsPerBeat = 1 / beatsPerSecond;
    const [beatsPerBar] = timeSignature;
    const secondsPerBar = secondsPerBeat * beatsPerBar;
    
    // Calculate subdivision interval based on grid mode
    let subdivisionInterval = secondsPerBeat;
    if (gridMode === 'adaptive') {
      // Auto-adjust based on zoom
      if (zoom < 30) {
        subdivisionInterval = secondsPerBar; // Bars
      } else if (zoom < 80) {
        subdivisionInterval = secondsPerBeat; // Quarter notes
      } else if (zoom < 200) {
        subdivisionInterval = secondsPerBeat / 4; // 16th notes
      } else {
        subdivisionInterval = secondsPerBeat / 8; // 32nd notes
      }
    } else {
      // Use grid resolution setting
      switch (gridResolution) {
        case '1/4': subdivisionInterval = secondsPerBeat; break;
        case '1/8': subdivisionInterval = secondsPerBeat / 2; break;
        case '1/16': subdivisionInterval = secondsPerBeat / 4; break;
        case '1/32': subdivisionInterval = secondsPerBeat / 8; break;
        case '1/64': subdivisionInterval = secondsPerBeat / 16; break;
      }
    }
    
    const startTime = scrollX / zoom;
    const endTime = (scrollX + width) / zoom;
    
    const startIndex = Math.floor(startTime / subdivisionInterval);
    const endIndex = Math.ceil(endTime / subdivisionInterval);
    
    // Draw subdivision lines with gradient fade
    for (let i = startIndex; i <= endIndex; i++) {
      const time = i * subdivisionInterval;
      const x = (time * zoom) - scrollX;
      
      if (x >= 0 && x <= width) {
        const isBar = Math.abs(time % secondsPerBar) < 0.001;
        const isBeat = Math.abs(time % secondsPerBeat) < 0.001;
        
        // Skip if it's a beat or bar line (will draw those separately)
        if (!isBar && !isBeat) {
          const gradient = ctx.createLinearGradient(x, 0, x, height);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
    }
    
    // Draw beat lines with pulsing glow
    for (let i = startIndex; i <= endIndex; i++) {
      const time = i * subdivisionInterval;
      const x = (time * zoom) - scrollX;
      
      if (x >= 0 && x <= width) {
        const isBeat = Math.abs(time % secondsPerBeat) < 0.001;
        const isBar = Math.abs(time % secondsPerBar) < 0.001;
        
        if (isBeat && !isBar) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 2;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
    }
    
    // Draw bar lines with multi-layer depth and STRONG 4/8-bar emphasis (trap loop points)
    for (let i = startIndex; i <= endIndex; i++) {
      const time = i * subdivisionInterval;
      const x = (time * zoom) - scrollX;
      
      if (x >= 0 && x <= width) {
        const isBar = Math.abs(time % secondsPerBar) < 0.001;
        
        if (isBar) {
          const barNumber = Math.round(time / secondsPerBar);
          const is4BarMark = barNumber % 4 === 0;
          const is8BarMark = barNumber % 8 === 0;
          
          if (is8BarMark) {
            // 8-bar marks - ULTRA PROMINENT (trap phrases)
            ctx.strokeStyle = 'rgba(255, 50, 180, 0.15)';
            ctx.lineWidth = 8;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 50, 180, 0.4)';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(255, 50, 180, 0.6)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Neon accent
            ctx.strokeStyle = 'hsl(320 100% 60%)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'hsl(320 100% 60%)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, Math.min(40, height));
            ctx.stroke();
          } else if (is4BarMark) {
            // 4-bar marks - VERY PROMINENT (trap loops)
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.12)';
            ctx.lineWidth = 6;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 16;
            ctx.shadowColor = 'rgba(100, 150, 255, 0.4)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Cyan accent
            ctx.strokeStyle = primaryHsl;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = primaryHsl;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, Math.min(30, height));
            ctx.stroke();
          } else {
            // Regular bar lines - subtle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
        }
      }
    }
    
    ctx.shadowBlur = 0;
  }, [width, height, zoom, scrollX, bpm, gridSnap, gridResolution, gridMode, timeSignature]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
