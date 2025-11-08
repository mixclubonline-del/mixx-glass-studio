/**
 * Layout Constants - Unified spacing and sizing system
 * All measurements in pixels, following 4px grid
 */

// Header Heights (standardized across all views)
export const CREATIVE_HEADER_HEIGHT = 48; // Creative breathing controls (BPM/Time/Position)
export const HEADER_HEIGHT = 72; // Main view headers
export const TOOLBAR_HEIGHT = 48; // Toolbars and secondary bars
export const TRANSPORT_HEIGHT = 60; // Transport controls
export const VIEW_SWITCHER_HEIGHT = 48; // View navigation tabs
export const RULER_HEIGHT = 40; // Timeline ruler
export const HEADER_TOTAL_HEIGHT = 168; // Sum of all header sections + spacing

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
export const MASTER_CHANNEL_WIDTH = 176; // Master channel fixed width

// Track Heights - Compact for trap/rap workflow
export const TRACK_HEIGHT = 48; // Standard track height (compact for seeing more tracks)
export const TRACK_HEIGHT_MINI = 32; // Mini view for dense arrangements
export const TRACK_HEIGHT_MIDI = 64; // MIDI/Pattern view
export const TRACK_HEIGHT_MAXI = 96; // Maximum detail view
export const TRACK_HEIGHT_MIN = 32; // Minimum track height
export const TRACK_HEIGHT_MAX = 128; // Maximum track height

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

// Icon Sizes (consistent sizing across UI)
export const ICON_SIZE = {
  xs: 12,   // Extra small icons
  sm: 14,   // Small icons (toolbar, compact)
  md: 16,   // Default icons (standard buttons)
  lg: 20,   // Large icons (emphasized actions)
  xl: 24,   // Extra large icons (primary features)
} as const;

// Border Radius (consistent rounding)
export const RADIUS = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
} as const;
