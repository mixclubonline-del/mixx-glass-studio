/**
 * Plugin Registry - Register all available plugins
 */

import React from 'react';
import { PluginManager } from '@/audio/plugins/PluginManager';
import { MixxReverb } from './MixxReverb';
import { MixxDelay } from './MixxDelay';
import { MixxEQ } from './MixxEQ';
import { MixxCompressor } from './MixxCompressor';
import { MixxSaturator } from './MixxSaturator';
import { MixxChorus } from './MixxChorus';
import { MixxLimiter } from './MixxLimiter';
import { MixxGate } from './MixxGate';
import { MixxPhaser } from './MixxPhaser';
import { MixxFlanger } from './MixxFlanger';
import { MixxStereoImager } from './MixxStereoImager';
import { MixxTransient } from './MixxTransient';
import { MixxMultiBandComp } from './MixxMultiBandComp';
import { MixxExciter } from './MixxExciter';
import { MixxDeEsser } from './MixxDeEsser';
import { MixxTune } from './MixxTune';

// Register MixxTune - AI-Powered Pitch Correction
PluginManager.register({
  metadata: {
    id: 'mixxtune',
    name: 'MixxTune AI',
    category: 'ai',
    description: 'AI-powered context-aware pitch correction. Listens to your full mix to understand chords, key, and melody—adapting in real-time for natural, musical results. Perfect for modern hip-hop, trap, and R&B.',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['pitch', 'auto-tune', 'vocal', 'ai', 'context-aware', 'hip-hop', 'trap', 'r&b'],
    presetCount: 4
  },
  component: MixxTune,
  defaultParameters: {
    speed: 50,
    strength: 80,
    tolerance: 30
  }
});

// Register MixxReverb
PluginManager.register({
  metadata: {
    id: 'mixxreverb',
    name: 'MixxReverb',
    category: 'effects',
    description: 'Atmos Designer - Professional algorithmic reverb with early reflections and tail control',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['reverb', 'space', 'ambience', 'atmosphere'],
    presetCount: 25,
  },
  component: MixxReverb,
  defaultParameters: {
    mix: 0.3,
    decay: 0.5,
    preDelay: 0.2,
    size: 0.6,
    damping: 0.4,
    diffusion: 0.7,
  },
});

// Register MixxDelay
PluginManager.register({
  metadata: {
    id: 'mixxdelay',
    name: 'MixxDelay',
    category: 'effects',
    description: 'Echo Designer - Stereo delay with filtering and tempo sync',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['delay', 'echo', 'feedback', 'time'],
    presetCount: 20,
  },
  component: MixxDelay,
  defaultParameters: {
    time: 0.5,
    feedback: 0.3,
    mix: 0.3,
    lowCut: 0.2,
    highCut: 0.8,
    sync: 0,
  },
});

// Register MixxEQ
PluginManager.register({
  metadata: {
    id: 'mixxeq',
    name: 'MixxEQ',
    category: 'dynamics',
    description: 'Channel EQ - 3-band parametric equalizer with shelving filters',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['eq', 'equalizer', 'filter', 'tone'],
    presetCount: 30,
  },
  component: MixxEQ,
  defaultParameters: {
    lowGain: 0.5,
    lowFreq: 0.2,
    midGain: 0.5,
    midFreq: 0.5,
    midQ: 0.7,
    highGain: 0.5,
    highFreq: 0.8,
  },
});

// Register MixxCompressor
PluginManager.register({
  metadata: {
    id: 'mixxcompressor',
    name: 'MixxCompressor',
    category: 'dynamics',
    description: 'Dynamics Processor - Professional compressor with adaptive response',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['compressor', 'dynamics', 'compression', 'punch'],
    presetCount: 35,
  },
  component: MixxCompressor,
  defaultParameters: {
    threshold: 0.7,
    ratio: 0.25,
    attack: 0.3,
    release: 0.5,
    knee: 0.3,
    makeup: 0.5,
  },
});

// Register MixxSaturator
PluginManager.register({
  metadata: {
    id: 'mixxsaturator',
    name: 'MixxSaturator',
    category: 'creative',
    description: 'Color Box - Analog-style saturation and harmonic enhancement',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['saturation', 'distortion', 'warmth', 'harmonics', 'color'],
    presetCount: 28,
  },
  component: MixxSaturator,
  defaultParameters: {
    drive: 0.3,
    type: 0.33,
    tone: 0.5,
    mix: 0.5,
    output: 0.5,
    harmonics: 0.5,
  },
});

// Register MixxChorus
PluginManager.register({
  metadata: {
    id: 'mixxchorus',
    name: 'MixxChorus',
    category: 'effects',
    description: 'Dimension - Multi-voice chorus with stereo imaging',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['chorus', 'modulation', 'stereo', 'width', 'dimension'],
    presetCount: 22,
  },
  component: MixxChorus,
  defaultParameters: {
    rate: 0.3,
    depth: 0.5,
    feedback: 0.2,
    mix: 0.5,
    voices: 0.33,
    stereo: 0.7,
  },
});

// Register MixxLimiter
PluginManager.register({
  metadata: {
    id: 'mixxlimiter',
    name: 'MixxLimiter',
    category: 'mastering',
    description: 'Maximizer - True peak limiter for mastering and final output',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['limiter', 'maximizer', 'mastering', 'loudness', 'ceiling'],
    presetCount: 18,
  },
  component: MixxLimiter,
  defaultParameters: {
    threshold: 0.95,
    ceiling: 0.98,
    release: 0.5,
    gain: 0.5,
    mode: 0.5,
    link: 1,
  },
});

