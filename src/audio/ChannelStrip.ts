/**
 * Channel Strip
 * Complete per-track processing chain: EQ → Compressor → Pan → Sends → Fader
 */

import { EQ3Band } from './effects/EQ3Band';
import { SimpleCompressor } from './effects/SimpleCompressor';
import { EQParams, CompressorParams, SendConfig, PeakLevel } from '@/types/audio';
import { TruePeakDetector } from './metering/TruePeakDetector';
import { LUFSCalculator } from './metering/LUFSCalculator';
import { PhaseCorrelationAnalyzer } from './metering/PhaseCorrelationAnalyzer';
import { DynamicRangeCalculator } from './metering/DynamicRangeCalculator';

export class ChannelStrip {
  private context: AudioContext;
  public input: GainNode;
  public output: GainNode;
  
  // Processing chain
  public eq: EQ3Band;
  public compressor: SimpleCompressor;
  private panNode: StereoPannerNode;
  public fader: GainNode;
  
  // Send nodes (pre/post fader)
  public sends: Map<string, { node: GainNode; preFader: boolean }>;
  
  // Metering
  private analyser: AnalyserNode;
  private analyserDataArray: Float32Array<ArrayBuffer>;
  
  // Professional metering
  private truePeakDetector: TruePeakDetector;
  private lufsCalculator: LUFSCalculator;
  private phaseAnalyzer: PhaseCorrelationAnalyzer;
  private drCalculator: DynamicRangeCalculator;
  
  // State
  private _muted: boolean = false;
  private _solo: boolean = false;
  private _volume: number = 1.0;
  private _pan: number = 0;
  
  constructor(context: AudioContext) {
    this.context = context;
    this.sends = new Map();
    
    // Create nodes
    this.input = context.createGain();
    this.output = context.createGain();
    this.eq = new EQ3Band(context);
    this.compressor = new SimpleCompressor(context);
    this.panNode = context.createStereoPanner();
    this.fader = context.createGain();
    
    // Metering
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyserDataArray = new Float32Array(this.analyser.frequencyBinCount);
    
    // Connect chain: input → EQ → comp → pan → fader → output
    this.input.connect(this.eq.inputNode);
    this.eq.outputNode.connect(this.compressor.inputNode);
    this.compressor.outputNode.connect(this.panNode);
    this.panNode.connect(this.fader);
    this.fader.connect(this.output);
    
    // Connect to analyser for metering (after fader)
    this.fader.connect(this.analyser);
    
    // Initialize professional metering
    this.truePeakDetector = new TruePeakDetector(context);
    this.lufsCalculator = new LUFSCalculator(context);
    this.phaseAnalyzer = new PhaseCorrelationAnalyzer();
    this.drCalculator = new DynamicRangeCalculator();
  }
  
  // EQ controls
  setEQ(params: Partial<EQParams>) {
    this.eq.setParams(params);
  }
  
  getEQ(): EQParams {
    return this.eq.getParams();
  }
  
  // Compressor controls
  setCompressor(params: Partial<CompressorParams>) {
    this.compressor.setParams(params);
  }
  
  getCompressor(): CompressorParams {
    return this.compressor.getParams();
  }
  
  // Pan control
  setPan(pan: number) {
    this._pan = Math.max(-1, Math.min(1, pan));
    this.panNode.pan.value = this._pan;
  }
  
  getPan(): number {
    return this._pan;
  }
  
  // Volume control
  setVolume(volume: number) {
    this._volume = Math.max(0, Math.min(2, volume));
    if (!this._muted) {
      this.fader.gain.value = this._volume;
    }
  }
  
  getVolume(): number {
    return this._volume;
  }
  
  // Mute control (with smooth ramping)
  setMute(muted: boolean) {
    this._muted = muted;
    const targetGain = muted ? 0 : this._volume;
    this.fader.gain.linearRampToValueAtTime(
      targetGain,
      this.context.currentTime + 0.01
    );
  }
  
  isMuted(): boolean {
    return this._muted;
  }
  
  // Solo control
  setSolo(solo: boolean) {
    this._solo = solo;
  }
  
  isSolo(): boolean {
    return this._solo;
  }
  
  // Send management
  createSend(busId: string, preFader: boolean = false): GainNode {
    const sendNode = this.context.createGain();
    sendNode.gain.value = 0; // Default send amount = 0
    
    // Connect based on pre/post fader
    if (preFader) {
      this.panNode.connect(sendNode);
    } else {
      this.fader.connect(sendNode);
    }
    
    this.sends.set(busId, { node: sendNode, preFader });
    return sendNode;
  }
  
  setSendAmount(busId: string, amount: number) {
    const send = this.sends.get(busId);
    if (send) {
      send.node.gain.value = Math.max(0, Math.min(1, amount));
    }
  }
  
  getSendAmount(busId: string): number {
    const send = this.sends.get(busId);
    return send ? send.node.gain.value : 0;
  }
  
  removeSend(busId: string) {
    const send = this.sends.get(busId);
    if (send) {
      send.node.disconnect();
      this.sends.delete(busId);
    }
  }
  
  // Peak metering (standard)
  getPeakLevel(): PeakLevel {
    this.analyser.getFloatTimeDomainData(this.analyserDataArray);
    
    let peak = 0;
    for (let i = 0; i < this.analyserDataArray.length; i++) {
      peak = Math.max(peak, Math.abs(this.analyserDataArray[i]));
    }
    
    // Convert to dB (-60 to +6 range)
    const db = peak > 0 ? 20 * Math.log10(peak) : -60;
    
    // Return same for both channels (mono meter for now)
    return { left: db, right: db };
  }
  
  // True Peak metering (ITU-R BS.1770-5)
  getTruePeak(): number {
    this.analyser.getFloatTimeDomainData(this.analyserDataArray);
    return this.truePeakDetector.detectTruePeak(this.analyserDataArray);
  }
  
  // LUFS calculations
  getLUFS(): { integrated: number; shortTerm: number; momentary: number; range: number } {
    this.analyser.getFloatTimeDomainData(this.analyserDataArray);
    
    return {
      integrated: this.lufsCalculator.calculateIntegrated(this.analyserDataArray),
      shortTerm: this.lufsCalculator.calculateShortTerm(this.analyserDataArray),
      momentary: this.lufsCalculator.calculateMomentary(this.analyserDataArray),
      range: this.lufsCalculator.calculateLRA(this.analyserDataArray)
    };
  }
  
  // Phase correlation
  getPhaseCorrelation(): number {
    this.analyser.getFloatTimeDomainData(this.analyserDataArray);
    // For now, use same data for L/R (mono)
    return this.phaseAnalyzer.calculateCorrelation(this.analyserDataArray, this.analyserDataArray);
  }
  
  // Dynamic range
  getDynamicRange(): { dr: number; crest: number } {
    this.analyser.getFloatTimeDomainData(this.analyserDataArray);
    
    return {
      dr: this.drCalculator.calculateDRScore(this.analyserDataArray),
      crest: this.drCalculator.calculateCrestFactor(this.analyserDataArray)
    };
  }
  
  dispose() {
    this.input.disconnect();
    this.eq.dispose();
    this.compressor.dispose();
    this.panNode.disconnect();
    this.fader.disconnect();
    this.analyser.disconnect();
    this.output.disconnect();
    
    this.sends.forEach(send => send.node.disconnect());
    this.sends.clear();
  }
}
