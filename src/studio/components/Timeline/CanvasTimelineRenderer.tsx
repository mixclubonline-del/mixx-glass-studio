/**
 * Canvas Timeline Renderer - High-performance canvas-based timeline
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { Region } from '@/types/timeline';

interface CanvasTimelineRendererProps {
  width: number;
  height: number;
  trackHeight: number;
  onRegionClick?: (regionId: string) => void;
  onSeek?: (time: number) => void;
}

export const CanvasTimelineRenderer: React.FC<CanvasTimelineRendererProps> = ({
  width,
  height,
  trackHeight,
  onRegionClick,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTime, zoom, scrollX, isPlaying } = useTimelineStore();
  const { tracks, regions } = useTracksStore();

  // Render timeline
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = width * dpr;
    const h = height * dpr;

    // Set canvas size
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = 'rgba(13, 13, 20, 1)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid (1-second intervals)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const startSec = Math.floor(scrollX / zoom);
    const endSec = Math.ceil((scrollX + width) / zoom);
    
    for (let sec = startSec; sec <= endSec; sec++) {
      const x = sec * zoom - scrollX;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw tracks and regions
    tracks.forEach((track, trackIndex) => {
      const trackY = trackIndex * trackHeight;
      const trackRegions = regions.filter(r => r.trackId === track.id);

      // Track lane background
      ctx.fillStyle = trackIndex % 2 === 0 
        ? 'rgba(15, 15, 22, 0.5)' 
        : 'rgba(10, 10, 16, 0.5)';
      ctx.fillRect(0, trackY, width, trackHeight);

      // Draw regions
      trackRegions.forEach(region => {
        drawRegion(ctx, region, trackY, trackHeight, zoom, scrollX);
      });
    });

    // Draw playhead
    const playheadX = currentTime * zoom - scrollX;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = isPlaying ? '#FF6B6B' : '#30E1C6';
      ctx.lineWidth = 2;
      ctx.shadowColor = isPlaying ? '#FF6B6B' : '#30E1C6';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  }, [width, height, trackHeight, tracks, regions, currentTime, zoom, scrollX, isPlaying]);

  // Re-render on changes
  useEffect(() => {
    render();
  }, [render]);

  // Click handler
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = (x + scrollX) / zoom;
    const trackIndex = Math.floor(y / trackHeight);

    if (trackIndex >= 0 && trackIndex < tracks.length) {
      const track = tracks[trackIndex];
      const clickedRegion = regions.find(
        r => r.trackId === track.id && 
             time >= r.startTime && 
             time <= r.startTime + r.duration
      );

      if (clickedRegion) {
        onRegionClick?.(clickedRegion.id);
      } else {
        onSeek?.(time);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="cursor-crosshair"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
};

/**
 * Draw a region on the canvas
 */
function drawRegion(
  ctx: CanvasRenderingContext2D,
  region: Region,
  trackY: number,
  trackHeight: number,
  zoom: number,
  scrollX: number
) {
  const x = region.startTime * zoom - scrollX;
  const w = region.duration * zoom;
  const h = trackHeight - 8;
  const y = trackY + 4;

  // Region background
  ctx.fillStyle = `${region.color}15`;
  ctx.strokeStyle = `${region.color}80`;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 4);

  // Region name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const padding = 8;
  const text = region.name;
  const textWidth = ctx.measureText(text).width;
  
  if (textWidth + padding * 2 < w) {
    ctx.fillText(text, x + padding, y + padding);
  }

  // Waveform (if available)
  if (region.audioBuffer && w > 20) {
    drawWaveform(ctx, region, x, y, w, h);
  }
}

/**
 * Draw waveform for a region
 */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  region: Region,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!region.audioBuffer) return;

  const buffer = region.audioBuffer;
  const channelData = buffer.getChannelData(0);
  const samples = channelData.length;
  const samplesPerPixel = Math.max(1, Math.floor(samples / w));

  ctx.strokeStyle = '#30E1C6';
  ctx.lineWidth = 1;
  ctx.beginPath();

  const centerY = y + h / 2;
  const amplitude = h * 0.4;

  for (let i = 0; i < w; i++) {
    const start = Math.floor(i * samplesPerPixel);
    const end = Math.min(samples, start + samplesPerPixel);

    let min = 0;
    let max = 0;

    for (let j = start; j < end; j++) {
      const value = channelData[j];
      if (value < min) min = value;
      if (value > max) max = value;
    }

    const yMin = centerY + min * amplitude;
    const yMax = centerY + max * amplitude;

    ctx.moveTo(x + i, yMin);
    ctx.lineTo(x + i, yMax);
  }

  ctx.stroke();
}

/**
 * Draw rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
