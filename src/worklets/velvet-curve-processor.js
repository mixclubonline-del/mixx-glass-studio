/**
 * VELVET CURVE PROCESSOR - AudioWorklet
 * 
 * Optimized AudioWorklet processor for Velvet Curve stage.
 * Provides multiband compression with focus on low-end control.
 * 
 * Phase 34: Verified stereo processing with isolated L/R states.
 * 
 * @author Prime (Mixx Club)
 * @version 2.0.0 - Phase 34 Stereo Migration
 */

class VelvetCurveProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'crossoverFreq',
        defaultValue: 200,
        minValue: 100,
        maxValue: 400,
        automationRate: 'k-rate',
      },
      {
        name: 'lowThreshold',
        defaultValue: -24,
        minValue: -60,
        maxValue: 0,
        automationRate: 'k-rate',
      },
      {
        name: 'lowRatio',
        defaultValue: 3,
        minValue: 1,
        maxValue: 20,
        automationRate: 'k-rate',
      },
      {
        name: 'attack',
        defaultValue: 0.01, // 10ms
        minValue: 0.001,
        maxValue: 0.1,
        automationRate: 'k-rate',
      },
      {
        name: 'release',
        defaultValue: 0.25, // 250ms
        minValue: 0.05,
        maxValue: 1.0,
        automationRate: 'k-rate',
      },
    ];
  }

  constructor() {
    super();
    
    this.sampleRate = sampleRate;
    
    // Lowpass filter states
    this.lowpassStateL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.lowpassStateR = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    // Highpass filter states
    this.highpassStateL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.highpassStateR = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    // Compressor envelope followers
    this.envelopeL = 0;
    this.envelopeR = 0;
  }

  /**
   * Apply 2-pole Butterworth lowpass
   */
  applyLowpassSample(sample, frequency, state) {
    const omega = 2 * Math.PI * frequency / this.sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * 0.707);
    
    const b0 = (1 - cosOmega) / 2;
    const b1 = 1 - cosOmega;
    const b2 = (1 - cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;
    
    const x = sample;
    const y = (b0 / a0) * x + (b1 / a0) * state.x1 + 
              (b2 / a0) * state.x2 - 
              (a1 / a0) * state.y1 - 
              (a2 / a0) * state.y2;
    
    state.x2 = state.x1;
    state.x1 = x;
    state.y2 = state.y1;
    state.y1 = y;
    
    return y;
  }

  /**
   * Apply 2-pole Butterworth highpass
   */
  applyHighpassSample(sample, frequency, state) {
    const omega = 2 * Math.PI * frequency / this.sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * 0.707);
    
    const b0 = (1 + cosOmega) / 2;
    const b1 = -(1 + cosOmega);
    const b2 = (1 + cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;
    
    const x = sample;
    const y = (b0 / a0) * x + (b1 / a0) * state.x1 + 
              (b2 / a0) * state.x2 - 
              (a1 / a0) * state.y1 - 
              (a2 / a0) * state.y2;
    
    state.x2 = state.x1;
    state.x1 = x;
    state.y2 = state.y1;
    state.y1 = y;
    
    return y;
  }

  /**
   * Simple soft-knee compressor
   */
  compressSample(sample, envelope, threshold, ratio, attack, release) {
    const inputAbs = Math.abs(sample);
    
    // Envelope follower
    const attackCoef = Math.exp(-1 / (attack * this.sampleRate));
    const releaseCoef = Math.exp(-1 / (release * this.sampleRate));
    
    if (inputAbs > envelope) {
      envelope = attackCoef * envelope + (1 - attackCoef) * inputAbs;
    } else {
      envelope = releaseCoef * envelope + (1 - releaseCoef) * inputAbs;
    }
    
    // Convert to dB
    const envDb = 20 * Math.log10(envelope + 1e-10);
    
    // Compute gain reduction
    let gainReduction = 0;
    if (envDb > threshold) {
      const overDb = envDb - threshold;
      gainReduction = overDb - overDb / ratio;
    }
    
    // Convert back to linear gain
    const gainLin = Math.pow(10, -gainReduction / 20);
    
    return { output: sample * gainLin, envelope };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input.length || !output || !output.length) {
      return true;
    }
    
    // Handle mono or stereo
    const numChannels = Math.min(input.length, output.length);
    const inputL = input[0];
    const inputR = input[1] || input[0];
    const outputL = output[0];
    const outputR = output[1] || output[0];
    
    if (!inputL || !outputL) {
      return true;
    }
    
    const crossoverFreq = parameters.crossoverFreq[0] || 200;
    const lowThreshold = parameters.lowThreshold[0] || -24;
    const lowRatio = parameters.lowRatio[0] || 3;
    const attack = parameters.attack[0] || 0.01;
    const release = parameters.release[0] || 0.25;
    
    for (let i = 0; i < inputL.length; i++) {
      // Split into low and high bands
      const lowL = this.applyLowpassSample(inputL[i], crossoverFreq, this.lowpassStateL);
      const highL = this.applyHighpassSample(inputL[i], crossoverFreq, this.highpassStateL);
      
      // Compress low band
      const compL = this.compressSample(lowL, this.envelopeL, lowThreshold, lowRatio, attack, release);
      this.envelopeL = compL.envelope;
      
      // Sum bands
      outputL[i] = compL.output + highL;
      
      // Process right channel if stereo
      if (numChannels > 1 && inputR && outputR) {
        const lowR = this.applyLowpassSample(inputR[i], crossoverFreq, this.lowpassStateR);
        const highR = this.applyHighpassSample(inputR[i], crossoverFreq, this.highpassStateR);
        
        const compR = this.compressSample(lowR, this.envelopeR, lowThreshold, lowRatio, attack, release);
        this.envelopeR = compR.envelope;
        
        outputR[i] = compR.output + highR;
      }
    }
    
    return true;
  }
}

registerProcessor('velvet-curve-processor', VelvetCurveProcessor);
