/**
 * Waveform Renderer - High-performance canvas-based waveform visualization
 * Phase 3: Enhanced with WaveformCache integration and zoom-aware rendering
 */

import React, { useEffect, useRef } from 'react';
import { waveformCache } from '@/audio/WaveformCache';

interface WaveformRendererProps {
  regionId: string;
  audioBuffer: AudioBuffer | null;
  width: number;
  height: number;
  color: string;
  zoom?: number; // Pixels per second
  startTime?: number;
  duration?: number;
  fadeIn?: number; // Fade in duration in seconds
  fadeOut?: number; // Fade out duration in seconds
}

export const WaveformRenderer: React.FC<WaveformRendererProps> = ({
  regionId,
  audioBuffer,
  width,
  height,
  color,
  zoom = 100,
  startTime = 0,
  duration,
  fadeIn = 0,
  fadeOut = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTimeRef = useRef<number>(0);
  
  useEffect(() => {
    const startRender = performance.now();
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get cached peaks for this zoom level
    const peaks = waveformCache.getPeaks(regionId, audioBuffer, zoom);
    const samplesPerPixel = Math.max(128, Math.floor(audioBuffer.sampleRate / zoom));
    const centerY = height / 2;
    
    // Draw waveform using cached peaks
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    
    const numPixels = Math.min(width, peaks.length / 2);
    
    // Top half (max values)
    for (let x = 0; x < numPixels; x++) {
      const peakIndex = x * 2;
      const max = peaks[peakIndex + 1] || 0;
      const yMax = centerY - (max * centerY * 0.85);
      
      if (x === 0) {
        ctx.moveTo(x, yMax);
      } else {
        ctx.lineTo(x, yMax);
      }
    }
    
    // Bottom half (min values)
    for (let x = numPixels - 1; x >= 0; x--) {
      const peakIndex = x * 2;
      const min = peaks[peakIndex] || 0;
      const yMin = centerY - (min * centerY * 0.85);
      ctx.lineTo(x, yMin);
    }
    
    ctx.closePath();
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '60');
    gradient.addColorStop(0.5, color + '30');
    gradient.addColorStop(1, color + '60');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.stroke();
    
    // Draw fade overlays
    if (fadeIn > 0 || fadeOut > 0) {
      const fadeInPixels = (fadeIn * zoom);
      const fadeOutPixels = (fadeOut * zoom);
      
      // Fade in
      if (fadeIn > 0 && fadeInPixels > 0) {
        const fadeGradient = ctx.createLinearGradient(0, 0, fadeInPixels, 0);
        fadeGradient.addColorStop(0, 'rgba(0,0,0,0.4)');
        fadeGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fadeGradient;
        ctx.fillRect(0, 0, fadeInPixels, height);
      }
      
      // Fade out
      if (fadeOut > 0 && fadeOutPixels > 0) {
        const fadeGradient = ctx.createLinearGradient(width - fadeOutPixels, 0, width, 0);
        fadeGradient.addColorStop(0, 'rgba(0,0,0,0)');
        fadeGradient.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = fadeGradient;
        ctx.fillRect(width - fadeOutPixels, 0, fadeOutPixels, height);
      }
    }
    
    // Track render performance (target: ≤16ms)
    renderTimeRef.current = performance.now() - startRender;
    if (renderTimeRef.current > 16) {
      console.warn(`⚠️ Waveform render slow: ${renderTimeRef.current.toFixed(2)}ms (target: ≤16ms)`);
    }
    
  }, [regionId, audioBuffer, width, height, color, zoom, fadeIn, fadeOut]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
};
