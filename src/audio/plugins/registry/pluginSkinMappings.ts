/**
 * Plugin Skin Mappings - Maps plugin parameters to positions on skin images
 */

export interface SkinParameterMapping {
  name: string;
  x: number; // Percentage position on skin (0-100)
  y: number; // Percentage position on skin (0-100)
  size?: number; // Size of interactive area (percentage)
  min: number;
  max: number;
  unit?: string;
}

export const pluginSkinMappings: Record<string, SkinParameterMapping[]> = {
  mixxdelay: [
    { name: 'feedback', x: 25, y: 35, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'mix', x: 75, y: 35, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'lowCut', x: 25, y: 70, size: 12, min: 20, max: 200, unit: 'Hz' },
    { name: 'highCut', x: 75, y: 70, size: 12, min: 1000, max: 20000, unit: 'Hz' }
  ],
  
  xziter: [
    { name: 'harmonics', x: 25, y: 30, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'brilliance', x: 75, y: 30, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'mix', x: 25, y: 65, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'gain', x: 75, y: 65, size: 12, min: -12, max: 12, unit: 'dB' }
  ],
  
  mixxmaster: [
    { name: 'targetLUFS', x: 25, y: 70, size: 12, min: -23, max: -6, unit: 'LUFS' },
    { name: 'truePeak', x: 50, y: 70, size: 12, min: -6, max: -0.1, unit: 'dB' },
    { name: 'stereoWidth', x: 75, y: 70, size: 12, min: 0, max: 200, unit: '%' }
  ],
  
  mixxvintage: [
    { name: 'saturation', x: 20, y: 60, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'hiss', x: 40, y: 75, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'warmth', x: 60, y: 75, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'flutter', x: 80, y: 60, size: 12, min: 0, max: 100, unit: '%' }
  ],
  
  mixxfx: [
    { name: 'rate', x: 25, y: 45, size: 12, min: 0.1, max: 10, unit: 'Hz' },
    { name: 'depth', x: 75, y: 45, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'feedback', x: 25, y: 75, size: 12, min: 0, max: 100, unit: '%' },
    { name: 'mix', x: 75, y: 75, size: 12, min: 0, max: 100, unit: '%' }
  ],
  
  mixxglue: [
    { name: 'threshold', x: 20, y: 35, size: 12, min: -40, max: 0, unit: 'dB' },
    { name: 'ratio', x: 50, y: 28, size: 10, min: 1, max: 20, unit: ':1' },
    { name: 'attack', x: 80, y: 35, size: 12, min: 0.1, max: 100, unit: 'ms' },
    { name: 'release', x: 20, y: 65, size: 12, min: 10, max: 1000, unit: 'ms' },
    { name: 'makeup', x: 80, y: 65, size: 12, min: 0, max: 24, unit: 'dB' }
  ]
};
