/**
 * MixxGlass Toggle Component
 * 
 * Proprietary toggle/switch component with glass aesthetic and ALS integration.
 * Replaces Radix UI switch components.
 */

import React, { useState } from 'react';
import { getGlassSurface } from '../utils/glassStyles';
import { useALSFeedback, type ALSChannel } from '../hooks/useALSFeedback';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { spacing, typography, layout, transitions, composeStyles } from '../../../design-system';

export interface MixxGlassToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  alsChannel?: ALSChannel;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

/**
 * MixxGlass Toggle
 * 
 * Glass aesthetic toggle with ALS feedback integration.
 */
export const MixxGlassToggle: React.FC<MixxGlassToggleProps> = ({
  checked,
  onChange,
  alsChannel,
  disabled = false,
  size = 'md',
  label,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // ALS feedback
  const alsFeedback = useALSFeedback({
    channel: alsChannel || 'momentum',
    value: checked ? 1 : 0,
    enabled: !!alsChannel,
  });

  // Animated position
  const animatedPosition = useFlowMotion(
    { position: checked ? 1 : 0 },
    { duration: 200, easing: 'ease-out' }
  );

  const sizeStyles = {
    sm: { width: '32px', height: '18px', thumb: '14px' },
    md: { width: '44px', height: '24px', thumb: '20px' },
    lg: { width: '56px', height: '30px', thumb: '26px' },
  };

  const styles = sizeStyles[size];
  const thumbOffset = animatedPosition.position * (styles.width - styles.thumb - 4);

  const glassSurface = getGlassSurface({
    intensity: 'soft',
    border: true,
    glow: alsFeedback?.pulse ?? false,
    glowColor: alsFeedback?.glowColor,
  });

  const trackStyle: React.CSSProperties = composeStyles(
    glassSurface,
    layout.position.relative,
    {
      width: `${styles.width}px`,
      height: `${styles.height}px`,
      borderRadius: `${styles.height / 2}px`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    },
    transitions.transition.standard('all', 200, 'ease-out')
  );

  const thumbStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    {
      top: '2px',
      left: `${2 + thumbOffset}px`,
      width: `${styles.thumb}px`,
      height: `${styles.thumb}px`,
      borderRadius: '50%',
      background: checked
        ? `radial-gradient(circle, ${alsFeedback?.color || '#60c8ff'}, ${alsFeedback?.glowColor || '#60c8ff'}80)`
        : 'rgba(102, 140, 198, 0.4)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      boxShadow: checked
        ? `0 0 ${8 + (alsFeedback?.intensity || 0) * 8}px ${alsFeedback?.glowColor || '#60c8ff'}60`
        : '0 2px 4px rgba(0, 0, 0, 0.2)',
      transform: isHovered && !disabled ? 'scale(1.1)' : 'scale(1)',
    },
    transitions.transition.standard('all', 200, 'ease-out')
  );

  return (
    <div style={composeStyles(
      layout.flex.container('row'),
      layout.flex.align.center,
      spacing.gap(2)
    )}>
      <div
        style={trackStyle}
        onClick={() => !disabled && onChange(!checked)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <div style={thumbStyle} />
      </div>
      {label && (
        <label
          style={composeStyles(
            typography.size('sm'),
            typography.color.ink.DEFAULT,
            { cursor: 'pointer' }
          )}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default MixxGlassToggle;


