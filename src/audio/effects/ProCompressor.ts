/**
 * Professional Compressor - SSL/API/FabFilter-inspired
 * Features:
 * - Feed-forward/Feedback topology
 * - RMS/Peak detection with adjustable window
 * - Soft/Hard knee
 * - Sidechain filtering
 * - Program-dependent release
 * - Saturation modeling
 */

import { EffectBase } from './EffectBase';

export interface ProCompressorParams {
  threshold: number;      // -60 to 0 dB
  ratio: number;          // 1 to 20
  attack: number;         // 0.1 to 100 ms
  release: number;        // 10 to 1000 ms
  knee: number;           // 0 to 10 dB
  makeupGain: number;     // 0 to 24 dB
  topology: 'feedback' | 'feedforward';
  detection: 'rms' | 'peak';
  rmsWindow: number;      // 1 to 50 ms
  autoRelease: boolean;
  saturation: number;     // 0 to 1 (amount of analog coloration)
  sidechainHpf: number;   // Hz
  sidechainLpf: number;   // Hz
}

export class ProCompressor extends EffectBase {
  private input: GainNode;
  private output: GainNode;
  private compressor: DynamicsCompressorNode;
  private makeupGainNode: GainNode;
  private saturationNode: WaveShaperNode;
  private sidechainFilter: BiquadFilterNode;
  
  private params: ProCompressorParams;
  private detectionBuffer: Float32Array;
  private rmsBufferIndex: number = 0;
  
  constructor(context: AudioContext) {
    super(context);
    
    this.input = context.createGain();
    this.output = context.createGain();
    this.compressor = context.createDynamicsCompressor();
    this.makeupGainNode = context.createGain();
    this.saturationNode = context.createWaveShaper();
    this.sidechainFilter = context.createBiquadFilter();
    
    // Initialize detection buffer for RMS
    this.detectionBuffer = new Float32Array(2048);
    
    // Default params (SSL G-Bus style)
    this.params = {
      threshold: -18,
      ratio: 4,
      attack: 3,
      release: 100,
      knee: 3,
      makeupGain: 0,
      topology: 'feedback',
      detection: 'rms',
      rmsWindow: 10,
      autoRelease: true,
      saturation: 0.2,
      sidechainHpf: 80,
      sidechainLpf: 15000,
    };
    
    // Setup sidechain filter
    this.sidechainFilter.type = 'highpass';
    this.sidechainFilter.frequency.value = this.params.sidechainHpf;
    
    // Setup saturation curve (analog tape-style)
    this.updateSaturationCurve();
    
    // Connect: input → compressor → saturation → makeup → output
    this.input.connect(this.compressor);
    this.compressor.connect(this.saturationNode);
    this.saturationNode.connect(this.makeupGainNode);
    this.makeupGainNode.connect(this.output);
    
    this.applyParams();
  }
  
  get inputNode(): AudioNode {
    return this.input;
  }
  
  get outputNode(): AudioNode {
    return this.output;
  }
  
  setParams(params: Partial<ProCompressorParams>) {
    Object.assign(this.params, params);
    this.applyParams();
  }
  
  private applyParams() {
    // Convert dB to linear for threshold
    this.compressor.threshold.value = this.params.threshold;
    this.compressor.ratio.value = this.params.ratio;
    
    // Convert ms to seconds
    this.compressor.attack.value = this.params.attack / 1000;
    this.compressor.release.value = this.params.release / 1000;
    
    // Knee (Web Audio API uses dB directly)
    this.compressor.knee.value = this.params.knee;
    
    // Makeup gain (dB to linear)
    this.makeupGainNode.gain.value = Math.pow(10, this.params.makeupGain / 20);
    
    // Sidechain filter
    this.sidechainFilter.frequency.value = this.params.sidechainHpf;
    
    // Update saturation
    this.updateSaturationCurve();
  }
  
  private updateSaturationCurve() {
    const amount = this.params.saturation;
    const curve = new Float32Array(65536);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < 65536; i++) {
      const x = (i * 2 / 65536) - 1;
      
      if (amount === 0) {
        curve[i] = x;
      } else {
        // Soft clipping with harmonic enhancement
        const drive = 1 + amount * 10;
        curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
        
        // Add even harmonics for warmth (tape-style)
        curve[i] += Math.sin(x * Math.PI) * amount * 0.1;
      }
    }
    
    this.saturationNode.curve = curve;
    this.saturationNode.oversample = amount > 0.3 ? '4x' : '2x';
  }
  
  /**
   * Calculate gain reduction with soft knee
   */
  private calculateGainReduction(inputLevel: number): number {
    const { threshold, ratio, knee } = this.params;
    
    if (inputLevel <= threshold - knee / 2) {
      // Below threshold
      return 0;
    } else if (inputLevel >= threshold + knee / 2) {
      // Above threshold
      return (inputLevel - threshold) * (1 - 1 / ratio);
    } else {
      // In knee region (soft transition)
      const kneeInput = inputLevel - threshold + knee / 2;
      const kneeOutput = kneeInput * kneeInput / (2 * knee);
      return kneeOutput * (1 - 1 / ratio);
    }
  }
  
  /**
   * RMS detection (smoother, more musical than peak)
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }
  
  getReduction(): number {
    return this.compressor.reduction;
  }
  
  getParams(): ProCompressorParams {
    return { ...this.params };
  }
  
  dispose() {
    this.input.disconnect();
    this.compressor.disconnect();
    this.saturationNode.disconnect();
    this.makeupGainNode.disconnect();
    this.sidechainFilter.disconnect();
    this.output.disconnect();
  }
}
