/**
 * Plugin Factory - Creates audio effect instances from plugin IDs
 */

import { EffectBase } from '../effects/EffectBase';
import { Reverb } from '../effects/Reverb';
import { Delay } from '../effects/Delay';
import { EQ3Band } from '../effects/EQ3Band';
import { SimpleCompressor } from '../effects/SimpleCompressor';
import { MixxTune } from '../effects/MixxTune';
import { ProEQ } from '../effects/ProEQ';
import { ProCompressor } from '../effects/ProCompressor';
import { ProSaturator } from '../effects/ProSaturator';

export class PluginFactory {
  /**
   * Create an audio effect instance from a plugin ID
   */
  static createInstance(pluginId: string, context: AudioContext): EffectBase | null {
    switch (pluginId.toLowerCase()) {
      // Basic effects
      case 'mixxreverb':
        return new Reverb(context);
      
      case 'mixxdelay':
        return new Delay(context);
      
      case 'mixxeq':
        return new EQ3Band(context);
      
      case 'mixxcompressor':
        return new SimpleCompressor(context);
      
      // AI-Powered
      case 'mixxtune':
        return new MixxTune(context);
      
      // Professional effects
      case 'proeq':
        return new ProEQ(context);
      
      case 'procompressor':
        return new ProCompressor(context);
      
      case 'prosaturator':
        return new ProSaturator(context);
      
      // More plugins will be added as they're implemented
      default:
        console.warn(`Plugin ${pluginId} not found in factory`);
        return null;
    }
  }
  
  /**
   * Check if a plugin ID is supported
   */
  static isSupported(pluginId: string): boolean {
    const supportedPlugins = [
      'mixxreverb',
      'mixxdelay',
      'mixxeq',
      'mixxcompressor',
      'mixxtune',
      'proeq',
      'procompressor',
      'prosaturator',
    ];
    
    return supportedPlugins.includes(pluginId.toLowerCase());
  }
}
