import React, { useState, useRef, useEffect, useCallback } from 'react';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

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
      style={composeStyles(
        layout.width.full,
        layout.position.relative,
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.center,
        effects.border.radius.full,
        {
          height: '16px',
          cursor: 'ew-resize',
          background: 'rgba(55, 65, 81, 0.5)',
          border: '1px solid rgba(75, 85, 99, 0.5)',
        }
      )}
      onMouseDown={handleMouseDown}
    >
      <div style={composeStyles(
        layout.position.absolute,
        { left: '50%' },
        transitions.transform.combine('translateX(-50%)'),
        {
          width: '2px',
          height: '100%',
          background: 'rgba(107, 114, 128, 1)',
        }
      )} />
      <div
        style={composeStyles(
          layout.position.absolute,
          effects.border.radius.full,
          {
            width: '8px',
            height: '16px',
            left: `calc(${indicatorPosition}% - 4px)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            border: '1px solid',
            ...(colorClass.includes('amber') ? {
              background: 'rgba(251, 191, 36, 1)',
              borderColor: 'rgba(252, 211, 77, 1)',
            } : {
              background: 'rgba(107, 114, 128, 1)',
              borderColor: 'rgba(156, 163, 175, 1)',
            }),
          }
        )}
      />
      <span style={composeStyles(
        layout.position.absolute,
        { bottom: '20px' },
        typography.weight('semibold'),
        {
          fontSize: '10px',
          color: 'rgba(156, 163, 175, 0.8)',
        }
      )}>{label}</span>
    </div>
  );
};

export default PanSlider;
