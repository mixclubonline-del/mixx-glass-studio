import React, { useState, useRef, useEffect, useCallback } from 'react';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

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
            style={composeStyles(
              layout.position.relative,
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.center,
              {
                width: '48px',
                height: '48px',
                cursor: 'ns-resize',
              }
            )}
            onMouseDown={handleMouseDown}
        >
            <div style={composeStyles(
              layout.position.absolute,
              layout.width.full,
              layout.height.full,
              effects.border.radius.full,
              {
                background: 'rgba(17, 24, 39, 1)',
                border: '2px solid rgba(55, 65, 81, 1)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
              }
            )}></div>
            <div 
                style={composeStyles(
                  layout.position.absolute,
                  layout.width.full,
                  layout.height.full,
                  {
                    transform: `rotate(${rotation}deg)`,
                  }
                )}
            >
                <div style={composeStyles(
                  layout.position.absolute,
                  { top: '4px', left: '50%' },
                  transitions.transform.combine('translateX(-50%)'),
                  effects.border.radius.full,
                  {
                    width: '6px',
                    height: '6px',
                    background: 'rgba(6, 182, 212, 1)',
                    boxShadow: '0 0 5px #06b6d4',
                  }
                )}></div>
            </div>
            <span style={composeStyles(
              typography.transform('uppercase'),
              spacing.mt(1),
              {
                fontSize: '10px',
                color: 'rgba(107, 114, 128, 1)',
              }
            )}>PAN</span>
        </div>
    );
};

export default Knob;