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
  displayMode?: 'peak' | 'rms';
  zoom?: number;
}

export const WaveformRenderer: React.FC<WaveformRendererProps> = ({
  audioBuffer,
  width,
  height,
  color,
  peaks,
  startTime = 0,
  duration,
  displayMode = 'peak',
  zoom = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Performance measurement
    const renderStart = performance.now();
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform - respect startTime and duration
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate sample range based on startTime and duration
    const startSample = startTime ? Math.floor(startTime * sampleRate) : 0;
    const endSample = duration 
      ? Math.min(Math.floor((startTime + duration) * sampleRate), channelData.length)
      : channelData.length;
    const totalSamples = endSample - startSample;
    
    // Adaptive detail based on zoom level
    const detailLevel = zoom > 200 ? 1 : zoom > 100 ? 2 : zoom > 50 ? 4 : 8;
    const samplesPerPixel = Math.max(1, Math.floor(totalSamples / width));
    const centerY = height / 2;
    
    // Calculate max amplitude for gradient selection
    let maxAmplitude = 0;
    for (let i = startSample; i < endSample; i += Math.floor(samplesPerPixel / 10)) {
      const sample = Math.abs(channelData[i] || 0);
      if (sample > maxAmplitude) maxAmplitude = sample;
    }
    
    // Create amplitude-based ice-to-fire gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (maxAmplitude > 0.8) {
      // Hot zone - fire colors
      gradient.addColorStop(0, 'hsl(0 100% 70%)');
      gradient.addColorStop(0.5, 'hsl(30 100% 60%)');
      gradient.addColorStop(1, 'hsl(45 100% 50%)');
    } else if (maxAmplitude > 0.5) {
      // Warm zone
      gradient.addColorStop(0, 'hsl(275 100% 70%)');
      gradient.addColorStop(1, 'hsl(314 100% 65%)');
    } else {
      // Cool zone - ice colors
      gradient.addColorStop(0, 'hsl(191 100% 60%)');
      gradient.addColorStop(1, 'hsl(220 100% 70%)');
    }
    
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x += detailLevel) {
      const start = startSample + Math.floor(x * samplesPerPixel);
      const end = Math.min(startSample + Math.floor((x + 1) * samplesPerPixel), endSample);
      
      let min = 1;
      let max = -1;
      let rmsSum = 0;
      let sampleCount = 0;
      
      for (let i = start; i < end; i++) {
        const sample = channelData[i] || 0;
        if (sample < min) min = sample;
        if (sample > max) max = sample;
        
        if (displayMode === 'rms') {
          rmsSum += sample * sample;
          sampleCount++;
        }
      }
      
      // Use RMS if in RMS mode
      if (displayMode === 'rms' && sampleCount > 0) {
        const rms = Math.sqrt(rmsSum / sampleCount);
        max = rms;
        min = -rms;
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
    for (let x = width - 1; x >= 0; x -= detailLevel) {
      const start = startSample + Math.floor(x * samplesPerPixel);
      const end = Math.min(startSample + Math.floor((x + 1) * samplesPerPixel), endSample);
      
      let min = 1;
      let rmsSum = 0;
      let sampleCount = 0;
      
      for (let i = start; i < end; i++) {
        const sample = channelData[i] || 0;
        if (sample < min) min = sample;
        
        if (displayMode === 'rms') {
          rmsSum += sample * sample;
          sampleCount++;
        }
      }
      
      if (displayMode === 'rms' && sampleCount > 0) {
        const rms = Math.sqrt(rmsSum / sampleCount);
        min = -rms;
      }
      
      const yMin = centerY - (min * centerY * 0.9);
      ctx.lineTo(x, yMin);
    }
    
    ctx.closePath();
    
    // Use gradient for fill with transparency
    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (maxAmplitude > 0.8) {
      fillGradient.addColorStop(0, 'hsl(0 100% 70% / 0.3)');
      fillGradient.addColorStop(0.5, 'hsl(30 100% 60% / 0.2)');
      fillGradient.addColorStop(1, 'hsl(45 100% 50% / 0.15)');
    } else if (maxAmplitude > 0.5) {
      fillGradient.addColorStop(0, 'hsl(275 100% 70% / 0.3)');
      fillGradient.addColorStop(1, 'hsl(314 100% 65% / 0.2)');
    } else {
      fillGradient.addColorStop(0, 'hsl(191 100% 60% / 0.3)');
      fillGradient.addColorStop(1, 'hsl(220 100% 70% / 0.2)');
    }
    ctx.fillStyle = fillGradient;
    ctx.fill();
    ctx.stroke();
    
    // Log performance
    const renderTime = performance.now() - renderStart;
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Waveform render took ${renderTime.toFixed(2)}ms`);
    }
    
  }, [audioBuffer, width, height, color, displayMode, zoom, startTime, duration]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
    />
  );
};
