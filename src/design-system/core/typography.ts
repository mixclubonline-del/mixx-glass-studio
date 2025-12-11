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
   * Preset typography styles
   */
  preset: {
    /**
     * Body text
     */
    body: () => ({
      ...typography.size('base'),
      ...typography.weight('normal'),
      ...typography.leading.normal,
      ...typography.color.ink.DEFAULT,
    }),
    
    /**
     * Heading 1
     */
    h1: () => ({
      ...typography.size('4xl'),
      ...typography.weight('bold'),
      ...typography.leading.tight,
      ...typography.color.ink.DEFAULT,
    }),
    
    /**
     * Heading 2
     */
    h2: () => ({
      ...typography.size('3xl'),
      ...typography.weight('bold'),
      ...typography.leading.tight,
      ...typography.color.ink.DEFAULT,
    }),
    
    /**
     * Heading 3
     */
    h3: () => ({
      ...typography.size('2xl'),
      ...typography.weight('semibold'),
      ...typography.leading.snug,
      ...typography.color.ink.DEFAULT,
    }),
    
    /**
     * Small text
     */
    small: () => ({
      ...typography.size('sm'),
      ...typography.weight('normal'),
      ...typography.leading.normal,
      ...typography.color.ink.muted,
    }),
    
    /**
     * Caption text
     */
    caption: () => ({
      ...typography.size('xs'),
      ...typography.weight('normal'),
      ...typography.leading.relaxed,
      ...typography.color.ink.muted,
    }),
    
    /**
     * Label text (uppercase, tracking)
     */
    label: () => ({
      ...typography.size('xs'),
      ...typography.weight('semibold'),
      ...typography.transform('uppercase'),
      ...typography.tracking.widest,
      ...typography.color.ink.soft,
    }),
  },
};


