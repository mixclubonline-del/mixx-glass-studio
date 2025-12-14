/**
 * Adaptive Layout Hook
 * 
 * Provides reactive layout adaptation based on platform, screen size, and orientation.
 * Returns layout configuration that adapts to the current context.
 * 
 * Layout Modes:
 * - compact: Mobile/tablet portrait, minimal UI
 * - standard: Desktop/laptop, balanced layout
 * - expanded: Large desktop, more space for content
 * - immersive: Ultra-wide/4K, maximum content area
 */

import { useEffect, useState, useMemo } from 'react';
import { getPlatformInfo, Platform, Orientation } from './platformDetection';
import { getCurrentBreakpoint, getScaleFactor } from './scaleSystem';

export type LayoutMode = 'compact' | 'standard' | 'expanded' | 'immersive';

export interface AdaptiveLayoutConfig {
  mode: LayoutMode;
  platform: Platform;
  orientation: Orientation;
  breakpoint: string;
  scaleFactor: number;
  
  // Layout dimensions
  headerHeight: number;
  dockHeight: number;
  bloomWidth: number;
  bloomHeight: number;
  trackHeaderWidth: number;
  timelinePadding: number;
  
  // Component visibility
  showBloom: boolean;
  showDock: boolean;
  showTrackHeaders: boolean;
  showMixer: boolean;
  
  // Layout behavior
  isCompact: boolean;
  isExpanded: boolean;
  isImmersive: boolean;
  canShowSidebar: boolean;
  canShowMultiColumn: boolean;
}

/**
 * Calculate layout mode based on platform and screen size
 */
function calculateLayoutMode(
  platform: Platform,
  breakpoint: string,
  orientation: Orientation,
  screenWidth: number,
  screenHeight: number
): LayoutMode {
  // Mobile: always compact
  if (platform === 'mobile') {
    return 'compact';
  }

  // Tablet: compact in portrait, standard in landscape
  if (platform === 'tablet') {
    return orientation === 'portrait' ? 'compact' : 'standard';
  }

  // VisionOS: immersive by default
  if (platform === 'visionos') {
    return 'immersive';
  }

  // Desktop: based on breakpoint
  if (platform === 'desktop') {
    if (breakpoint === '4xl' || breakpoint === '3xl') {
      return 'immersive';
    }
    if (breakpoint === '2xl') {
      return 'expanded';
    }
    if (breakpoint === 'xl' || breakpoint === 'lg') {
      return 'standard';
    }
    return 'compact';
  }

  return 'standard';
}

/**
 * Get adaptive layout configuration
 */
function getLayoutConfig(
  mode: LayoutMode,
  platform: Platform,
  orientation: Orientation,
  breakpoint: string,
  scaleFactor: number,
  screenWidth: number,
  screenHeight: number
): AdaptiveLayoutConfig {
  const isCompact = mode === 'compact';
  const isExpanded = mode === 'expanded' || mode === 'immersive';
  const isImmersive = mode === 'immersive';

  // Base dimensions (will be scaled)
  const baseHeaderHeight = 60;
  const baseDockHeight = 84;
  const baseBloomWidth = 380;
  const baseBloomHeight = 300;
  const baseTrackHeaderWidth = 200;
  const baseTimelinePadding = 16;

  // Adjust dimensions based on mode
  let headerHeight = baseHeaderHeight;
  let dockHeight = baseDockHeight;
  let bloomWidth = baseBloomWidth;
  let bloomHeight = baseBloomHeight;
  let trackHeaderWidth = baseTrackHeaderWidth;
  let timelinePadding = baseTimelinePadding;

  if (isCompact) {
    headerHeight = 48;
    dockHeight = 64;
    bloomWidth = Math.min(320, screenWidth * 0.9);
    bloomHeight = 240;
    trackHeaderWidth = 120;
    timelinePadding = 8;
  } else if (isExpanded) {
    headerHeight = 72;
    dockHeight = 96;
    bloomWidth = 420;
    bloomHeight = 340;
    trackHeaderWidth = 240;
    timelinePadding = 24;
  } else if (isImmersive) {
    headerHeight = 80;
    dockHeight = 100;
    bloomWidth = 480;
    bloomHeight = 380;
    trackHeaderWidth = 280;
    timelinePadding = 32;
  }

  // Apply scale factor
  headerHeight = Math.round(headerHeight * scaleFactor);
  dockHeight = Math.round(dockHeight * scaleFactor);
  bloomWidth = Math.round(bloomWidth * scaleFactor);
  bloomHeight = Math.round(bloomHeight * scaleFactor);
  trackHeaderWidth = Math.round(trackHeaderWidth * scaleFactor);
  timelinePadding = Math.round(timelinePadding * scaleFactor);

  // Component visibility rules
  const showBloom = !isCompact || orientation === 'landscape';
  const showDock = true; // Always show dock, but may be smaller
  const showTrackHeaders = screenWidth >= 640; // Hide on very small screens
  const showMixer = screenWidth >= 1024 || orientation === 'landscape';

  // Layout capabilities
  const canShowSidebar = screenWidth >= 1024;
  const canShowMultiColumn = screenWidth >= 1280;

  return {
    mode,
    platform,
    orientation,
    breakpoint,
    scaleFactor,
    headerHeight,
    dockHeight,
    bloomWidth,
    bloomHeight,
    trackHeaderWidth,
    timelinePadding,
    showBloom,
    showDock,
    showTrackHeaders,
    showMixer,
    isCompact,
    isExpanded,
    isImmersive,
    canShowSidebar,
    canShowMultiColumn,
  };
}

/**
 * Hook for adaptive layout management
 */
export function useAdaptiveLayout(): AdaptiveLayoutConfig {
  const [platformInfo, setPlatformInfo] = useState(getPlatformInfo);
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint);
  const [scaleFactor, setScaleFactor] = useState(getScaleFactor);

  useEffect(() => {
    const updateLayout = () => {
      setPlatformInfo(getPlatformInfo());
      setBreakpoint(getCurrentBreakpoint());
      setScaleFactor(getScaleFactor());
    };

    // Initial update
    updateLayout();

    // Update on resize/orientation change
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateLayout, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateLayout);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateLayout);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const layoutConfig = useMemo(() => {
    const mode = calculateLayoutMode(
      platformInfo.platform,
      breakpoint,
      platformInfo.orientation,
      platformInfo.screenWidth,
      platformInfo.screenHeight
    );

    return getLayoutConfig(
      mode,
      platformInfo.platform,
      platformInfo.orientation,
      breakpoint,
      scaleFactor,
      platformInfo.screenWidth,
      platformInfo.screenHeight
    );
  }, [platformInfo, breakpoint, scaleFactor]);

  return layoutConfig;
}

/**
 * Get CSS custom properties for adaptive layout
 */
export function getAdaptiveLayoutCSS(config: AdaptiveLayoutConfig): Record<string, string> {
  return {
    '--adaptive-header-height': `${config.headerHeight}px`,
    '--adaptive-dock-height': `${config.dockHeight}px`,
    '--adaptive-bloom-width': `${config.bloomWidth}px`,
    '--adaptive-bloom-height': `${config.bloomHeight}px`,
    '--adaptive-track-header-width': `${config.trackHeaderWidth}px`,
    '--adaptive-timeline-padding': `${config.timelinePadding}px`,
    '--adaptive-mode': config.mode,
    '--adaptive-platform': config.platform,
    '--adaptive-orientation': config.orientation,
  };
}










