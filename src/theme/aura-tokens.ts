/**
 * AURA Design System Tokens
 * © 2025 Mixxtech AI
 */

export const AuraColors = {
  // Brand
  violet: '#8b5cf6',
  blue: '#3b82f6',
  velvet: '#6366f1',
  
  // Backgrounds
  space: '#0a0a0f',
  night: '#0f0f1a',
  twilight: '#1a1033',
  glass: 'rgba(15, 15, 26, 0.7)',
  
  // Thermal ALS Palette
  thermal: {
    cold: '#88ccff',
    warm: '#ffaa44',
    hot: '#ff6622',
    blazing: '#ff2244'
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    dark: 'linear-gradient(180deg, #0f0f1a 0%, #1a1033 100%)',
    velvet: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
  }
};

export const AuraTypos = {
  sans: 'Inter, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
};

export const AuraEffects = {
  glow: {
    sm: '0 0 10px rgba(139, 92, 246, 0.3)',
    md: '0 0 20px rgba(139, 92, 246, 0.5)',
    lg: '0 0 40px rgba(59, 130, 246, 0.6)',
  },
  glass: {
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }
};
