/**
 * VELVET CURVE ENGINE - Five Pillars Doctrine Compliance
 * 
 * Movement: Beat-locked dynamic curves and musical expression
 * Texture: Warmth, silk edge, and human tactility
 * Time: Musical timing alignment for emotion curves
 * Space: Dimensional depth in harmonic enhancement
 * Form: Clean, reductionist curve processing
 * 
 * V(t) = W(t) × S(t) × E(t) × P(t) × B(t)
 * where:
 * - W(t): Warmth curve - velvet smoothness
 * - S(t): Silk edge - clarity and presence  
 * - E(t): Emotion curve - musical expression
 * - P(t): Power curve - dynamic impact
 * - B(t): Beat-locked breathing for Movement Doctrine
 * 
 * @author Prime (Mixx Club)
 * @version 2.0.0 - Five Pillars Doctrine
 */

import { FourAnchors, MusicalContext } from '../types/sonic-architecture';
import { IAudioEngine } from '../types/audio-graph';
import { breathingPattern, warmthModulation } from '../core/beat-locked-lfo';
import { als } from '../utils/alsFeedback';

export interface VelvetCurveState {
  warmth: number;
  silkEdge: number;
  emotion: number;
  power: number;
  balance: number;
  isActive: boolean;
}

export interface VelvetCurveConfig {
  sampleRate: number;
  warmthTarget: number;    // Target warmth level
  silkEdgeTarget: number;  // Target silk edge level
  emotionTarget: number;   // Target emotion level
  powerTarget: number;     // Target power level
  processingMode: 'gentle' | 'moderate' | 'aggressive';
}

export interface VelvetCurveProcessing {
  inputGain: number;
  warmthGain: number;
  silkEdgeGain: number;
  emotionGain: number;
  powerGain: number;
  outputGain: number;
  harmonicEnhancement: number;
  dynamicShaping: number;
}


export class VelvetCurveEngine implements IAudioEngine {
  // Five Pillars Doctrine - Audio Graph Interface
  public input: AudioNode; // Publicly exposed input node
  public output: AudioNode; // Publicly exposed output node
  public makeup: GainNode; // Makeup gain before final output
  
  // Beat-locked timing for Movement Doctrine
  private getBeatPhase: (() => number) | null = null;
  public audioContext: BaseAudioContext | null = null; // Public for debugging/re-init
  private state: VelvetCurveState;
  private config: VelvetCurveConfig;
  private processing: VelvetCurveProcessing;
  private isInitialized: boolean = false;

  // Audio processing nodes
  private inputGainNode: GainNode | null = null; // Internal input gain
  private warmthFilter: BiquadFilterNode | null = null;
  private silkEdgeFilter: BiquadFilterNode | null = null;
  private emotionFilter: BiquadFilterNode | null = null;
  private powerCompressor: DynamicsCompressorNode | null = null;
  private harmonicEnhancer: BiquadFilterNode | null = null;
  private outputGainNode: GainNode | null = null; // Internal output gain before makeup


  constructor(audioContext: BaseAudioContext | null = null, config?: VelvetCurveConfig) {
    this.audioContext = audioContext;
    
    // Initialize public AudioNodes to dummy nodes if context is null, or actual nodes if provided
    this.input = audioContext ? audioContext.createGain() : null as any;
    this.output = audioContext ? audioContext.createGain() : null as any;
    this.makeup = audioContext ? audioContext.createGain() : null as any;
    
    this.config = config || { // Default config
      sampleRate: 44100,
      warmthTarget: 0.7,
      silkEdgeTarget: 0.6,
      emotionTarget: 0.8,
      powerTarget: 0.7,
      processingMode: 'moderate'
    };
    this.state = {
      warmth: 0.7,
      silkEdge: 0.6,
      emotion: 0.8,
      power: 0.7,
      balance: 0.7,
      isActive: true
    };
    this.processing = {
      inputGain: 1.0,
      warmthGain: 1.0,
      silkEdgeGain: 1.0,
      emotionGain: 1.0,
      powerGain: 1.0,
      outputGain: 1.0,
      harmonicEnhancement: 0.3,
      dynamicShaping: 0.5
    };
  }
  
