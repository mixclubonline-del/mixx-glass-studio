
import React from 'react';
import { usePulseAnimation } from '../../../../components/mixxglass';
import { Mood } from '../../types';
import { mapRange } from '../../lib/utils';

interface AmbientBackgroundProps {
  mood: Mood;
  intensity: number;
}

const moodColors: Record<Mood, { bg: string; orb1: string; orb2: string; shimmer: string }> = {
  Neutral: {
    bg: '#0d1117',
    orb1: '#1e3a8a', // Dark Blue
    orb2: '#334155', // Slate
    shimmer: 'rgba(0, 255, 255, 0.05)'
  },
  Warm: {
    bg: '#1f1005',
    orb1: '#7c2d12', // Orange/Brown
    orb2: '#b45309', // Amber
    shimmer: 'rgba(251, 191, 36, 0.05)'
  },
  Bright: {
    bg: '#0f172a',
    orb1: '#0891b2', // Cyan
    orb2: '#475569', // Light Slate
    shimmer: 'rgba(255, 255, 255, 0.08)'
  },
  Dark: {
    bg: '#020617',
    orb1: '#312e81', // Indigo
    orb2: '#4c1d95', // Violet
    shimmer: 'rgba(124, 58, 237, 0.05)'
  },
  Energetic: {
    bg: '#18081a',
    orb1: '#be185d', // Pink
    orb2: '#0e7490', // Cyan
    shimmer: 'rgba(236, 72, 153, 0.08)'
  }
};

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ mood, intensity }) => {
  const colors = moodColors[mood];
  const speedMultiplier = mapRange(intensity, 0, 100, 20, 5); // Lower duration = faster

  // Animated orb positions and scales
  const orb1X = usePulseAnimation(0, 100, speedMultiplier * 1500, 'ease-in-out');
  const orb1Y = usePulseAnimation(0, 50, speedMultiplier * 1500, 'ease-in-out');
  const orb1Scale = usePulseAnimation(1, 1.2, speedMultiplier * 1500, 'ease-in-out');
  
  const orb2X = usePulseAnimation(0, -150, speedMultiplier * 1200, 'ease-in-out');
  const orb2Y = usePulseAnimation(0, -100, speedMultiplier * 1200, 'ease-in-out');
  const orb2Scale = usePulseAnimation(1, 1.3, speedMultiplier * 1200, 'ease-in-out');
  
  const shimmerRotation = usePulseAnimation(0, 360, speedMultiplier * 4000, 'linear');

  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden transition-colors duration-2000"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Base Gradient Layer - Slow moving */}
      <div
        className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full opacity-30 mix-blend-screen filter blur-[100px]"
        style={{
          backgroundColor: colors.orb1,
          transform: `translate(${orb1X}px, ${orb1Y}px) scale(${orb1Scale})`,
        }}
      />

      {/* Secondary Gradient Layer - Counter movement */}
      <div
        className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full opacity-20 mix-blend-screen filter blur-[120px]"
        style={{
          backgroundColor: colors.orb2,
          transform: `translate(${orb2X}px, ${orb2Y}px) scale(${orb2Scale})`,
        }}
      />

      {/* Shimmer Layer - Subtle rotation */}
      <div
        className="absolute inset-[-50%] w-[200%] h-[200%] opacity-30"
        style={{
          background: `conic-gradient(from ${shimmerRotation}deg, transparent 0deg, ${colors.shimmer} 180deg, transparent 360deg)`,
        }}
      />
      
      {/* Scanline/Grid Overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '100% 4px'
        }}
      />
    </div>
  );
};
