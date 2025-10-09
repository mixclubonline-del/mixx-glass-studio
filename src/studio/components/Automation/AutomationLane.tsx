/**
 * Automation Lane - Visual automation editor
 */

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AutomationPoint {
  bar: number;
  value: number; // 0-100
}

interface AutomationLaneProps {
  trackId: string;
  parameter: string;
  color?: string;
  height?: number;
  barWidth?: number;
  totalBars?: number;
}

export function AutomationLane({
  trackId,
  parameter,
  color = 'hsl(var(--primary))',
  height = 64,
  barWidth = 90,
  totalBars = 16,
}: AutomationLaneProps) {
  const [points, setPoints] = useState<AutomationPoint[]>([
    { bar: 1, value: 75 },
    { bar: 4, value: 30 },
    { bar: 8, value: 80 },
    { bar: 12, value: 50 },
  ]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  
  const handleClick = (e: React.MouseEvent) => {
    if (!laneRef.current) return;
    
    const rect = laneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const bar = Math.max(0, Math.min(totalBars, x / barWidth));
    const value = Math.max(0, Math.min(100, (1 - y / height) * 100));
    
    // Check if clicking near existing point
    const clickedPoint = points.findIndex(p => 
      Math.abs(p.bar * barWidth - x) < 10 && 
      Math.abs((1 - p.value / 100) * height - y) < 10
    );
    
    if (clickedPoint !== -1) {
      setSelectedPoint(clickedPoint);
    } else {
      // Add new point
      const newPoints = [...points, { bar, value }].sort((a, b) => a.bar - b.bar);
      setPoints(newPoints);
    }
  };
  
  const handleDragPoint = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!laneRef.current) return;
    
    const rect = laneRef.current.getBoundingClientRect();
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const bar = Math.max(0, Math.min(totalBars, x / barWidth));
      const value = Math.max(0, Math.min(100, (1 - y / height) * 100));
      
      setPoints(prev => {
        const newPoints = [...prev];
        newPoints[index] = { bar, value };
        return newPoints.sort((a, b) => a.bar - b.bar);
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const deletePoint = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPoints(prev => prev.filter((_, i) => i !== index));
    setSelectedPoint(null);
  };
  
  // Generate path for automation curve
  const generatePath = () => {
    if (points.length === 0) return '';
    
    let path = `M 0 ${height / 2}`;
    
    points.forEach((point) => {
      const x = point.bar * barWidth;
      const y = (1 - point.value / 100) * height;
      path += ` L ${x} ${y}`;
    });
    
    path += ` L ${totalBars * barWidth} ${(1 - (points[points.length - 1]?.value || 50) / 100) * height}`;
    
    return path;
  };
  
  return (
    <div className="relative border-b border-border/30">
      <div className="absolute left-0 top-0 bottom-0 w-[260px] px-4 flex items-center text-xs text-muted-foreground border-r border-border/50 bg-muted/20">
        {parameter}
      </div>
      
      <div 
        ref={laneRef}
        className="ml-[260px] relative cursor-crosshair"
        style={{ height: `${height}px`, width: `${totalBars * barWidth}px` }}
        onClick={handleClick}
      >
        {/* Grid */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: totalBars }, (_, i) => (
            <div
              key={i}
              className="border-r border-border/10"
              style={{ width: `${barWidth}px` }}
            />
          ))}
        </div>
        
        {/* Center line */}
        <div className="absolute left-0 right-0 border-t border-border/20" style={{ top: '50%' }} />
        
        {/* Automation curve */}
        <svg className="absolute inset-0 pointer-events-none">
          <path
            d={generatePath()}
            stroke={color}
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
        </svg>
        
        {/* Automation points */}
        {points.map((point, index) => (
          <div
            key={index}
            className={cn(
              "absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 bg-background cursor-move transition-all",
              selectedPoint === index ? "scale-125" : "hover:scale-110"
            )}
            style={{
              left: `${point.bar * barWidth}px`,
              top: `${(1 - point.value / 100) * height}px`,
              borderColor: color,
            }}
            onMouseDown={(e) => handleDragPoint(index, e)}
            onDoubleClick={(e) => deletePoint(index, e)}
          />
        ))}
      </div>
    </div>
  );
}
