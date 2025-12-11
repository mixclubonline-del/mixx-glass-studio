/**
 * MixxGlass Style Utilities
 * 
 * Provides glass aesthetic styling primitives and utilities
 */

export interface GlassStyleProps {
  intensity?: 'soft' | 'medium' | 'strong';
  border?: boolean;
  glow?: boolean;
  glowColor?: string;
}

/**
 * Generate glass surface styles
 */
export function getGlassSurface(props: GlassStyleProps = {}) {
  const { intensity = 'medium', border = true, glow = false, glowColor } = props;

  const intensities = {
    soft: {
      background: 'rgba(9, 18, 36, 0.68)',
      backdrop: 'blur(16px) saturate(140%)',
      border: 'rgba(102, 140, 198, 0.26)',
    },
    medium: {
      background: 'rgba(9, 18, 36, 0.82)',
      backdrop: 'blur(28px) saturate(160%)',
      border: 'rgba(102, 140, 198, 0.45)',
    },
    strong: {
      background: 'rgba(9, 18, 36, 0.92)',
      backdrop: 'blur(40px) saturate(180%)',
      border: 'rgba(102, 140, 198, 0.65)',
    },
  };

  const style = intensities[intensity];

  return {
    backgroundColor: style.background,
    backdropFilter: style.backdrop,
    WebkitBackdropFilter: style.backdrop,
    border: border ? `1px solid ${style.border}` : 'none',
    boxShadow: glow
      ? `0 0 20px ${glowColor || 'rgba(96, 200, 255, 0.3)'}, 0 22px 70px rgba(4, 12, 26, 0.55)`
      : '0 22px 70px rgba(4, 12, 26, 0.55)',
  };
}

/**
 * Generate glass button styles
 */
export function getGlassButtonStyles(variant: 'primary' | 'secondary' | 'ghost' = 'primary') {
  const variants = {
    primary: {
      background: 'linear-gradient(140deg, rgba(40, 64, 118, 0.95), rgba(122, 84, 222, 0.72))',
      border: '1px solid rgba(188, 161, 255, 0.6)',
      color: '#f8f9ff',
      hover: {
        transform: 'translateY(-3px) scale(1.02)',
        boxShadow: '0 28px 55px rgba(9, 20, 44, 0.75)',
      },
    },
    secondary: {
      background: 'rgba(16, 28, 54, 0.85)',
      border: '1px solid rgba(102, 140, 198, 0.45)',
      color: '#e6f0ff',
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 20px 40px rgba(4, 12, 26, 0.6)',
      },
    },
    ghost: {
      background: 'transparent',
      border: '1px solid rgba(102, 140, 198, 0.2)',
      color: '#e6f0ff',
      hover: {
        background: 'rgba(16, 28, 54, 0.4)',
        border: '1px solid rgba(102, 140, 198, 0.4)',
      },
    },
  };

  return variants[variant];
}

/**
 * Generate glass input styles
 */
export function getGlassInputStyles(focused: boolean = false) {
  return {
    background: focused
      ? 'rgba(16, 28, 54, 0.9)'
      : 'rgba(9, 18, 36, 0.68)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    border: focused
      ? '1px solid rgba(96, 200, 255, 0.6)'
      : '1px solid rgba(102, 140, 198, 0.3)',
    boxShadow: focused
      ? '0 0 15px rgba(96, 200, 255, 0.3), inset 0 0 0.5px rgba(255, 255, 255, 0.1)'
      : 'inset 0 0 0.5px rgba(255, 255, 255, 0.1)',
    color: '#e6f0ff',
  };
}

/**
 * Generate 3D transform for glass effect
 */
export function getGlassTransform(depth: number = 0) {
  return {
    transform: `translateZ(${depth}px)`,
    transformStyle: 'preserve-3d' as const,
  };
}

/**
 * Generate pulse animation for ALS feedback
 */
export function getALSPulse(color: string, intensity: number = 0.5) {
  return {
    animation: `als-pulse-${color.replace('#', '')} 2s ease-in-out infinite`,
    '@keyframes': {
      [`als-pulse-${color.replace('#', '')}`]: {
        '0%, 100%': {
          boxShadow: `0 0 10px ${color}40`,
        },
        '50%': {
          boxShadow: `0 0 20px ${color}${Math.round(intensity * 255).toString(16)}`,
        },
      },
    },
  };
}



