/**
 * MixxGlass Effects System
 * 
 * Proprietary effects utilities (shadows, glows, borders, etc.)
 */

export type ShadowIntensity = 'soft' | 'medium' | 'strong' | 'intense';
export type GlowColor = 'cyan' | 'pink' | 'violet' | 'amber' | 'rose' | 'custom';

/**
 * Shadow utilities
 */
export const shadow = {
  /**
   * Glass shadow (standard)
   */
  glass: (intensity: ShadowIntensity = 'medium'): React.CSSProperties => {
    const shadows = {
      soft: '0 8px 32px rgba(4, 12, 26, 0.35)',
      medium: '0 22px 70px rgba(4, 12, 26, 0.55)',
      strong: '0 35px 100px rgba(4, 12, 26, 0.75)',
      intense: '0 50px 140px rgba(4, 12, 26, 0.95)',
    };
    return {
      boxShadow: shadows[intensity],
    };
  },
  
  /**
   * ALS glow shadow
   */
  alsGlow: (color: string, intensity: number = 0.5): React.CSSProperties => ({
    boxShadow: `0 0 ${10 + intensity * 30}px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
  }),
  
  /**
   * Inner shadow
   */
  inner: (intensity: ShadowIntensity = 'medium'): React.CSSProperties => {
    const shadows = {
      soft: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      medium: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
      strong: 'inset 0 4px 12px rgba(0, 0, 0, 0.4)',
      intense: 'inset 0 6px 16px rgba(0, 0, 0, 0.5)',
    };
    return {
      boxShadow: shadows[intensity],
    };
  },
  
  /**
   * Combined glass + inner shadow
   */
  glassInner: (intensity: ShadowIntensity = 'medium'): React.CSSProperties => ({
    boxShadow: `${shadow.glass(intensity).boxShadow}, ${shadow.inner(intensity).boxShadow}`,
  }),
};

/**
 * Glow utilities
 */
export const glow = {
  /**
   * Standard glow colors
   */
  colors: {
    cyan: 'rgba(96, 200, 255, 0.6)',
    pink: 'rgba(255, 103, 199, 0.6)',
    violet: 'rgba(167, 124, 255, 0.6)',
    amber: 'rgba(251, 191, 36, 0.6)',
    rose: 'rgba(244, 63, 94, 0.6)',
  } as Record<string, string>,
  
  /**
   * Generate glow effect
   */
  effect: (color: GlowColor | string, intensity: number = 0.5, size: number = 20): React.CSSProperties => {
    const glowColor = typeof color === 'string' && !glow.colors[color as GlowColor]
      ? color
      : glow.colors[color as GlowColor] || glow.colors.cyan;
    
    const alpha = Math.round(intensity * 255).toString(16).padStart(2, '0');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rgbaColor = glowColor.replace('0.6', `${intensity}`).replace('rgba', '').replace('(', '').replace(')', '');
    
    return {
      boxShadow: `0 0 ${size}px ${glowColor}, 0 0 ${size * 1.5}px ${glowColor}${alpha}`,
    };
  },
  
  /**
   * ALS-aware glow
   */
  als: (channel: 'temperature' | 'momentum' | 'pressure' | 'harmony', intensity: number = 0.5): React.CSSProperties => {
    const colors = {
      temperature: intensity > 0.7 ? '#ff6b6b' : intensity > 0.4 ? '#ffa94d' : '#4ecdc4',
      momentum: '#60c8ff',
      pressure: '#a57cff',
      harmony: '#ff67c7',
    };
    
    return glow.effect(colors[channel], intensity, 15 + intensity * 25);
  },
};

/**
 * Border utilities
 */
export const border = {
  /**
   * Glass border
   */
  glass: (intensity: 'soft' | 'medium' | 'strong' = 'medium'): React.CSSProperties => {
    const borders = {
      soft: 'rgba(102, 140, 198, 0.26)',
      medium: 'rgba(102, 140, 198, 0.45)',
      strong: 'rgba(102, 140, 198, 0.65)',
    };
    return {
      border: `1px solid ${borders[intensity]}`,
    };
  },
  
  /**
   * ALS border (color changes with ALS feedback)
   */
  als: (color: string, intensity: number = 0.5): React.CSSProperties => ({
    border: `1px solid ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
  }),
  
  /**
   * Border sides (convenience methods)
   */
  top: (intensity: 'soft' | 'medium' | 'strong' = 'medium'): React.CSSProperties => {
    const borders = {
      soft: 'rgba(102, 140, 198, 0.26)',
      medium: 'rgba(102, 140, 198, 0.45)',
      strong: 'rgba(102, 140, 198, 0.65)',
    };
    return {
      borderTop: `1px solid ${borders[intensity]}`,
    };
  },
  
  bottom: (intensity: 'soft' | 'medium' | 'strong' = 'medium'): React.CSSProperties => {
    const borders = {
      soft: 'rgba(102, 140, 198, 0.26)',
      medium: 'rgba(102, 140, 198, 0.45)',
      strong: 'rgba(102, 140, 198, 0.65)',
    };
    return {
      borderBottom: `1px solid ${borders[intensity]}`,
    };
  },
  
  left: (intensity: 'soft' | 'medium' | 'strong' = 'medium'): React.CSSProperties => {
    const borders = {
      soft: 'rgba(102, 140, 198, 0.26)',
      medium: 'rgba(102, 140, 198, 0.45)',
      strong: 'rgba(102, 140, 198, 0.65)',
    };
    return {
      borderLeft: `1px solid ${borders[intensity]}`,
    };
  },
  
  right: (intensity: 'soft' | 'medium' | 'strong' = 'medium'): React.CSSProperties => {
    const borders = {
      soft: 'rgba(102, 140, 198, 0.26)',
      medium: 'rgba(102, 140, 198, 0.45)',
      strong: 'rgba(102, 140, 198, 0.65)',
    };
    return {
      borderRight: `1px solid ${borders[intensity]}`,
    };
  },
  
  /**
   * Border radius
   */
  radius: {
    none: { borderRadius: '0' } as React.CSSProperties,
    sm: { borderRadius: 'var(--flow-radius-sm)' } as React.CSSProperties,
    md: { borderRadius: 'var(--flow-radius-md)' } as React.CSSProperties,
    lg: { borderRadius: 'var(--flow-radius-lg)' } as React.CSSProperties,
    xl: { borderRadius: 'var(--flow-radius-xl)' } as React.CSSProperties,
    '2xl': { borderRadius: 'var(--flow-radius-2xl)' } as React.CSSProperties,
    full: { borderRadius: 'var(--flow-radius-full)' } as React.CSSProperties,
    /**
     * Custom border radius value
     */
    custom: (value: string): React.CSSProperties => ({ borderRadius: value }),
  },
};

/**
 * Backdrop utilities
 */
export const backdrop = {
  /**
   * Backdrop blur
   */
  blur: (intensity: 'soft' | 'medium' | 'strong' = 'medium'): React.CSSProperties => {
    const blurs = {
      soft: 'blur(16px) saturate(140%)',
      medium: 'blur(28px) saturate(160%)',
      strong: 'blur(40px) saturate(180%)',
    };
    return {
      backdropFilter: blurs[intensity],
      WebkitBackdropFilter: blurs[intensity],
    };
  },
};

/**
 * Effects object with all utilities
 */
export const effects = {
  shadow,
  glow,
  border,
  backdrop,
};


