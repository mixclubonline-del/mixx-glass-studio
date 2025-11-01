/**
 * Layout Constants - Unified spacing and sizing system
 * All measurements in pixels, following 4px grid
 */

// Header Heights (standardized across all views)
export const HEADER_HEIGHT = 72; // Main view headers
export const TOOLBAR_HEIGHT = 48; // Toolbars and secondary bars
export const TRANSPORT_HEIGHT = 64; // Transport controls
export const RULER_HEIGHT = 40; // Timeline ruler

// Panel Widths (standardized sidebar/panel sizes)
export const PANEL_WIDTH_SM = 280; // Small panels (metering, browser)
export const PANEL_WIDTH_MD = 320; // Medium panels (AI assistant)
export const PANEL_WIDTH_LG = 400; // Large panels (extended features)
export const TRACK_LIST_WIDTH = 280; // Timeline track list
export const TRACK_LIST_COLLAPSED = 48; // Collapsed track list

// Channel Strip Sizing
export const CHANNEL_WIDTH_MIN = 80; // Minimum channel width
export const CHANNEL_WIDTH_DEFAULT = 90; // Default channel width
export const CHANNEL_WIDTH_MAX = 120; // Maximum channel width
export const MASTER_CHANNEL_WIDTH = 128; // Master channel fixed width

// Track Heights
export const TRACK_HEIGHT = 100; // Standard track height in timeline
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
