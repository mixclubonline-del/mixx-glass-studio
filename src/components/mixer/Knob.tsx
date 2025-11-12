import React, { useState, useRef, useEffect, useCallback } from 'react';

interface KnobProps {
    value: number; // -1 to 1
    onChange: (value: number) => void;
}

const Knob: React.FC<KnobProps> = ({ value, onChange }) => {
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
        const sensitivity = 200; // pixels per full range
        const newValue = dragStartValue.current + (deltaY / sensitivity) * 2;
        const clampedValue = Math.max(-1, Math.min(1, newValue));
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

    // Map value from [-1, 1] to rotation in degrees [-135, 135]
    const rotation = value * 135;

    return (
        <div 
            ref={knobRef}
            className="relative w-12 h-12 flex items-center justify-center cursor-ns-resize"
            onMouseDown={handleMouseDown}
        >
            <div className="absolute w-full h-full rounded-full bg-gray-900 border-2 border-gray-700 shadow-inner"></div>
            <div 
                className="absolute w-full h-full"
                style={{ transform: `rotate(${rotation}deg)`}}
            >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#06b6d4]"></div>
            </div>
            <span className="text-[10px] text-gray-500 mt-1">PAN</span>
        </div>
    );
};

export default Knob;