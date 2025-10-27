/**
 * VELVET FLOOR ENGINE - Five Pillars Doctrine Compliance
 * 
 * Movement: Beat-locked sub-harmonic modulation
 * Texture: Warmth and human tactility in sub-bass
 * Time: Musical timing alignment
 * Space: Dimensional depth in sub-harmonic foundation
 * Form: Clean, reductionist structure
 * 
 * S(t) = Σᵢ Hᵢ(t) × Gᵢ × Pᵢ × B(t)
 * where:
 * - Hᵢ(t): harmonic amplitude of source i (808, kick, bass synth)
 * - Gᵢ: gain coefficient derived from ALS headroom color
 * - Pᵢ: phase-alignment factor from Prime Fabric's Sonic Gravity node
 * - B(t): beat-locked breathing pattern for Movement Doctrine
 */

export interface SubHarmonicSource {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
  harmonicContent: number[];
  sourceType: 'kick' | '808' | 'bass' | 'sub';
}

export interface VelvetFloorState {
  physicalFeel: number;    // 20-35 Hz - Physical feel
  grooveBody: number;      // 36-55 Hz - Groove body  
  tonalDefinition: number; // 56-80 Hz - Tonal definition
  transitionBand: number;  // 81-120 Hz - Transition band
  overallWeight: number;   // Total sub weight
  sonicGravity: number;    // Phase alignment quality
}

export interface HarmonicLattice {
  warmth: number[];    // 2nd-4th harmonics - Velvet warmth
  presence: number[];  // 5th-7th harmonics - Silk edge
  air: number[];       // 8th-12th harmonics - Mixx shimmer
  totalHarmonics: number;
}

export interface PhaseWeaveVector {
  angle: number;       // θₙ(t) - time-varying angle
  amplitude: number;   // Harmonic amplitude
  frequency: number;   // Harmonic frequency
  motionType: 'orbit' | 'swing' | 'pulse';
}

import { IAudioEngine, AudioGraphNode } from '../../types/audio-graph';
import { breathingPattern, warmthModulation } from '../../core/beat-locked-lfo';

export class VelvetFloorEngine implements IAudioEngine {
  private audioContext: AudioContext | null = null;
  private subSources = new Map<string, SubHarmonicSource>();
  private velvetFloorState: VelvetFloorState = {
    physicalFeel: 0.5,
    grooveBody: 0.5,
    tonalDefinition: 0.5,
    transitionBand: 0.5,
    overallWeight: 0.5,
    sonicGravity: 0.5
  };
  private harmonicLattice: HarmonicLattice = {
    warmth: [],
    presence: [],
    air: [],
    totalHarmonics: 0
  };
  
  // Five Pillars Doctrine - Audio Graph Interface
  public input: AudioNode;
  public output: AudioNode;
  public makeup: GainNode;
  
  // Beat-locked timing for Movement Doctrine
  private getBeatPhase: (() => number) | null = null;
  private phaseWeaveVectors: PhaseWeaveVector[] = [];
  
  constructor() {
    // Initialize audio graph nodes (will be set in initialize)
    this.input = null as any;
    this.output = null as any;
    this.makeup = null as any;
  }
  
  // Sonic Gravity parameters
  private sonicGravityThreshold = 0.25; // radians max rotation
  private psychoacousticConstants = {
    physicalFeel: { min: 20, max: 35 },
    grooveBody: { min: 36, max: 55 },
    tonalDefinition: { min: 56, max: 80 },
    transitionBand: { min: 81, max: 120 }
  };

