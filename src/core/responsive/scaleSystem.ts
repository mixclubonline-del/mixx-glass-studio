/**
 * Flow Responsive Scale System
 * 
 * Provides consistent scaling across all screen resolutions and sizes.
 * Uses CSS custom properties and viewport-based calculations for fluid scaling.
 * 
 * Key Features:
 * - Base scale factor calculated from viewport size
 * - Consistent spacing, typography, and component sizing
 * - High-DPI display support
 * - Zoom-level awareness
 * - Breakpoint-based adjustments
 */

/**
 * Viewport breakpoints for responsive design
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,    // Small tablets
  md: 768,    // Tablets
  lg: 1024,   // Small laptops
  xl: 1280,   // Laptops
  '2xl': 1536, // Desktops
  '3xl': 1920, // Large desktops
  '4xl': 2560, // Ultra-wide / 4K
} as const;

/**
 * Base scale factors for different viewport sizes
 * These determine how UI elements scale relative to a 1920px reference
 */
export const SCALE_FACTORS = {
  xs: 0.75,   // Very small screens
  sm: 0.85,   // Small tablets
  md: 0.9,    // Tablets
  lg: 0.95,   // Small laptops
  xl: 1.0,    // Standard (1920px reference)
  '2xl': 1.05, // Large desktops
  '3xl': 1.1,  // 4K displays
  '4xl': 1.15, // Ultra-wide
} as const;

/**
 * Calculate current scale factor based on viewport width
 */
export function getScaleFactor(): number {
  if (typeof window === 'undefined') return 1.0;
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['4xl']) return SCALE_FACTORS['4xl'];
  if (width >= BREAKPOINTS['3xl']) return SCALE_FACTORS['3xl'];
  if (width >= BREAKPOINTS['2xl']) return SCALE_FACTORS['2xl'];
  if (width >= BREAKPOINTS.xl) return SCALE_FACTORS.xl;
  if (width >= BREAKPOINTS.lg) return SCALE_FACTORS.lg;
  if (width >= BREAKPOINTS.md) return SCALE_FACTORS.md;
  if (width >= BREAKPOINTS.sm) return SCALE_FACTORS.sm;
  return SCALE_FACTORS.xs;
}

/**
 * Get current breakpoint name
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (typeof window === 'undefined') return 'xl';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['4xl']) return '4xl';
  if (width >= BREAKPOINTS['3xl']) return '3xl';
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Calculate device pixel ratio (for high-DPI displays)
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Scale a value based on current viewport and DPI
 */
export function scaleValue(baseValue: number, factor?: number): number {
  const scaleFactor = factor ?? getScaleFactor();
  const dpr = getDevicePixelRatio();
  
  // For high-DPI displays, slightly reduce scaling to prevent UI from being too small
  const dprAdjustment = dpr > 1.5 ? 0.95 : 1.0;
  
  return baseValue * scaleFactor * dprAdjustment;
}

/**
 * Convert pixels to rem with scaling
 */
export function pxToRem(px: number, factor?: number): string {
  const scaled = scaleValue(px, factor);
  const baseFontSize = 16; // Standard browser default
  return `${scaled / baseFontSize}rem`;
}

/**
 * Convert pixels to viewport width units with scaling
 */
export function pxToVw(px: number, factor?: number): string {
  if (typeof window === 'undefined') return `${px}px`;
  
  const scaled = scaleValue(px, factor);
  const viewportWidth = window.innerWidth;
  return `${(scaled / viewportWidth) * 100}vw`;
}

/**
 * Convert pixels to viewport height units with scaling
 */
export function pxToVh(px: number, factor?: number): string {
  if (typeof window === 'undefined') return `${px}px`;
  
  const scaled = scaleValue(px, factor);
  const viewportHeight = window.innerHeight;
  return `${(scaled / viewportHeight) * 100}vh`;
}

/**
 * Clamp a value between min and max with scaling
 */
export function clampScaled(
  min: number,
  preferred: number,
  max: number,
  factor?: number
): string {
  const scaleFactor = factor ?? getScaleFactor();
  return `clamp(${pxToRem(min * scaleFactor)}, ${pxToVw(preferred)}, ${pxToRem(max * scaleFactor)})`;
}

