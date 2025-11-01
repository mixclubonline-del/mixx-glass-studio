/**
 * Spectrum Analyzer - Real-time FFT visualization
 */

import React, { useEffect, useRef } from 'react';

interface SpectrumAnalyzerProps {
  width: number;
  height: number;
  analyser?: AnalyserNode; // Direct FFT connection
  mode?: 'spectrum' | 'phase' | 'waveform';
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ 
  width, 
  height, 
  analyser,
  mode = 'spectrum'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  
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
    
    // Initialize frequency data array if we have analyser
    let dataArray: Uint8Array | null = null;
    if (analyser) {
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Get real FFT data if available
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray as any);
      }
      
      // Draw frequency bars
      const barCount = 32;
      const barWidth = width / barCount;
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, primaryHsl);
      gradient.addColorStop(0.5, 'hsl(191 100% 50%)'); // neon blue
      gradient.addColorStop(1, 'hsl(314 100% 65%)'); // neon pink
      
      for (let i = 0; i < barCount; i++) {
        let value: number;
        
        // Use real FFT data if available
        if (dataArray && analyser) {
          const binIndex = Math.floor(i * dataArray.length / barCount);
          value = dataArray[binIndex] / 255; // Normalize to 0-1
        } else {
          // Fallback to minimal idle animation
          value = Math.random() * 0.1;
        }
        
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
  }, [width, height, analyser]);
  
  return (
    <canvas
      ref={canvasRef}
      className="rounded glass"
    />
  );
};