  // Five Pillars Doctrine - IAudioEngine Implementation
  async initialize(ctx: AudioContext): Promise<void> {
    this.audioContext = ctx;
    
    // Create audio graph nodes
    this.input = ctx.createGain();
    this.makeup = ctx.createGain();
    this.output = ctx.createGain();
    
    // Set default makeup gain (-6 dB for Form Doctrine)
    this.makeup.gain.value = 0.5;
    
    // Connect the chain
    this.input.connect(this.makeup);
    this.makeup.connect(this.output);
    
    // Initialize state
    this.velvetFloorState = {
      physicalFeel: 0.5,
      grooveBody: 0.5,
      tonalDefinition: 0.5,
      transitionBand: 0.5,
      overallWeight: 0.5,
      sonicGravity: 0.5
    };
  }

  setClock(getBeatPhase: () => number): void {
    this.getBeatPhase = getBeatPhase;
  }

  dispose(): void {
    if (this.input) this.input.disconnect();
    if (this.makeup) this.makeup.disconnect();
    if (this.output) this.output.disconnect();
  }

  /**
   * Add a sub-harmonic source to the Velvet Floor
   */
  addSubSource(source: SubHarmonicSource): void {
    this.subSources.set(source.id, source);
    this.recalculateVelvetFloor();
    console.log(`🎵 Added sub source: ${source.id} at ${source.frequency}Hz`);
  }

  /**
   * Remove a sub-harmonic source
   */
  removeSubSource(sourceId: string): void {
    this.subSources.delete(sourceId);
    this.recalculateVelvetFloor();
    console.log(`🗑️ Removed sub source: ${sourceId}`);
  }

  /**
   * Update sub-harmonic source
   */
  updateSubSource(sourceId: string, updates: Partial<SubHarmonicSource>): void {
    const source = this.subSources.get(sourceId);
    if (source) {
      Object.assign(source, updates);
      this.recalculateVelvetFloor();
    }
  }

  /**
   * Recalculate the entire Velvet Floor state
   */
  private recalculateVelvetFloor(): void {
    const sources = Array.from(this.subSources.values());
    
    // Calculate band-specific energy
    this.velvetFloorState.physicalFeel = this.calculateBandEnergy(sources, this.psychoacousticConstants.physicalFeel);
    this.velvetFloorState.grooveBody = this.calculateBandEnergy(sources, this.psychoacousticConstants.grooveBody);
    this.velvetFloorState.tonalDefinition = this.calculateBandEnergy(sources, this.psychoacousticConstants.tonalDefinition);
    this.velvetFloorState.transitionBand = this.calculateBandEnergy(sources, this.psychoacousticConstants.transitionBand);
    
    // Calculate overall weight
    this.velvetFloorState.overallWeight = (
      this.velvetFloorState.physicalFeel * 0.3 +
      this.velvetFloorState.grooveBody * 0.4 +
      this.velvetFloorState.tonalDefinition * 0.2 +
      this.velvetFloorState.transitionBand * 0.1
    );

    // Calculate Sonic Gravity (phase alignment quality)
    this.velvetFloorState.sonicGravity = this.calculateSonicGravity(sources);

    // Update harmonic lattice
    this.updateHarmonicLattice(sources);

    // Update phase weave vectors
    this.updatePhaseWeaveVectors(sources);
  }

  /**
   * Calculate energy in a specific frequency band
   */
  private calculateBandEnergy(sources: SubHarmonicSource[], band: { min: number; max: number }): number {
    let totalEnergy = 0;
    
    sources.forEach(source => {
      if (source.frequency >= band.min && source.frequency <= band.max) {
        totalEnergy += source.amplitude * this.getHarmonicWeight(source.frequency);
      }
    });
    
    return Math.min(1, totalEnergy);
  }

  /**
   * Get harmonic weight based on frequency
   */
  private getHarmonicWeight(frequency: number): number {
    // Weight sub-harmonics more heavily in the sweet spots
    if (frequency >= 28 && frequency <= 35) return 1.2; // Physical feel sweet spot
    if (frequency >= 36 && frequency <= 55) return 1.0; // Groove body
    if (frequency >= 56 && frequency <= 80) return 0.8; // Tonal definition
    if (frequency >= 81 && frequency <= 120) return 0.6; // Transition band
    return 0.4; // Outside velvet floor
  }

