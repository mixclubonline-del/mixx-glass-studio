/**
 * Plugin Registry - Register all available plugins
 */

import { PluginManager } from '@/audio/plugins/PluginManager';
import { MixxReverb } from './MixxReverb';
import { MixxDelay } from './MixxDelay';
import { MixxEQ } from './MixxEQ';
import { MixxCompressor } from './MixxCompressor';
import { MixxSaturator } from './MixxSaturator';
import { MixxChorus } from './MixxChorus';
import { MixxLimiter } from './MixxLimiter';

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