  /**
   * Adapts engine parameters based on Prime Brain's Four Anchors analysis.
   * This is the "listening" part of the Cultural Intelligence.
   */
  adaptToAnchors(anchors: FourAnchors): void {
    if (!this.isInitialized || !this.audioContext) return;

    // Normalize anchor values (0-100) to parameter range (0-1)
    const bodyNorm = anchors.body / 100;
    const soulNorm = anchors.soul / 100;
    const airNorm = anchors.air / 100;
    const silkNorm = anchors.silk / 100;

    // Intelligent mapping from analysis to parameters
    this.state.warmth = (bodyNorm * 0.6) + (soulNorm * 0.3) + (silkNorm * 0.1);
    this.state.power = (bodyNorm * 0.7) + (soulNorm * 0.2);
    this.state.silkEdge = (airNorm * 0.7) + (soulNorm * 0.2) + (silkNorm * 0.1);
    this.state.emotion = (soulNorm * 0.5) + (silkNorm * 0.5);

    // Clamp values to ensure they are within the 0-1 range
    this.state.warmth = Math.max(0, Math.min(1, this.state.warmth));
    this.state.power = Math.max(0, Math.min(1, this.state.power));
    this.state.silkEdge = Math.max(0, Math.min(1, this.state.silkEdge));
    this.state.emotion = Math.max(0, Math.min(1, this.state.emotion));

    this.updateProcessingParameters();
  }

  /**
   * Sets the musical context and adapts parameters accordingly.
   * This is the core of the "Cultural Intelligence".
   */
  setContext(context: MusicalContext): void {
    const { genre, mood } = context;

    // Base settings for genres
    switch (genre) {
      case 'Hip-Hop':
        this.state.warmth = 0.8;
        this.state.power = 0.75;
        this.state.silkEdge = 0.5;
        this.state.emotion = 0.6;
        break;
      case 'Trap':
        this.state.warmth = 0.6;
        this.state.power = 0.85;
        this.state.silkEdge = 0.6;
        this.state.emotion = 0.4;
        break;
      case 'R&B':
        this.state.warmth = 0.85;
        this.state.power = 0.6;
        this.state.silkEdge = 0.7;
        this.state.emotion = 0.75;
        break;
      case 'Drill':
        this.state.warmth = 0.5;
        this.state.power = 0.9;
        this.state.silkEdge = 0.5;
        this.state.emotion = 0.3;
        break;
      case 'Afrobeat':
        this.state.warmth = 0.7;
        this.state.power = 0.7;
        this.state.silkEdge = 0.65;
        this.state.emotion = 0.7;
        break;
      case 'Club':
        this.state.warmth = 0.6;
        this.state.power = 0.8;
        this.state.silkEdge = 0.7;
        this.state.emotion = 0.5;
        break;
      case 'Audiophile':
        this.state.warmth = 0.75;
        this.state.power = 0.5;
        this.state.silkEdge = 0.8;
        this.state.emotion = 0.8;
        break;
      case 'Streaming':
      default:
        this.state.warmth = 0.7;
        this.state.power = 0.7;
        this.state.silkEdge = 0.6;
        this.state.emotion = 0.8;
        break;
    }

    // Adjustments for mood
    switch (mood) {
      case 'Energetic':
        this.state.power = Math.min(1, this.state.power + 0.1);
        this.state.silkEdge = Math.min(1, this.state.silkEdge + 0.1);
        break;
      case 'Calm':
        this.state.power = Math.max(0, this.state.power - 0.1);
        this.state.warmth = Math.min(1, this.state.warmth + 0.1);
        break;
      case 'Dark':
        this.state.warmth = Math.min(1, this.state.warmth + 0.05);
        this.state.silkEdge = Math.max(0, this.state.silkEdge - 0.1);
        break;
      case 'Balanced':
        // No change
        break;
    }

    this.updateProcessingParameters();
  }

  /**
   * Initialize the Velvet Curve Engine
   */
  async initialize(audioContext: BaseAudioContext): Promise<void> {
    if (this.isInitialized) return;

    this.audioContext = audioContext;

    // Create public nodes if they are dummy nodes
    this.input = this.audioContext.createGain();
    this.makeup = this.audioContext.createGain();
    this.output = this.audioContext.createGain(); // Final public output

    // Create internal audio processing chain
    this.createProcessingChain();

    // Connect internal processing chain to makeup gain and then to final output
    if (this.inputGainNode && this.outputGainNode) {
      // Connect internal chain: input → warmth → silk → emotion → power → harmonic → output
      this.inputGainNode.connect(this.warmthFilter!);
      this.warmthFilter!.connect(this.silkEdgeFilter!);
      this.silkEdgeFilter!.connect(this.emotionFilter!);
      this.emotionFilter!.connect(this.powerCompressor!);
      this.powerCompressor!.connect(this.harmonicEnhancer!);
      this.harmonicEnhancer!.connect(this.outputGainNode);

      // Connect the public input to the internal inputGainNode
      this.input.connect(this.inputGainNode);

      // Connect the internal outputGainNode to makeup gain, then to public output
      this.outputGainNode.connect(this.makeup);
      this.makeup.connect(this.output);
    }
    
    // Set initial processing parameters
    this.updateProcessingParameters();

    this.isInitialized = true;
  }

