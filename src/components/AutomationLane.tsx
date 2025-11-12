// FIX: Imported useEffect hook.
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { AutomationPoint } from '../App';
import { TrackData } from '../App';

interface AutomationLaneProps {
  trackId: string;
  fxId: string; // Add fxId to props
  paramName: string; // Add paramName to props
  points: AutomationPoint[];
  trackColor: TrackData['trackColor'];
  height: number;
  duration: number;
  pixelsPerSecond: number;
  onAddPoint: (point: AutomationPoint) => void;
  onUpdatePoint: (index: number, point: AutomationPoint) => void;
  onDeletePoint: (index: number) => void;
}

const colorMap = {
  cyan: '#06b6d4',
  magenta: '#d946ef',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
};

const AutomationLane: React.FC<AutomationLaneProps> = ({
  points,
  trackColor,
  height,
  duration,
  pixelsPerSecond,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
}) => {
  const laneRef = useRef<HTMLDivElement>(null);
  const [draggedPoint, setDraggedPoint] = useState<{ index: number; initialY: number; initialValue: number } | null>(null);
  const color = colorMap[trackColor];
  const totalWidth = duration * pixelsPerSecond;

  const valueToY = useCallback((value: number) => {
    // Map value (0-1.2) to y-coordinate (height-5 to 5)
    return height - 5 - (value / 1.2) * (height - 10);
  }, [height]);

  const yToValue = useCallback((y: number) => {
    // Map y-coordinate to value
    const val = (height - 5 - y) / (height - 10) * 1.2;
    return Math.max(0, Math.min(1.2, val));
  }, [height]);
  
  const timeToX = useCallback((time: number) => time * pixelsPerSecond, [pixelsPerSecond]);
  const xToTime = useCallback((x: number) => x / pixelsPerSecond, [pixelsPerSecond]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laneRef.current) return;
    const rect = laneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = xToTime(x);
    const value = yToValue(e.clientY - rect.top);
    onAddPoint({ time, value });
  };

  const handlePointMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDraggedPoint({ index, initialY: e.clientY, initialValue: points[index].value });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedPoint || !laneRef.current) return;

    const rect = laneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for deletion by dragging out of bounds
    if (y < -20 || y > height + 20) {
      onDeletePoint(draggedPoint.index);
      setDraggedPoint(null);
      return;
    }

    const newTime = xToTime(x);
    const newValue = yToValue(y);

    onUpdatePoint(draggedPoint.index, { time: newTime, value: newValue });
  }, [draggedPoint, height, onDeletePoint, onUpdatePoint, xToTime, yToValue]);

  const handleMouseUp = useCallback(() => {
    setDraggedPoint(null);
  }, []);

  useEffect(() => {
    if (draggedPoint) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPoint, handleMouseMove, handleMouseUp]);
  
  const pathData = points.reduce((d, p, i) => {
      const x = timeToX(p.time);
      const y = valueToY(p.value);
      return d + (i === 0 ? `M ${x},${y}` : ` L ${x},${y}`);
  }, '');
  
  return (
    <div
      ref={laneRef}
      className="w-full relative bg-black/30 border-t border-white/10"
      style={{ height }}
      onMouseDown={handleMouseDown}
    >
      <svg width={totalWidth} height={height} className="absolute top-0 left-0">
        <path d={pathData} stroke={color} strokeWidth="2" fill="none" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={timeToX(p.time)}
            cy={valueToY(p.value)}
            r="4"
            fill={color}
            stroke="black"
            strokeWidth="1.5"
            className="cursor-pointer"
            onMouseDown={(e) => handlePointMouseDown(e, i)}
          />
        ))}
      </svg>
    </div>
  );
};

export default AutomationLane;