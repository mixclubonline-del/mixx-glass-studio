import React from 'react';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

/**
 * Font size mapping (responsive)
 */
const fontSizeMap: Record<FontSize, string> = {
  xs: 'var(--flow-font-xs)',
  sm: 'var(--flow-font-sm)',
  base: 'var(--flow-font-md)',
  lg: 'var(--flow-font-lg)',
  xl: 'var(--flow-font-xl)',
  '2xl': 'var(--flow-font-2xl)',
  '3xl': 'calc(var(--flow-font-2xl) * 1.33)',
  '4xl': 'calc(var(--flow-font-2xl) * 1.66)',
  '5xl': 'calc(var(--flow-font-2xl) * 2)',
  '6xl': 'calc(var(--flow-font-2xl) * 2.5)',
};

/**
 * Font weight mapping
 */
const fontWeightMap: Record<FontWeight, string> = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

/**
 * Typography utilities
 */
export const typography = {
  /**
   * Font size
   */
  size: (size: FontSize): React.CSSProperties => ({
    fontSize: fontSizeMap[size],
  }),
  
  /**
   * Font weight
   */
  weight: (weight: FontWeight): React.CSSProperties => ({
    fontWeight: fontWeightMap[weight] as any, // Cast to any because React expects 'bold' | 'normal' | number
  }),
  
  /**
   * Text alignment
   */
  align: (align: TextAlign): React.CSSProperties => ({
    textAlign: align,
  }),
  
  /**
   * Text transform
   */
  transform: (transform: TextTransform): React.CSSProperties => ({
    textTransform: transform,
  }),
  
  /**
   * Letter spacing (tracking)
   */
  tracking: {
    tighter: { letterSpacing: '-0.05em' } as React.CSSProperties,
    tight: { letterSpacing: '-0.025em' } as React.CSSProperties,
    normal: { letterSpacing: '0em' } as React.CSSProperties,
    wide: { letterSpacing: '0.025em' } as React.CSSProperties,
    wider: { letterSpacing: '0.05em' } as React.CSSProperties,
    widest: { letterSpacing: '0.1em' } as React.CSSProperties,
  },
  
  /**
   * Line height
   */
  leading: {
    none: { lineHeight: '1' } as React.CSSProperties,
    tight: { lineHeight: '1.25' } as React.CSSProperties,
    snug: { lineHeight: '1.375' } as React.CSSProperties,
    normal: { lineHeight: '1.5' } as React.CSSProperties,
    relaxed: { lineHeight: '1.625' } as React.CSSProperties,
    loose: { lineHeight: '2' } as React.CSSProperties,
  },
  
  /**
   * Text color (ALS-aware)
   */
  color: {
    ink: {
      DEFAULT: { color: 'var(--ink-foreground)' } as React.CSSProperties,
      soft: { color: 'var(--ink-soft)' } as React.CSSProperties,
      muted: { color: 'var(--ink-muted)' } as React.CSSProperties,
      inverted: { color: 'var(--ink-inverted)' } as React.CSSProperties,
    },
  },
  
  /**
   * Preset typography styles (Professional DAW standards)
   */
  preset: {
    /**
     * Body text - Primary readable text (13px)
     */
    body: (): React.CSSProperties => ({
      ...typography.size('base'),
      ...typography.weight('normal'),
      ...typography.leading.normal,
      ...typography.color.ink.DEFAULT,
      color: 'rgba(230, 240, 255, 0.95)', // High contrast for readability
    }),
    
    /**
     * Heading - Clear hierarchy (17px)
     */
    heading: (): React.CSSProperties => ({
      ...typography.size('xl'),
      ...typography.weight('semibold'),
      ...typography.leading.tight,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Heading 1 - Large display (24px)
     */
    h1: (): React.CSSProperties => ({
      ...typography.size('3xl'),
      ...typography.weight('bold'),
      ...typography.leading.tight,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Heading 2 - Section heading (20px)
     */
    h2: (): React.CSSProperties => ({
      ...typography.size('2xl'),
      ...typography.weight('bold'),
      ...typography.leading.tight,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Heading 3 - Subsection (17px)
     */
    h3: (): React.CSSProperties => ({
      ...typography.size('xl'),
      ...typography.weight('semibold'),
      ...typography.leading.snug,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Label - Clear, scannable (12px, semibold, uppercase)
     */
    label: (): React.CSSProperties => ({
      ...typography.size('sm'),
      ...typography.weight('semibold'),
      ...typography.transform('uppercase'),
      ...typography.tracking.wide,
      color: 'rgba(230, 240, 255, 0.85)',
      letterSpacing: '0.05em',
    }),
    
    /**
     * Small text - Secondary info (12px)
     */
    small: (): React.CSSProperties => ({
      ...typography.size('sm'),
      ...typography.weight('normal'),
      ...typography.leading.normal,
      color: 'rgba(230, 240, 255, 0.75)',
    }),
    
    /**
     * Caption - Tertiary info (11px minimum)
     */
    caption: (): React.CSSProperties => ({
      ...typography.size('xs'),
      ...typography.weight('normal'),
      ...typography.leading.relaxed,
      color: 'rgba(230, 240, 255, 0.65)',
    }),
    
    /**
     * Value - Numeric display (13px, medium weight)
     */
    value: (): React.CSSProperties => ({
      ...typography.size('base'),
      ...typography.weight('medium'),
      ...typography.leading.normal,
      color: 'rgba(230, 240, 255, 0.9)',
      fontVariantNumeric: 'tabular-nums', // Aligned numbers
    }),
  },
};