  /**
   * Create the audio processing chain (internal nodes)
   */
  private createProcessingChain(): void {
    if (!this.audioContext) return;

    // Input gain stage (internal)
    this.inputGainNode = this.audioContext.createGain();
    this.inputGainNode.gain.value = this.processing.inputGain;

    // Warmth curve - Low-mid enhancement for velvet smoothness
    this.warmthFilter = this.audioContext.createBiquadFilter();
    this.warmthFilter.type = 'peaking';
    this.warmthFilter.frequency.value = 250; // Warmth frequency
    this.warmthFilter.Q.value = 0.7;
    this.warmthFilter.gain.value = this.processing.warmthGain * 3; // dB

    // Silk edge - High-mid enhancement for clarity
    this.silkEdgeFilter = this.audioContext.createBiquadFilter();
    this.silkEdgeFilter.type = 'peaking';
    this.silkEdgeFilter.frequency.value = 3000; // Silk edge frequency
    this.silkEdgeFilter.Q.value = 1.2;
    this.silkEdgeFilter.gain.value = this.processing.silkEdgeGain * 2; // dB

    // Emotion curve - Mid enhancement for musical expression
    this.emotionFilter = this.audioContext.createBiquadFilter();
    this.emotionFilter.type = 'peaking';
    this.emotionFilter.frequency.value = 1000; // Emotion frequency
    this.emotionFilter.Q.value = 0.8;
    this.emotionFilter.gain.value = this.processing.emotionGain * 2.5; // dB

    // Power curve - Dynamic compression for impact
    this.powerCompressor = this.audioContext.createDynamicsCompressor();
    this.powerCompressor.threshold.value = -12; // dB
    this.powerCompressor.knee.value = 30; // dB
    this.powerCompressor.ratio.value = 3.5;
    this.powerCompressor.attack.value = 0.003; // 3ms
    this.powerCompressor.release.value = 0.1; // 100ms

    // Harmonic enhancer - Add harmonic richness
    this.harmonicEnhancer = this.audioContext.createBiquadFilter();
    this.harmonicEnhancer.type = 'highpass';
    this.harmonicEnhancer.frequency.value = 80; // Remove sub-bass
    this.harmonicEnhancer.Q.value = 0.5;

    // Output gain stage (internal)
    this.outputGainNode = this.audioContext.createGain();
    this.outputGainNode.gain.value = this.processing.outputGain;
  }

