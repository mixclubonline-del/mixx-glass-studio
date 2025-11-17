/**
 * Ice-Fire Fader - Professional slim fader with temperature gradient
 * Animated from cold ice blue (low) to hot fire red (high)
 */

import React, { useRef, useState, useCallback } from 'react';
import { dbToNormalized, normalizedToDb, getTemperatureColor, getGlowIntensity, getGlowBlur } from '@/studio/utils/TemperatureGradient';

interface IceFireFaderProps {
  value: number; // 0-1 normalized value
  onChange: (value: number) => void;
  height?: number;
  width?: number;
  showScale?: boolean;
  label?: string;
  id?: string;
  ariaLabel?: string;
  ariaValueText?: string;
}

export const IceFireFader: React.FC<IceFireFaderProps> = ({
  value,
  onChange,
  height = 300,
  width = 24,
  showScale = true,
  label,
  id,
  ariaLabel,
  ariaValueText
}) => {
  const faderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fineControl, setFineControl] = useState(false);
  
  const db = normalizedToDb(value);
  const temperature = getTemperatureColor(value);
  const glowIntensity = getGlowIntensity(value);
  const glowBlur = getGlowBlur(value);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setFineControl(e.shiftKey);
    updateValue(e);
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateValue(e);
  }, [isDragging]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setFineControl(false);
  }, []);
  
  const updateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!faderRef.current) return;
    
    const rect = faderRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    let newValue = 1 - (y / rect.height);
    
    // Fine control with shift
    if (e.shiftKey) {
      const delta = (newValue - value) * 0.1;
      newValue = value + delta;
    }
    
    // Magnetic snap to 0dB (0.75 normalized)
    const unityValue = dbToNormalized(0);
    if (Math.abs(newValue - unityValue) < 0.02) {
      newValue = unityValue;
    }
    
    onChange(Math.max(0, Math.min(1, newValue)));
  };
  
  const handleDoubleClick = () => {
    // Reset to unity (0dB)
    onChange(dbToNormalized(0));
  };
  
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
  
  // dB scale markers
  const dbMarkers = [-60, -48, -36, -24, -18, -12, -6, 0, 6, 12];
  
  return (
    <div id={id} className="flex flex-col items-center gap-2">
      {label && (
        <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
      )}
      
      <div className="flex items-center gap-2">
        {/* dB Scale */}
        {showScale && (
          <div className="relative" style={{ height: `${height}px` }}>
            {dbMarkers.map((db) => {
              const pos = dbToNormalized(db) * height;
              return (
                <div
                  key={db}
                  className="absolute right-0 flex items-center gap-1"
                  style={{ bottom: `${pos}px`, transform: 'translateY(50%)' }}
                >
                  <div className={`w-2 h-px ${db === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  <span className={`text-[8px] ${db === 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {db > 0 ? `+${db}` : db}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Fader track */}
        <div className="relative flex flex-col items-center">
          <div
            ref={faderRef}
            className="relative cursor-pointer rounded-full overflow-hidden"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              background: 'rgba(10, 10, 15, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            role="slider"
            aria-label={ariaLabel || label || 'Volume fader'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(value * 100)}
            aria-valuetext={ariaValueText || `${Math.round(value * 100)}%`}
            aria-orientation="vertical"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                e.preventDefault();
                onChange(Math.min(1, value + 0.05));
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                e.preventDefault();
                onChange(Math.max(0, value - 0.05));
              } else if (e.key === 'Home') {
                e.preventDefault();
                onChange(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                onChange(1);
              }
            }}
          >
            {/* Filled portion with temperature gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all"
              style={{
                height: `${value * 100}%`,
                background: `linear-gradient(to top, 
                  hsl(191 100% 40%) 0%,
                  hsl(191 100% 50%) 25%,
                  hsl(191 80% 60%) 45%,
                  hsl(275 100% 65%) 65%,
                  hsl(314 100% 65%) 85%,
                  hsl(0 100% 60%) 100%)`,
                backgroundSize: '100% 1000%',
                backgroundPosition: `0% ${100 - value * 100}%`,
                boxShadow: isDragging 
                  ? `0 0 ${glowBlur}px ${temperature}, inset 0 0 20px rgba(255,255,255,0.2)`
                  : `0 0 ${glowBlur * 0.5}px ${temperature}`,
                opacity: glowIntensity
              }}
            />
            
            {/* Unity (0dB) marker line */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
              style={{
                bottom: `${dbToNormalized(0) * 100}%`,
                transform: 'translateY(50%)'
              }}
            />
            
            {/* Fader cap */}
            <div
              className="absolute left-1/2 w-10 h-3.5 rounded-full transition-all cursor-grab active:cursor-grabbing"
              style={{
                bottom: `${value * 100}%`,
                transform: 'translate(-50%, 50%)',
                background: temperature,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `0 0 ${glowBlur}px ${temperature}, 0 2px 4px rgba(0,0,0,0.3)`,
                opacity: isDragging ? 1 : 0.95
              }}
            />
          </div>
        </div>
      </div>
      
      {/* dB readout */}
      <div 
        className="text-xs font-mono font-bold text-center min-w-[48px]"
        style={{ color: temperature }}
      >
        {db === -60 ? '-∞' : db > 0 ? `+${db.toFixed(1)}` : db.toFixed(1)} dB
      </div>
      
      {fineControl && (
        <div className="text-[9px] text-primary">Fine Control</div>
      )}
    </div>
  );
};
