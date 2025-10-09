/**
 * RotaryKnob - 3D rotary knob with 270° arc and glow effects
 */

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RotaryKnobProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  size?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  color?: string;
}

export function RotaryKnob({
  value,
  onChange,
  label,
  unit = '',
  size = 60,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
  color = 'hsl(var(--neon-blue))',
}: RotaryKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);
  
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const delta = (dragStartY.current - e.clientY) / 100;
      const newValue = Math.max(0, Math.min(1, dragStartValue.current + delta));
      const snappedValue = Math.round(newValue / step) * step;
      
      setDisplayValue(snappedValue);
      onChange(snappedValue);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, onChange, step]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = displayValue;
  };
  
  const handleDoubleClick = () => {
    if (disabled) return;
    const defaultValue = (min + max) / 2;
    const normalizedDefault = (defaultValue - min) / (max - min);
    onChange(normalizedDefault);
  };
  
  // Calculate rotation angle (270° arc, -135° to +135°)
  const rotation = -135 + (displayValue * 270);
  
  // Format display value
  const formattedValue = () => {
    const actualValue = min + (displayValue * (max - min));
    return actualValue.toFixed(2);
  };
  
  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}
      
      <div
        ref={knobRef}
        className={cn(
          "relative rounded-full cursor-pointer transition-shadow",
          isDragging && "shadow-[0_0_20px_hsl(var(--neon-blue)/0.5)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Outer ring with gradient */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              from 225deg,
              ${color} 0deg,
              ${color} ${displayValue * 270}deg,
              hsl(var(--secondary)) ${displayValue * 270}deg,
              hsl(var(--secondary)) 270deg
            )`,
            padding: '3px',
          }}
        >
          {/* Inner knob */}
          <div
            className="w-full h-full rounded-full glass flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, hsl(240 10% 15%), hsl(240 10% 8%))',
            }}
          >
            {/* Indicator line */}
            <div
              className="absolute top-[10%] w-[2px] h-[30%] origin-bottom"
              style={{
                background: color,
                transform: `rotate(${rotation}deg)`,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          </div>
        </div>
        
        {/* Center dot */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
      
      {/* Value display */}
      <div className="text-xs font-mono text-foreground bg-secondary/50 px-2 py-1 rounded min-w-[60px] text-center">
        {formattedValue()}{unit}
      </div>
    </div>
  );
}