/**
 * Initialize responsive scale system
 * Call this once on app mount to set CSS custom properties
 */
export function initResponsiveScale(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const updateScale = () => {
    const scaleFactor = getScaleFactor();
    const breakpoint = getCurrentBreakpoint();
    const dpr = getDevicePixelRatio();
    
    const root = document.documentElement;
    
    // Set base scale factor
    root.style.setProperty('--flow-scale', String(scaleFactor));
    
    // Set breakpoint name
    root.style.setProperty('--flow-breakpoint', breakpoint);
    
    // Set device pixel ratio
    root.style.setProperty('--flow-dpr', String(dpr));
    
    // Calculate and set scaled spacing units
    const spacingBase = 4; // Base spacing unit in px
    root.style.setProperty('--flow-spacing-xs', pxToRem(spacingBase * 0.5, scaleFactor));
    root.style.setProperty('--flow-spacing-sm', pxToRem(spacingBase * 1, scaleFactor));
    root.style.setProperty('--flow-spacing-md', pxToRem(spacingBase * 2, scaleFactor));
    root.style.setProperty('--flow-spacing-lg', pxToRem(spacingBase * 4, scaleFactor));
    root.style.setProperty('--flow-spacing-xl', pxToRem(spacingBase * 6, scaleFactor));
    root.style.setProperty('--flow-spacing-2xl', pxToRem(spacingBase * 8, scaleFactor));
    
    // Calculate and set scaled font sizes
    root.style.setProperty('--flow-font-xs', pxToRem(10, scaleFactor));
    root.style.setProperty('--flow-font-sm', pxToRem(12, scaleFactor));
    root.style.setProperty('--flow-font-md', pxToRem(14, scaleFactor));
    root.style.setProperty('--flow-font-lg', pxToRem(16, scaleFactor));
    root.style.setProperty('--flow-font-xl', pxToRem(18, scaleFactor));
    root.style.setProperty('--flow-font-2xl', pxToRem(24, scaleFactor));
    root.style.setProperty('--flow-font-3xl', pxToRem(32, scaleFactor));
    
    // Calculate and set scaled border radius
    root.style.setProperty('--flow-radius-sm', pxToRem(4, scaleFactor));
    root.style.setProperty('--flow-radius-md', pxToRem(8, scaleFactor));
    root.style.setProperty('--flow-radius-lg', pxToRem(12, scaleFactor));
    root.style.setProperty('--flow-radius-xl', pxToRem(16, scaleFactor));
    root.style.setProperty('--flow-radius-2xl', pxToRem(24, scaleFactor));
    root.style.setProperty('--flow-radius-full', pxToRem(9999, scaleFactor));
    
    // Calculate and set scaled component sizes
    root.style.setProperty('--flow-button-height-sm', pxToRem(32, scaleFactor));
    root.style.setProperty('--flow-button-height-md', pxToRem(40, scaleFactor));
    root.style.setProperty('--flow-button-height-lg', pxToRem(48, scaleFactor));
    
    root.style.setProperty('--flow-input-height-sm', pxToRem(32, scaleFactor));
    root.style.setProperty('--flow-input-height-md', pxToRem(40, scaleFactor));
    root.style.setProperty('--flow-input-height-lg', pxToRem(48, scaleFactor));
    
    // Icon sizes
    root.style.setProperty('--flow-icon-xs', pxToRem(12, scaleFactor));
    root.style.setProperty('--flow-icon-sm', pxToRem(16, scaleFactor));
    root.style.setProperty('--flow-icon-md', pxToRem(20, scaleFactor));
    root.style.setProperty('--flow-icon-lg', pxToRem(24, scaleFactor));
    root.style.setProperty('--flow-icon-xl', pxToRem(32, scaleFactor));
  };
  
  // Initial update
  updateScale();
  
  // Update on resize with debounce
  let resizeTimeout: ReturnType<typeof setTimeout>;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateScale, 150);
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', updateScale);
  
  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', updateScale);
    clearTimeout(resizeTimeout);
  };
}

