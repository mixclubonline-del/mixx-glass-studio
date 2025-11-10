import React, { useState, useRef, useEffect, useCallback } from 'react';

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
    const displayValue = Math.round(value * 100);

    return (
        <div className="flex flex-col items-center space-y-2">
            <div 
                ref={knobRef}
                className="relative w-16 h-16 flex items-center justify-center cursor-ns-resize select-none"
                onMouseDown={handleMouseDown}
            >
                {/* Knob Body */}
                <div className="absolute w-full h-full rounded-full bg-gray-800 border-2 border-gray-900 shadow-inner"></div>
                {/* Indicator */}
                <div 
                    className="absolute w-full h-full"
                    style={{ transform: `rotate(${rotation}deg)`}}
                >
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"></div>
                </div>
                {/* Value Display */}
                <span className="relative text-sm font-mono text-white">{displayValue}</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        </div>
    );
};