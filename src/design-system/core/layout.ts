import React from 'react';

export type Display = 'block' | 'inline-block' | 'inline' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none';
export type FlexDirection = 'row' | 'row-reverse' | 'col' | 'col-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContent = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
export type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
export type AlignContent = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly' | 'stretch';
export type Position = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

/**
 * Display utilities
 */
export const display: Record<Display, React.CSSProperties> = {
  block: { display: 'block' },
  'inline-block': { display: 'inline-block' },
  inline: { display: 'inline' },
  flex: { display: 'flex' },
  'inline-flex': { display: 'inline-flex' },
  grid: { display: 'grid' },
  'inline-grid': { display: 'inline-grid' },
  none: { display: 'none' },
};

/**
 * Flexbox utilities
 */
export const flex = {
  /**
   * Flex direction
   */
  direction: {
    row: { flexDirection: 'row' } as React.CSSProperties,
    'row-reverse': { flexDirection: 'row-reverse' } as React.CSSProperties,
    col: { flexDirection: 'column' } as React.CSSProperties,
    'col-reverse': { flexDirection: 'column-reverse' } as React.CSSProperties,
  },
  
  /**
   * Flex wrap
   */
  wrap: {
    nowrap: { flexWrap: 'nowrap' } as React.CSSProperties,
    wrap: { flexWrap: 'wrap' } as React.CSSProperties,
    'wrap-reverse': { flexWrap: 'wrap-reverse' } as React.CSSProperties,
  },
  
  /**
   * Justify content
   */
  justify: {
    start: { justifyContent: 'flex-start' } as React.CSSProperties,
    end: { justifyContent: 'flex-end' } as React.CSSProperties,
    center: { justifyContent: 'center' } as React.CSSProperties,
    between: { justifyContent: 'space-between' } as React.CSSProperties,
    around: { justifyContent: 'space-around' } as React.CSSProperties,
    evenly: { justifyContent: 'space-evenly' } as React.CSSProperties,
  },
  
  /**
   * Align items
   */
  align: {
    start: { alignItems: 'flex-start' } as React.CSSProperties,
    end: { alignItems: 'flex-end' } as React.CSSProperties,
    center: { alignItems: 'center' } as React.CSSProperties,
    baseline: { alignItems: 'baseline' } as React.CSSProperties,
    stretch: { alignItems: 'stretch' } as React.CSSProperties,
  },
  
  /**
   * Align content
   */
  content: {
    start: { alignContent: 'flex-start' } as React.CSSProperties,
    end: { alignContent: 'flex-end' } as React.CSSProperties,
    center: { alignContent: 'center' } as React.CSSProperties,
    between: { alignContent: 'space-between' } as React.CSSProperties,
    around: { alignContent: 'space-around' } as React.CSSProperties,
    evenly: { alignContent: 'space-evenly' } as React.CSSProperties,
    stretch: { alignContent: 'stretch' } as React.CSSProperties,
  },
  
  /**
   * Flex grow
   */
  grow: (value: number = 1): React.CSSProperties => ({
    flexGrow: value,
  }),
  
  /**
   * Flex shrink
   */
  shrink: (value: number = 1): React.CSSProperties => ({
    flexShrink: value,
  }),
  
  /**
   * Flex basis
   */
  basis: (value: string | number): React.CSSProperties => ({
    flexBasis: typeof value === 'number' ? `${value}px` : value,
  }),
  
  /**
   * Preset flex container
   */
  container: (direction: FlexDirection = 'row'): React.CSSProperties => {
    const styles: React.CSSProperties = {
      display: 'flex',
    };
    
    if (direction === 'row') styles.flexDirection = 'row';
    else if (direction === 'row-reverse') styles.flexDirection = 'row-reverse';
    else if (direction === 'col') styles.flexDirection = 'column';
    else if (direction === 'col-reverse') styles.flexDirection = 'column-reverse';
    
    return styles;
  },
};

/**
 * Grid utilities
 */
