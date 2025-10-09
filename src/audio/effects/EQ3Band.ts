/**
 * 3-Band Parametric EQ
 * Low shelf, Mid bell, High shelf
 */

import { EffectBase } from './EffectBase';
import { EQParams } from '@/types/audio';

export class EQ3Band extends EffectBase {
  private input: GainNode;
  private output: GainNode;
  private lowFilter: BiquadFilterNode;
  private midFilter: BiquadFilterNode;
  private highFilter: BiquadFilterNode;
  
  constructor(context: AudioContext) {
    super(context);
    
    this.input = context.createGain();
    this.output = context.createGain();
    
    // Create filters
    this.lowFilter = context.createBiquadFilter();
    this.midFilter = context.createBiquadFilter();
    this.highFilter = context.createBiquadFilter();
    
    // Default settings
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 100;
    this.lowFilter.gain.value = 0;
    
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1.0;
    this.midFilter.gain.value = 0;
    
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 8000;
    this.highFilter.gain.value = 0;
    
    // Connect: input → low → mid → high → output
    this.input.connect(this.lowFilter);
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.output);
  }
  
  get inputNode(): AudioNode {
    return this.input;
  }
  
  get outputNode(): AudioNode {
    return this.output;
  }
  
  setParams(params: Partial<EQParams>) {
    if (params.low) {
      this.lowFilter.frequency.value = params.low.frequency;
      this.lowFilter.gain.value = params.low.gain;
      this.lowFilter.type = params.low.type === 'bell' ? 'peaking' : 'lowshelf';
    }
    
    if (params.mid) {
      this.midFilter.frequency.value = params.mid.frequency;
      this.midFilter.gain.value = params.mid.gain;
      this.midFilter.Q.value = params.mid.q;
    }
    
    if (params.high) {
      this.highFilter.frequency.value = params.high.frequency;
      this.highFilter.gain.value = params.high.gain;
      this.highFilter.type = params.high.type === 'bell' ? 'peaking' : 'highshelf';
    }
  }
  
  getParams(): EQParams {
    return {
      low: {
        frequency: this.lowFilter.frequency.value,
        gain: this.lowFilter.gain.value,
        type: this.lowFilter.type === 'peaking' ? 'bell' : 'shelf',
      },
      mid: {
        frequency: this.midFilter.frequency.value,
        gain: this.midFilter.gain.value,
        q: this.midFilter.Q.value,
      },
      high: {
        frequency: this.highFilter.frequency.value,
        gain: this.highFilter.gain.value,
        type: this.highFilter.type === 'peaking' ? 'bell' : 'shelf',
      },
    };
  }
  
  dispose() {
    this.input.disconnect();
    this.lowFilter.disconnect();
    this.midFilter.disconnect();
    this.highFilter.disconnect();
    this.output.disconnect();
  }
}
