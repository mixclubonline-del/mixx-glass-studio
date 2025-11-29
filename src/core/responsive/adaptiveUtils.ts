/**
 * Adaptive Layout Utilities
 * 
 * Helper functions for components to use adaptive dimensions and layouts.
 * Provides easy access to adaptive layout configuration.
 */

import { AdaptiveLayoutConfig } from './useAdaptiveLayout';
import { getPlatformInfo } from './platformDetection';
import { getCurrentBreakpoint, getScaleFactor } from './scaleSystem';

/**
 * Get adaptive dimension value
 * Returns the appropriate dimension based on layout mode and platform
 */
export function getAdaptiveDimension(
  config: AdaptiveLayoutConfig,
  dimension: 'headerHeight' | 'dockHeight' | 'bloomWidth' | 'bloomHeight' | 'trackHeaderWidth' | 'timelinePadding'
): number {
  return config[dimension];
}

/**
 * Get responsive spacing value
 * Scales spacing based on layout mode
 */
export function getResponsiveSpacing(
  baseSpacing: number,
  config: AdaptiveLayoutConfig
): number {
  if (config.isCompact) {
    return Math.round(baseSpacing * 0.75);
  }
  if (config.isExpanded) {
    return Math.round(baseSpacing * 1.25);
  }
  if (config.isImmersive) {
    return Math.round(baseSpacing * 1.5);
  }
  return baseSpacing;
}

/**
 * Get responsive font size
 * Scales font size based on layout mode and platform
 */
export function getResponsiveFontSize(
  baseSize: number,
  config: AdaptiveLayoutConfig
): number {
  const scale = config.scaleFactor;
  
  if (config.isCompact) {
    return Math.round(baseSize * scale * 0.9);
  }
  if (config.isExpanded) {
    return Math.round(baseSize * scale * 1.1);
  }
  if (config.isImmersive) {
    return Math.round(baseSize * scale * 1.2);
  }
  return Math.round(baseSize * scale);
}

/**
 * Check if component should be visible
 */
export function shouldShowComponent(
  component: 'bloom' | 'dock' | 'trackHeaders' | 'mixer' | 'sidebar',
  config: AdaptiveLayoutConfig
): boolean {
  switch (component) {
    case 'bloom':
      return config.showBloom;
    case 'dock':
      return config.showDock;
    case 'trackHeaders':
      return config.showTrackHeaders;
    case 'mixer':
      return config.showMixer;
    case 'sidebar':
      return config.canShowSidebar;
    default:
      return true;
  }
}

/**
 * Get responsive width for component
 */
export function getResponsiveWidth(
  baseWidth: number,
  config: AdaptiveLayoutConfig,
  options?: {
    minWidth?: number;
    maxWidth?: number;
    useViewport?: boolean;
  }
): number {
  const { minWidth, maxWidth, useViewport } = options || {};
  const scale = config.scaleFactor;
  let width = baseWidth * scale;

  // Apply mode adjustments
  if (config.isCompact) {
    width = width * 0.85;
  } else if (config.isExpanded) {
    width = width * 1.15;
  } else if (config.isImmersive) {
    width = width * 1.3;
  }

  // Apply viewport constraints if needed
  if (useViewport && typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    width = Math.min(width, viewportWidth * 0.95);
  }

  // Apply min/max constraints
  if (minWidth !== undefined) {
    width = Math.max(width, minWidth);
  }
  if (maxWidth !== undefined) {
    width = Math.min(width, maxWidth);
  }

  return Math.round(width);
}

/**
 * Get responsive height for component
 */
export function getResponsiveHeight(
  baseHeight: number,
  config: AdaptiveLayoutConfig,
  options?: {
    minHeight?: number;
    maxHeight?: number;
    useViewport?: boolean;
  }
): number {
  const { minHeight, maxHeight, useViewport } = options || {};
  const scale = config.scaleFactor;
  let height = baseHeight * scale;

  // Apply mode adjustments
  if (config.isCompact) {
    height = height * 0.85;
  } else if (config.isExpanded) {
    height = height * 1.15;
  } else if (config.isImmersive) {
    height = height * 1.3;
  }

  // Apply viewport constraints if needed
  if (useViewport && typeof window !== 'undefined') {
    const viewportHeight = window.innerHeight;
    height = Math.min(height, viewportHeight * 0.95);
  }

  // Apply min/max constraints
  if (minHeight !== undefined) {
    height = Math.max(height, minHeight);
  }
  if (maxHeight !== undefined) {
    height = Math.min(height, maxHeight);
  }

  return Math.round(height);
}

/**
 * Get CSS clamp value for fluid responsive sizing
 */
export function getClampValue(
  min: number,
  preferred: number,
  max: number,
  config: AdaptiveLayoutConfig
): string {
  const scale = config.scaleFactor;
  const scaledMin = min * scale;
  const scaledMax = max * scale;
  
  // Use viewport units for preferred value
  const vwPreferred = (preferred / (typeof window !== 'undefined' ? window.innerWidth : 1920)) * 100;
  
  return `clamp(${scaledMin}px, ${vwPreferred}vw, ${scaledMax}px)`;
}

/**
 * Get responsive grid columns
 * Returns appropriate number of columns based on layout capabilities
 */
export function getResponsiveColumns(
  config: AdaptiveLayoutConfig,
  baseColumns: number = 1
): number {
  if (!config.canShowMultiColumn) {
    return 1;
  }
  
  if (config.isCompact) {
    return Math.max(1, Math.floor(baseColumns * 0.75));
  }
  
  if (config.isExpanded) {
    return Math.floor(baseColumns * 1.25);
  }
  
  if (config.isImmersive) {
    return Math.floor(baseColumns * 1.5);
  }
  
  return baseColumns;
}

/**
 * Get touch-friendly size adjustments
 * Increases touch target sizes on touch devices
 */
export function getTouchTargetSize(
  baseSize: number,
  config: AdaptiveLayoutConfig
): number {
  const platformInfo = getPlatformInfo();
  
  if (platformInfo.isTouchDevice) {
    // Minimum 44px touch target (Apple HIG)
    return Math.max(44, baseSize * 1.2);
  }
  
  return baseSize;
}



