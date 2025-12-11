/**
 * HARMONIC LATTICE - Five Pillars Doctrine Compliance
 * 
 * Movement: Beat-locked harmonic breathing and modulation
 * Texture: Warmth, presence, and air with human tactility
 * Time: Musical timing alignment for harmonic evolution
 * Space: Dimensional depth in harmonic field
 * Form: Clean, reductionist harmonic processing
 * 
 * "If sub-harmonics are gravity, the upper harmonics are light.
 * They give shape and emotion to weight — they're how the ear recognizes soul."
 * 
 * The harmonic field treated like a lattice of resonant points across the spectrum,
 * where every overtone is a reflection of what's happening underneath.
 */

import { IAudioEngine } from '../types/audio-graph';
import { breathingPattern, warmthModulation } from '../core/beat-locked-lfo';
import { als } from '../utils/alsFeedback';

export interface HarmonicLatticeState {
  warmth: {
    harmonics: number[];
    coefficient: number;
    modulation: number;
    color: string;
  };
  presence: {
    harmonics: number[];
    coefficient: number;
    modulation: number;
    color: string;
  };
  air: {
    harmonics: number[];
    coefficient: number;
    modulation: number;
    color: string;
  };
  totalHarmonics: number;
  emotionalBias: number;
}

export class HarmonicLattice implements IAudioEngine {
  public input: AudioNode;
  public output: AudioNode;
  public makeup: GainNode;
  
  private getBeatPhase: (() => number) | null = null;
  private isInitialized: boolean = false;
  
  private state: HarmonicLatticeState;
  
  public audioContext: BaseAudioContext | null = null;
  private inputGain: GainNode | null = null; // Internal input gain
  private warmthFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  private outputGain: GainNode | null = null; // Internal output gain
  private intervalId: number | null = null;

  constructor(audioContext: BaseAudioContext | null = null) {
    this.audioContext = audioContext;

    this.input = audioContext ? audioContext.createGain() : null as any;
    this.output = audioContext ? audioContext.createGain() : null as any;
    this.makeup = audioContext ? audioContext.createGain() : null as any;
    
    this.state = {
      warmth: { harmonics: [0, 0, 0], coefficient: 1.0, modulation: 0.0, color: '#8b5cf6' },
      presence: { harmonics: [0, 0, 0], coefficient: 1.0, modulation: 0.0, color: '#f59e0b' },
      air: { harmonics: [0, 0, 0, 0, 0], coefficient: 1.0, modulation: 0.0, color: '#06b6d4' },
      totalHarmonics: 0,
      emotionalBias: 0.5 // Default emotional bias
    };
  }

