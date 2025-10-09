/**
 * Spectrum Analyzer - Real-time FFT visualization
 */

import React, { useEffect, useRef } from 'react';

interface SpectrumAnalyzerProps {
  width: number;
  height: number;
  peakLevel?: { left: number; right: number };
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  width,
  height,
  peakLevel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Get computed CSS color values
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary').trim();
    const primaryHsl = `hsl(${primaryColor})`;
    const mutedForeground = getComputedStyle(document.documentElement)
      .getPropertyValue('--muted-foreground').trim();
    const mutedHsl = `hsl(${mutedForeground})`;
    
    // Mock spectrum data (in real implementation, would use AnalyserNode)
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw frequency bars
      const barCount = 32;
      const barWidth = width / barCount;
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, primaryHsl);
      gradient.addColorStop(0.5, 'hsl(191 100% 50%)'); // neon blue
      gradient.addColorStop(1, 'hsl(314 100% 65%)'); // neon pink
      
      for (let i = 0; i < barCount; i++) {
        // Mock data with some variation
        const value = Math.random() * 0.3 + 0.1 + (peakLevel ? (peakLevel.left + 60) / 60 * 0.4 : 0);
        const barHeight = value * height;
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * barWidth + 1,
          height - barHeight,
          barWidth - 2,
          barHeight
        );
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = primaryHsl;
        ctx.fillRect(
          i * barWidth + 1,
          height - barHeight,
          barWidth - 2,
          barHeight
        );
        ctx.shadowBlur = 0;
      }
      
      // Draw frequency labels
      ctx.fillStyle = mutedHsl;
      ctx.font = '8px monospace';
      ctx.fillText('20Hz', 2, height - 2);
      ctx.fillText('20kHz', width - 30, height - 2);
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, peakLevel]);
  
  return (
    <canvas
      ref={canvasRef}
      className="rounded glass"
    />
  );
};
