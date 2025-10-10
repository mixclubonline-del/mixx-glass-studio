/**
 * New Plugin Definitions - 7 additional plugins
 */

import { PluginMetadata } from '../PluginManager';

export const newPluginMetadata: PluginMetadata[] = [
  {
    id: 'mixxdelay',
    name: 'MixxDelay',
    category: 'effects',
    manufacturer: 'MixxClub',
    version: '1.0.0',
    description: 'Echo Machine with ping-pong mode, filters, and modulation',
    tags: ['delay', 'echo', 'time', 'feedback'],
    presets: ['Short Echo', 'Long Echo', 'Ping Pong', 'Tape Delay'],
    skinPath: 'mixxdelay-skin.png'
  },
  {
    id: 'xziter',
    name: "X'Ziter",
    category: 'creative',
    manufacturer: 'MixxClub',
    version: '1.0.0',
    description: 'Harmonic Enhancer - adds harmonics, brilliance, and stereo width',
    tags: ['harmonics', 'exciter', 'brilliance', 'width'],
    presets: ['Subtle Shine', 'Bright Air', 'Wide & Warm'],
    skinPath: 'xziter-skin.png'
  },
  {
    id: 'mixxport',
    name: 'MixxPort',
    category: 'ai',
    manufacturer: 'MixxClub',
    version: '1.0.0',
    description: 'Audio Upload Hub with AI analysis, stem separation, and auto-suggestions',
    tags: ['upload', 'ai', 'analysis', 'stems'],
    presets: ['Default'],
    skinPath: 'mixxport-skin.png'
  },
  {
    id: 'mixxmaster',
    name: 'MixxMaster',
    category: 'mastering',
    manufacturer: 'MixxClub',
    version: '1.0.0',
    description: 'Mastering Suite with AI-powered loudness optimization',
    tags: ['mastering', 'loudness', 'ai', 'lufs'],
    presets: ['Streaming', 'Club', 'Broadcast', 'Custom'],
    skinPath: 'mixxmaster-skin.png'
  },
  {
    id: 'mixxvintage',
    name: 'MixxVintage',
    category: 'effects',
    manufacturer: 'MixxClub',
    version: '1.0.0',
    description: 'Tape & Vinyl emulation with saturation, hiss, warmth, and flutter',
    tags: ['vintage', 'tape', 'vinyl', 'saturation', 'warmth'],
    presets: ['Analog Tape', 'Warm Vinyl', 'Lo-Fi', 'Cassette'],
    skinPath: 'mixxvintage-skin.png'
  },
  {
    id: 'mixxfx',
    name: 'MixxFX',
    category: 'creative',
    manufacturer: 'MixxClub',
    version: '1.0.0',
    description: 'Creative Effects - chorus, flanger, phaser with effect morphing',
    tags: ['modulation', 'chorus', 'flanger', 'phaser', 'creative'],
    presets: ['Classic Chorus', 'Jet Flanger', 'Vintage Phaser', 'Morph FX'],
    skinPath: 'mixxfx-skin.png'
  },
  {
    id: 'mixxglue',
    name: 'MixxGlue',
    category: 'dynamics',
    manufacturer: 'MixxClub',
    version: '1.0.0',
    description: 'Bus Compressor - glue mixes together with AI preset suggestions',
    tags: ['compression', 'bus', 'glue', 'mix', 'ai'],
    presets: ['Soft Glue', 'Medium Glue', 'Hard Glue', 'AI Preset'],
    skinPath: 'mixxglue-skin.png'
  }
];

export const newPluginParameters: Record<string, any> = {
  mixxdelay: {
    feedback: { min: 0, max: 100, default: 30, unit: '%' },
    mix: { min: 0, max: 100, default: 50, unit: '%' },
    lowCut: { min: 20, max: 200, default: 20, unit: 'Hz' },
    highCut: { min: 1000, max: 20000, default: 20000, unit: 'Hz' },
    pingPong: { min: 0, max: 1, default: 0, unit: 'toggle' }
  },
  xziter: {
    harmonics: { min: 0, max: 100, default: 30, unit: '%' },
    brilliance: { min: 0, max: 100, default: 50, unit: '%' },
    mix: { min: 0, max: 100, default: 40, unit: '%' },
    gain: { min: -12, max: 12, default: 0, unit: 'dB' }
  },
  mixxport: {
    // This is a utility plugin, parameters handled by UI
  },
  mixxmaster: {
    targetLUFS: { min: -23, max: -6, default: -14, unit: 'LUFS' },
    truePeak: { min: -6, max: -0.1, default: -1, unit: 'dB' },
    stereoWidth: { min: 0, max: 200, default: 100, unit: '%' }
  },
  mixxvintage: {
    saturation: { min: 0, max: 100, default: 30, unit: '%' },
    hiss: { min: 0, max: 100, default: 10, unit: '%' },
    warmth: { min: 0, max: 100, default: 5, unit: '%' },
    flutter: { min: 0, max: 100, default: 5, unit: '%' }
  },
  mixxfx: {
    rate: { min: 0.1, max: 10, default: 1, unit: 'Hz' },
    depth: { min: 0, max: 100, default: 50, unit: '%' },
    feedback: { min: 0, max: 100, default: 30, unit: '%' },
    mix: { min: 0, max: 100, default: 40, unit: '%' }
  },
  mixxglue: {
    threshold: { min: -40, max: 0, default: -20, unit: 'dB' },
    ratio: { min: 1, max: 20, default: 4, unit: ':1' },
    attack: { min: 0.1, max: 100, default: 10, unit: 'ms' },
    release: { min: 10, max: 1000, default: 100, unit: 'ms' },
    makeup: { min: 0, max: 24, default: 0, unit: 'dB' }
  }
};
