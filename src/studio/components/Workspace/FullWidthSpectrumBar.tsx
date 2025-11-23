/**
 * Full Width Spectrum Bar - Prominent frequency visualization
 */

import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timelineStore';

export const FullWidthSpectrumBar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTime, duration } = useTimelineStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw gradient background - futuristic blue to purple to pink
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'hsl(200, 80%, 60%)');      // Sky blue
      gradient.addColorStop(0.35, 'hsl(240, 75%, 60%)');   // Electric blue
      gradient.addColorStop(0.65, 'hsl(275, 70%, 55%)');   // Purple
      gradient.addColorStop(1, 'hsl(330, 75%, 60%)');      // Pink

      // Draw frequency bars
      const barCount = 120;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const normalizedHeight = Math.random() * 0.6 + 0.2; // Simulated frequency data
        const barHeight = height * normalizedHeight;

        // Determine color based on position for glow
        const hue = 200 + (i / barCount) * 130; // 200 (blue) to 330 (pink)
        const glowColor = `hsl(${hue}, 80%, 60%)`;

        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.4 + normalizedHeight * 0.5;
        
        // Draw bar with glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = glowColor;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        ctx.shadowBlur = 0;
      }

      // Draw playhead position
      if (duration > 0) {
        const progress = currentTime / duration;
        const playheadX = width * progress;

        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    // Set canvas size
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      draw();
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const interval = setInterval(draw, 50); // 20fps for performance

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateSize);
    };
  }, [currentTime, duration]);

  return (
    <div className="h-[80px] border-b border-border/30 relative overflow-hidden bg-gradient-to-b from-background/60 via-background/40 to-background/20">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'auto' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
  );
};
