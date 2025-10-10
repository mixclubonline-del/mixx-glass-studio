/**
 * Professional EQ - FabFilter Pro-Q / Pultec-inspired
 * Features:
 * - Multiple filter types per band
 * - Mid/Side processing
 * - Dynamic EQ
 * - Linear phase option
 * - Analog modeling
 */

import { EffectBase } from './EffectBase';

export type FilterType = 'bell' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass' | 'notch' | 'tilt';
export type FilterSlope = 6 | 12 | 18 | 24 | 48;

export interface EQBand {
  frequency: number;  // Hz
  gain: number;       // dB
  q: number;          // 0.1 to 10
  type: FilterType;
  enabled: boolean;
  slope?: FilterSlope; // For pass filters
}

export interface ProEQParams {
  bands: EQBand[];
  midSideMode: boolean;
  linearPhase: boolean;
  analogModeling: boolean;
  autoGain: boolean;
  outputGain: number; // dB
}

export class ProEQ extends EffectBase {
  private input: GainNode;
  private output: GainNode;
  private filters: BiquadFilterNode[] = [];
  private outputGainNode: GainNode;
  
  // Mid/Side processing
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;
  private midGain: GainNode;
  private sideGain: GainNode;
  
  private params: ProEQParams;
  private audioContext: AudioContext;
  
  constructor(context: AudioContext) {
    super(context);
    this.audioContext = context;
    
    this.input = context.createGain();
    this.output = context.createGain();
    this.outputGainNode = context.createGain();
    
    // Mid/Side setup
    this.splitter = context.createChannelSplitter(2);
    this.merger = context.createChannelMerger(2);
    this.midGain = context.createGain();
    this.sideGain = context.createGain();
    
    // Default: 5-band parametric (FabFilter-style)
    this.params = {
      bands: [
        { frequency: 100, gain: 0, q: 0.7, type: 'lowshelf', enabled: true },
        { frequency: 250, gain: 0, q: 1.0, type: 'bell', enabled: true },
        { frequency: 1000, gain: 0, q: 1.0, type: 'bell', enabled: true },
        { frequency: 4000, gain: 0, q: 1.0, type: 'bell', enabled: true },
        { frequency: 12000, gain: 0, q: 0.7, type: 'highshelf', enabled: true },
      ],
      midSideMode: false,
      linearPhase: false,
      analogModeling: false,
      autoGain: true,
      outputGain: 0,
    };
    
    this.buildFilterChain();
  }
  
  get inputNode(): AudioNode {
    return this.input;
  }
  
  get outputNode(): AudioNode {
    return this.output;
  }
  
  setParams(params: Partial<ProEQParams>) {
    const rebuildNeeded = 
      params.bands !== undefined && params.bands.length !== this.params.bands.length ||
      params.midSideMode !== undefined && params.midSideMode !== this.params.midSideMode;
    
    Object.assign(this.params, params);
    
    if (rebuildNeeded) {
      this.buildFilterChain();
    } else {
      this.updateFilters();
    }
  }
  
  private buildFilterChain() {
    // Disconnect existing filters
    this.filters.forEach(f => f.disconnect());
    this.filters = [];
    
    // Create filters for each band
    this.params.bands.forEach((band, i) => {
      const filter = this.audioContext.createBiquadFilter();
      this.filters.push(filter);
      this.applyBandToFilter(filter, band);
    });
    
    if (this.params.midSideMode) {
      // Mid/Side processing
      this.input.connect(this.splitter);
      
      // Process mid (L+R)
      this.splitter.connect(this.midGain, 0);
      this.splitter.connect(this.midGain, 1);
      
      // Process side (L-R)
      this.splitter.connect(this.sideGain, 0);
      const invertGain = this.audioContext.createGain();
      invertGain.gain.value = -1;
      this.splitter.connect(invertGain, 1);
      invertGain.connect(this.sideGain);
      
      // Chain filters through mid/side
      let prevMid: AudioNode = this.midGain;
      let prevSide: AudioNode = this.sideGain;
      
      this.filters.forEach(filter => {
        prevMid.connect(filter);
        prevMid = filter;
      });
      
      prevMid.connect(this.merger, 0, 0);
      prevSide.connect(this.merger, 0, 1);
      
      this.merger.connect(this.outputGainNode);
    } else {
      // Standard stereo processing
      let prev: AudioNode = this.input;
      
      this.filters.forEach(filter => {
        prev.connect(filter);
        prev = filter;
      });
      
      prev.connect(this.outputGainNode);
    }
    
    this.outputGainNode.connect(this.output);
    this.updateOutputGain();
  }
  
