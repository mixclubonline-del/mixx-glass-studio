/**
 * AURA Bloom Petal Component
 * 
 * Organic glassmorphic petal with spiral unfurling animation.
 * Ported from aura-bloom-menu standalone project.
 */

import React, { memo, useState } from 'react';

interface PetalProps {
  label: string;
  icon: React.ReactNode;
  rotation: number;
  onClick: () => void;
  index: number;
  isActive: boolean;
  isDisabled?: boolean;
  isOpen: boolean;
  delay: number;
  /** Distance to offset the petal from the center (spread) */
  offset?: number;
}

export const Petal: React.FC<PetalProps> = memo(({ 
  label, 
  icon, 
  rotation, 
  onClick, 
  index, 
  isActive, 
  isDisabled = false,
  isOpen,
  delay,
  offset = 0
}) => {
  const gradientId = `petalGradient-${index}`;
  const petalPath = "M 45 160 C 20 130, 5 100, 10 60 C 15 30, 30 10, 45 5 C 60 10, 75 30, 80 60 C 85 100, 70 130, 45 160 Z";
  
  // Local state for immediate click feedback independent of parent state
  const [isClicked, setIsClicked] = useState(false);
  // Local state for disabled interaction feedback
  const [showDisabledFeedback, setShowDisabledFeedback] = useState(false);

  const handleClick = () => {
    if (isDisabled) {
      // Trigger "rejection" feedback
      setShowDisabledFeedback(true);
      // Haptic feedback for disabled state (double tap pattern)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 50, 20]); 
      }
      setTimeout(() => setShowDisabledFeedback(false), 150);
      return;
    }
    
    // Haptic feedback for success state (single crisp tap)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    setIsClicked(true);
    // Reset local click state quickly
    setTimeout(() => setIsClicked(false), 200);
    // Trigger parent handler
    onClick();
  };

  // Calculate dynamic styles for the bloom effect
  // We add a rotation offset when closed to create a "spiral" unfurling effect
  const closedRotationOffset = 45; // Degrees to twist when closed
  const currentRotation = isOpen ? rotation : rotation - closedRotationOffset;
  const currentScale = isOpen ? 1 : 0.25; // Start slightly larger than 0 to make the spiral twist visible during the fade
  
  return (
    <div
      className={`absolute left-1/2 top-1/2 w-[90px] h-[160px] 
        ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
        ${isDisabled ? 'cursor-not-allowed opacity-40 grayscale-[0.6]' : 'group cursor-pointer'}`}
      style={{
        // Logic:
        // 1. Position element so its bottom edge is at the center: translate(-50%, -100%)
        // 2. Apply additional radial offset (spread): calc(-100% - offset)
        // 3. Compensate transform-origin to keep rotation centered: calc(100% + offset)
        transform: `translate(-50%, calc(-100% - ${offset}px)) rotate(${currentRotation}deg) scale(${currentScale})`,
        transformOrigin: `50% calc(100% + ${offset}px)`,
        
        // Dynamic transition: Springy/slow when opening, Fast/snappy when closing
        transition: `
          transform ${isOpen ? '0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : '0.4s cubic-bezier(0.4, 0, 0.2, 1)'} ${delay}ms, 
          opacity ${isOpen ? '0.5s ease-out' : '0.2s ease-in'} ${delay}ms, 
          filter 0.3s ease
        `,
      }}
      onClick={handleClick}
    >
      {/* Glassmorphism Background Layer */}
      {/* Uses clip-path to match petal shape and backdrop-filter for blur */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{
          clipPath: `path('${petalPath}')`
        }}
      >
        <div className={`w-full h-full bg-white/10 backdrop-blur-xl transition-all duration-300 ${isActive ? 'bg-white/20' : 'group-hover:bg-white/15'}`} />
      </div>

      {/* SVG Shape - Border & Gradient Overlay */}
      <svg 
        viewBox="0 0 90 160" 
        className={`relative z-10 w-full h-full overflow-visible drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-all origin-bottom ${
          isActive 
            ? 'duration-150 scale-95 brightness-150' 
            : showDisabledFeedback
              ? 'duration-75 translate-x-[2px]' // Subtle tremor/shake effect
              : 'duration-300 group-hover:drop-shadow-[0_0_20px_rgba(120,200,255,0.4)] group-hover:scale-105'
        }`}
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="40%" r="90%" fx="50%" fy="40%">
            {/* Lighter, more transparent gradient for glass effect */}
            <stop offset="0%" stopColor="rgba(200, 230, 255, 0.15)" />
            <stop offset="60%" stopColor="rgba(130, 150, 240, 0.1)" />
            <stop offset="100%" stopColor="rgba(70, 40, 180, 0.05)" />
          </radialGradient>
        </defs>

        <path
          d={petalPath}
          fill={`url(#${gradientId})`}
          // Use a stronger, more defined stroke for the glass edge
          stroke={showDisabledFeedback ? "rgba(255, 255, 255, 0.5)" : isClicked ? "white" : "rgba(255, 255, 255, 0.4)"}
          strokeWidth={showDisabledFeedback ? "1" : isClicked ? "1.5" : "0.75"}
          className={`transition-all ${
            showDisabledFeedback 
              ? 'duration-75 brightness-125' 
              : isClicked 
                ? 'duration-75 brightness-[1.8]' 
                : 'duration-300 group-hover:brightness-125'
          }`}
        />
      </svg>

      {/* Content Wrapper - Counter Rotated */}
      <div
        className="absolute top-[25%] left-1/2 flex flex-col items-center gap-2 pointer-events-none z-20"
        style={{
          transform: `translateX(-50%) rotate(${-rotation}deg)`,
        }}
      >
        <div className={`text-blue-100/90 transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] ${
          isActive || isClicked ? 'scale-110 text-white' : 'group-hover:text-white group-hover:scale-110'
        }`}>
          {icon}
        </div>
        <span className={`text-[11px] font-medium tracking-[0.15em] uppercase text-blue-100/80 transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] whitespace-nowrap ${
          isActive || isClicked
            ? 'text-white scale-110 font-semibold' 
            : 'group-hover:text-white group-hover:scale-110 group-hover:font-semibold'
        }`}>
          {label}
        </span>
      </div>
    </div>
  );
});

Petal.displayName = 'Petal';

export default Petal;