// Register MixxGate
PluginManager.register({
  metadata: {
    id: 'mixxgate',
    name: 'MixxGate',
    category: 'dynamics',
    description: 'Gate/Expander - Noise gate with expander mode for clean recordings',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['gate', 'expander', 'noise', 'dynamics', 'clean'],
    presetCount: 16,
  },
  component: MixxGate,
  defaultParameters: {
    threshold: 0.3,
    range: 0.5,
    attack: 0.2,
    hold: 0.3,
    release: 0.4,
    ratio: 0.2,
  },
});

// Register MixxPhaser
PluginManager.register({
  metadata: {
    id: 'mixxphaser',
    name: 'MixxPhaser',
    category: 'effects',
    description: 'Phase Shifter - Vintage phaser with multi-stage filtering',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['phaser', 'modulation', 'vintage', 'sweep', 'notch'],
    presetCount: 20,
  },
  component: MixxPhaser,
  defaultParameters: {
    rate: 0.4,
    depth: 0.6,
    feedback: 0.3,
    stages: 0.5,
    mix: 0.5,
    stereo: 0.5,
  },
});

// Register MixxFlanger
PluginManager.register({
  metadata: {
    id: 'mixxflanger',
    name: 'MixxFlanger',
    category: 'effects',
    description: 'Jet Flanger - Classic flanging effect with feedback control',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['flanger', 'modulation', 'jet', 'sweep', 'comb'],
    presetCount: 18,
  },
  component: MixxFlanger,
  defaultParameters: {
    rate: 0.3,
    depth: 0.5,
    feedback: 0.4,
    delay: 0.2,
    mix: 0.5,
    invert: 0,
  },
});

// Register MixxStereoImager
PluginManager.register({
  metadata: {
    id: 'mixxstereoimager',
    name: 'MixxStereoImager',
    category: 'mastering',
    description: 'Stereo Imager - Advanced stereo width and spatial control',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['stereo', 'width', 'imaging', 'spatial', 'mid-side'],
    presetCount: 15,
  },
  component: MixxStereoImager,
  defaultParameters: {
    width: 0.5,
    mono: 0.5,
    balance: 0.5,
    rotation: 0.5,
    lowWidth: 0.3,
    highWidth: 0.7,
  },
});

// Register MixxTransient
PluginManager.register({
  metadata: {
    id: 'mixxtransient',
    name: 'MixxTransient',
    category: 'dynamics',
    description: 'Transient Designer - Shape attack and sustain independently',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['transient', 'attack', 'sustain', 'punch', 'envelope'],
    presetCount: 24,
  },
  component: MixxTransient,
  defaultParameters: {
    attack: 0.5,
    sustain: 0.5,
    speed: 0.5,
    highEmphasis: 0.3,
    clipGuard: 0.8,
    output: 0.5,
  },
});

// Register MixxMultiBandComp
PluginManager.register({
  metadata: {
    id: 'mixxmultibandcomp',
    name: 'MixxMultiBandComp',
    category: 'mastering',
    description: 'Multiband Dynamics - 3-band compressor for mastering and bus processing',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['multiband', 'compressor', 'mastering', 'frequency', 'dynamics'],
    presetCount: 32,
  },
  component: MixxMultiBandComp,
  defaultParameters: {
    lowThreshold: 0.6,
    lowRatio: 0.3,
    midThreshold: 0.6,
    midRatio: 0.3,
    highThreshold: 0.6,
    highRatio: 0.3,
    attack: 0.3,
    release: 0.5,
    crossover1: 0.2,
    crossover2: 0.8,
    lowGain: 0.5,
    midGain: 0.5,
    highGain: 0.5,
    output: 0.5,
  },
});

// Register MixxExciter
PluginManager.register({
  metadata: {
    id: 'mixxexciter',
    name: 'MixxExciter',
    category: 'creative',
    description: 'Harmonic Exciter - Add brightness and presence with harmonic generation',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['exciter', 'harmonics', 'brightness', 'presence', 'air'],
    presetCount: 22,
  },
  component: MixxExciter,
  defaultParameters: {
    amount: 0.4,
    frequency: 0.6,
    harmonics: 0.5,
    mix: 0.5,
    mode: 0.5,
    output: 0.5,
  },
});

// Register MixxDeEsser
PluginManager.register({
  metadata: {
    id: 'mixxdeesser',
    name: 'MixxDeEsser',
    category: 'dynamics',
    description: 'De-Esser - Intelligent sibilance reduction for vocals',
    manufacturer: 'Mixx Club',
    version: '1.0.0',
    tags: ['deesser', 'vocal', 'sibilance', 'dynamics', 'processing'],
    presetCount: 14,
  },
  component: MixxDeEsser,
  defaultParameters: {
    threshold: 0.6,
    frequency: 0.75,
    range: 0.5,
    speed: 0.5,
    mode: 0.5,
    amount: 0.5,
  },
});

// Register new plugins
import { newPluginMetadata } from '@/audio/plugins/registry/newPlugins';

newPluginMetadata.forEach(metadata => {
  PluginManager.register({
    metadata: {
      ...metadata,
      presetCount: metadata.presets?.length || 0
    },
    component: () => React.createElement('div', { className: 'p-4 text-sm' }, 'Plugin UI coming soon'),
    defaultParameters: {}
  });
});

export default PluginManager;