  async initialize(ctx: BaseAudioContext): Promise<void> {
    if (this.isInitialized) return;
    this.audioContext = ctx;
    
    // Create public nodes if they are dummy nodes
    this.input = ctx.createGain();
    this.makeup = ctx.createGain();
    this.output = ctx.createGain(); // Final public output node

    // Create internal audio nodes
    this.initializeAudioNodes();
    
    // Connect internal processing chain
    if (this.inputGain && this.warmthFilter && this.presenceFilter && this.airFilter && this.outputGain) {
      this.inputGain.connect(this.warmthFilter);
      this.warmthFilter.connect(this.presenceFilter);
      this.presenceFilter.connect(this.airFilter);
      this.airFilter.connect(this.outputGain);

      // Connect the public input to the internal inputGain
      this.input.connect(this.inputGain);

      // Connect the internal outputGain to makeup gain, then to public output
      this.outputGain.connect(this.makeup);
      this.makeup.connect(this.output);
    }
    
    this.isInitialized = true;
    this.startStateProcessing(); // Start interval AFTER initialization is complete
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {
    this.getBeatPhase = getBeatPhase;
  }

  dispose(): void {
    if (this.inputGain) this.inputGain.disconnect();
    if (this.warmthFilter) this.warmthFilter.disconnect();
    if (this.presenceFilter) this.presenceFilter.disconnect();
    if (this.airFilter) this.airFilter.disconnect();
    if (this.outputGain) this.outputGain.disconnect();
    if (this.makeup) this.makeup.disconnect();
    if (this.input) this.input.disconnect();
    if (this.output) this.output.disconnect();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isInitialized = false;
  }

  private initializeAudioNodes(): void {
    if (!this.audioContext) return;
    
    this.inputGain = this.audioContext.createGain();
    this.inputGain.gain.value = 1.0;

    this.warmthFilter = this.audioContext.createBiquadFilter();
    this.warmthFilter.type = 'peaking';
    this.warmthFilter.frequency.value = 350;
    this.warmthFilter.Q.value = 0.7;
    this.warmthFilter.gain.value = 0;
    
    this.presenceFilter = this.audioContext.createBiquadFilter();
    this.presenceFilter.type = 'peaking';
    this.presenceFilter.frequency.value = 2500;
    this.presenceFilter.Q.value = 1.2;
    this.presenceFilter.gain.value = 0;
    
    this.airFilter = this.audioContext.createBiquadFilter();
    this.airFilter.type = 'highshelf';
    this.airFilter.frequency.value = 10000;
    this.airFilter.gain.value = 0;

    this.outputGain = this.audioContext.createGain();
    this.outputGain.gain.value = 1.0;
  }

  private startStateProcessing(): void {
    if(this.intervalId) clearInterval(this.intervalId); // Clear any existing interval

    this.intervalId = window.setInterval(() => {
      if (!this.isInitialized || !this.audioContext) return;
      this.updateHarmonicLattice();
      this.applyStateToNodes();
    }, 50);
  }

  private updateHarmonicLattice(): void {
    this.updateHarmonicCoefficients();
    this.updateHarmonicModulation();
    this.updateHarmonicColors();
  }
  
  private applyStateToNodes(): void {
    if (!this.audioContext || !this.warmthFilter || !this.presenceFilter || !this.airFilter) return;

    const warmthGain = (this.state.warmth.coefficient - 1) * 6 + (this.state.warmth.modulation);
    this.warmthFilter.gain.setTargetAtTime(warmthGain, this.audioContext.currentTime, 0.05);

    const presenceGain = (this.state.presence.coefficient - 1) * 4 + (this.state.presence.modulation);
    this.presenceFilter.gain.setTargetAtTime(presenceGain, this.audioContext.currentTime, 0.05);
    
    const airGain = (this.state.air.coefficient - 1) * 8 + (this.state.air.modulation);
    this.airFilter.gain.setTargetAtTime(airGain, this.audioContext.currentTime, 0.05);
  }

  private updateHarmonicCoefficients(): void {
    const biasFactor = this.state.emotionalBias;
    this.state.warmth.coefficient = 1.0 + (biasFactor - 0.5) * 0.5;
    this.state.presence.coefficient = 1.0;
    this.state.air.coefficient = 1.0 - (biasFactor - 0.5) * 0.3;
  }

  private updateHarmonicModulation(): void {
    const beatPhase = this.getBeatPhase ? this.getBeatPhase() : 0;
    this.state.warmth.modulation = (breathingPattern(beatPhase, 0.1) - 1) * 2;
    this.state.presence.modulation = (warmthModulation(beatPhase, 0.05) - 1) * 1.5;
    this.state.air.modulation = (breathingPattern(beatPhase, 0.15) - 1) * 3;
  }

  private updateHarmonicColors(): void {
    if (this.state.warmth.coefficient > 1.1) this.state.warmth.color = '#f59e0b';
    else this.state.warmth.color = '#8b5cf6';
    if (this.state.presence.coefficient > 1.1) this.state.presence.color = '#ef4444';
    else this.state.presence.color = '#f59e0b';
    if (this.state.air.coefficient > 1.1) this.state.air.color = '#ffffff';
    else this.state.air.color = '#06b6d4';
  }

  // --- IAudioEngine Parameter Interface Implementation ---
  setParameter(name: string, value: number): void {
    if (!this.isInitialized) return;
    switch (name) {
      case 'emotionalBias': this.setEmotionalBias(value); break;
      // Add more specific parameter setters here if HarmonicLattice exposes them
      default: 
        // Unknown parameter - log in DEV mode only
        if (import.meta.env.DEV) {
          als.warning(`HarmonicLattice: Unknown parameter ${name}`);
        }
    }
  }

  getParameter(name: string): number {
    switch (name) {
      case 'emotionalBias': return this.state.emotionalBias;
      default: return 0;
    }
  }

  getParameterNames(): string[] {
    return ['emotionalBias']; // Expose only this for now
  }

  getParameterMin(name: string): number {
    switch (name) {
      case 'emotionalBias': return 0;
      default: return 0;
    }
  }

  getParameterMax(name: string): number {
    switch (name) {
      case 'emotionalBias': return 1;
      default: return 1;
    }
  }
  // --- End IAudioEngine Parameter Interface ---

  public getHarmonicLatticeState(): HarmonicLatticeState {
    return { ...this.state };
  }

  public setEmotionalBias(value: number): void {
    this.state.emotionalBias = Math.max(0, Math.min(1, value));
    this.updateHarmonicCoefficients(); // Update immediately
  }
}

let harmonicLatticeInstance: HarmonicLattice | null = null;

export function getHarmonicLattice(audioContext: BaseAudioContext | null = null): HarmonicLattice {
  // If instance exists but context is closed or different, dispose and recreate
  if (harmonicLatticeInstance) {
    const existingContext = harmonicLatticeInstance.audioContext;
    const contextClosed = existingContext && 'state' in existingContext && existingContext.state === 'closed';
    const contextChanged = audioContext && existingContext && existingContext !== audioContext;
    
    if (contextClosed || contextChanged) {
      harmonicLatticeInstance.dispose();
      harmonicLatticeInstance = null;
    }
  }
  
  if (!harmonicLatticeInstance) {
    harmonicLatticeInstance = new HarmonicLattice(audioContext);
  } else if (audioContext && !harmonicLatticeInstance.audioContext) {
      // If context is provided later, set it
      harmonicLatticeInstance.audioContext = audioContext;
      // Re-create dummy nodes to actual nodes
      harmonicLatticeInstance.input = audioContext.createGain();
      harmonicLatticeInstance.output = audioContext.createGain();
      harmonicLatticeInstance.makeup = audioContext.createGain();
  }
  return harmonicLatticeInstance;
}

export async function initializeHarmonicLattice(audioContext: BaseAudioContext): Promise<void> {
    const engine = getHarmonicLattice(audioContext);
    if (!engine.getIsInitialized()) {
      await engine.initialize(audioContext);
    }
}