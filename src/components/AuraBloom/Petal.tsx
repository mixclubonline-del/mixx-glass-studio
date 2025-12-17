/**
 * AURA Bloom Petal Component
 * 
 * Organic, flower-like petal with ethereal glow and fluid unfurling animation.
 * Features a more natural curved shape with layered glass and aurora effects.
 * Uses the AURA Design System tokens for consistent styling.
 */

import React, { memo, useState, useMemo } from 'react';
import { 
  AuraPalette, 
  AuraEffects, 
  AuraMotion,
  AuraKeyframes,
  auraAlpha 
} from '../../theme/aura-tokens';

// Extract palette colors
const { violet, cyan, magenta, amber, indigo } = AuraPalette;

// Color schemes for petals based on index - creates a rainbow bloom effect
const PETAL_COLOR_SCHEMES = [
  { primary: violet.DEFAULT, secondary: indigo[400], accent: cyan[300], glow: violet[400] },
  { primary: cyan.DEFAULT, secondary: violet[400], accent: magenta[300], glow: cyan[400] },
  { primary: magenta.DEFAULT, secondary: violet[300], accent: amber[300], glow: magenta[400] },
  { primary: indigo.DEFAULT, secondary: cyan[400], accent: violet[300], glow: indigo[400] },
  { primary: amber.DEFAULT, secondary: magenta[400], accent: cyan[300], glow: amber[400] },
  { primary: violet[400], secondary: magenta[400], accent: indigo[300], glow: violet[300] },
  { primary: cyan[400], secondary: indigo.DEFAULT, accent: magenta[300], glow: cyan[300] },
  { primary: magenta[400], secondary: amber[400], accent: violet[300], glow: magenta[300] },
];

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
  offset?: number;
  color?: string;
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
  offset = 0,
  color,
}) => {
  const uniqueId = `petal-${index}`;
  
  // More organic, curved petal shape - like a flower petal or leaf
  // Wider at bottom, gracefully curving to a point at top
  const petalPath = `
    M 50 175 
    C 25 155, 8 125, 5 90 
    C 2 55, 15 25, 50 5 
    C 85 25, 98 55, 95 90 
    C 92 125, 75 155, 50 175 
    Z
  `.trim().replace(/\s+/g, ' ');
  
  // Inner petal path for layered effect
  const innerPetalPath = `
    M 50 160 
    C 30 145, 18 120, 15 90 
    C 12 60, 22 35, 50 18 
    C 78 35, 88 60, 85 90 
    C 82 120, 70 145, 50 160 
    Z
  `.trim().replace(/\s+/g, ' ');
  
  // Get color scheme based on index
  const colorScheme = useMemo(() => {
    const scheme = PETAL_COLOR_SCHEMES[index % PETAL_COLOR_SCHEMES.length];
    return color ? { ...scheme, primary: color, glow: color } : scheme;
  }, [index, color]);
  
  // Local state
  const [isClicked, setIsClicked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDisabledFeedback, setShowDisabledFeedback] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDisabled) {
      setShowDisabledFeedback(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 50, 20]); 
      }
      setTimeout(() => setShowDisabledFeedback(false), 180);
      return;
    }
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 350);
    onClick();
  };

  // Enhanced spiral unfurling animation
  const closedRotationOffset = 90; // More dramatic twist when closed
  const closedScaleY = 0.3; // Squish when closed for organic feel
  const currentRotation = isOpen ? rotation : rotation - closedRotationOffset;
  const currentScale = isOpen ? 1 : 0.1;
  const currentScaleY = isOpen ? 1 : closedScaleY;
  
  // Dynamic glow intensity
  const glowIntensity = isActive ? 1 : isHovered ? 0.6 : 0.25;
  const glowRadius = isActive ? 25 : isHovered ? 18 : 10;
  
  return (
    <>
      <style>{AuraKeyframes}</style>
      
      <div
        className={`absolute left-1/2 top-1/2 w-[100px] h-[180px] 
          ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
          ${isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
        style={{
          transform: `
            translate(-50%, calc(-100% - ${offset}px)) 
            rotate(${currentRotation}deg) 
            scale(${currentScale}) 
            scaleY(${currentScaleY})
          `,
          transformOrigin: `50% calc(100% + ${offset}px)`,
          transition: `
            transform ${isOpen ? '900ms' : '400ms'} ${isOpen ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)'} ${delay}ms,
            opacity ${isOpen ? '600ms' : '200ms'} ease ${delay}ms
          `,
          filter: isDisabled ? 'grayscale(0.7) brightness(0.6)' : 'none',
        }}
        onClick={handleClick}
        onMouseEnter={() => !isDisabled && setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsClicked(false); }}
      >
        {/* ===== OUTER ETHEREAL GLOW ===== */}
        <div 
          className="absolute pointer-events-none"
          style={{
            inset: -30,
            background: `radial-gradient(ellipse 60% 70% at 50% 35%,
              ${auraAlpha(colorScheme.glow, glowIntensity * 0.6)} 0%,
              ${auraAlpha(colorScheme.secondary, glowIntensity * 0.25)} 50%,
              transparent 75%
            )`,
            filter: `blur(${glowRadius}px)`,
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.6s ease, filter 0.3s ease',
            animation: isOpen && !isHovered ? 'aura-breathe 4s ease-in-out infinite' : 'none',
            animationDelay: `${index * 200}ms`,
          }}
        />

        {/* ===== SVG PETAL SHAPE ===== */}
        <svg 
          viewBox="0 0 100 180" 
          className="relative z-10 w-full h-full overflow-visible"
          style={{
            filter: isActive || isClicked 
              ? `drop-shadow(0 0 ${glowRadius + 10}px ${colorScheme.glow})`
              : `drop-shadow(0 8px 16px rgba(0,0,0,0.4))`,
            transform: isActive 
              ? 'scale(0.92)' 
              : showDisabledFeedback 
                ? 'translateX(3px)' 
                : isHovered 
                  ? 'scale(1.08) translateY(-3px)' 
                  : 'scale(1)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease',
          }}
        >
          <defs>
            {/* Primary gradient - vertical flow */}
            <linearGradient id={`${uniqueId}-grad`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor={auraAlpha(colorScheme.primary, 0.4)} />
              <stop offset="50%" stopColor={auraAlpha(colorScheme.secondary, 0.25)} />
              <stop offset="100%" stopColor={auraAlpha(colorScheme.primary, 0.15)} />
            </linearGradient>
            
            {/* Inner glow gradient */}
            <radialGradient id={`${uniqueId}-inner`} cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor={auraAlpha(colorScheme.accent, isHovered ? 0.5 : 0.2)} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            
            {/* Shimmer sweep */}
            <linearGradient id={`${uniqueId}-shimmer`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor={auraAlpha('#ffffff', 0.08)} />
              <stop offset="50%" stopColor={auraAlpha('#ffffff', 0.2)} />
              <stop offset="55%" stopColor={auraAlpha('#ffffff', 0.08)} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            
            {/* Clip path for effects */}
            <clipPath id={`${uniqueId}-clip`}>
              <path d={petalPath} />
            </clipPath>
            
            {/* Blur filter for glass */}
            <filter id={`${uniqueId}-blur`}>
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* Background blur simulation layer */}
          <path
            d={petalPath}
            fill={auraAlpha('#1a1025', 0.6)}
            style={{ mixBlendMode: 'multiply' }}
          />
          
          {/* Main petal fill */}
          <path
            d={petalPath}
            fill={`url(#${uniqueId}-grad)`}
            style={{
              transition: 'fill 0.3s ease',
            }}
          />
          
          {/* Inner glow layer */}
          <path
            d={innerPetalPath}
            fill={`url(#${uniqueId}-inner)`}
            style={{
              opacity: isHovered || isActive ? 1 : 0.5,
              transition: 'opacity 0.3s ease',
            }}
          />
          
          {/* Edge highlight stroke */}
          <path
            d={petalPath}
            fill="none"
            stroke={auraAlpha(colorScheme.primary, isActive ? 0.9 : isHovered ? 0.7 : 0.4)}
            strokeWidth={isActive ? 2 : 1}
            style={{
              transition: 'stroke 0.3s ease, stroke-width 0.2s ease',
            }}
          />
          
          {/* Inner edge subtle line */}
          <path
            d={innerPetalPath}
            fill="none"
            stroke={auraAlpha('#ffffff', 0.12)}
            strokeWidth="0.5"
          />
          
          {/* Top highlight ellipse */}
          <ellipse
            cx="50"
            cy="45"
            rx="28"
            ry="18"
            fill={`url(#${uniqueId}-shimmer)`}
            opacity={isHovered || isActive ? 0.9 : 0.5}
            style={{
              transition: 'opacity 0.3s ease',
            }}
          />
          
          {/* Animated shimmer on hover */}
          {isHovered && (
            <g clipPath={`url(#${uniqueId}-clip)`}>
              <rect
                x="-150"
                y="0"
                width="400"
                height="180"
                fill={`url(#${uniqueId}-shimmer)`}
                style={{
                  animation: 'aura-shimmer 1.8s ease-in-out infinite',
                }}
              />
            </g>
          )}
        </svg>

        {/* ===== CONTENT - COUNTER-ROTATED ===== */}
        <div
          className="absolute left-1/2 flex flex-col items-center pointer-events-none z-20"
          style={{
            top: '28%', // Position in the visual center of the petal shape
            transform: `translateX(-50%) rotate(${-rotation}deg) scaleY(${1 / currentScaleY})`,
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Icon container with consistent sizing */}
          <div 
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              color: isActive || isClicked 
                ? '#ffffff' 
                : isHovered 
                  ? auraAlpha('#ffffff', 0.98)
                  : auraAlpha(colorScheme.accent, 0.95),
              filter: isActive || isClicked
                ? `drop-shadow(0 0 18px ${colorScheme.glow}) drop-shadow(0 0 10px ${colorScheme.primary})`
                : isHovered
                  ? `drop-shadow(0 0 12px ${auraAlpha(colorScheme.glow, 0.7)})`
                  : `drop-shadow(0 3px 8px rgba(0,0,0,0.5))`,
              transform: isActive || isClicked ? 'scale(1.25)' : isHovered ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {icon}
          </div>
          
          {/* Label with glow - slightly separated */}
          <span 
            className="text-[9px] font-bold tracking-[0.2em] uppercase whitespace-nowrap mt-2"
            style={{
              color: isActive || isClicked ? '#ffffff' : auraAlpha('#ffffff', 0.92),
              textShadow: isActive || isClicked
                ? `0 0 20px ${colorScheme.glow}, 0 0 12px ${auraAlpha(colorScheme.primary, 0.9)}, 0 2px 4px rgba(0,0,0,0.6)`
                : isHovered
                  ? `0 0 14px ${auraAlpha(colorScheme.glow, 0.6)}, 0 2px 4px rgba(0,0,0,0.5)`
                  : `0 2px 6px rgba(0,0,0,0.7)`,
              letterSpacing: '0.18em',
              transform: isActive || isClicked ? 'scale(1.1)' : isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.25s ease',
            }}
          >
            {label}
          </span>
        </div>

        {/* ===== RIPPLE EFFECT ON CLICK ===== */}
        {isClicked && (
          <div 
            className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
            style={{
              clipPath: `path('${petalPath}')`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: '50%',
                width: '250%',
                height: '250%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, 
                  ${auraAlpha(colorScheme.glow, 0.7)} 0%, 
                  ${auraAlpha(colorScheme.primary, 0.4)} 30%,
                  ${auraAlpha(colorScheme.secondary, 0.2)} 60%,
                  transparent 80%
                )`,
                animation: 'aura-ripple 0.6s ease-out forwards',
              }}
            />
          </div>
        )}
      </div>
    </>
  );
});

Petal.displayName = 'Petal';

export default Petal;
