import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

export function Timeline({ currentTime, duration, isPlaying, onSeek }: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, 'hsla(240, 10%, 12%, 0.6)');
    gradient.addColorStop(1, 'hsla(240, 10%, 6%, 0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Waveform visualization (placeholder)
    ctx.strokeStyle = 'hsla(275, 100%, 65%, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = 0; x < rect.width; x += 2) {
      const progress = x / rect.width;
      const wave = Math.sin(progress * Math.PI * 20) * Math.sin(progress * Math.PI * 3);
      const y = rect.height / 2 + wave * (rect.height / 4);
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Time markers
    const markers = 10;
    ctx.fillStyle = 'hsla(0, 0%, 100%, 0.3)';
    ctx.font = '10px Inter';
    
    for (let i = 0; i <= markers; i++) {
      const x = (i / markers) * rect.width;
      const time = (i / markers) * duration;
      
      ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.1)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
      
      ctx.fillText(formatTime(time), x + 4, 12);
    }

    // Playhead
    const playheadX = duration > 0 ? (currentTime / duration) * rect.width : 0;
    
    // Playhead glow
    const playheadGradient = ctx.createRadialGradient(playheadX, rect.height / 2, 0, playheadX, rect.height / 2, 30);
    playheadGradient.addColorStop(0, 'hsla(191, 100%, 50%, 0.4)');
    playheadGradient.addColorStop(1, 'hsla(191, 100%, 50%, 0)');
    ctx.fillStyle = playheadGradient;
    ctx.fillRect(playheadX - 30, 0, 60, rect.height);
    
    // Playhead line
    ctx.strokeStyle = 'hsl(191, 100%, 50%)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'hsl(191, 100%, 50%)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, rect.height);
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [currentTime, duration, isPlaying]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const seekTime = progress * duration;
    
    onSeek(Math.max(0, Math.min(duration, seekTime)));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-24 rounded-lg overflow-hidden glass cursor-pointer",
        "hover:shadow-[0_0_30px_hsl(var(--neon-blue)/0.3)] transition-all"
      )}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Time display */}
      <div className="absolute top-2 right-2 glass px-3 py-1 rounded text-xs font-mono">
        <span className="text-[hsl(var(--neon-blue))]">{formatTime(currentTime)}</span>
        <span className="text-muted-foreground mx-1">/</span>
        <span className="text-foreground">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}