/**
 * ═══════════════════════════════════════════════════════════════════════════
 *                        AURA DESIGN SYSTEM TOKENS
 *                           © 2025 Mixxtech AI
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The official color palette and design tokens for AURA DAW.
 * These tokens define the visual identity across the entire application.
 * 
 * AURA = Adaptive Universal Radiant Atmosphere
 * 
 * The palette represents the mystical, creative, and premium feel of AURA:
 * - Violet: Mystical creativity, the primary brand color
 * - Cyan: Flow state, technology, clarity
 * - Magenta: Energy, warmth, passion
 * - Amber: Premium quality, golden excellence
 * - Indigo: Deep spirituality, intuition
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE AURA PALETTE
// ═══════════════════════════════════════════════════════════════════════════

export const AuraPalette = {
  /** Primary mystical/creative - The signature AURA color */
  violet: {
    DEFAULT: '#8B5CF6',
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  
  /** Flow/technology - Represents the flow state and tech */
  cyan: {
    DEFAULT: '#22D3EE',
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  
  /** Energy/warmth - Passion and creative fire */
  magenta: {
    DEFAULT: '#EC4899',
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },
  
  /** Premium/golden - Excellence and quality */
  amber: {
    DEFAULT: '#F59E0B',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  /** Deep/spiritual - Intuition and depth */
  indigo: {
    DEFAULT: '#6366F1',
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SEMANTIC COLORS (Backwards compatible)
// ═══════════════════════════════════════════════════════════════════════════

export const AuraColors = {
  // Core Brand Colors (from palette)
  violet: AuraPalette.violet.DEFAULT,
  cyan: AuraPalette.cyan.DEFAULT,
  magenta: AuraPalette.magenta.DEFAULT,
  amber: AuraPalette.amber.DEFAULT,
  indigo: AuraPalette.indigo.DEFAULT,
  
  // Legacy compatibility
  blue: '#3b82f6',
  velvet: AuraPalette.indigo.DEFAULT,
  
  // Background Surfaces
  space: '#0A0A0F',      // Deepest black
  night: '#0F0F1A',      // Dark background
  twilight: '#1A1033',   // Elevated surface
  void: '#050508',       // Absolute darkness
  
  // Glass/Transparency
  glass: 'rgba(15, 15, 26, 0.75)',
  glassLight: 'rgba(255, 255, 255, 0.05)',
  glassMedium: 'rgba(255, 255, 255, 0.1)',
  glassHeavy: 'rgba(255, 255, 255, 0.15)',
  
  // Thermal ALS Palette (for audio feedback)
  thermal: {
    cold: '#88CCFF',
    cool: AuraPalette.cyan.DEFAULT,
    warm: AuraPalette.amber.DEFAULT,
    hot: '#FF6622',
    blazing: '#FF2244',
  },
  
  // Full palette reference
  palette: AuraPalette,
};

// ═══════════════════════════════════════════════════════════════════════════
// GRADIENTS
// ═══════════════════════════════════════════════════════════════════════════

export const AuraGradients = {
  // Primary brand gradients
  primary: `linear-gradient(135deg, ${AuraPalette.violet.DEFAULT} 0%, ${AuraPalette.indigo.DEFAULT} 100%)`,
  aurora: `linear-gradient(135deg, 
    ${AuraPalette.violet.DEFAULT} 0%, 
    ${AuraPalette.magenta.DEFAULT} 33%, 
    ${AuraPalette.cyan.DEFAULT} 66%, 
    ${AuraPalette.indigo.DEFAULT} 100%
  )`,
  sunset: `linear-gradient(135deg, ${AuraPalette.magenta.DEFAULT} 0%, ${AuraPalette.amber.DEFAULT} 100%)`,
  ocean: `linear-gradient(135deg, ${AuraPalette.cyan.DEFAULT} 0%, ${AuraPalette.indigo.DEFAULT} 100%)`,
  
  // Background gradients
  dark: 'linear-gradient(180deg, #0F0F1A 0%, #1A1033 100%)',
  depth: 'linear-gradient(180deg, #0A0A0F 0%, #0F0F1A 50%, #1A1033 100%)',
  
  // Radial glows
  coreGlow: `radial-gradient(circle at center, 
    rgba(139, 92, 246, 0.3) 0%, 
    rgba(236, 72, 153, 0.15) 40%,
    rgba(34, 211, 238, 0.1) 70%,
    transparent 100%
  )`,
  
  // Conic aurora effect
  auroraWisp: `conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(139, 92, 246, 0.35) 8%,
    rgba(236, 72, 153, 0.25) 16%,
    transparent 24%,
    transparent 33%,
    rgba(34, 211, 238, 0.3) 41%,
    rgba(99, 102, 241, 0.25) 49%,
    transparent 57%,
    transparent 66%,
    rgba(245, 158, 11, 0.2) 74%,
    rgba(139, 92, 246, 0.25) 82%,
    transparent 90%,
    transparent 100%
  )`,
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

export const AuraTypos = {
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  mono: 'JetBrains Mono, Consolas, monospace',
  display: 'Inter, system-ui, sans-serif',
};

// ═══════════════════════════════════════════════════════════════════════════
// EFFECTS & SHADOWS
// ═══════════════════════════════════════════════════════════════════════════

export const AuraEffects = {
  // Glow effects
  glow: {
    xs: `0 0 5px rgba(139, 92, 246, 0.2)`,
    sm: `0 0 10px rgba(139, 92, 246, 0.3)`,
    md: `0 0 20px rgba(139, 92, 246, 0.4), 0 0 10px rgba(34, 211, 238, 0.2)`,
    lg: `0 0 40px rgba(139, 92, 246, 0.5), 0 0 20px rgba(236, 72, 153, 0.3)`,
    xl: `0 0 60px rgba(139, 92, 246, 0.6), 0 0 30px rgba(34, 211, 238, 0.3), 0 0 15px rgba(236, 72, 153, 0.2)`,
  },
  
  // Multi-color AURA glow
  auraGlow: {
    subtle: `
      0 0 20px rgba(139, 92, 246, 0.25),
      0 0 40px rgba(34, 211, 238, 0.15),
      0 0 60px rgba(236, 72, 153, 0.1)
    `,
    medium: `
      0 0 30px rgba(139, 92, 246, 0.4),
      0 0 50px rgba(34, 211, 238, 0.25),
      0 0 70px rgba(236, 72, 153, 0.15)
    `,
    intense: `
      0 0 40px rgba(139, 92, 246, 0.6),
      0 0 60px rgba(34, 211, 238, 0.4),
      0 0 80px rgba(236, 72, 153, 0.25),
      0 0 100px rgba(245, 158, 11, 0.15)
    `,
  },
  
  // Text shadows
  textGlow: {
    subtle: '0 0 10px rgba(139, 92, 246, 0.5)',
    medium: '0 0 15px rgba(139, 92, 246, 0.7), 0 0 25px rgba(34, 211, 238, 0.4)',
    aura: `
      0 0 15px rgba(139, 92, 246, 0.9),
      0 0 30px rgba(236, 72, 153, 0.5),
      0 0 45px rgba(34, 211, 238, 0.4),
      0 0 60px rgba(245, 158, 11, 0.25)
    `,
  },
  
  // Glass effects
  glass: {
    backdropFilter: 'blur(12px)',
    backdropFilterHeavy: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderGlow: `1px solid rgba(139, 92, 246, 0.3)`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION TOKENS
// ═══════════════════════════════════════════════════════════════════════════

export const AuraMotion = {
  // Durations
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms',
    slowest: '1200ms',
  },
  
  // Easing curves
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CSS CUSTOM PROPERTIES (for use in stylesheets)
// ═══════════════════════════════════════════════════════════════════════════

export const AuraCSSVars = `
  :root {
    /* Core Palette */
    --aura-violet: ${AuraPalette.violet.DEFAULT};
    --aura-cyan: ${AuraPalette.cyan.DEFAULT};
    --aura-magenta: ${AuraPalette.magenta.DEFAULT};
    --aura-amber: ${AuraPalette.amber.DEFAULT};
    --aura-indigo: ${AuraPalette.indigo.DEFAULT};
    
    /* Violet Scale */
    --aura-violet-50: ${AuraPalette.violet[50]};
    --aura-violet-100: ${AuraPalette.violet[100]};
    --aura-violet-200: ${AuraPalette.violet[200]};
    --aura-violet-300: ${AuraPalette.violet[300]};
    --aura-violet-400: ${AuraPalette.violet[400]};
    --aura-violet-500: ${AuraPalette.violet[500]};
    --aura-violet-600: ${AuraPalette.violet[600]};
    --aura-violet-700: ${AuraPalette.violet[700]};
    --aura-violet-800: ${AuraPalette.violet[800]};
    --aura-violet-900: ${AuraPalette.violet[900]};
    
    /* Backgrounds */
    --aura-space: ${AuraColors.space};
    --aura-night: ${AuraColors.night};
    --aura-twilight: ${AuraColors.twilight};
    --aura-void: ${AuraColors.void};
    
    /* Typography */
    --aura-font-sans: ${AuraTypos.sans};
    --aura-font-mono: ${AuraTypos.mono};
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Convert hex to rgba with alpha */
export function auraAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Get AURA glow for a specific color */
export function auraGlow(color: keyof typeof AuraPalette, intensity: 'sm' | 'md' | 'lg' = 'md'): string {
  const hex = AuraPalette[color].DEFAULT;
  const sizes = { sm: [10, 0.3], md: [25, 0.5], lg: [50, 0.6] };
  const [size, alpha] = sizes[intensity];
  return `0 0 ${size}px ${auraAlpha(hex, alpha)}`;
}

// Default export for convenience
export default {
  palette: AuraPalette,
  colors: AuraColors,
  gradients: AuraGradients,
  typography: AuraTypos,
  effects: AuraEffects,
  motion: AuraMotion,
  cssVars: AuraCSSVars,
  alpha: auraAlpha,
  glow: auraGlow,
};
