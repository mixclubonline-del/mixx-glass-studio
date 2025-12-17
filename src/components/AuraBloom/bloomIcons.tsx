/**
 * AURA Bloom Icons
 * 
 * Ethereal SVG icon set for the bloom menu system.
 * Designed with soft lines, subtle fills, and glowing effects
 * to match the AURA Design System aesthetic.
 */

import React from 'react';

// Common icon props for consistent styling
interface IconProps {
  className?: string;
  size?: number;
}

const defaultSize = 26;

// ═══════════════════════════════════════════════════════════════════════════
// HOME MENU ICONS - Larger, more expressive
// ═══════════════════════════════════════════════════════════════════════════

export const PlusIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Outer glow circle */}
    <circle cx="12" cy="12" r="9" strokeWidth="1" opacity="0.3" />
    {/* Plus sign */}
    <line x1="12" y1="7" x2="12" y2="17" strokeWidth="2.5" />
    <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.5" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Folder with open effect */}
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    {/* Inner document lines */}
    <line x1="7" y1="13" x2="17" y2="13" opacity="0.5" strokeWidth="1" />
    <line x1="7" y1="16" x2="13" y2="16" opacity="0.5" strokeWidth="1" />
  </svg>
);

export const GridIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* 2x2 grid with rounded corners */}
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    {/* Center connecting dots */}
    <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.5" />
  </svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="4" ry="10" />
    <line x1="2" y1="12" x2="22" y2="12" opacity="0.6" />
    {/* Latitude lines */}
    <path d="M4 8h16" opacity="0.4" strokeWidth="1" />
    <path d="M4 16h16" opacity="0.4" strokeWidth="1" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// TOOL MENU ICONS - Functional, clear
// ═══════════════════════════════════════════════════════════════════════════

export const SaveIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" opacity="0.7" />
    {/* Checkmark indicator */}
    <path d="M10 13l2 2 4-4" strokeWidth="2" opacity="0.6" />
  </svg>
);

export const MixerIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Fader channels */}
    <rect x="3" y="6" width="4" height="14" rx="1" />
    <rect x="10" y="4" width="4" height="16" rx="1" />
    <rect x="17" y="8" width="4" height="12" rx="1" />
    {/* Fader knobs */}
    <circle cx="5" cy="10" r="1.5" fill="currentColor" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const PluginsIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Plug shape */}
    <path d="M12 2v4" strokeWidth="2" />
    <path d="M8 2v3" strokeWidth="1.5" opacity="0.7" />
    <path d="M16 2v3" strokeWidth="1.5" opacity="0.7" />
    <rect x="6" y="6" width="12" height="8" rx="2" />
    <path d="M10 14v3" />
    <path d="M14 14v3" />
    <rect x="8" y="17" width="8" height="4" rx="1" />
    {/* Power indicator */}
    <circle cx="12" cy="10" r="2" fill="currentColor" opacity="0.4" />
  </svg>
);

export const ImportIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    {/* Animated-looking arrow */}
    <path d="M12 3v12" strokeWidth="2" />
    <path d="M7 10l5 5 5-5" strokeWidth="2" />
    {/* Wave effect lines */}
    <path d="M5 7h2" opacity="0.4" strokeWidth="1" />
    <path d="M17 7h2" opacity="0.4" strokeWidth="1" />
  </svg>
);

export const ExportIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    {/* Up arrow */}
    <path d="M12 15V3" strokeWidth="2" />
    <path d="M17 8l-5-5-5 5" strokeWidth="2" />
    {/* Sparkle */}
    <circle cx="18" cy="5" r="1" fill="currentColor" opacity="0.5" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Gear teeth */}
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73l1.41-1.41" opacity="0.6" strokeWidth="1" />
    {/* Outer ring */}
    <circle cx="12" cy="12" r="7" />
    {/* Inner gear */}
    <circle cx="12" cy="12" r="3" strokeWidth="2" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const AIIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Brain/chip shape */}
    <rect x="5" y="5" width="14" height="14" rx="3" />
    {/* Neural connections */}
    <path d="M9 5v-2" opacity="0.6" />
    <path d="M15 5v-2" opacity="0.6" />
    <path d="M9 21v-2" opacity="0.6" />
    <path d="M15 21v-2" opacity="0.6" />
    <path d="M5 9h-2" opacity="0.6" />
    <path d="M5 15h-2" opacity="0.6" />
    <path d="M21 9h-2" opacity="0.6" />
    <path d="M21 15h-2" opacity="0.6" />
    {/* AI core */}
    <circle cx="12" cy="12" r="3" strokeWidth="2" />
    {/* Sparkle points */}
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="9" r="0.5" fill="currentColor" opacity="0.5" />
    <circle cx="15" cy="9" r="0.5" fill="currentColor" opacity="0.5" />
    <circle cx="9" cy="15" r="0.5" fill="currentColor" opacity="0.5" />
    <circle cx="15" cy="15" r="0.5" fill="currentColor" opacity="0.5" />
  </svg>
);

export const HelpIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    {/* Question mark */}
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY ICONS - For compatibility
// ═══════════════════════════════════════════════════════════════════════════

export const BrushIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

export const LayersIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

export const AdjustIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="21" x2="4" y2="14"/>
    <line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/>
    <line x1="20" y1="12" x2="20" y2="3"/>
    <circle cx="4" cy="12" r="2"/>
    <circle cx="12" cy="10" r="2"/>
    <circle cx="20" cy="14" r="2"/>
  </svg>
);

