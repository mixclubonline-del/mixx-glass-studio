/**
 * MixxGlass Layout System
 * 
 * Proprietary layout utilities replacing Tailwind layout classes
 */

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
export const display = {
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
    row: { flexDirection: 'row' },
    'row-reverse': { flexDirection: 'row-reverse' },
    col: { flexDirection: 'column' },
    'col-reverse': { flexDirection: 'column-reverse' },
  },
  
  /**
   * Flex wrap
   */
  wrap: {
    nowrap: { flexWrap: 'nowrap' },
    wrap: { flexWrap: 'wrap' },
    'wrap-reverse': { flexWrap: 'wrap-reverse' },
  },
  
  /**
   * Justify content
   */
  justify: {
    start: { justifyContent: 'flex-start' },
    end: { justifyContent: 'flex-end' },
    center: { justifyContent: 'center' },
    between: { justifyContent: 'space-between' },
    around: { justifyContent: 'space-around' },
    evenly: { justifyContent: 'space-evenly' },
  },
  
  /**
   * Align items
   */
  align: {
    start: { alignItems: 'flex-start' },
    end: { alignItems: 'flex-end' },
    center: { alignItems: 'center' },
    baseline: { alignItems: 'baseline' },
    stretch: { alignItems: 'stretch' },
  },
  
  /**
   * Align content
   */
  content: {
    start: { alignContent: 'flex-start' },
    end: { alignContent: 'flex-end' },
    center: { alignContent: 'center' },
    between: { alignContent: 'space-between' },
    around: { alignContent: 'space-around' },
    evenly: { alignContent: 'space-evenly' },
    stretch: { alignContent: 'stretch' },
  },
  
  /**
   * Flex grow
   */
  grow: (value: number = 1) => ({
    flexGrow: value,
  }),
  
  /**
   * Flex shrink
   */
  shrink: (value: number = 1) => ({
    flexShrink: value,
  }),
  
  /**
   * Flex basis
   */
  basis: (value: string | number) => ({
    flexBasis: typeof value === 'number' ? `${value}px` : value,
  }),
  
  /**
   * Preset flex container
   */
  container: (direction: FlexDirection = 'row') => ({
    display: 'flex',
    flexDirection: direction === 'row' || direction === 'row-reverse' ? 'row' : 'column',
    ...(direction === 'row-reverse' && { flexDirection: 'row-reverse' }),
    ...(direction === 'col-reverse' && { flexDirection: 'column-reverse' }),
  }),
};

/**
 * Grid utilities
 */
export const grid = {
  /**
   * Grid template columns
   */
  cols: (count: number | string) => ({
    gridTemplateColumns: typeof count === 'number' ? `repeat(${count}, minmax(0, 1fr))` : count,
  }),
  
  /**
   * Grid template rows
   */
  rows: (count: number | string) => ({
    gridTemplateRows: typeof count === 'number' ? `repeat(${count}, minmax(0, 1fr))` : count,
  }),
  
  /**
   * Grid column span
   */
  colSpan: (span: number | string) => ({
    gridColumn: typeof span === 'number' ? `span ${span} / span ${span}` : span,
  }),
  
  /**
   * Grid row span
   */
  rowSpan: (span: number | string) => ({
    gridRow: typeof span === 'number' ? `span ${span} / span ${span}` : span,
  }),
  
  /**
   * Preset grid container
   */
  container: (cols?: number | string, rows?: number | string) => ({
    display: 'grid',
    ...(cols && grid.cols(cols)),
    ...(rows && grid.rows(rows)),
  }),
};

/**
 * Position utilities
 */
export const position = {
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
  auto: { zIndex: 'auto' },
  0: { zIndex: 0 },
  10: { zIndex: 10 },
  20: { zIndex: 20 },
  30: { zIndex: 30 },
  40: { zIndex: 40 },
  50: { zIndex: 50 },
  max: { zIndex: 2147483647 },
};

/**
 * Width utilities
 */
export const width = {
  auto: { width: 'auto' },
  full: { width: '100%' },
  screen: { width: '100vw' },
  min: { width: 'min-content' },
  max: { width: 'max-content' },
  fit: { width: 'fit-content' },
  custom: (value: string | number) => ({
    width: typeof value === 'number' ? `${value}px` : value,
  }),
};

/**
 * Height utilities
 */
export const height = {
  auto: { height: 'auto' },
  full: { height: '100%' },
  screen: { height: '100vh' },
  min: { height: 'min-content' },
  max: { height: 'max-content' },
  fit: { height: 'fit-content' },
  custom: (value: string | number) => ({
    height: typeof value === 'number' ? `${value}px` : value,
  }),
};

/**
 * Overflow utilities
 */
export const overflow = {
  auto: { overflow: 'auto' },
  hidden: { overflow: 'hidden' },
  visible: { overflow: 'visible' },
  scroll: { overflow: 'scroll' },
  x: {
    auto: { overflowX: 'auto' },
    hidden: { overflowX: 'hidden' },
    visible: { overflowX: 'visible' },
    scroll: { overflowX: 'scroll' },
  },
  y: {
    auto: { overflowY: 'auto' },
    hidden: { overflowY: 'hidden' },
    visible: { overflowY: 'visible' },
    scroll: { overflowY: 'scroll' },
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


