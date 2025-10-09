/**
 * Ice-Fire Knob - Professional rotary knob with temperature gradient
 * 270° rotation range with ice-to-fire animation
 */

import React, { useRef, useState, useCallback } from 'react';
import { getTemperatureColor, getGlowIntensity, getGlowBlur } from '@/studio/utils/TemperatureGradient';

interface IceFireKnobProps {
  value: number; // 0-1 normalized value
  onChange: (value: number) => void;
  size?: number;
  label?: string;
  valueLabel?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const IceFireKnob: React.FC<IceFireKnobProps> = ({
  value,
  onChange,
  size = 48,
  label,
  valueLabel,
  min = 0,
  max = 100,
  step = 1,
  unit = ''
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const [fineControl, setFineControl] = useState(false);
  
  const temperature = getTemperatureColor(value);
  const glowIntensity = getGlowIntensity(value);
  const glowBlur = getGlowBlur(value);
  const rotation = -135 + (value * 270); // -135° to +135°
  
  const actualValue = min + (value * (max - min));
  const displayValue = valueLabel || `${actualValue.toFixed(step < 1 ? 1 : 0)}${unit}`;
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
    setFineControl(e.shiftKey);
  }, [value]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = startY - e.clientY;
    const sensitivity = e.shiftKey ? 0.002 : 0.005; // Fine control with shift
    let newValue = startValue + (deltaY * sensitivity);
    
    newValue = Math.max(0, Math.min(1, newValue));
    onChange(newValue);
  }, [isDragging, startY, startValue, onChange]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setFineControl(false);
  }, []);
  
  const handleDoubleClick = () => {
    // Reset to center/default (0.5)
    onChange(0.5);
  };
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.01 : 0.01;
    const newValue = Math.max(0, Math.min(1, value + delta));
    onChange(newValue);
  }, [value, onChange]);
  
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </div>
      )}
      
      <div
        ref={knobRef}
        className="relative cursor-pointer"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        {/* Background circle */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'rgba(10, 10, 15, 0.6)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)'
          }}
        />
        
        {/* Progress arc */}
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
          style={{
            filter: `drop-shadow(0 0 ${glowBlur * 0.5}px ${temperature})`
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="6"
            strokeDasharray="197"
            strokeDashoffset="23"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={temperature}
            strokeWidth="6"
            strokeDasharray="197"
            strokeDashoffset={197 - (value * 197 * 0.75) + 23}
            strokeLinecap="round"
            style={{
              transition: 'stroke 0.1s ease',
              opacity: glowIntensity
            }}
          />
        </svg>
        
        {/* Center indicator needle */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`
          }}
        >
          <div
            className="w-0.5 rounded-full"
            style={{
              height: `${size * 0.35}px`,
              background: temperature,
              boxShadow: `0 0 ${glowBlur * 0.3}px ${temperature}`,
              transformOrigin: 'center bottom',
              marginBottom: `${size * 0.05}px`
            }}
          />
        </div>
        
        {/* Value display */}
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono"
          style={{ color: temperature }}
        >
          {displayValue}
        </div>
        
        {/* Glow effect when active */}
        {isDragging && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: `0 0 ${glowBlur}px ${temperature}`,
              animation: 'pulse 1s ease-in-out infinite'
            }}
          />
        )}
      </div>
      
      {fineControl && (
        <div className="text-[9px] text-primary">Fine Control</div>
      )}
    </div>
  );
};
