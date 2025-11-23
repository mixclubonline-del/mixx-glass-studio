/**
 * Enhanced Waveform Renderer - Real-time visualization with playback animation and peak indicators
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { useTimelineStore } from '@/store/timelineStore';

interface EnhancedWaveformRendererProps {
  audioBuffer: AudioBuffer | null;
  width: number;
  height: number;
  color: string;
  regionStartTime: number;
  regionDuration: number;
  bufferOffset?: number;
  peaks?: Float32Array;
  displayMode?: 'peak' | 'rms';
  zoom?: number;
}

export const EnhancedWaveformRenderer: React.FC<EnhancedWaveformRendererProps> = ({
  audioBuffer,
  width,
  height,
  color,
  regionStartTime,
  regionDuration,
  bufferOffset = 0,
  peaks,
  displayMode = 'peak',
  zoom = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { currentTime, isPlaying } = useTimelineStore();
  
  // Calculate real-time peak values
  const realtimePeaks = useRef<{ x: number; peak: number; timestamp: number }[]>([]);
  
  // Render static waveform
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
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate sample range based on bufferOffset and duration
    const startSample = Math.floor(bufferOffset * sampleRate);
    const endSample = Math.min(
      Math.floor((bufferOffset + regionDuration) * sampleRate),
      channelData.length
    );
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
    
    // Create futuristic gradient - blue to purple to pink
    const waveformGradient = ctx.createLinearGradient(0, 0, width, 0);
    waveformGradient.addColorStop(0, 'hsl(200, 85%, 65%)');     // Sky blue
    waveformGradient.addColorStop(0.25, 'hsl(220, 80%, 60%)');  // Electric blue
    waveformGradient.addColorStop(0.5, 'hsl(265, 75%, 60%)');   // Purple
    waveformGradient.addColorStop(0.75, 'hsl(290, 80%, 65%)');  // Violet
    waveformGradient.addColorStop(1, 'hsl(320, 85%, 65%)');     // Pink
    
    ctx.beginPath();
    ctx.strokeStyle = waveformGradient;
    ctx.lineWidth = 1;
    
    // Draw waveform
    for (let x = 0; x < width; x += detailLevel) {
      const start = startSample + Math.floor(x * samplesPerPixel);
      const end = Math.min(startSample + Math.floor((x + 1) * samplesPerPixel), endSample);
      
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
      ctx.lineTo(x, yMin);
    }
    
    ctx.stroke();
    
    // Add fill for better visibility with glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'hsl(275, 80%, 60%)';
    ctx.fillStyle = waveformGradient;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
  }, [audioBuffer, width, height, color, bufferOffset, regionDuration, zoom, displayMode]);
  
  // Render real-time peaks and playback position
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }
    
    const canvas = peaksCanvasRef.current;
    if (!canvas || !audioBuffer) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Check if playhead is within this region
      if (currentTime >= regionStartTime && currentTime <= regionStartTime + regionDuration) {
        // Calculate playback position within region
        const localTime = currentTime - regionStartTime;
        const playbackX = (localTime / regionDuration) * width;
        
        // Get current sample for peak detection
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const sampleIndex = Math.floor((bufferOffset + localTime) * sampleRate);
        
        if (sampleIndex >= 0 && sampleIndex < channelData.length) {
          const peak = Math.abs(channelData[sampleIndex]);
          
          // Add to peaks array with fade out
          realtimePeaks.current.push({
            x: playbackX,
            peak,
            timestamp: Date.now()
          });
          
          // Remove old peaks (older than 500ms)
          const now = Date.now();
          realtimePeaks.current = realtimePeaks.current.filter(p => now - p.timestamp < 500);
        }
        
        // Draw playback position overlay
        const gradient = ctx.createLinearGradient(0, 0, playbackX, 0);
        gradient.addColorStop(0, 'hsl(var(--prime) / 0.1)');
        gradient.addColorStop(1, 'hsl(var(--prime) / 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, playbackX, height);
        
        // Draw playback line
        ctx.strokeStyle = 'hsl(var(--neon-pink))';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playbackX, 0);
        ctx.lineTo(playbackX, height);
        ctx.stroke();
        
        // Draw peak indicator at playback position
        if (realtimePeaks.current.length > 0) {
          const latestPeak = realtimePeaks.current[realtimePeaks.current.length - 1];
          const peakHeight = latestPeak.peak * height * 0.5;
          
          // Peak pulse
          const centerY = height / 2;
          ctx.beginPath();
          ctx.arc(playbackX, centerY, peakHeight, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(var(--neon-pink) / 0.2)`;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(playbackX, centerY, peakHeight * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(var(--neon-pink) / 0.4)`;
          ctx.fill();
        }
      }
      
      // Draw fading peak indicators
      const now = Date.now();
      realtimePeaks.current.forEach(({ x, peak, timestamp }) => {
        const age = now - timestamp;
        const opacity = 1 - (age / 500); // Fade out over 500ms
        const centerY = height / 2;
        const peakY = centerY - (peak * height * 0.4);
        
        // Draw peak line
        ctx.strokeStyle = `hsl(var(--neon-pink) / ${opacity * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x, peakY);
        ctx.stroke();
        
        // Draw peak dot
        ctx.fillStyle = `hsl(var(--neon-pink) / ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, peakY, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, regionStartTime, regionDuration, audioBuffer, width, height, bufferOffset]);
  
  return (
    <div className="relative w-full h-full">
      {/* Static waveform layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      {/* Real-time peaks and playback overlay */}
      <canvas
        ref={peaksCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
};