export const grid = {
  /**
   * Grid template columns
   */
  cols: (count: number | string): React.CSSProperties => ({
    gridTemplateColumns: typeof count === 'number' ? `repeat(${count}, minmax(0, 1fr))` : count,
  }),
  
  /**
   * Grid template rows
   */
  rows: (count: number | string): React.CSSProperties => ({
    gridTemplateRows: typeof count === 'number' ? `repeat(${count}, minmax(0, 1fr))` : count,
  }),
  
  /**
   * Grid column span
   */
  colSpan: (span: number | string): React.CSSProperties => ({
    gridColumn: typeof span === 'number' ? `span ${span} / span ${span}` : span,
  }),
  
  /**
   * Grid row span
   */
  rowSpan: (span: number | string): React.CSSProperties => ({
    gridRow: typeof span === 'number' ? `span ${span} / span ${span}` : span,
  }),
  
  /**
   * Preset grid container
   */
  container: (cols?: number | string, rows?: number | string): React.CSSProperties => ({
    display: 'grid',
    ...(cols && grid.cols(cols)),
    ...(rows && grid.rows(rows)),
  }),
};

/**
 * Position utilities
 */
export const position: Record<Position, React.CSSProperties> = {
  static: { position: 'static' },
  relative: { position: 'relative' },
  absolute: { position: 'absolute' },
  fixed: { position: 'fixed' },
  sticky: { position: 'sticky' },
};

/**
 * Z-index utilities
 */
export const zIndex = {
  auto: { zIndex: 'auto' } as React.CSSProperties,
  0: { zIndex: 0 } as React.CSSProperties,
  10: { zIndex: 10 } as React.CSSProperties,
  20: { zIndex: 20 } as React.CSSProperties,
  30: { zIndex: 30 } as React.CSSProperties,
  40: { zIndex: 40 } as React.CSSProperties,
  50: { zIndex: 50 } as React.CSSProperties,
  max: { zIndex: 2147483647 } as React.CSSProperties,
};

/**
 * Width utilities
 */
export const width = {
  auto: { width: 'auto' } as React.CSSProperties,
  full: { width: '100%' } as React.CSSProperties,
  screen: { width: '100vw' } as React.CSSProperties,
  min: { width: 'min-content' } as React.CSSProperties,
  max: { width: 'max-content' } as React.CSSProperties,
  fit: { width: 'fit-content' } as React.CSSProperties,
  custom: (value: string | number): React.CSSProperties => ({
    width: typeof value === 'number' ? `${value}px` : value,
  }),
};

/**
 * Height utilities
 */
export const height = {
  auto: { height: 'auto' } as React.CSSProperties,
  full: { height: '100%' } as React.CSSProperties,
  screen: { height: '100vh' } as React.CSSProperties,
  min: { height: 'min-content' } as React.CSSProperties,
  max: { height: 'max-content' } as React.CSSProperties,
  fit: { height: 'fit-content' } as React.CSSProperties,
  custom: (value: string | number): React.CSSProperties => ({
    height: typeof value === 'number' ? `${value}px` : value,
  }),
};

/**
 * Overflow utilities
 */
export const overflow = {
  auto: { overflow: 'auto' } as React.CSSProperties,
  hidden: { overflow: 'hidden' } as React.CSSProperties,
  visible: { overflow: 'visible' } as React.CSSProperties,
  scroll: { overflow: 'scroll' } as React.CSSProperties,
  x: {
    auto: { overflowX: 'auto' } as React.CSSProperties,
    hidden: { overflowX: 'hidden' } as React.CSSProperties,
    visible: { overflowX: 'visible' } as React.CSSProperties,
    scroll: { overflowX: 'scroll' } as React.CSSProperties,
  },
  y: {
    auto: { overflowY: 'auto' } as React.CSSProperties,
    hidden: { overflowY: 'hidden' } as React.CSSProperties,
    visible: { overflowY: 'visible' } as React.CSSProperties,
    scroll: { overflowY: 'scroll' } as React.CSSProperties,
  },
};

/**
 * Layout object with all utilities
 */
export const layout = {
  display,
  flex,
  grid,
  position,
  zIndex,
  width,
  height,
  overflow,
};


