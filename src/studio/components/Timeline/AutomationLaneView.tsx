/**
 * Automation Lane View - Display and edit automation data
 */

import React, { useState, useRef } from 'react';
import { Volume2, Move, Sliders } from 'lucide-react';

interface AutomationPoint {
  time: number;
  value: number;
}

interface AutomationLaneViewProps {
  trackId: string;
  type: 'volume' | 'pan' | 'plugin';
  points: AutomationPoint[];
  zoom: number;
  height?: number;
  color?: string;
  onPointAdd?: (time: number, value: number) => void;
  onPointUpdate?: (index: number, time: number, value: number) => void;
  onPointDelete?: (index: number) => void;
}

export const AutomationLaneView: React.FC<AutomationLaneViewProps> = ({
  trackId,
  type,
  points,
  zoom,
  height = 60,
  color = '#a855f7',
  onPointAdd,
  onPointUpdate,
  onPointDelete
}) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getIcon = () => {
    switch (type) {
      case 'volume': return <Volume2 size={14} />;
      case 'pan': return <Move size={14} />;
      case 'plugin': return <Sliders size={14} />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'volume': return 'Volume';
      case 'pan': return 'Pan';
      case 'plugin': return 'Parameter';
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = x / zoom;
    const value = 1 - (y / height);

    // Check if clicking near existing point
    const clickThreshold = 8;
    const clickedPointIndex = points.findIndex(p => {
      const px = p.time * zoom;
      const py = (1 - p.value) * height;
      return Math.abs(px - x) < clickThreshold && Math.abs(py - y) < clickThreshold;
    });

    if (clickedPointIndex !== -1) {
      // Select existing point
      setSelectedPoint(clickedPointIndex);
    } else {
      // Add new point
      onPointAdd?.(time, Math.max(0, Math.min(1, value)));
    }
  };

  const handlePointDrag = (e: React.MouseEvent) => {
    if (!isDragging || selectedPoint === null) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = Math.max(0, x / zoom);
    const value = Math.max(0, Math.min(1, 1 - (y / height)));

    onPointUpdate?.(selectedPoint, time, value);
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.offsetWidth, y);
      ctx.stroke();
    }

    if (points.length === 0) return;

    // Draw automation curve
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Sort points by time
    const sortedPoints = [...points].sort((a, b) => a.time - b.time);

    sortedPoints.forEach((point, i) => {
      const x = point.time * zoom;
      const y = (1 - point.value) * height;

      if (i === 0) {
        ctx.moveTo(0, y);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Extend to end
    const lastPoint = sortedPoints[sortedPoints.length - 1];
    ctx.lineTo(canvas.offsetWidth, (1 - lastPoint.value) * height);
    ctx.stroke();

    // Draw points
    sortedPoints.forEach((point, i) => {
      const x = point.time * zoom;
      const y = (1 - point.value) * height;

      ctx.fillStyle = i === selectedPoint ? '#ffffff' : color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      if (i === selectedPoint) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [points, zoom, height, color, selectedPoint]);

  return (
    <div
      ref={containerRef}
      className="relative border-t border-border/20"
      style={{ height: `${height}px` }}
    >
      {/* Header */}
      <div className="absolute top-1 left-2 z-10 flex items-center gap-1 text-xs text-muted-foreground">
        {getIcon()}
        <span>{getLabel()}</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full cursor-crosshair"
        style={{ height: `${height}px` }}
        onClick={handleCanvasClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseMove={handlePointDrag}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      />

      {/* Value indicator */}
      {selectedPoint !== null && points[selectedPoint] && (
        <div className="absolute top-1 right-2 text-xs glass-ultra px-2 py-0.5 rounded">
          {(points[selectedPoint].value * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
};
