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
  all: (scale: SpacingScale) => ({
    padding: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Horizontal padding
   */
  x: (scale: SpacingScale) => ({
    paddingLeft: scaleToResponsiveRem(scale),
    paddingRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Vertical padding
   */
  y: (scale: SpacingScale) => ({
    paddingTop: scaleToResponsiveRem(scale),
    paddingBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Top padding
   */
  top: (scale: SpacingScale) => ({
    paddingTop: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Right padding
   */
  right: (scale: SpacingScale) => ({
    paddingRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Bottom padding
   */
  bottom: (scale: SpacingScale) => ({
    paddingBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Left padding
   */
  left: (scale: SpacingScale) => ({
    paddingLeft: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Shorthand: p(scale) = padding all
   */
  p: (scale: SpacingScale) => padding.all(scale),
  
  /**
   * Shorthand: px(scale) = padding horizontal
   */
  px: (scale: SpacingScale) => padding.x(scale),
  
  /**
   * Shorthand: py(scale) = padding vertical
   */
  py: (scale: SpacingScale) => padding.y(scale),
  
  /**
   * Shorthand: pt(scale) = padding top
   */
  pt: (scale: SpacingScale) => padding.top(scale),
  
  /**
   * Shorthand: pr(scale) = padding right
   */
  pr: (scale: SpacingScale) => padding.right(scale),
  
  /**
   * Shorthand: pb(scale) = padding bottom
   */
  pb: (scale: SpacingScale) => padding.bottom(scale),
  
  /**
   * Shorthand: pl(scale) = padding left
   */
  pl: (scale: SpacingScale) => padding.left(scale),
};

/**
 * Margin utilities
 */
export const margin = {
  /**
   * All sides margin
   */
  all: (scale: SpacingScale) => ({
    margin: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Horizontal margin
   */
  x: (scale: SpacingScale) => ({
    marginLeft: scaleToResponsiveRem(scale),
    marginRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Vertical margin
   */
  y: (scale: SpacingScale) => ({
    marginTop: scaleToResponsiveRem(scale),
    marginBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Top margin
   */
  top: (scale: SpacingScale) => ({
    marginTop: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Right margin
   */
  right: (scale: SpacingScale) => ({
    marginRight: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Bottom margin
   */
  bottom: (scale: SpacingScale) => ({
    marginBottom: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Left margin
   */
  left: (scale: SpacingScale) => ({
    marginLeft: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Auto margin (centering)
   */
  auto: {
    x: {
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    y: {
      marginTop: 'auto',
      marginBottom: 'auto',
    },
  },
  
  /**
   * Shorthand: m(scale) = margin all
   */
  m: (scale: SpacingScale) => margin.all(scale),
  
  /**
   * Shorthand: mx(scale) = margin horizontal
   */
  mx: (scale: SpacingScale) => margin.x(scale),
  
  /**
   * Shorthand: my(scale) = margin vertical
   */
  my: (scale: SpacingScale) => margin.y(scale),
  
  /**
   * Shorthand: mt(scale) = margin top
   */
  mt: (scale: SpacingScale) => margin.top(scale),
  
  /**
   * Shorthand: mr(scale) = margin right
   */
  mr: (scale: SpacingScale) => margin.right(scale),
  
  /**
   * Shorthand: mb(scale) = margin bottom
   */
  mb: (scale: SpacingScale) => margin.bottom(scale),
  
  /**
   * Shorthand: ml(scale) = margin left
   */
  ml: (scale: SpacingScale) => margin.left(scale),
};

/**
 * Gap utilities (for flex/grid)
 */
export const gap = {
  /**
   * Gap between flex/grid items
   */
  gap: (scale: SpacingScale) => ({
    gap: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Row gap
   */
  row: (scale: SpacingScale) => ({
    rowGap: scaleToResponsiveRem(scale),
  }),
  
  /**
   * Column gap
   */
  col: (scale: SpacingScale) => ({
    columnGap: scaleToResponsiveRem(scale),
  }),
};

/**
 * Spacing object with all utilities
 */
export const spacing = {
  padding,
  margin,
  gap,
  
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


