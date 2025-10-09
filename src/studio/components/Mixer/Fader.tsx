/**
 * Vertical Fader Component
 * Logarithmic dB scale fader with smooth interaction
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FaderProps {
  value: number; // 0 to 2 (0 = -∞, 1 = 0dB, 2 = +6dB)
  onChange: (value: number) => void;
  color?: string;
  label?: string;
  height?: number;
}

export function Fader({ value, onChange, color, label, height = 200 }: FaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Convert linear value (0-2) to dB for display
  const valueToDb = (val: number): string => {
    if (val === 0) return '-∞';
    const db = 20 * Math.log10(val);
    return db.toFixed(1);
  };
  
  // Convert linear value to position percentage
  const valueToPosition = (val: number): number => {
    if (val === 0) return 0;
    // Map 0-2 to 0-100% (logarithmic feel)
    const db = 20 * Math.log10(val);
    const percentage = ((db + 60) / 66) * 100; // -60dB to +6dB range
    return Math.max(0, Math.min(100, percentage));
  };
  
  // Convert mouse position to value
  const positionToValue = (clientY: number): number => {
    if (!containerRef.current) return value;
    
    const rect = containerRef.current.getBoundingClientRect();
    const percentage = 1 - (clientY - rect.top) / rect.height;
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    
    // Convert percentage to dB, then to linear
    const db = (clampedPercentage * 66) - 60; // -60dB to +6dB
    if (db <= -59) return 0;
    return Math.pow(10, db / 20);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newValue = positionToValue(e.clientY);
    onChange(newValue);
  };
  
  const handleDoubleClick = () => {
    // Reset to unity (0dB = value 1.0)
    onChange(1.0);
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newValue = positionToValue(e.clientY);
      onChange(newValue);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  const position = valueToPosition(value);
  const isUnity = Math.abs(value - 1.0) < 0.01;
  
  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      
      <div
        ref={containerRef}
        className="relative w-8 rounded-full glass cursor-pointer select-none"
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* dB markers */}
        <div className="absolute inset-y-0 -left-8 flex flex-col justify-between text-[9px] text-muted-foreground/60 pointer-events-none">
          <span>+6</span>
          <span>0</span>
          <span>-12</span>
          <span>-24</span>
          <span>-∞</span>
        </div>
        
        {/* Unity marker (0dB) */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-accent/40"
          style={{ bottom: '75.76%' }} // 0dB position
        />
        
        {/* Fill */}
        <div
          className="absolute bottom-0 left-1 right-1 rounded-full transition-all"
          style={{
            height: `${position}%`,
            background: color || `linear-gradient(to top, hsl(var(--prime-500)), hsl(var(--neon-pink)))`,
            boxShadow: `0 0 12px ${color ? color + '80' : 'hsl(var(--prime-500) / 0.5)'}`,
          }}
        />
        
        {/* Thumb */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-10 h-3 rounded-full glass-glow border-2 transition-all",
            isUnity ? "border-accent" : "border-primary"
          )}
          style={{
            bottom: `${position}%`,
            transform: `translate(-50%, 50%)`,
          }}
        />
      </div>
      
      {/* Value display */}
      <div className="text-xs font-mono text-foreground/80 min-w-[3rem] text-center">
        {valueToDb(value)} dB
      </div>
    </div>
  );
}
