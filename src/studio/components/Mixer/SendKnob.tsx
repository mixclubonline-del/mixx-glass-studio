/**
 * Send Knob Component
 * Rotary control for aux send amount with pre/post toggle
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SendKnobProps {
  label: string;
  value: number; // 0 to 1
  preFader: boolean;
  onValueChange: (value: number) => void;
  onPreFaderToggle: (preFader: boolean) => void;
  color?: string;
}

export function SendKnob({
  label,
  value,
  preFader,
  onValueChange,
  onPreFaderToggle,
  color = 'hsl(var(--neon-blue))',
}: SendKnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);
  
  // Convert 0-1 to rotation angle (-135 to +135 degrees)
  const valueToRotation = (val: number): number => {
    return (val * 270) - 135;
  };
  
  // Convert 0-1 to dB for display
  const valueToDb = (val: number): string => {
    if (val === 0) return '-∞';
    const db = 20 * Math.log10(val);
    return db.toFixed(1);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY - e.clientY; // Inverted for natural feel
      const sensitivity = 0.005;
      const newValue = Math.max(0, Math.min(1, startValue + deltaY * sensitivity));
      onValueChange(newValue);
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
  }, [isDragging, startY, startValue]);
  
  const rotation = valueToRotation(value);
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
      
      {/* Knob */}
      <div className="relative">
        <div
          ref={knobRef}
          className={cn(
            "w-10 h-10 rounded-full glass-glow cursor-pointer select-none relative",
            "transition-shadow hover:shadow-lg"
          )}
          onMouseDown={handleMouseDown}
          style={{
            borderColor: color,
            borderWidth: '2px',
          }}
        >
          {/* Value arc */}
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
              strokeDasharray="75.4"
              strokeDashoffset="0"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray="75.4"
              strokeDashoffset={75.4 * (1 - value)}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          </svg>
          
          {/* Pointer */}
          <div
            className="absolute top-1/2 left-1/2 w-1 h-4 rounded-full"
            style={{
              background: color,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transformOrigin: 'center bottom',
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        </div>
      </div>
      
      {/* Value display */}
      <div className="text-[9px] font-mono text-foreground/70">
        {valueToDb(value)}
      </div>
      
      {/* Pre/Post toggle */}
      <button
        onClick={() => onPreFaderToggle(!preFader)}
        className={cn(
          "text-[9px] px-1.5 py-0.5 rounded glass hover-glow transition-all",
          preFader ? "text-accent" : "text-muted-foreground"
        )}
        title={preFader ? "Pre-fader" : "Post-fader"}
      >
        {preFader ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
    </div>
  );
}