  /**
   * Calculate Sonic Gravity - phase alignment quality
   */
  private calculateSonicGravity(sources: SubHarmonicSource[]): number {
    if (sources.length < 2) return 1.0;

    let totalPhaseAlignment = 0;
    let pairCount = 0;

    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const phaseDiff = Math.abs((sources[i]?.phase || 0) - (sources[j]?.phase || 0));
        const alignment = Math.cos(phaseDiff); // 1 = perfect alignment, -1 = destructive
        totalPhaseAlignment += alignment;
        pairCount++;
      }
    }

    return pairCount > 0 ? Math.max(0, totalPhaseAlignment / pairCount) : 1.0;
  }

  /**
   * Update harmonic lattice based on sub sources
   */
  private updateHarmonicLattice(sources: SubHarmonicSource[]): void {
    // Calculate harmonic content from all sources
    const warmth = [0, 0, 0];    // 2nd, 3rd, 4th
    const presence = [0, 0, 0];  // 5th, 6th, 7th
    const air = [0, 0, 0, 0, 0]; // 8th, 9th, 10th, 11th, 12th

    sources.forEach(source => {
      source.harmonicContent.forEach((amplitude, index) => {
        const harmonicNumber = index + 1;
        
        if (harmonicNumber >= 2 && harmonicNumber <= 4) {
          const warmthIndex = harmonicNumber - 2;
          if (warmth[warmthIndex] !== undefined) {
            warmth[warmthIndex] += (amplitude || 0) * 0.3;
          }
        } else if (harmonicNumber >= 5 && harmonicNumber <= 7) {
          const presenceIndex = harmonicNumber - 5;
          if (presence[presenceIndex] !== undefined) {
            presence[presenceIndex] += (amplitude || 0) * 0.2;
          }
        } else if (harmonicNumber >= 8 && harmonicNumber <= 12) {
          const airIndex = Math.min(harmonicNumber - 8, 4);
          if (air[airIndex] !== undefined) {
            air[airIndex] += (amplitude || 0) * 0.1;
          }
        }
      });
    });

    this.harmonicLattice = {
      warmth,
      presence,
      air,
      totalHarmonics: [...warmth, ...presence, ...air].reduce((sum, val) => sum + val, 0)
    };
  }

  /**
   * Update phase weave vectors for stereo motion
   */
  private updatePhaseWeaveVectors(sources: SubHarmonicSource[]): void {
    this.phaseWeaveVectors = [];

    sources.forEach(source => {
      // Create phase weave vectors for each harmonic
      source.harmonicContent.forEach((amplitude, index) => {
        const harmonicNumber = index + 1;
        const harmonicFreq = source.frequency * harmonicNumber;
        
        if (amplitude > 0.1) { // Only include significant harmonics
          const vector: PhaseWeaveVector = {
            angle: (Date.now() * 0.001 * harmonicFreq * 0.1) % (Math.PI * 2),
            amplitude,
            frequency: harmonicFreq,
            motionType: this.getMotionType(harmonicNumber, harmonicFreq)
          };
          
          this.phaseWeaveVectors.push(vector);
        }
      });
    });
  }

  /**
   * Determine motion type based on harmonic number and frequency
   */
  private getMotionType(harmonicNumber: number, frequency: number): 'orbit' | 'swing' | 'pulse' {
    if (harmonicNumber <= 4) return 'orbit';  // Low harmonics orbit slowly
    if (frequency < 200) return 'swing';      // Mid harmonics swing
    return 'pulse';                           // High harmonics pulse
  }

  /**
   * Apply Sonic Gravity corrections
   */
  applySonicGravityCorrections(): void {
    const sources = Array.from(this.subSources.values());
    
    sources.forEach(source => {
      // Apply micro-rotation for phase alignment
      if (this.velvetFloorState.sonicGravity < 0.8) {
        const correction = (0.8 - this.velvetFloorState.sonicGravity) * this.sonicGravityThreshold;
        source.phase += Math.sin(Date.now() * 0.001) * correction;
        source.phase = source.phase % (Math.PI * 2);
      }

      // Add complementary harmonics when needed
      if (this.velvetFloorState.tonalDefinition < 0.3) {
        this.addComplementaryHarmonics(source);
      }
    });
  }

  /**
   * Add complementary 2nd and 4th harmonics for definition
   */
  private addComplementaryHarmonics(source: SubHarmonicSource): void {
    if (source.harmonicContent.length < 4) {
      source.harmonicContent.push(0, 0, 0, 0);
    }
    
    // Add subtle 2nd and 4th harmonics
    source.harmonicContent[1] = Math.min(1, (source.harmonicContent[1] || 0) + 0.1); // 2nd harmonic
    source.harmonicContent[3] = Math.min(1, (source.harmonicContent[3] || 0) + 0.05); // 4th harmonic
  }

  /**
   * Get ALS color based on Velvet Floor state
   */
  getALSColor(): string {
    const { sonicGravity, overallWeight, physicalFeel } = this.velvetFloorState;
    
    if (sonicGravity > 0.9 && overallWeight > 0.7) return '#7c3aed'; // Deep violet - sub integrity
    if (physicalFeel > 0.8) return '#dc2626'; // Crimson flashes - energy overload below 30Hz
    if (overallWeight < 0.3) return '#4f46e5'; // Indigo - under-fed low end
    if (sonicGravity > 0.8) return '#f59e0b'; // Gold halo - optimal Sonic Gravity
    
    return '#8b5cf6'; // Default violet
  }

  /**
   * Get psychoacoustic enhancement for small speakers
   */
  getPsychoacousticEnhancement(): {
    missingFundamental: number;
    temporalModulation: number;
    stereoShadow: number;
  } {
    const { physicalFeel, grooveBody } = this.velvetFloorState;
    
    return {
      missingFundamental: physicalFeel * 0.3, // Create upper harmonic illusions of 30Hz tones
      temporalModulation: grooveBody * 0.2,   // Micro-envelope wobble (1-3Hz)
      stereoShadow: this.velvetFloorState.tonalDefinition * 0.1 // Decorrelation around 80Hz
    };
  }

  /**
   * Get current Velvet Floor state
   */
  getVelvetFloorState(): VelvetFloorState {
    return { ...this.velvetFloorState };
  }

  /**
   * Get physical feel level
   */
  getPhysicalFeel(): number {
    return this.velvetFloorState.physicalFeel;
  }

  /**
   * Get groove body level
   */
  getGrooveBody(): number {
    return this.velvetFloorState.grooveBody;
  }

  /**
   * Get tonal definition level
   */
  getTonalDefinition(): number {
    return this.velvetFloorState.tonalDefinition;
  }

  /**
   * Get sonic gravity level
   */
  getSonicGravity(): number {
    return this.velvetFloorState.sonicGravity;
  }

  /**
   * Get harmonic lattice state
   */
  getHarmonicLattice(): HarmonicLattice {
    return { ...this.harmonicLattice };
  }

  /**
   * Get phase weave vectors
   */
  getPhaseWeaveVectors(): PhaseWeaveVector[] {
    return [...this.phaseWeaveVectors];
  }

  /**
   * Clear all sub sources
   */
  clearSubSources(): void {
    this.subSources.clear();
    this.recalculateVelvetFloor();
    console.log('🧹 Velvet Floor Engine cleared');
  }
}

// Singleton instance
let velvetFloorInstance: VelvetFloorEngine | null = null;

export function getVelvetFloorEngine(): VelvetFloorEngine {
  if (!velvetFloorInstance) {
    velvetFloorInstance = new VelvetFloorEngine();
  }
  return velvetFloorInstance;
}
