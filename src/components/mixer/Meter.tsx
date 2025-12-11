import React, { useState, useEffect, useRef } from 'react';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

interface MeterProps {
    level: number; // 0 to 1
}

const NUM_SEGMENTS = 12;

const Meter: React.FC<MeterProps> = ({ level }) => {
    const peakLevelRef = useRef(0);
    const peakTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (level >= peakLevelRef.current) {
            peakLevelRef.current = level;
            if (peakTimeoutRef.current) {
                clearTimeout(peakTimeoutRef.current);
            }
            peakTimeoutRef.current = window.setTimeout(() => {
                peakLevelRef.current = 0;
            }, 1000); // Peak hold time
        }
    }, [level]);

    const activeSegments = Math.round(level * NUM_SEGMENTS);
    const peakSegment = Math.round(peakLevelRef.current * NUM_SEGMENTS);

    const getSegmentColor = (index: number) => {
        if (index >= 10) return 'rgba(239, 68, 68, 1)'; // Clip
        if (index >= 7) return 'rgba(250, 204, 21, 1)';
        return 'rgba(6, 182, 212, 1)';
    };

    return (
        <div style={composeStyles(
          layout.width.custom('16px'),
          { height: '100%' },
          layout.flex.container('col-reverse'),
          layout.flex.justify.start,
          effects.border.radius.full,
          layout.overflow.hidden,
          spacing.p(1),
          {
            background: 'rgba(0,0,0,0.5)',
          }
        )}>
            {Array.from({ length: NUM_SEGMENTS }).map((_, i) => {
                const isActive = i < activeSegments;
                const isPeak = i === peakSegment - 1 && peakLevelRef.current > 0;
                const bgColor = isActive 
                  ? getSegmentColor(i)
                  : (isPeak ? 'rgba(156, 163, 175, 1)' : 'rgba(55, 65, 81, 0.5)');
                return (
                    <div
                        key={i}
                        style={composeStyles(
                          layout.width.full,
                          effects.border.radius.sm,
                          transitions.transition.standard('opacity', 100, 'ease-out'),
                          {
                            height: '8px',
                            marginTop: '2px',
                            marginBottom: '2px',
                            background: bgColor,
                          }
                        )}
                    />
                );
            })}
        </div>
    );
};

export default Meter;