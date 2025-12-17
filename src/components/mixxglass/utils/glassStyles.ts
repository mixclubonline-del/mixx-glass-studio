/**
 * MixxGlass Style Utilities
 * 
 * Provides glass aesthetic styling primitives using the AURA Design System.
 */

import { 
  AuraPalette, 
  AuraColors, 
  AuraEffects, 
  auraAlpha 
} from '../../../theme/aura-tokens';

// Extract palette colors
const { violet, cyan, magenta, indigo } = AuraPalette;

export interface GlassStyleProps {
  intensity?: 'soft' | 'medium' | 'strong';
  border?: boolean;
  glow?: boolean;
  glowColor?: string;
}

/**
 * Generate glass surface styles using AURA palette
 */
export function getGlassSurface(props: GlassStyleProps = {}) {
  const { intensity = 'medium', border = true, glow = false, glowColor } = props;

  const intensities = {
    soft: {
      background: auraAlpha(AuraColors.night, 0.68),
      backdrop: AuraEffects.glass.backdropFilterLight,
      border: auraAlpha(cyan[400], 0.26),
    },
    medium: {
      background: auraAlpha(AuraColors.night, 0.82),
      backdrop: AuraEffects.glass.backdropFilter,
      border: auraAlpha(cyan[400], 0.45),
    },
    strong: {
      background: auraAlpha(AuraColors.night, 0.92),
      backdrop: AuraEffects.glass.backdropFilterHeavy,
      border: auraAlpha(cyan[400], 0.65),
    },
  };

  const style = intensities[intensity];

  return {
    backgroundColor: style.background,
    backdropFilter: style.backdrop,
    WebkitBackdropFilter: style.backdrop,
    border: border ? `1px solid ${style.border}` : 'none',
    boxShadow: glow
      ? `0 0 20px ${glowColor || auraAlpha(violet.DEFAULT, 0.3)}, 0 22px 70px ${auraAlpha(AuraColors.space, 0.55)}`
      : `0 22px 70px ${auraAlpha(AuraColors.space, 0.55)}`,
  };
}

/**
 * Generate glass button styles using AURA palette
 */
export function getGlassButtonStyles(variant: 'primary' | 'secondary' | 'ghost' = 'primary') {
  const variants = {
    primary: {
      background: `linear-gradient(140deg, ${auraAlpha(indigo[700], 0.95)}, ${auraAlpha(violet.DEFAULT, 0.72)})`,
      border: `1px solid ${auraAlpha(violet[300], 0.6)}`,
      color: '#f8f9ff',
      hover: {
        transform: 'translateY(-3px) scale(1.02)',
        boxShadow: AuraEffects.auraGlow.medium,
      },
    },
    secondary: {
      background: auraAlpha(indigo[900], 0.85),
      border: `1px solid ${auraAlpha(cyan[400], 0.45)}`,
      color: auraAlpha(cyan[100], 0.9),
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: AuraEffects.glow.md,
      },
    },
    ghost: {
      background: 'transparent',
      border: `1px solid ${auraAlpha(cyan[400], 0.2)}`,
      color: auraAlpha(cyan[100], 0.9),
      hover: {
        background: auraAlpha(indigo[900], 0.4),
        border: `1px solid ${auraAlpha(violet.DEFAULT, 0.4)}`,
      },
    },
  };

  return variants[variant];
}

/**
 * Generate glass input styles using AURA palette
 */
export function getGlassInputStyles(focused: boolean = false) {
  return {
    background: focused
      ? auraAlpha(indigo[900], 0.9)
      : auraAlpha(AuraColors.night, 0.68),
    backdropFilter: AuraEffects.glass.backdropFilter,
    WebkitBackdropFilter: AuraEffects.glass.backdropFilter,
    border: focused
      ? `1px solid ${auraAlpha(cyan.DEFAULT, 0.6)}`
      : `1px solid ${auraAlpha(cyan[400], 0.3)}`,
    boxShadow: focused
      ? `0 0 15px ${auraAlpha(cyan.DEFAULT, 0.3)}, inset 0 0 0.5px rgba(255, 255, 255, 0.1)`
      : 'inset 0 0 0.5px rgba(255, 255, 255, 0.1)',
    color: auraAlpha(cyan[100], 0.9),
  };
}

/**
 * Generate 3D transform for glass effect
 */
export function getGlassTransform(depth: number = 0) {
  return {
    transform: `translateZ(${depth}px)`,
    transformStyle: 'preserve-3d' as const,
  };
}

/**
 * Generate pulse animation for ALS feedback using AURA palette
 */
export function getALSPulse(color: string, intensity: number = 0.5) {
  // Default to violet if no color provided
  const pulseColor = color || violet.DEFAULT;
  
  return {
    animation: `als-pulse 2s ease-in-out infinite`,
    boxShadow: `0 0 ${10 + intensity * 20}px ${auraAlpha(pulseColor, intensity * 0.8)}`,
  };
}

/**
 * Generate AURA glow effect for surfaces
 */
export function getAuraGlow(level: 'subtle' | 'medium' | 'intense' = 'medium') {
  return {
    boxShadow: AuraEffects.auraGlow[level],
  };
}

/**
 * Generate neon effect for elements
 */
export function getNeonGlow(color: 'violet' | 'cyan' | 'magenta' | 'amber' = 'violet') {
  return {
    boxShadow: AuraEffects.neon[color],
  };
}
