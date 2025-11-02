/**
 * Layout Constants - Unified spacing and sizing system
 * All measurements in pixels, following 4px grid
 */

// Header Heights (standardized across all views)
export const COMPACT_HEADER_HEIGHT = 64; // Single unified header combining all global controls
export const HEADER_HEIGHT = 72; // Main view headers
export const TOOLBAR_HEIGHT = 48; // Toolbars and secondary bars (REMOVED from timeline)
export const RULER_HEIGHT = 32; // Timeline ruler (reduced from 40px)
export const HEADER_TOTAL_HEIGHT = 64; // Compact header only

// Panel Widths (standardized sidebar/panel sizes)
export const PANEL_WIDTH_SM = 280; // Small panels (metering, browser)
export const PANEL_WIDTH_MD = 320; // Medium panels (AI assistant)
export const PANEL_WIDTH_LG = 400; // Large panels (extended features)
export const TRACK_LIST_WIDTH = 180; // Timeline track list (narrower for minimal design)
export const TRACK_LIST_COLLAPSED = 0; // Fully hidden when collapsed

// Channel Strip Sizing
export const CHANNEL_WIDTH_MIN = 80; // Minimum channel width
export const CHANNEL_WIDTH_DEFAULT = 90; // Default channel width
export const CHANNEL_WIDTH_MAX = 120; // Maximum channel width
export const MASTER_CHANNEL_WIDTH = 176; // Master channel fixed width

// Track Heights
export const TRACK_HEIGHT = 80; // Standard track height in timeline (reduced for minimal design)
export const TRACK_HEIGHT_MIN = 60; // Minimum track height
export const TRACK_HEIGHT_MAX = 200; // Maximum track height

// Spacing Scale (4px grid system)
export const SPACING = {
  xs: 4,   // 0.5 rem
  sm: 8,   // 1 rem
  md: 12,  // 1.5 rem
  lg: 16,  // 2 rem
  xl: 24,  // 3 rem
  xxl: 32, // 4 rem
} as const;

// Z-Index Layers (consistent stacking)
export const Z_INDEX = {
  base: 0,
  content: 10,
  overlay: 20,
  dropdown: 30,
  modal: 40,
  popup: 50,
  tooltip: 60,
} as const;

// Border Radius (consistent rounding)
export const RADIUS = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
} as const;
