import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PanSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  colorClass: string; // e.g., 'bg-amber-400 border-amber-300'
}

const PanSlider: React.FC<PanSliderProps> = ({ value, onChange, label, colorClass }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartValue = useRef(0);
  const dragStartX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartValue.current = value;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const sensitivity = 200; // pixels per full range (-1 to 1)
    const newValue = dragStartValue.current + (deltaX / sensitivity) * 2;
    const clampedValue = Math.max(-1, Math.min(1, newValue));
    onChange(clampedValue);
  }, [isDragging, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const indicatorPosition = ((value + 1) / 2) * 100; // Map -1 to 1 to 0 to 100%

  return (
    <div
      className="w-full h-4 relative flex items-center justify-center cursor-ew-resize bg-gray-700/50 rounded-full border border-gray-600/50"
      onMouseDown={handleMouseDown}
    >
      <div className="absolute w-0.5 h-full bg-gray-500 left-1/2 -translate-x-1/2" />
      <div
        className={`absolute w-2 h-4 rounded-full shadow-md border ${colorClass}`}
        style={{ left: `calc(${indicatorPosition}% - 4px)` }} // Adjust for knob width
      />
      <span className="absolute bottom-5 text-[10px] text-gray-400/80 font-semibold">{label}</span>
    </div>
  );
};

export default PanSlider;
