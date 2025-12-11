/**
 * MixxGlass Typography System
 * 
 * Proprietary typography utilities replacing Tailwind typography classes
 * Integrates with Flow responsive system and ALS
 */

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
  size: (size: FontSize) => ({
    fontSize: fontSizeMap[size],
  }),
  
  /**
   * Font weight
   */
  weight: (weight: FontWeight) => ({
    fontWeight: fontWeightMap[weight],
  }),
  
  /**
   * Text alignment
   */
  align: (align: TextAlign) => ({
    textAlign: align,
  }),
  
  /**
   * Text transform
   */
  transform: (transform: TextTransform) => ({
    textTransform: transform,
  }),
  
  /**
   * Letter spacing (tracking)
   */
  tracking: {
    tighter: { letterSpacing: '-0.05em' },
    tight: { letterSpacing: '-0.025em' },
    normal: { letterSpacing: '0em' },
    wide: { letterSpacing: '0.025em' },
    wider: { letterSpacing: '0.05em' },
    widest: { letterSpacing: '0.1em' },
  },
  
  /**
   * Line height
   */
  leading: {
    none: { lineHeight: '1' },
    tight: { lineHeight: '1.25' },
    snug: { lineHeight: '1.375' },
    normal: { lineHeight: '1.5' },
    relaxed: { lineHeight: '1.625' },
    loose: { lineHeight: '2' },
  },
  
  /**
   * Text color (ALS-aware)
   */
  color: {
    ink: {
      DEFAULT: { color: 'var(--ink-foreground)' },
      soft: { color: 'var(--ink-soft)' },
      muted: { color: 'var(--ink-muted)' },
      inverted: { color: 'var(--ink-inverted)' },
    },
  },
  
  /**
   * Preset typography styles (Professional DAW standards)
   */
  preset: {
    /**
     * Body text - Primary readable text (13px)
     */
    body: () => ({
      ...typography.size('base'),
      ...typography.weight('normal'),
      ...typography.leading.normal,
      ...typography.color.ink.DEFAULT,
      color: 'rgba(230, 240, 255, 0.95)', // High contrast for readability
    }),
    
    /**
     * Heading - Clear hierarchy (17px)
     */
    heading: () => ({
      ...typography.size('xl'),
      ...typography.weight('semibold'),
      ...typography.leading.tight,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Heading 1 - Large display (24px)
     */
    h1: () => ({
      ...typography.size('3xl'),
      ...typography.weight('bold'),
      ...typography.leading.tight,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Heading 2 - Section heading (20px)
     */
    h2: () => ({
      ...typography.size('2xl'),
      ...typography.weight('bold'),
      ...typography.leading.tight,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Heading 3 - Subsection (17px)
     */
    h3: () => ({
      ...typography.size('xl'),
      ...typography.weight('semibold'),
      ...typography.leading.snug,
      color: 'rgba(230, 240, 255, 0.95)',
    }),
    
    /**
     * Label - Clear, scannable (12px, semibold, uppercase)
     */
    label: () => ({
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
    small: () => ({
      ...typography.size('sm'),
      ...typography.weight('normal'),
      ...typography.leading.normal,
      color: 'rgba(230, 240, 255, 0.75)',
    }),
    
    /**
     * Caption - Tertiary info (11px minimum)
     */
    caption: () => ({
      ...typography.size('xs'),
      ...typography.weight('normal'),
      ...typography.leading.relaxed,
      color: 'rgba(230, 240, 255, 0.65)',
    }),
    
    /**
     * Value - Numeric display (13px, medium weight)
     */
    value: () => ({
      ...typography.size('base'),
      ...typography.weight('medium'),
      ...typography.leading.normal,
      color: 'rgba(230, 240, 255, 0.9)',
      fontVariantNumeric: 'tabular-nums', // Aligned numbers
    }),
  },
};


