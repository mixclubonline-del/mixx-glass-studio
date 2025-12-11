/**
 * MixxGlass Button Component
 * 
 * Proprietary button component with glass aesthetic and ALS integration.
 * Replaces Radix UI button components.
 */

import React from 'react';
import { getGlassButtonStyles, getGlassSurface } from '../utils/glassStyles';
import { useALSFeedback, type ALSChannel } from '../hooks/useALSFeedback';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { spacing, typography, transitions, composeStyles } from '../../../design-system';

export interface MixxGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  alsChannel?: ALSChannel;
  alsValue?: number;
  glow?: boolean;
  children: React.ReactNode;
}

/**
 * MixxGlass Button
 * 
 * Glass aesthetic button with optional ALS feedback integration.
 * No raw numbers - uses color/temperature/energy for feedback.
 */
export const MixxGlassButton: React.FC<MixxGlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  alsChannel,
  alsValue,
  glow = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Get ALS feedback if provided
  const alsFeedback = useALSFeedback({
    channel: alsChannel || 'momentum',
    value: alsValue || 0,
    enabled: !!alsChannel && alsValue !== undefined,
  });

  // Animation for hover/interaction
  const [isHovered, setIsHovered] = React.useState(false);
  const animatedScale = useFlowMotion(
    { scale: isHovered && !disabled ? 1.02 : 1 },
    { duration: 200, easing: 'ease-out' }
  );

  // Get base styles
  const baseStyles = getGlassButtonStyles(variant);
  const glassSurface = getGlassSurface({
    intensity: variant === 'primary' ? 'medium' : 'soft',
    border: true,
    glow: glow || (alsFeedback?.pulse ?? false),
    glowColor: alsFeedback?.glowColor,
  });

  // Size styles using design system
  const sizeStyles = {
    sm: composeStyles(
      spacing.px(3),
      spacing.py(1.5),
      typography.size('sm')
    ),
    md: composeStyles(
      spacing.px(4),
      spacing.py(2),
      typography.size('base')
    ),
    lg: composeStyles(
      spacing.px(6),
      spacing.py(3),
      typography.size('lg')
    ),
  };

  // Combine styles using design system
  const buttonStyle: React.CSSProperties = composeStyles(
    baseStyles,
    glassSurface,
    sizeStyles[size],
    transitions.transform.scale(animatedScale.scale),
    transitions.transition.standard(['transform', 'box-shadow'], 250, 'ease-out'),
    {
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      position: 'relative',
      overflow: 'hidden',
    }
  );

  return (
    <button
      className={`mixxglass-button ${className}`}
      style={buttonStyle}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Glass border overlay */}
      <div
        style={composeStyles(
          {
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            border: '1px solid rgba(255, 255, 255, 0.28)',
            opacity: 0.6,
          }
        )}
      />
      
      {/* Content */}
      <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>

      {/* ALS pulse effect */}
      {alsFeedback?.pulse && (
        <div
          style={composeStyles(
            {
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              background: `radial-gradient(circle, ${alsFeedback.glowColor} 0%, transparent 70%)`,
              opacity: 0.3,
              animation: 'pulse 2s ease-in-out infinite',
            }
          )}
        />
      )}
    </button>
  );
};

export default MixxGlassButton;