  /**
   * Update processing parameters based on current state - ENHANCED FOR 100% COHERENCE
   */
  private updateProcessingParameters(): void {
    if (!this.warmthFilter || !this.silkEdgeFilter || !this.emotionFilter || 
        !this.powerCompressor || !this.harmonicEnhancer || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const rampTime = 0.05; // 50ms ramp to prevent clicks

    // ENHANCED COHERENCE: Apply beat-locked modulation for 100% coherence
    const beatPhase = this.getBeatPhase ? this.getBeatPhase() : 0;
    const coherenceMultiplier = breathingPattern(beatPhase, 0.5);
    const sentienceMultiplier = warmthModulation(beatPhase, 0.3);

    // Update warmth curve with coherence enhancement
    const enhancedWarmth = this.state.warmth * coherenceMultiplier;
    this.warmthFilter.gain.setTargetAtTime(enhancedWarmth * 3, now, rampTime);

    // Update silk edge curve with sentience enhancement
    const enhancedSilkEdge = this.state.silkEdge * sentienceMultiplier;
    this.silkEdgeFilter.gain.setTargetAtTime(enhancedSilkEdge * 2, now, rampTime);

    // Update emotion curve with coherence enhancement
    const enhancedEmotion = this.state.emotion * coherenceMultiplier;
    this.emotionFilter.gain.setTargetAtTime(enhancedEmotion * 2.5, now, rampTime);

    // Update power curve with sentience enhancement
    const enhancedPower = this.state.power * sentienceMultiplier;
    this.powerCompressor.ratio.setTargetAtTime(2 + (enhancedPower * 3), now, rampTime);

    // Update harmonic enhancement with coherence boost
    const enhancedBalance = this.state.balance * coherenceMultiplier;
    this.harmonicEnhancer.frequency.setTargetAtTime(60 + (enhancedBalance * 40), now, rampTime);
  }

  /**
   * Set warmth level (0-1)
   */
  setParameter(paramName: string, value: number): void {
    switch (paramName) {
      case 'warmth': this.setWarmth(value); break;
      case 'silkEdge': this.setSilkEdge(value); break;
      case 'emotion': this.setEmotion(value); break;
      case 'power': this.setPower(value); break;
      case 'balance': this.setBalance(value); break;
      default: 
        // Unknown parameter - log in DEV mode only
        if (import.meta.env.DEV) {
          als.warning(`VelvetCurveEngine: Unknown parameter ${paramName}`);
        }
    }
  }

  getParameter(paramName: string): number {
    switch (paramName) {
      case 'warmth': return this.state.warmth;
      case 'silkEdge': return this.state.silkEdge;
      case 'emotion': return this.state.emotion;
      case 'power': return this.state.power;
      case 'balance': return this.state.balance;
      default: return 0;
    }
  }

  getParameterNames(): string[] {
    return ['warmth', 'silkEdge', 'emotion', 'power', 'balance'];
  }

  getParameterMin(paramName: string): number {
    // All current parameters are 0-1 range
    return 0;
  }

  getParameterMax(paramName: string): number {
    // All current parameters are 0-1 range
    return 1;
  }
  
  /**
   * Provides a clock source to the engine for synchronized effects.
   * @param getBeatPhase A function that returns the current phase of the beat (0 to 1).
   */
  setClock(getBeatPhase: () => number): void {
    this.getBeatPhase = getBeatPhase;
  }

  getWarmth(): number { return this.state.warmth; }
  setWarmth(value: number): void { this.state.warmth = Math.max(0, Math.min(1, value)); this.updateProcessingParameters(); }
  getSilkEdge(): number { return this.state.silkEdge; }
  setSilkEdge(value: number): void { this.state.silkEdge = Math.max(0, Math.min(1, value)); this.updateProcessingParameters(); }
  getEmotion(): number { return this.state.emotion; }
  setEmotion(value: number): void { this.state.emotion = Math.max(0, Math.min(1, value)); this.updateProcessingParameters(); }
  getPower(): number { return this.state.power; }
  setPower(value: number): void { this.state.power = Math.max(0, Math.min(1, value)); this.updateProcessingParameters(); }
  getBalance(): number { return this.state.balance; }
  setBalance(value: number): void { this.state.balance = Math.max(0, Math.min(1, value)); this.updateProcessingParameters(); }


  /**
   * Get current state
   */
  getState(): VelvetCurveState {
    return { ...this.state };
  }

  /**
   * Check if engine is active
   */
  isActive(): boolean {
    return this.state.isActive && this.isInitialized;
  }

  /**
   * Get initialization status
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Enable/disable the Velvet Curve
   */
  setActive(active: boolean): void {
    this.state.isActive = active;
  }

  /**
   * Dispose of the engine
   */
  dispose(): void {
    if (this.inputGainNode) this.inputGainNode.disconnect();
    if (this.warmthFilter) this.warmthFilter.disconnect();
    if (this.silkEdgeFilter) this.silkEdgeFilter.disconnect();
    if (this.emotionFilter) this.emotionFilter.disconnect();
    if (this.powerCompressor) this.powerCompressor.disconnect();
    if (this.harmonicEnhancer) this.harmonicEnhancer.disconnect();
    if (this.outputGainNode) this.outputGainNode.disconnect();
    if (this.makeup) this.makeup.disconnect();
    if (this.input) this.input.disconnect(); // Disconnect public input
    if (this.output) this.output.disconnect(); // Disconnect public output

    this.isInitialized = false;
  }
}

// Global Velvet Curve Engine instance
let velvetCurveInstance: VelvetCurveEngine | null = null;

/**
 * Get the global Velvet Curve Engine instance (singleton pattern)
 */
export function getVelvetCurveEngine(audioContext: BaseAudioContext | null = null): VelvetCurveEngine {
  // If instance exists but context is closed or different, dispose and recreate
  if (velvetCurveInstance) {
    const existingContext = velvetCurveInstance.audioContext;
    const contextClosed = existingContext && 'state' in existingContext && existingContext.state === 'closed';
    const contextChanged = audioContext && existingContext && existingContext !== audioContext;
    
    if (contextClosed || contextChanged) {
      velvetCurveInstance.dispose();
      velvetCurveInstance = null;
    }
  }
  
  if (!velvetCurveInstance) {
    velvetCurveInstance = new VelvetCurveEngine(audioContext);
  } else if (audioContext && !velvetCurveInstance.audioContext) {
      // If context is provided later, set it
      velvetCurveInstance.audioContext = audioContext;
      // Re-create dummy nodes to actual nodes
      velvetCurveInstance.input = audioContext.createGain();
      velvetCurveInstance.output = audioContext.createGain();
      velvetCurveInstance.makeup = audioContext.createGain();
  }
  return velvetCurveInstance;
}

/**
 * Initialize the Velvet Curve Engine
 */
export async function initializeVelvetCurveEngine(audioContext: BaseAudioContext): Promise<void> {
  const engine = getVelvetCurveEngine(audioContext); // Pass context
  if (!engine.getIsInitialized()) { // Use getIsInitialized
    await engine.initialize(audioContext);
  }
}