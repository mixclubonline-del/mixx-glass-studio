/**
 * Enhanced Reverb Effect
 * Convolution-based reverb with controls
 */

import { EffectBase } from './EffectBase';

export interface ReverbParams {
  mix: number; // 0 to 1
  decay: number; // 0.1 to 5 seconds
  preDelay: number; // 0 to 0.1 seconds
}

export class Reverb extends EffectBase {
  private input: GainNode;
  private output: GainNode;
  private convolver: ConvolverNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private params: ReverbParams;
  
  constructor(context: AudioContext) {
    super(context);
    
    this.input = context.createGain();
    this.output = context.createGain();
    this.convolver = context.createConvolver();
    this.wetGain = context.createGain();
    this.dryGain = context.createGain();
    
    this.params = {
      mix: 0.3,
      decay: 2.5,
      preDelay: 0,
    };
    
    // Generate impulse response
    this.generateImpulse();
    
    // Wet path: input → convolver → wetGain → output
    this.input.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Dry path: input → dryGain → output
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Set initial mix
    this.updateMix();
  }
  
  get inputNode(): AudioNode {
    return this.input;
  }
  
  get outputNode(): AudioNode {
    return this.output;
  }
  
  setMix(mix: number) {
    this.params.mix = Math.max(0, Math.min(1, mix));
    this.updateMix();
  }
  
  setDecay(decay: number) {
    this.params.decay = Math.max(0.1, Math.min(5, decay));
    this.generateImpulse();
  }
  
  private updateMix() {
    this.wetGain.gain.value = this.params.mix;
    this.dryGain.gain.value = 1 - this.params.mix;
  }
  
  private generateImpulse() {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * this.params.decay;
    const impulse = this.context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with noise
        const decay = Math.exp(-i / (sampleRate * (this.params.decay * 0.3)));
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    this.convolver.buffer = impulse;
  }
  
  dispose() {
    this.input.disconnect();
    this.convolver.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.output.disconnect();
  }
}
