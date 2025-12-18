/**
 * PHASE WEAVE PROCESSOR - AudioWorklet
 * 
 * Optimized AudioWorklet processor for Phase Weave stage.
 * Provides stereo width control via Mid/Side processing.
 * 
 * Phase 34: Verified stereo M/S processing is correct.
 * 
 * @author Prime (Mixx Club)
 * @version 2.0.0 - Phase 34 Stereo Migration
 */

class PhaseWeaveProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'width',
        defaultValue: 100, // 0-200, 100 = normal
        minValue: 0,
        maxValue: 200,
        automationRate: 'k-rate',
      },
      {
        name: 'monoBelow',
        defaultValue: 0, // Hz - mono frequencies below this
        minValue: 0,
        maxValue: 300,
        automationRate: 'k-rate',
      },
    ];
  }

  constructor() {
    super();
    
    this.sampleRate = sampleRate;
    
    // Lowpass state for mono bass
    this.lowpassStateL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.lowpassStateR = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.highpassStateL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.highpassStateR = { x1: 0, x2: 0, y1: 0, y2: 0 };
  }

  /**
   * Apply simple 2-pole lowpass filter
   */
  applyLowpass(sample, frequency, state) {
    if (frequency <= 0) return 0;
    
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
   * Apply simple 2-pole highpass filter
   */
  applyHighpass(sample, frequency, state) {
    if (frequency <= 0) return sample;
    
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

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length < 2 || !output || output.length < 2) {
      // Pass through mono or silence
      if (input && input[0] && output && output[0]) {
        output[0].set(input[0]);
      }
      return true;
    }
    
    const inputL = input[0];
    const inputR = input[1];
    const outputL = output[0];
    const outputR = output[1];
    
    if (!inputL || !inputR || !outputL || !outputR) {
      return true;
    }
    
    const width = (parameters.width[0] || 100) / 100; // 0-2, 1 = normal
    const monoBelow = parameters.monoBelow[0] || 0;
    
    for (let i = 0; i < inputL.length; i++) {
      let left = inputL[i];
      let right = inputR[i];
      
      // Optional: mono bass below frequency
      if (monoBelow > 0) {
        const lowL = this.applyLowpass(left, monoBelow, this.lowpassStateL);
        const lowR = this.applyLowpass(right, monoBelow, this.lowpassStateR);
        const highL = this.applyHighpass(left, monoBelow, this.highpassStateL);
        const highR = this.applyHighpass(right, monoBelow, this.highpassStateR);
        
        // Mono the lows
        const monoLow = (lowL + lowR) * 0.5;
        
        // Apply width to highs only
        const midHigh = (highL + highR) * 0.5;
        const sideHigh = (highL - highR) * 0.5;
        
        const wideMidHigh = midHigh;
        const wideSideHigh = sideHigh * width;
        
        outputL[i] = monoLow + wideMidHigh + wideSideHigh;
        outputR[i] = monoLow + wideMidHigh - wideSideHigh;
      } else {
        // Standard M/S width processing
        const mid = (left + right) * 0.5;
        const side = (left - right) * 0.5;
        
        // Apply width to side channel
        const wideSide = side * width;
        
        // Decode back to L/R
        outputL[i] = mid + wideSide;
        outputR[i] = mid - wideSide;
      }
    }
    
    return true;
  }
}

registerProcessor('phase-weave-processor', PhaseWeaveProcessor);
