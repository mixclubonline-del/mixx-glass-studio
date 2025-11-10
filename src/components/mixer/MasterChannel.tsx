import React, { useState, useRef, useEffect, useCallback } from 'react';
import PanSlider from './PanSlider';

interface MasterChannelProps {
    volume: number;
    onVolumeChange: (volume: number) => void;
    balance: number;
    onBalanceChange: (balance: number) => void;
    analysis: { level: number; transient: boolean };
}

const colorMap = {
    glow: 'rgba(252, 211, 77, 0.7)', // amber-300
    base: '#fca5a5', // red-300 for top
    mid: '#facc15', // yellow-400 for mid
    low: '#fbbf24', // amber-400 for low
};

const MasterChannel: React.FC<MasterChannelProps> = ({ volume, onVolumeChange, balance, onBalanceChange, analysis }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);

    const handleInteraction = useCallback((clientY: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const newPercentage = 1 - (clientY - rect.top) / rect.height;
        const clampedValue = Math.max(0, Math.min(1.2, newPercentage)); // Allow +dB
        onVolumeChange(clampedValue);
    }, [onVolumeChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleInteraction(e.clientY);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 100);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) handleInteraction(e.clientY);
    };

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleInteraction]);

    const height = Math.pow(analysis.level, 0.5) * 100;
    const faderPosition = Math.max(0, Math.min(100, (volume / 1.2) * 100));

    return (
        <div className="h-full w-24 flex flex-col items-center p-3 border-2 border-yellow-400/30 bg-black/40 rounded-2xl space-y-2 backdrop-blur-lg shadow-[0_0_25px_rgba(252,211,77,0.2)]">
            {/* Pan/Balance Control */}
            <div className="flex-shrink-0 w-full mb-4">
                <PanSlider value={balance} onChange={onBalanceChange} label="BAL" colorClass="bg-amber-400 border-amber-300" />
            </div>

            <div
                ref={trackRef}
                className="relative flex-grow w-full flex flex-col items-center cursor-pointer"
                onMouseDown={handleMouseDown}
            >
                {/* VU Meter Background */}
                <div className="absolute inset-0 w-full h-full bg-yellow-900/50 rounded-lg overflow-hidden">
                    <div
                        className="absolute bottom-0 w-full rounded-t-md transition-all duration-75 ease-out"
                        style={{
                            height: `${height}%`,
                            background: `linear-gradient(to top, ${colorMap.low}, ${colorMap.mid}, ${colorMap.base})`,
                            boxShadow: `0 0 10px ${colorMap.glow}, 0 0 20px ${colorMap.glow}`
                        }}
                    />
                </div>
                 {/* Transient Flash */}
                {analysis.transient && (
                    <div
                        key={Date.now()}
                        className="absolute inset-0 w-full h-full bg-yellow-300/80 rounded-lg pointer-events-none animate-transient-flash"
                    />
                )}
                
                {/* Fader Cap */}
                <div
                    className={`absolute left-1/2 -translate-x-1/2 w-16 h-2 rounded-md bg-amber-200 border-2 border-amber-300 shadow-lg pointer-events-none ${isPulsing ? 'fader-cap-pulse' : ''}`}
                    style={{ bottom: `calc(${faderPosition}%)` }}
                />
            </div>
            <div className="flex-shrink-0 mt-2 text-center h-16 flex flex-col justify-center">
                <span className="text-sm font-bold text-amber-300/80 uppercase tracking-widest">Master</span>
                <span className="text-xs font-mono text-amber-400/70">{(volume * 12 - 9).toFixed(1)} dB</span>
            </div>
        </div>
    );
};

export default MasterChannel;