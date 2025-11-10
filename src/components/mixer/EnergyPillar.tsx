import React, { useState, useEffect } from 'react';
import { TrackData } from '../../App';

type TrackColor = TrackData['trackColor'];

interface EnergyPillarProps {
    level: number; // 0 to 1
    transient: boolean;
    isPlaying: boolean;
    color: TrackColor;
}

interface Shockwave {
    id: number;
}

const colorMap: { [key in TrackColor]: { glow: string; base: string } } = {
  cyan: { glow: 'rgba(6, 182, 212, 0.7)', base: '#06b6d4' },
  magenta: { glow: 'rgba(217, 70, 239, 0.7)', base: '#d946ef' },
  blue: { glow: 'rgba(59, 130, 246, 0.7)', base: '#3b82f6' },
  green: { glow: 'rgba(34, 197, 94, 0.7)', base: '#22c55e' },
  purple: { glow: 'rgba(139, 92, 246, 0.7)', base: '#8b5cf6' },
};

const EnergyPillar: React.FC<EnergyPillarProps> = ({ level, transient, isPlaying, color }) => {
    const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);

    useEffect(() => {
        if (transient && isPlaying) {
            const newShockwave = { id: Date.now() };
            setShockwaves(prev => [...prev, newShockwave]);
        }
    }, [transient, isPlaying]);

    const handleAnimationEnd = (id: number) => {
        setShockwaves(prev => prev.filter(sw => sw.id !== id));
    };

    const height = Math.pow(level, 0.5) * 100; // Use power to make lower levels more visible
    const selectedColor = colorMap[color];
    const glowColor = selectedColor.glow;
    const baseColor = selectedColor.base;

    return (
        <div className="relative w-full h-full flex flex-col justify-end items-center">
             {/* Shockwave Container */}
            <div className="absolute bottom-0 w-full h-16 flex items-center justify-center">
                 {shockwaves.map(sw => (
                    <div
                        key={sw.id}
                        className="absolute w-full h-full rounded-full border-2 shockwave-animate"
                        style={{ borderColor: baseColor }}
                        onAnimationEnd={() => handleAnimationEnd(sw.id)}
                    />
                ))}
            </div>

            {/* Main Pillar */}
            <div
                className="w-4 rounded-t-full transition-all duration-75 ease-out"
                style={{
                    height: `${height}%`,
                    background: `linear-gradient(to top, ${baseColor}, transparent)`,
                    boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`
                }}
            />
            {/* Base Glow */}
            <div 
                className="absolute bottom-0 w-6 h-2 rounded-full transition-opacity duration-200"
                style={{
                    background: baseColor,
                    filter: 'blur(5px)',
                    opacity: level > 0.1 ? 0.8 : 0,
                }}
            />
        </div>
    );
};

export default EnergyPillar;