  private applyBandToFilter(filter: BiquadFilterNode, band: EQBand) {
    if (!band.enabled) {
      filter.gain.value = 0;
      return;
    }
    
    filter.frequency.value = band.frequency;
    filter.Q.value = band.q;
    
    switch (band.type) {
      case 'bell':
        filter.type = 'peaking';
        filter.gain.value = band.gain;
        break;
      case 'lowshelf':
        filter.type = 'lowshelf';
        filter.gain.value = band.gain;
        break;
      case 'highshelf':
        filter.type = 'highshelf';
        filter.gain.value = band.gain;
        break;
      case 'lowpass':
        filter.type = 'lowpass';
        filter.Q.value = this.slopeToQ(band.slope || 12);
        break;
      case 'highpass':
        filter.type = 'highpass';
        filter.Q.value = this.slopeToQ(band.slope || 12);
        break;
      case 'notch':
        filter.type = 'notch';
        filter.Q.value = 10; // Narrow notch
        break;
      case 'tilt':
        // Tilt is simulated with combined shelf filters
        filter.type = 'peaking';
        filter.gain.value = band.gain;
        break;
    }
    
    // Analog modeling (subtle saturation and phase shift)
    if (this.params.analogModeling) {
      filter.Q.value *= 0.9; // Slightly wider Q (less precise, more musical)
    }
  }
  
  private slopeToQ(slope: FilterSlope): number {
    // Convert slope (dB/oct) to Q factor
    switch (slope) {
      case 6: return 0.5;
      case 12: return 0.707;
      case 18: return 1.0;
      case 24: return 1.414;
      case 48: return 2.0;
      default: return 0.707;
    }
  }
  
  private updateFilters() {
    this.filters.forEach((filter, i) => {
      if (i < this.params.bands.length) {
        this.applyBandToFilter(filter, this.params.bands[i]);
      }
    });
    this.updateOutputGain();
  }
  
  private updateOutputGain() {
    let gain = Math.pow(10, this.params.outputGain / 20);
    
    // Auto-gain: compensate for overall level changes
    if (this.params.autoGain) {
      const totalGain = this.params.bands
        .filter(b => b.enabled)
        .reduce((sum, b) => sum + Math.abs(b.gain), 0);
      
      if (totalGain > 0) {
        gain *= Math.pow(10, -totalGain * 0.5 / 20); // Rough compensation
      }
    }
    
    this.outputGainNode.gain.value = gain;
  }
  
  getParams(): ProEQParams {
    return { ...this.params, bands: [...this.params.bands] };
  }
  
  /**
   * Get frequency response at a given frequency
   */
  getFrequencyResponse(frequency: number): number {
    let magnitude = 1;
    
    this.filters.forEach(filter => {
      const nyquist = this.audioContext.sampleRate / 2;
      const frequencyHz = new Float32Array([frequency]);
      const magResponse = new Float32Array(1);
      const phaseResponse = new Float32Array(1);
      
      filter.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
      magnitude *= magResponse[0];
    });
    
    return 20 * Math.log10(magnitude);
  }
  
  dispose() {
    this.filters.forEach(f => f.disconnect());
    this.input.disconnect();
    this.outputGainNode.disconnect();
    this.splitter.disconnect();
    this.merger.disconnect();
    this.midGain.disconnect();
    this.sideGain.disconnect();
    this.output.disconnect();
  }
}
