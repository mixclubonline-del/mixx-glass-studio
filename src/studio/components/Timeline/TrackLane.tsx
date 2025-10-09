/**
 * TrackLane - canvas-based track rendering with waveforms
 */

import { useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { Region as RegionType } from '@/types/timeline';
import { waveformCache } from '@/audio/WaveformCache';

interface TrackLaneProps {
  trackId: string;
  trackName: string;
  trackColor: string;
  regions: RegionType[];
  width: number;
  height: number;
  audioBuffers: Map<string, AudioBuffer>;
}

export function TrackLane({
  trackId,
  trackName,
  trackColor,
  regions,
  width,
  height,
  audioBuffers,
}: TrackLaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoom, scrollX, selectedRegions } = useTimelineStore();
  
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
    
    // Background with track color tint
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${trackColor}15`);
    gradient.addColorStop(1, `${trackColor}05`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw regions
    regions.forEach((region) => {
      drawRegion(ctx, region, audioBuffers.get(trackId));
    });
    
  }, [width, height, zoom, scrollX, regions, trackColor, audioBuffers, selectedRegions, trackId]);
  
  const drawRegion = (ctx: CanvasRenderingContext2D, region: RegionType, buffer?: AudioBuffer) => {
    const regionX = (region.startTime * zoom) - scrollX;
    const regionWidth = region.duration * zoom;
    
    // Don't render if off-screen
    if (regionX + regionWidth < 0 || regionX > width) return;
    
    const isSelected = selectedRegions.has(region.id);
    
    // Region background
    ctx.fillStyle = region.color + (isSelected ? '40' : '25');
    ctx.fillRect(regionX, 0, regionWidth, height);
    
    // Border
    ctx.strokeStyle = region.color + (isSelected ? 'AA' : '66');
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(regionX, 0, regionWidth, height);
    
    // Waveform
    if (buffer) {
      const peaks = waveformCache.getPeaks(region.id, buffer, zoom);
      drawWaveform(ctx, peaks, regionX, regionWidth);
    }
    
    // Region name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '11px Inter';
    ctx.fillText(region.name, regionX + 6, 16);
    
    // Selection glow
    if (isSelected) {
      ctx.shadowColor = region.color;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = region.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(regionX, 0, regionWidth, height);
      ctx.shadowBlur = 0;
    }
  };
  
  const drawWaveform = (ctx: CanvasRenderingContext2D, peaks: Float32Array, startX: number, regionWidth: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const centerY = height / 2;
    const amplitude = height * 0.35;
    const numPeaks = peaks.length / 2;
    const pixelsPerPeak = regionWidth / numPeaks;
    
    for (let i = 0; i < numPeaks; i++) {
      const x = startX + (i * pixelsPerPeak);
      const min = peaks[i * 2];
      const max = peaks[i * 2 + 1];
      
      const yMin = centerY - (min * amplitude);
      const yMax = centerY - (max * amplitude);
      
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    
    ctx.stroke();
  };
  
  return (
    <div className="relative border-b border-border/50">
      <canvas ref={canvasRef} className="cursor-pointer" />
    </div>
  );
}
