/**
 * Waveform Renderer - High-performance canvas-based waveform visualization
 */

import React, { useEffect, useRef } from 'react';

interface WaveformRendererProps {
  audioBuffer: AudioBuffer | null;
  width: number;
  height: number;
  color: string;
  peaks?: Float32Array;
  startTime?: number;
  duration?: number;
}

export const WaveformRenderer: React.FC<WaveformRendererProps> = ({
  audioBuffer,
  width,
  height,
  color,
  peaks,
  startTime = 0,
  duration
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    
    const ctx = canvas.getContext('2d');
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
    
    // Draw waveform
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / width);
    const centerY = height / 2;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x++) {
      const start = Math.floor(x * samplesPerPixel);
      const end = Math.floor(start + samplesPerPixel);
      
      let min = 1;
      let max = -1;
      
      for (let i = start; i < end; i++) {
        const sample = channelData[i] || 0;
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      const yMax = centerY - (max * centerY * 0.9);
      const yMin = centerY - (min * centerY * 0.9);
      
      if (x === 0) {
        ctx.moveTo(x, yMax);
      } else {
        ctx.lineTo(x, yMax);
      }
    }
    
    // Mirror for bottom half
    for (let x = width - 1; x >= 0; x--) {
      const start = Math.floor(x * samplesPerPixel);
      const end = Math.floor(start + samplesPerPixel);
      
      let min = 1;
      
      for (let i = start; i < end; i++) {
        const sample = channelData[i] || 0;
        if (sample < min) min = sample;
      }
      
      const yMin = centerY - (min * centerY * 0.9);
      ctx.lineTo(x, yMin);
    }
    
    ctx.closePath();
    ctx.fillStyle = color + '40'; // Add transparency
    ctx.fill();
    ctx.stroke();
    
  }, [audioBuffer, width, height, color]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
    />
  );
};
