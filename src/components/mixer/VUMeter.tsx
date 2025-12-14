
import React, { useState, useEffect, useRef } from 'react';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

interface VUMeterProps {
    level: number; // RMS level, 0 to 1
}

const VUMeter: React.FC<VUMeterProps> = ({ level }) => {
    const [displayLevel, setDisplayLevel] = useState(0);
    const frameRef = useRef<number | null>(null);

    // VU Meter Ballistics
    const RISE_TIME = 0.05; // Fast rise
    const FALL_TIME = 0.3; // Slower fall

    useEffect(() => {
        const animate = () => {
            setDisplayLevel(prevLevel => {
                let newLevel;
                if (level > prevLevel) {
                    // Rising
                    newLevel = prevLevel + (1 / (60 * RISE_TIME)) * (level - prevLevel);
                } else {
                    // Falling
                    newLevel = prevLevel - (1 / (60 * FALL_TIME)) * prevLevel;
                }
                const finalLevel = Math.max(0, Math.min(1, newLevel));
                if (Math.abs(finalLevel - prevLevel) < 0.001) {
                    return prevLevel; // Stop updating if it's stable
                }
                return finalLevel;
            });
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [level]);

    // Map RMS level (0-1) to decibels, then to rotation angle
    // -60dB (0) to 0dB (1) -> angle range -45 to 45 degrees
    const db = 20 * Math.log10(displayLevel || 0.00001);
    const dbNormalized = Math.max(0, Math.min(1, (db + 60) / 60));
    const angle = dbNormalized * 90 - 45;

    return (
        <div style={composeStyles(
          layout.width.full,
          { height: '100%' },
          layout.flex.container('row'),
          layout.flex.align.center,
          layout.flex.justify.center
        )}>
            <svg viewBox="0 0 100 60" style={composeStyles(
              layout.width.full,
              { height: 'auto' }
            )}>
                {/* Background Arc */}
                <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#4a4a4a" strokeWidth="2" fill="none" />

                {/* DB Scale */}
                <g fontSize="6" fill="#888" textAnchor="middle">
                    <text x="15" y="40">-20</text>
                    <text x="32" y="23">-7</text>
                    <text x="50" y="15">-3</text>
                    <text x="68" y="23">0</text>
                    <text x="85" y="40">+3</text>
                </g>

                {/* Needle */}
                <g transform={`rotate(${angle} 50 50)`}>
                    <line x1="50" y1="50" x2="50" y2="15" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="3" fill="#f97316" />
                </g>
                 <defs>
                    <radialGradient id="needleGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(249, 115, 22, 0.5)" />
                        <stop offset="100%" stopColor="rgba(249, 115, 22, 0)" />
                    </radialGradient>
                </defs>
                 <circle cx="50" cy="50" r="40" fill="url(#needleGlow)" opacity={displayLevel * 0.5} />
            </svg>
        </div>
    );
};

export default VUMeter;