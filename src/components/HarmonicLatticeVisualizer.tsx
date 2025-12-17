import React from 'react';
import { HarmonicLatticeState } from '../audio/HarmonicLattice';
import { VisualizerProps } from '../App';


interface HarmonicZoneProps {
  zone: {
    harmonics: number[];
    coefficient: number;
    modulation: number;
    color: string;
  };
  name: string;
  isPlaying?: boolean;
}

const HarmonicZone: React.FC<HarmonicZoneProps> = ({ zone, name, isPlaying }) => {
  const intensity = zone.coefficient + Math.abs(zone.modulation);
  const size = 60 + intensity * 20;
  const animationDelay = (name.length * 0.1) + 's';

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div 
        className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderColor: zone.color,
          boxShadow: `0 0 ${intensity * 10}px ${zone.color}66`,
          animation: isPlaying ? `pulse 2s ${animationDelay} ease-in-out infinite` : 'none',
        }}
      >
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            backgroundColor: `${zone.color}33`,
            opacity: intensity * 0.8,
            filter: `blur(${intensity * 2}px)`
          }}
        />
        <span className="relative text-xs font-bold text-white uppercase">{name}</span>
      </div>
      <p className="text-gray-500 mt-2 text-xs">{intensity >= 1.5 ? 'Glowing' : intensity >= 1.0 ? 'Active' : intensity >= 0.5 ? 'Subtle' : 'Dormant'}</p>
    </div>
  );
};

const HarmonicLatticeVisualizer: React.FC<VisualizerProps<HarmonicLatticeState>> = ({ params, isPlaying }) => {
  return (
    <div className="p-4 flex flex-col items-center justify-between h-full text-xs text-gray-400">
        <style>
            {`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
            `}
        </style>
      <div className="w-full h-full flex items-center justify-around">
        <HarmonicZone zone={params.warmth} name="Warmth" isPlaying={isPlaying} />
        <HarmonicZone zone={params.presence} name="Presence" isPlaying={isPlaying} />
        <HarmonicZone zone={params.air} name="Air" isPlaying={isPlaying} />
      </div>
    </div>
  );
};

export default HarmonicLatticeVisualizer;