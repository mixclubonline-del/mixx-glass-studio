/**
 * Plugin Registry - Register all available plugins
 */

import { PluginManager } from '@/audio/plugins/PluginManager';
import { MixxReverb } from './MixxReverb';

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

// More plugins will be registered here as we implement them
// PluginManager.register({ ... MixxDelay ... });
// PluginManager.register({ ... MixxEQ ... });
// etc.
