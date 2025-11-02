/**
 * Per-Track Meter - Advanced metering for individual tracks
 */

import React, { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerTrackMeterProps {
  trackId: string;
  analyzer?: AnalyserNode;
  showSpectrum?: boolean;
  compact?: boolean;
}

export const PerTrackMeter: React.FC<PerTrackMeterProps> = ({
  trackId,
  analyzer,
  showSpectrum = false,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peak, setPeak] = useState(0);
  const [rms, setRms] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyzer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeData = new Float32Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas) return;

      // Get frequency data for spectrum
      analyzer.getByteFrequencyData(dataArray);
      
      // Get time data for peak/RMS
      analyzer.getFloatTimeDomainData(timeData);

      // Calculate peak and RMS
      let peakValue = 0;
      let sumSquares = 0;
      
      for (let i = 0; i < timeData.length; i++) {
        const abs = Math.abs(timeData[i]);
        if (abs > peakValue) peakValue = abs;
        sumSquares += timeData[i] * timeData[i];
      }
      
      const rmsValue = Math.sqrt(sumSquares / timeData.length);
      setPeak(peakValue);
      setRms(rmsValue);

      // Clear canvas
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (showSpectrum) {
        // Draw spectrum analyzer
        const barWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          
          // Color gradient based on frequency
          const hue = (i / bufferLength) * 120; // 0-120 (red to green)
          ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
          x += barWidth;
        }
      } else {
        // Draw peak meter bars
        const peakHeight = peakValue * canvas.height;
        const rmsHeight = rmsValue * canvas.height;

        // RMS bar (background)
        ctx.fillStyle = 'hsl(var(--primary) / 0.3)';
        ctx.fillRect(0, canvas.height - rmsHeight, canvas.width / 2 - 2, rmsHeight);

        // Peak bar
        const peakColor = peakValue > 0.95 ? '#ef4444' : peakValue > 0.8 ? '#f59e0b' : '#22c55e';
        ctx.fillStyle = peakColor;
        ctx.fillRect(canvas.width / 2 + 2, canvas.height - peakHeight, canvas.width / 2 - 2, peakHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyzer, showSpectrum]);

  if (!analyzer) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted/30 rounded',
        compact ? 'h-8 w-12' : 'h-16 w-24'
      )}>
        <Activity className="h-3 w-3 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        width={compact ? 48 : 96}
        height={compact ? 32 : 64}
        className="rounded border border-border/50 bg-background"
      />
      {!compact && (
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>P: {(peak * 100).toFixed(0)}%</span>
          <span>R: {(rms * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};
