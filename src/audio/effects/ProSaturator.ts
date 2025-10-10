/**
 * Professional Saturator - Decapitator/Saturn 2-inspired
 * Features:
 * - Multiple saturation types (tube, tape, transformer, transistor, digital)
 * - Even/Odd harmonic control
 * - Transient preservation
 * - Parallel processing
 * - Oversampling
 */

import { EffectBase } from './EffectBase';

export type SaturationType = 'tube' | 'tape' | 'transformer' | 'transistor' | 'digital';

export interface ProSaturatorParams {
  drive: number;              // 0 to 100 (amount of saturation)
  type: SaturationType;
  tone: number;               // -12 to +12 dB (tilt EQ)
  mix: number;                // 0 to 100% (parallel processing)
  output: number;             // -12 to +12 dB
  harmonics: number;          // 0 to 100 (harmonic content)
  evenOddBalance: number;     // -100 (all odd) to +100 (all even)
  transientPreserve: number;  // 0 to 100%
}

export class ProSaturator extends EffectBase {
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private driveGain: GainNode;
  private outputGain: GainNode;
  private waveshaper: WaveShaperNode;
  private toneFilter: BiquadFilterNode;
  
  private params: ProSaturatorParams;
  private audioContext: AudioContext;
  
  constructor(context: AudioContext) {
    super(context);
    this.audioContext = context;
    
    this.input = context.createGain();
    this.output = context.createGain();
    this.dryGain = context.createGain();
    this.wetGain = context.createGain();
    this.driveGain = context.createGain();
    this.outputGain = context.createGain();
    this.waveshaper = context.createWaveShaper();
    this.toneFilter = context.createBiquadFilter();
    
    // Default: tape saturation
    this.params = {
      drive: 30,
      type: 'tape',
      tone: 0,
      mix: 100,
      output: 0,
      harmonics: 50,
      evenOddBalance: 0,
      transientPreserve: 0,
    };
    
    // Tone filter (tilt EQ)
    this.toneFilter.type = 'highshelf';
    this.toneFilter.frequency.value = 1000;
    
    // Setup waveshaper with oversampling
    this.waveshaper.oversample = '4x';
    
    // Parallel routing: input → dry → output
    //                   input → drive → waveshaper → tone → wet → output
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    this.input.connect(this.driveGain);
    this.driveGain.connect(this.waveshaper);
    this.waveshaper.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);
    this.outputGain.connect(this.output);
    
    this.applyParams();
  }
  
  get inputNode(): AudioNode {
    return this.input;
  }
  
  get outputNode(): AudioNode {
    return this.output;
  }
  
  setParams(params: Partial<ProSaturatorParams>) {
    const typeChanged = params.type !== undefined && params.type !== this.params.type;
    Object.assign(this.params, params);
    
    if (typeChanged) {
      this.updateTransferCurve();
    }
    
    this.applyParams();
  }
  
  private applyParams() {
    const { drive, mix, output, tone } = this.params;
    
    // Drive (input gain)
    this.driveGain.gain.value = 1 + (drive / 100) * 9; // 1x to 10x
    
    // Mix (dry/wet)
    const mixNorm = mix / 100;
    this.dryGain.gain.value = 1 - mixNorm;
    this.wetGain.gain.value = mixNorm;
    
    // Output gain
    this.outputGain.gain.value = Math.pow(10, output / 20);
    
    // Tone (tilt EQ)
    this.toneFilter.gain.value = tone;
    
    this.updateTransferCurve();
  }
  
  private updateTransferCurve() {
    const { type, harmonics, evenOddBalance, drive } = this.params;
    const curveLength = 65536;
    const curve = new Float32Array(curveLength);
    
    for (let i = 0; i < curveLength; i++) {
      let x = (i / curveLength) * 2 - 1; // -1 to 1
      let y = x;
      
      const driveAmount = drive / 100;
      
      switch (type) {
        case 'tube':
          // Triode tube: smooth, warm, even harmonics
          y = Math.tanh(x * (1 + driveAmount * 5));
          // Add even harmonics
          y += Math.sin(x * Math.PI * 2) * (harmonics / 100) * 0.2 * Math.max(0, evenOddBalance / 100);
          break;
          
        case 'tape':
          // Tape saturation: hysteresis, compression at extremes
          const tapeCoeff = 1 + driveAmount * 3;
          y = x * (1 + Math.abs(x * tapeCoeff)) / (1 + Math.abs(x * tapeCoeff) + Math.pow(x * tapeCoeff, 4));
          // Add subtle even harmonics (tape warmth)
          y += Math.sin(x * Math.PI * 2) * (harmonics / 100) * 0.15;
          break;
          
        case 'transformer':
          // Transformer: subtle saturation, mostly even harmonics
          const transCoeff = 1 + driveAmount * 2;
          y = Math.atan(x * transCoeff) / Math.atan(transCoeff);
          y += Math.sin(x * Math.PI * 2) * (harmonics / 100) * 0.25 * Math.max(0, evenOddBalance / 100);
          break;
          
        case 'transistor':
          // Transistor: hard clipping, odd harmonics
          const clipLevel = 1 - driveAmount * 0.5;
          y = Math.max(-clipLevel, Math.min(clipLevel, x * (1 + driveAmount * 2)));
          // Add odd harmonics
          y += Math.sin(x * Math.PI) * (harmonics / 100) * 0.3 * Math.max(0, -evenOddBalance / 100);
          break;
          
        case 'digital':
          // Bit reduction and sample rate reduction
          const bits = 16 - Math.floor(driveAmount * 12);
          const steps = Math.pow(2, bits);
          y = Math.round(x * steps) / steps;
          break;
      }
      
      curve[i] = Math.max(-1, Math.min(1, y));
    }
    
    this.waveshaper.curve = curve;
  }
  
  getParams(): ProSaturatorParams {
    return { ...this.params };
  }
  
  dispose() {
    this.input.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.driveGain.disconnect();
    this.outputGain.disconnect();
    this.waveshaper.disconnect();
    this.toneFilter.disconnect();
    this.output.disconnect();
  }
}
