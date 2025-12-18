/**
 * WASM DSP PROCESSOR
 * 
 * AudioWorklet processor that runs WebAssembly DSP code.
 * Receives compiled WebAssembly.Module via processorOptions.
 * 
 * Phase 39: Load WASM in AudioWorklet
 * 
 * @author Prime (Mixx Club)
 */

class WASMDSPProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.wasmReady = false;
    this.wasmInstance = null;
    this.wasmMemory = null;
    
    // WASM DSP instances
    this.lowpassL = null;
    this.lowpassR = null;
    this.saturator = null;
    
    // Settings
    this.frequency = 150;
    this.q = 0.7;
    this.warmth = 0.5;
    this.bypassed = false;
    
    // Get WASM module from processorOptions
    const wasmModule = options.processorOptions?.wasmModule;
    const wasmImports = options.processorOptions?.wasmImports || {};
    
    if (wasmModule) {
      this._initWASM(wasmModule, wasmImports);
    } else {
      console.warn('[WASM DSP Processor] No WASM module provided, using bypass mode');
    }
    
    // Handle messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setFrequency':
          this.frequency = data;
          this._recreateFilters();
          break;
        case 'setQ':
          this.q = data;
          this._recreateFilters();
          break;
        case 'setWarmth':
          this.warmth = data;
          this._recreateSaturator();
          break;
        case 'setBypass':
          this.bypassed = data;
          break;
      }
    };
  }
  
  async _initWASM(wasmModule, imports) {
    try {
      // Instantiate the WASM module
      const instance = await WebAssembly.instantiate(wasmModule, imports);
      this.wasmInstance = instance;
      this.wasmMemory = instance.exports.memory;
      
      // Create DSP instances using wasm-bindgen exports
      this._createDSPInstances();
      
      this.wasmReady = true;
      this.port.postMessage({ type: 'wasmReady', success: true });
      
      console.log('[WASM DSP Processor] ✅ WASM initialized successfully');
    } catch (error) {
      console.error('[WASM DSP Processor] ❌ WASM init failed:', error);
      this.port.postMessage({ type: 'wasmReady', success: false, error: error.message });
    }
  }
  
  _createDSPInstances() {
    if (!this.wasmInstance) return;
    
    const exports = this.wasmInstance.exports;
    
    // Create lowpass filters for L/R channels
    // Using wasm-bindgen style exports: biquadfilter_new_lowpass(freq, q, sampleRate)
    if (exports.biquadfilter_new_lowpass) {
      this.lowpassL = exports.biquadfilter_new_lowpass(this.frequency, this.q, sampleRate);
      this.lowpassR = exports.biquadfilter_new_lowpass(this.frequency, this.q, sampleRate);
    }
    
    // Create saturator
    if (exports.saturator_new) {
      this.saturator = exports.saturator_new(this.warmth);
    }
  }
  
  _recreateFilters() {
    if (!this.wasmInstance) return;
    
    const exports = this.wasmInstance.exports;
    
    // Free old filters
    if (this.lowpassL && exports.__wbg_biquadfilter_free) {
      exports.__wbg_biquadfilter_free(this.lowpassL);
      exports.__wbg_biquadfilter_free(this.lowpassR);
    }
    
    // Create new filters
    if (exports.biquadfilter_new_lowpass) {
      this.lowpassL = exports.biquadfilter_new_lowpass(this.frequency, this.q, sampleRate);
      this.lowpassR = exports.biquadfilter_new_lowpass(this.frequency, this.q, sampleRate);
    }
  }
  
  _recreateSaturator() {
    if (!this.wasmInstance) return;
    
    const exports = this.wasmInstance.exports;
    
    // Free old saturator
    if (this.saturator && exports.__wbg_saturator_free) {
      exports.__wbg_saturator_free(this.saturator);
    }
    
    // Create new saturator
    if (exports.saturator_new) {
      this.saturator = exports.saturator_new(this.warmth);
    }
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0]) {
      return true;
    }
    
    // Bypass mode or WASM not ready
    if (this.bypassed || !this.wasmReady) {
      for (let channel = 0; channel < output.length; channel++) {
        if (input[channel]) {
          output[channel].set(input[channel]);
        }
      }
      return true;
    }
    
    const exports = this.wasmInstance.exports;
    
    // Process each channel
    for (let channel = 0; channel < output.length; channel++) {
      const inputData = input[channel];
      const outputData = output[channel];
      
      if (!inputData) continue;
      
      // Copy input to output first
      outputData.set(inputData);
      
      // Apply WASM processing sample-by-sample
      const filter = channel === 0 ? this.lowpassL : this.lowpassR;
      
      if (filter && exports.biquadfilter_process) {
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] = exports.biquadfilter_process(filter, outputData[i]);
        }
      }
      
      // Apply saturation
      if (this.saturator && exports.saturator_process) {
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] = exports.saturator_process(this.saturator, outputData[i]);
        }
      }
    }
    
    return true;
  }
}

registerProcessor('wasm-dsp-processor', WASMDSPProcessor);
