/**
 * MixxGlass Spacing System
 * 
 * Proprietary spacing utilities replacing Tailwind spacing classes
 * Integrates with Flow responsive system
 */

export type SpacingScale = 
  | 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16 | 20 | 24 | 28 | 32 | 36 | 40 | 44 | 48 | 52 | 56 | 60 | 64 | 72 | 80 | 96;

/**
 * Convert spacing scale to rem (base: 0.25rem per unit)
 */
function scaleToRem(scale: SpacingScale): string {
  return `${scale * 0.25}rem`;
}

/**
 * Convert spacing scale to responsive rem (uses Flow responsive system)
 */
function scaleToResponsiveRem(scale: SpacingScale): string {
  return `calc(var(--flow-scale) * ${scale * 0.25}rem)`;
}

/**
 * Padding utilities
 */
export const padding = {
  /**
   * All sides padding
   */
  all: (scale: SpacingScale): React.CSSProperties => ({
    padding: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Horizontal padding
   */
  x: (scale: SpacingScale): React.CSSProperties => ({
    paddingLeft: scaleToResponsiveRem(scale),
    paddingRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Vertical padding
   */
  y: (scale: SpacingScale): React.CSSProperties => ({
    paddingTop: scaleToResponsiveRem(scale),
    paddingBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Top padding
   */
  top: (scale: SpacingScale): React.CSSProperties => ({
    paddingTop: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Right padding
   */
  right: (scale: SpacingScale): React.CSSProperties => ({
    paddingRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Bottom padding
   */
  bottom: (scale: SpacingScale): React.CSSProperties => ({
    paddingBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Left padding
   */
  left: (scale: SpacingScale): React.CSSProperties => ({
    paddingLeft: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Shorthand: p(scale) = padding all
   */
  p: (scale: SpacingScale): React.CSSProperties => padding.all(scale),
  
  /**
   * Shorthand: px(scale) = padding horizontal
   */
  px: (scale: SpacingScale): React.CSSProperties => padding.x(scale),
  
  /**
   * Shorthand: py(scale) = padding vertical
   */
  py: (scale: SpacingScale): React.CSSProperties => padding.y(scale),
  
  /**
   * Shorthand: pt(scale) = padding top
   */
  pt: (scale: SpacingScale): React.CSSProperties => padding.top(scale),
  
  /**
   * Shorthand: pr(scale) = padding right
   */
  pr: (scale: SpacingScale): React.CSSProperties => padding.right(scale),
  
  /**
   * Shorthand: pb(scale) = padding bottom
   */
  pb: (scale: SpacingScale): React.CSSProperties => padding.bottom(scale),
  
  /**
   * Shorthand: pl(scale) = padding left
   */
  pl: (scale: SpacingScale): React.CSSProperties => padding.left(scale),
};

/**
 * Margin utilities
 */
export const margin = {
  /**
   * All sides margin
   */
  all: (scale: SpacingScale): React.CSSProperties => ({
    margin: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Horizontal margin
   */
  x: (scale: SpacingScale): React.CSSProperties => ({
    marginLeft: scaleToResponsiveRem(scale),
    marginRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Vertical margin
   */
  y: (scale: SpacingScale): React.CSSProperties => ({
    marginTop: scaleToResponsiveRem(scale),
    marginBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Top margin
   */
  top: (scale: SpacingScale): React.CSSProperties => ({
    marginTop: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Right margin
   */
  right: (scale: SpacingScale): React.CSSProperties => ({
    marginRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Bottom margin
   */
  bottom: (scale: SpacingScale): React.CSSProperties => ({
    marginBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Left margin
   */
  left: (scale: SpacingScale): React.CSSProperties => ({
    marginLeft: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Auto margin (centering)
   */
  auto: {
    x: {
      marginLeft: 'auto',
      marginRight: 'auto',
    } as React.CSSProperties,
    y: {
      marginTop: 'auto',
      marginBottom: 'auto',
    } as React.CSSProperties,
  },
  
  /**
   * Shorthand: m(scale) = margin all
   */
  m: (scale: SpacingScale): React.CSSProperties => margin.all(scale),
  
  /**
   * Shorthand: mx(scale) = margin horizontal
   */
  mx: (scale: SpacingScale): React.CSSProperties => margin.x(scale),
  
  /**
   * Shorthand: my(scale) = margin vertical
   */
  my: (scale: SpacingScale): React.CSSProperties => margin.y(scale),
  
  /**
   * Shorthand: mt(scale) = margin top
   */
  mt: (scale: SpacingScale): React.CSSProperties => margin.top(scale),
  
  /**
   * Shorthand: mr(scale) = margin right
   */
  mr: (scale: SpacingScale): React.CSSProperties => margin.right(scale),
  
  /**
   * Shorthand: mb(scale) = margin bottom
   */
  mb: (scale: SpacingScale): React.CSSProperties => margin.bottom(scale),
  
  /**
   * Shorthand: ml(scale) = margin left
   */
  ml: (scale: SpacingScale): React.CSSProperties => margin.left(scale),
};

/**
 * Gap utilities (for flex/grid)
 */
export const gap = {
  /**
   * Gap between flex/grid items
   */
  gap: (scale: SpacingScale): React.CSSProperties => ({
    gap: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Row gap
   */
  row: (scale: SpacingScale): React.CSSProperties => ({
    rowGap: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Column gap
   */
  col: (scale: SpacingScale): React.CSSProperties => ({
    columnGap: scaleToResponsiveRem(scale),
  }),
};

/**
 * Spacing object with all utilities
 */
export const spacing = {
  padding,
  margin,
  gapUtils: gap,
  
  /**
   * Quick access to common spacing values
   */
  scale: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
    '2xl': 12,
    '3xl': 16,
    '4xl': 24,
  },
  
  // Shorthand methods for convenience
  p: padding.p,
  px: padding.px,
  py: padding.py,
  pt: padding.pt,
  pr: padding.pr,
  pb: padding.pb,
  pl: padding.pl,
  m: margin.m,
  mx: margin.mx,
  my: margin.my,
  mt: margin.mt,
  mr: margin.mr,
  mb: margin.mb,
  ml: margin.ml,
  gap: gap.gap,
};


