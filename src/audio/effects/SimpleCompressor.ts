/**
 * Simple Compressor
 * Wrapper around DynamicsCompressorNode with makeup gain
 */

import { EffectBase } from './EffectBase';
import { CompressorParams } from '@/types/audio';

export class SimpleCompressor extends EffectBase {
  private input: GainNode;
  private output: GainNode;
  private compressor: DynamicsCompressorNode;
  private makeupGainNode: GainNode;
  
  constructor(context: AudioContext) {
    super(context);
    
    this.input = context.createGain();
    this.output = context.createGain();
    this.compressor = context.createDynamicsCompressor();
    this.makeupGainNode = context.createGain();
    
    // Default settings
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.makeupGainNode.gain.value = 1;
    
    // Connect: input → compressor → makeup gain → output
    this.input.connect(this.compressor);
    this.compressor.connect(this.makeupGainNode);
    this.makeupGainNode.connect(this.output);
  }
  
  get inputNode(): AudioNode {
    return this.input;
  }
  
  get outputNode(): AudioNode {
    return this.output;
  }
  
  setParams(params: Partial<CompressorParams>) {
    if (params.threshold !== undefined) {
      this.compressor.threshold.value = params.threshold;
    }
    if (params.ratio !== undefined) {
      this.compressor.ratio.value = params.ratio;
    }
    if (params.attack !== undefined) {
      this.compressor.attack.value = params.attack;
    }
    if (params.release !== undefined) {
      this.compressor.release.value = params.release;
    }
    if (params.makeupGain !== undefined) {
      // Convert dB to linear gain
      this.makeupGainNode.gain.value = Math.pow(10, params.makeupGain / 20);
    }
  }
  
  getParams(): CompressorParams {
    return {
      threshold: this.compressor.threshold.value,
      ratio: this.compressor.ratio.value,
      attack: this.compressor.attack.value,
      release: this.compressor.release.value,
      makeupGain: 20 * Math.log10(this.makeupGainNode.gain.value),
    };
  }
  
  getReduction(): number {
    // Web Audio API provides reduction as a negative value
    return this.compressor.reduction;
  }
  
  dispose() {
    this.input.disconnect();
    this.compressor.disconnect();
    this.makeupGainNode.disconnect();
    this.output.disconnect();
  }
}
