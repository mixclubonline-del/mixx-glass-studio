import React, { useState, useEffect, useRef } from 'react';

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
        if (index >= 10) return 'bg-red-500'; // Clip
        if (index >= 7) return 'bg-yellow-400';
        return 'bg-cyan-400';
    };

    return (
        <div className="w-4 h-full flex flex-col-reverse justify-start bg-black/50 rounded-full overflow-hidden p-1">
            {Array.from({ length: NUM_SEGMENTS }).map((_, i) => {
                const isActive = i < activeSegments;
                const isPeak = i === peakSegment - 1 && peakLevelRef.current > 0;
                return (
                    <div
                        key={i}
                        className={`w-full h-2 my-0.5 rounded-sm transition-opacity duration-100 ${
                            isActive ? getSegmentColor(i) : (isPeak ? 'bg-gray-400' : 'bg-gray-700/50')
                        }`}
                    />
                );
            })}
        </div>
    );
};

export default Meter;