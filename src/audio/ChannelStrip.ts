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
import { EffectBase } from './effects/EffectBase';

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
  
  // Metering - True stereo with splitter
  private splitter: ChannelSplitterNode;
  private analyserLeft: AnalyserNode;
  private analyserRight: AnalyserNode;
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
  
  // Insert slots (8 slots for plugin chain)
  private insertSlots: (EffectBase | null)[] = Array(8).fill(null);
  
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
    
    // Metering - True stereo metering with channel splitter
    this.splitter = context.createChannelSplitter(2);
    this.analyserLeft = context.createAnalyser();
    this.analyserRight = context.createAnalyser();
    this.analyserLeft.fftSize = 256;
    this.analyserRight.fftSize = 256;
    this.analyserLeft.smoothingTimeConstant = 0.8;
    this.analyserRight.smoothingTimeConstant = 0.8;
    this.analyserDataArray = new Float32Array(this.analyserLeft.frequencyBinCount);
    
    // Build initial audio graph
    this.rebuildAudioGraph();
    
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
  
  // Insert slot management
  loadInsert(slotNumber: number, effect: EffectBase): void {
    if (slotNumber < 1 || slotNumber > 8) {
      console.error('Insert slot must be between 1 and 8');
      return;
    }
    
    // Dispose old effect if exists
    const oldEffect = this.insertSlots[slotNumber - 1];
    if (oldEffect) {
      oldEffect.dispose();
    }
    
    // Store new effect
    this.insertSlots[slotNumber - 1] = effect;
    
    // Rebuild audio graph with new insert
    this.rebuildAudioGraph();
  }
  
  unloadInsert(slotNumber: number): void {
    if (slotNumber < 1 || slotNumber > 8) {
      console.error('Insert slot must be between 1 and 8');
      return;
    }
    
    // Dispose effect
    const effect = this.insertSlots[slotNumber - 1];
    if (effect) {
      effect.dispose();
      this.insertSlots[slotNumber - 1] = null;
    }
    
    // Rebuild audio graph without this insert
    this.rebuildAudioGraph();
  }
  
  bypassInsert(slotNumber: number, bypass: boolean): void {
    if (slotNumber < 1 || slotNumber > 8) {
      console.error('Insert slot must be between 1 and 8');
      return;
    }
    
    const effect = this.insertSlots[slotNumber - 1];
    if (effect) {
      effect.bypass = bypass;
      this.rebuildAudioGraph();
    }
  }
  
  getInsert(slotNumber: number): EffectBase | null {
    if (slotNumber < 1 || slotNumber > 8) {
      return null;
    }
    return this.insertSlots[slotNumber - 1];
  }
  
  // Get insert chain order (returns array of slot numbers with active inserts)
  getInsertChainOrder(): number[] {
    return this.insertSlots
      .map((insert, index) => (insert ? index + 1 : null))
      .filter((slot): slot is number => slot !== null);
  }
  
  // Reorder inserts (drag-and-drop support)
  reorderInsert(fromSlot: number, toSlot: number): void {
    if (
      fromSlot < 1 || fromSlot > 8 ||
      toSlot < 1 || toSlot > 8 ||
      fromSlot === toSlot
    ) {
      return;
    }
    
    const fromEffect = this.insertSlots[fromSlot - 1];
    const toEffect = this.insertSlots[toSlot - 1];
    
    // Swap effects
    this.insertSlots[fromSlot - 1] = toEffect;
    this.insertSlots[toSlot - 1] = fromEffect;
    
    // Rebuild audio graph with new order
    this.rebuildAudioGraph();
  }
  
  // Copy insert (for chain management)
  copyInsert(slotNumber: number): EffectBase | null {
    if (slotNumber < 1 || slotNumber > 8) {
      return null;
    }
    return this.insertSlots[slotNumber - 1];
  }
  
  // Paste insert (for chain management)
  pasteInsert(slotNumber: number, effect: EffectBase | null): void {
    if (slotNumber < 1 || slotNumber > 8) {
      return;
    }
    
    // Dispose old effect if exists
    const oldEffect = this.insertSlots[slotNumber - 1];
    if (oldEffect) {
      oldEffect.dispose();
    }
    
    // Store new effect
    this.insertSlots[slotNumber - 1] = effect;
    
    // Rebuild audio graph
    this.rebuildAudioGraph();
  }
  
  /**
   * Rebuild the audio graph with current insert chain
   * Chain: input → EQ → comp → [inserts 1-8] → pan → fader → output
   * Uses hot-swap technique to prevent glitches during playback
   */
  private rebuildAudioGraph(): void {
    const isPlaying = this.context.state === 'running';
    
    if (isPlaying) {
      // Hot-swap with crossfade during playback
      const fadeNode = this.context.createGain();
      fadeNode.gain.value = 1;
      
      // Build temporary chain in parallel
      const tempOutput = this.context.createGain();
      let currentNode: AudioNode = this.input;
      
      // Connect to both old (fading out) and new (fading in) chains
      try {
        // Fade out old chain
        const now = this.context.currentTime;
        this.output.gain.linearRampToValueAtTime(0, now + 0.01);
        
        // Build new chain
        currentNode.connect(this.eq.inputNode);
        currentNode = this.eq.outputNode;
        
        currentNode.connect(this.compressor.inputNode);
        currentNode = this.compressor.outputNode;
        
        // Connect insert chain
        for (const insert of this.insertSlots) {
          if (insert && !insert.bypass) {
            currentNode.connect(insert.inputNode);
            currentNode = insert.outputNode;
          }
        }
        
        // Connect to pan and fader
        currentNode.connect(this.panNode);
        this.panNode.connect(this.fader);
        this.fader.connect(this.output);
        
        // Connect to stereo analysers
        currentNode.connect(this.splitter);
        this.splitter.connect(this.analyserLeft, 0);
        this.splitter.connect(this.analyserRight, 1);
        
        // Fade in new chain
        this.output.gain.linearRampToValueAtTime(1, now + 0.01);
      } catch (e) {
        console.error('Error during hot-swap audio graph rebuild:', e);
      }
    } else {
      // Instant rebuild when stopped - more efficient
      try {
        this.input.disconnect();
        this.eq.outputNode.disconnect();
        this.compressor.outputNode.disconnect();
        this.insertSlots.forEach(insert => {
          if (insert) {
            try { insert.outputNode.disconnect(); } catch (e) {}
          }
        });
        this.panNode.disconnect();
        this.fader.disconnect();
      } catch (e) {
        // Nodes may not be connected yet
      }
      
      // Build new chain
      let currentNode: AudioNode = this.input;
      
      // Connect EQ and compressor first
      currentNode.connect(this.eq.inputNode);
      currentNode = this.eq.outputNode;
      
      currentNode.connect(this.compressor.inputNode);
      currentNode = this.compressor.outputNode;
      
      // Connect insert chain
      for (const insert of this.insertSlots) {
        if (insert && !insert.bypass) {
          currentNode.connect(insert.inputNode);
          currentNode = insert.outputNode;
        }
      }
      
      // Connect to pan and fader
      currentNode.connect(this.panNode);
      this.panNode.connect(this.fader);
      this.fader.connect(this.output);
      
      // Connect to stereo analysers BEFORE panning for true stereo metering
      currentNode.connect(this.splitter);
      this.splitter.connect(this.analyserLeft, 0);
      this.splitter.connect(this.analyserRight, 1);
    }
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
  
  // Alias for setSendAmount
  updateSend(busId: string, amount: number) {
    this.setSendAmount(busId, amount);
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
  
  // Get stereo analysers for direct metering
  getAnalysers(): { left: AnalyserNode; right: AnalyserNode } {
    return { left: this.analyserLeft, right: this.analyserRight };
  }
  
  // True Peak metering (ITU-R BS.1770-5)
  getTruePeak(): number {
    this.analyserLeft.getFloatTimeDomainData(this.analyserDataArray);
    return this.truePeakDetector.detectTruePeak(this.analyserDataArray);
  }
  
  // LUFS calculations
  getLUFS(): { integrated: number; shortTerm: number; momentary: number; range: number } {
    this.analyserLeft.getFloatTimeDomainData(this.analyserDataArray);
    
    return {
      integrated: this.lufsCalculator.calculateIntegrated(this.analyserDataArray),
      shortTerm: this.lufsCalculator.calculateShortTerm(this.analyserDataArray),
      momentary: this.lufsCalculator.calculateMomentary(this.analyserDataArray),
      range: this.lufsCalculator.calculateLRA(this.analyserDataArray)
    };
  }
  
  // Phase correlation
  getPhaseCorrelation(): number {
    const leftData = new Float32Array(this.analyserLeft.frequencyBinCount);
    const rightData = new Float32Array(this.analyserRight.frequencyBinCount);
    this.analyserLeft.getFloatTimeDomainData(leftData);
    this.analyserRight.getFloatTimeDomainData(rightData);
    return this.phaseAnalyzer.calculateCorrelation(leftData, rightData);
  }
  
  // Dynamic range
  getDynamicRange(): { dr: number; crest: number } {
    this.analyserLeft.getFloatTimeDomainData(this.analyserDataArray);
    
    return {
      dr: this.drCalculator.calculateDRScore(this.analyserDataArray),
      crest: this.drCalculator.calculateCrestFactor(this.analyserDataArray)
    };
  }
  
  // Legacy compatibility - return left analyser
  getAnalyser(): AnalyserNode {
    return this.analyserLeft;
  }
  
  dispose() {
    // Dispose insert effects
    this.insertSlots.forEach(insert => {
      if (insert) {
        insert.dispose();
      }
    });
    
    this.input.disconnect();
    this.eq.dispose();
    this.compressor.dispose();
    this.panNode.disconnect();
    this.fader.disconnect();
    this.splitter.disconnect();
    this.analyserLeft.disconnect();
    this.analyserRight.disconnect();
    this.output.disconnect();
    
    this.sends.forEach(send => send.node.disconnect());
    this.sends.clear();
  }
}
