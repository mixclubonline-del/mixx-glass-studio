/**
 * MixxGlass Input Component
 * 
 * Proprietary input component with glass aesthetic.
 * Replaces Radix UI input components.
 */

import React, { useState } from 'react';
import { getGlassInputStyles, getGlassSurface } from '../utils/glassStyles';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { spacing, typography, transitions, effects, composeStyles } from '../../../design-system';

export interface MixxGlassInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass';
  error?: boolean;
}

/**
 * MixxGlass Input
 * 
 * Glass aesthetic input field with focus states.
 */
export const MixxGlassInput: React.FC<MixxGlassInputProps> = ({
  size = 'md',
  variant = 'glass',
  error = false,
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Animated focus state
  const animatedGlow = useFlowMotion(
    { intensity: isFocused ? 1 : 0 },
    { duration: 200, easing: 'ease-out' }
  );

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
      spacing.px(5),
      spacing.py(3),
      typography.size('lg')
    ),
  };

  const baseStyles = getGlassInputStyles(isFocused);
  const glassSurface = variant === 'glass' ? getGlassSurface({ intensity: 'soft', border: false }) : {};

  const inputStyle: React.CSSProperties = composeStyles(
    baseStyles,
    glassSurface,
    sizeStyles[size],
    effects.border.radius.md,
    transitions.transition.standard('all', 200, 'ease-out'),
    {
      outline: 'none',
      boxShadow: error
        ? `0 0 15px rgba(255, 71, 87, 0.4), ${baseStyles.boxShadow}`
        : baseStyles.boxShadow,
    }
  );

  return (
    <input
      className={`mixxglass-input ${className}`}
      style={inputStyle}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
};

export default MixxGlassInput;