export const FiltersIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="9" r="6"/>
    <circle cx="15" cy="15" r="6"/>
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO & RECORDING ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const RecordIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.8" />
    {/* Pulse rings */}
    <circle cx="12" cy="12" r="7" opacity="0.3" strokeDasharray="2 3" />
  </svg>
);

export const MicrophoneIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <line x1="12" y1="18" x2="12" y2="22" strokeWidth="2" />
    <line x1="8" y1="22" x2="16" y2="22" />
    {/* Sound waves */}
    <path d="M19 8v2" opacity="0.4" />
    <path d="M21 9v0" opacity="0.3" />
  </svg>
);

export const HeadphonesIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
  </svg>
);

export const WaveformIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 12h2" opacity="0.5" />
    <path d="M6 8v8" />
    <path d="M10 5v14" />
    <path d="M14 7v10" />
    <path d="M18 9v6" />
    <path d="M20 12h2" opacity="0.5" />
  </svg>
);

export const SpeakerIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity="0.5" />
  </svg>
);

export const MuteIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" strokeWidth="2" />
    <line x1="17" y1="9" x2="23" y2="15" strokeWidth="2" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// EDITING & TOOLS ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const ScissorsIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" opacity="0.7" />
  </svg>
);

export const PasteIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    {/* Content lines */}
    <line x1="8" y1="12" x2="16" y2="12" opacity="0.5" />
    <line x1="8" y1="16" x2="14" y2="16" opacity="0.5" />
  </svg>
);

export const UndoIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

export const RedoIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
);

export const MagicWandIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 4l-4 4 9 9-4-4 4-4-5-5z" />
    <path d="M6 21l5-5" strokeWidth="2" />
    {/* Sparkles */}
    <circle cx="4" cy="4" r="1" fill="currentColor" />
    <circle cx="9" cy="2" r="0.5" fill="currentColor" opacity="0.6" />
    <circle cx="2" cy="9" r="0.5" fill="currentColor" opacity="0.6" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION & VIEW ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const ZoomInIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
    <line x1="11" y1="8" x2="11" y2="14" strokeWidth="2" />
    <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" />
  </svg>
);

export const ZoomOutIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
    <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" />
  </svg>
);

export const FullscreenIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" opacity="0.7" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT & PLAYBACK ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const PlayIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export const SkipBackIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const SkipForwardIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const LoopIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL & EFFECTS ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const SparkleIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    <circle cx="19" cy="5" r="1.5" opacity="0.5" />
    <circle cx="5" cy="19" r="1" opacity="0.4" />
  </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const StarFilledIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const FireIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// MUSIC & INSTRUMENTS ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const PianoIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="6" y1="4" x2="6" y2="20" opacity="0.5" />
    <line x1="10" y1="4" x2="10" y2="20" opacity="0.5" />
    <line x1="14" y1="4" x2="14" y2="20" opacity="0.5" />
    <line x1="18" y1="4" x2="18" y2="20" opacity="0.5" />
    {/* Black keys */}
    <rect x="5" y="4" width="2" height="8" fill="currentColor" />
    <rect x="9" y="4" width="2" height="8" fill="currentColor" />
    <rect x="15" y="4" width="2" height="8" fill="currentColor" />
    <rect x="19" y="4" width="2" height="8" fill="currentColor" />
  </svg>
);

export const DrumIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="8" rx="9" ry="4" />
    <path d="M3 8v8c0 2.21 4.03 4 9 4s9-1.79 9-4V8" />
    {/* Drum sticks */}
    <line x1="5" y1="3" x2="9" y2="7" strokeWidth="2" opacity="0.7" />
    <line x1="19" y1="3" x2="15" y2="7" strokeWidth="2" opacity="0.7" />
  </svg>
);

export const GuitarIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 3l-6 6" strokeWidth="2" />
    <path d="M12 10c-2 0-4 1-4 4 0 2-3 3-3 5s2 2 3 2 4-2 5-4c1-2 4-2 5-2 2 0 3-3 3-4s-1-2-3-2c-1 0-3 0-3 1h-3z" />
    <circle cx="8" cy="16" r="1" fill="currentColor" />
  </svg>
);

export const SynthIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    {/* Knobs */}
    <circle cx="6" cy="10" r="1.5" fill="currentColor" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="14" cy="10" r="1.5" fill="currentColor" />
    <circle cx="18" cy="10" r="1.5" fill="currentColor" />
    {/* Sliders */}
    <line x1="6" y1="14" x2="6" y2="16" strokeWidth="2" />
    <line x1="10" y1="13" x2="10" y2="16" strokeWidth="2" />
    <line x1="14" y1="14" x2="14" y2="16" strokeWidth="2" />
    <line x1="18" y1="12" x2="18" y2="16" strokeWidth="2" />
  </svg>
);

export const MetronomeIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 22l3-18h8l3 18H5z" />
    <line x1="12" y1="8" x2="17" y2="3" strokeWidth="2" />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// USER & SOCIAL ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const UserIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" opacity="0.6" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" opacity="0.6" />
  </svg>
);

export const MessageIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    {/* Message dots */}
    <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.5" />
    <circle cx="12" cy="10" r="1" fill="currentColor" opacity="0.5" />
    <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.5" />
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className, size = defaultSize }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    {/* Notification dot */}
    <circle cx="18" cy="5" r="2" fill="currentColor" opacity="0.8" />
  </svg>
);

