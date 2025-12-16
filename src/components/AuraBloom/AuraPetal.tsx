/**
 * AuraPetal Component
 * 
 * Organic leaf/teardrop shaped petal for the AURA Bloom menu.
 * Uses SVG for precise organic curves matching the design vision.
 */

import React, { useMemo } from 'react';
import type { AuraPetalConfig } from './petalConfigs';
import { hexToRgba } from '../../utils/ALS';
import { AuraColors } from '../../theme/aura-tokens';

interface AuraPetalProps {
  config: AuraPetalConfig;
  index: number;
  total: number;
  radius: number;
  isOpen: boolean;
  isHovered: boolean;
  onHover: (config: AuraPetalConfig | null) => void;
  onClick: (config: AuraPetalConfig) => void;
  icon?: React.ReactNode;
}

/**
 * Organic petal SVG path
 * Creates a teardrop/leaf shape pointing outward
 */
const PETAL_PATH = `
  M 40 10
  C 55 10, 70 25, 70 40
  C 70 52, 62 62, 50 68
  C 45 70, 40 70, 40 70
  C 40 70, 35 70, 30 68
  C 18 62, 10 52, 10 40
  C 10 25, 25 10, 40 10
  Z
`;

export const AuraPetal: React.FC<AuraPetalProps> = ({
  config,
  index,
  total,
  radius,
  isOpen,
  isHovered,
  onHover,
  onClick,
  icon,
}) => {
  // Calculate position around the circle
  const { x, y, rotation } = useMemo(() => {
    const angle = (360 / total) * index - 90; // Start from top
    const radians = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
      rotation: angle + 90, // Point outward from center
    };
  }, [index, total, radius]);

  const accentColor = config.accentColor || AuraColors.violet;
  
  // Dynamic styles based on state
  const pathStyle = useMemo(() => ({
    fill: isHovered 
      ? hexToRgba(accentColor, 0.25)
      : hexToRgba(AuraColors.violet, 0.12),
    stroke: isHovered
      ? hexToRgba(accentColor, 0.6)
      : 'rgba(255, 255, 255, 0.15)',
    strokeWidth: 1,
    filter: isHovered
      ? `drop-shadow(0 0 24px ${hexToRgba(accentColor, 0.7)})`
      : `drop-shadow(0 0 10px ${hexToRgba(AuraColors.violet, 0.35)})`,
    transition: 'all 0.35s ease',
  }), [accentColor, isHovered]);

  // Transform for positioning
  const transform = isOpen
    ? `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(1)`
    : `translate(0, 0) rotate(${rotation}deg) scale(0.3)`;

  return (
    <button
      type="button"
      className="aura-petal"
      style={{
        transform,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transitionDelay: isOpen ? `${index * 45}ms` : '0ms',
      }}
      disabled={config.disabled}
      onClick={() => onClick(config)}
      onMouseEnter={() => onHover(config)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(config)}
      onBlur={() => onHover(null)}
      aria-label={config.label}
    >
      {/* SVG Petal Shape */}
      <svg
        className="aura-petal__shape"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={PETAL_PATH} style={pathStyle} />
        
        {/* Inner glow layer */}
        <path
          d={PETAL_PATH}
          fill="none"
          stroke={isHovered ? hexToRgba(accentColor, 0.3) : 'rgba(255,255,255,0.05)'}
          strokeWidth="2"
          style={{
            filter: 'blur(4px)',
            transition: 'stroke 0.35s ease',
          }}
        />
      </svg>

      {/* Content (counter-rotated to stay upright) */}
      <div
        className="aura-petal__content"
        style={{
          transform: `rotate(${-rotation}deg)`,
        }}
      >
        {icon && (
          <div
            className="aura-petal__icon"
            style={{
              color: isHovered ? accentColor : 'rgba(255, 255, 255, 0.85)',
            }}
          >
            {icon}
          </div>
        )}
        <span
          className="aura-petal__label"
          style={{
            color: isHovered ? '#fff' : 'rgba(255, 255, 255, 0.7)',
          }}
        >
          {config.label}
        </span>
      </div>
    </button>
  );
};

export default AuraPetal;
