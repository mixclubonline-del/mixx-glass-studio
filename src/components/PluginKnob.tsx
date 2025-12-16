import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { hexToRgba, TRACK_COLOR_SWATCH } from '../utils/ALS';

interface PluginKnobProps {
    label: string;
    value: number; // 0 to 1
    onChange: (value: number) => void;
}

export const PluginKnob: React.FC<PluginKnobProps> = ({ label, value, onChange }) => {
    const knobRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartValue = useRef(0);
    const dragStartY = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartValue.current = value;
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const deltaY = dragStartY.current - e.clientY;
        const sensitivity = 150; // pixels per full range
        const newValue = dragStartValue.current + (deltaY / sensitivity);
        const clampedValue = Math.max(0, Math.min(1, newValue));
        onChange(clampedValue);
    }, [isDragging, onChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Map value from [0, 1] to rotation in degrees [-135, 135]
    const rotation = value * 270 - 135;
    
    // ALS: Value to intensity label (doctrine-compliant, no raw numbers)
    const valueToLabel = (v: number): string => {
      if (v >= 0.9) return 'Max';
      if (v >= 0.7) return 'High';
      if (v >= 0.4) return 'Mid';
      if (v >= 0.1) return 'Low';
      return 'Min';
    };
    
    // ALS: Glow intensity based on value and drag state
    const glowIntensity = useMemo(() => {
      const base = value * 0.6;
      const dragBoost = isDragging ? 0.4 : 0;
      return Math.min(1, base + dragBoost);
    }, [value, isDragging]);
    
    const accentColor = TRACK_COLOR_SWATCH.cyan.base;
    const glowColor = TRACK_COLOR_SWATCH.cyan.glow;

    return (
        <div className="flex flex-col items-center space-y-2">
            <div 
                ref={knobRef}
                className="relative w-16 h-16 flex items-center justify-center cursor-ns-resize select-none"
                onMouseDown={handleMouseDown}
                style={{
                    filter: glowIntensity > 0.3 ? `drop-shadow(0 0 ${4 + glowIntensity * 8}px ${hexToRgba(glowColor, glowIntensity * 0.6)})` : undefined,
                    transition: 'filter 0.2s ease-out',
                }}
            >
                {/* Knob Body */}
                <div 
                    className="absolute w-full h-full rounded-full bg-gray-800 border-2 border-gray-900 shadow-inner"
                    style={{
                        borderColor: isDragging ? hexToRgba(accentColor, 0.6) : undefined,
                        boxShadow: `inset 0 0 ${10 + glowIntensity * 10}px ${hexToRgba(accentColor, 0.1 + glowIntensity * 0.15)}`,
                        transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
                    }}
                ></div>
                {/* Indicator */}
                <div 
                    className="absolute w-full h-full"
                    style={{ transform: `rotate(${rotation}deg)`}}
                >
                    <div 
                        className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full"
                        style={{
                            backgroundColor: accentColor,
                            boxShadow: `0 0 ${6 + glowIntensity * 6}px ${hexToRgba(glowColor, 0.7 + glowIntensity * 0.3)}`,
                        }}
                    ></div>
                </div>
                {/* Value Display - ALS doctrine-compliant */}
                <span className="relative text-xs font-semibold uppercase tracking-wider text-white/80">{valueToLabel(value)}</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        </div>
    );
};