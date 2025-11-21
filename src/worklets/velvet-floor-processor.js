/**
 * VELVET FLOOR PROCESSOR - AudioWorklet
 * 
 * Optimized AudioWorklet processor for Velvet Floor stage.
 * Provides native-speed sub-harmonic foundation processing.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 3 WASM DSP
 */

class VelvetFloorProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'warmth',
        defaultValue: 0.5,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate',
      },
      {
        name: 'depth',
        defaultValue: 0.5,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate',
      },
      {
        name: 'frequency',
        defaultValue: 150,
        minValue: 50,
        maxValue: 300,
        automationRate: 'k-rate',
      },
      {
        name: 'q',
        defaultValue: 0.7,
        minValue: 0.1,
        maxValue: 2.0,
        automationRate: 'k-rate',
      },
    ];
  }

  constructor() {
    super();
    
    this.sampleRate = sampleRate;
    
    // Lowpass filter state (simple IIR)
    this.lowpassState = {
      x1: 0, x2: 0, y1: 0, y2: 0,
    };
    
    // Saturation curve cache
    this.saturationCurve = null;
    this.lastWarmth = -1;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'update') {
        // Handle parameter updates
      }
    };
  }

  /**
   * Create saturation curve for warmth
   */
  createSaturationCurve(warmth) {
    if (this.saturationCurve && this.lastWarmth === warmth) {
      return this.saturationCurve;
    }
    
    const samples = 1024;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    const amount = warmth;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const y = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      curve[i] = y;
    }
    
    this.saturationCurve = curve;
    this.lastWarmth = warmth;
    return curve;
  }

  /**
   * Apply lowpass filter (simplified biquad)
   */
  applyLowpass(input, frequency, q, sampleRate) {
    const omega = 2 * Math.PI * frequency / sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * q);
    
    const b0 = (1 - cosOmega) / 2;
    const b1 = 1 - cosOmega;
    const b2 = (1 - cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;
    
    const output = new Float32Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      const y = (b0 / a0) * x + (b1 / a0) * this.lowpassState.x1 + 
                (b2 / a0) * this.lowpassState.x2 - 
                (a1 / a0) * this.lowpassState.y1 - 
                (a2 / a0) * this.lowpassState.y2;
      
      this.lowpassState.x2 = this.lowpassState.x1;
      this.lowpassState.x1 = x;
      this.lowpassState.y2 = this.lowpassState.y1;
      this.lowpassState.y1 = y;
      
      output[i] = y;
    }
    
    return output;
  }

  /**
   * Apply saturation (waveshaper)
   */
  applySaturation(input, warmth) {
    const curve = this.createSaturationCurve(warmth);
    const output = new Float32Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      const index = Math.floor((x + 1) * (curve.length / 2));
      const clampedIndex = Math.max(0, Math.min(curve.length - 1, index));
      output[i] = curve[clampedIndex];
    }
    
    return output;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input.length || !output || !output.length) {
      return true;
    }
    
    const inputChannel = input[0];
    const outputChannel = output[0];
    
    if (!inputChannel || !outputChannel) {
      return true;
    }
    
    const warmth = parameters.warmth[0] || 0.5;
    const depth = parameters.depth[0] || 0.5;
    const frequency = parameters.frequency[0] || 150;
    const q = parameters.q[0] || 0.7;
    
    // Process: Lowpass → Saturation → Makeup Gain
    const lowpassed = this.applyLowpass(inputChannel, frequency, q, this.sampleRate);
    const saturated = this.applySaturation(lowpassed, warmth);
    
    // Apply makeup gain (depth)
    const makeupGain = 1 + depth;
    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = saturated[i] * makeupGain;
    }
    
    return true;
  }
}

registerProcessor('velvet-floor-processor', VelvetFloorProcessor);

