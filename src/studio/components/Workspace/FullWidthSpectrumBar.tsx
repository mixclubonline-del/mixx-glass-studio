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

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'hsl(200, 70%, 50%)');
      gradient.addColorStop(0.5, 'hsl(275, 70%, 50%)');
      gradient.addColorStop(1, 'hsl(330, 70%, 50%)');

      // Draw frequency bars
      const barCount = 120;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const normalizedHeight = Math.random() * 0.6 + 0.2; // Simulated frequency data
        const barHeight = height * normalizedHeight;

        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3 + normalizedHeight * 0.4;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
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
    <div className="h-[80px] border-b border-border/30 relative overflow-hidden bg-background/40">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'auto' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
    </div>
  );
};
