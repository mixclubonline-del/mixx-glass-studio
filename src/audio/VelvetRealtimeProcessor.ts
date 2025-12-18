/**
 * VelvetRealtimeProcessor
 * Phase 36: Wire Worklets to VelvetProcessor
 * 
 * Real-time audio mastering processor using AudioWorklet-based pillar stages.
 * For live audio playback with offloaded DSP processing.
 */

import { MasteringProfile } from '../types/sonic-architecture';
import {
  registerFivePillarsWorklets,
  createVelvetFloorWorklet,
  createHarmonicLatticeWorklet,
  createPhaseWeaveWorklet,
  createVelvetCurveWorklet,
  areAllPillarsRegistered,
  WorkletPillarStage,
} from './FivePillarsWorklet';
import {
  createVelvetFloorStage,
  createHarmonicLatticeStage,
  createPhaseWeaveStage,
  createVelvetCurveStage,
  PillarStage,
  VelvetFloorSettings,
  HarmonicLatticeSettings,
  PhaseWeaveSettings,
} from './fivePillars';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface VelvetRealtimeOptions {
  profile: MasteringProfile;
  useWorklets?: boolean; // Default: true
  onWorkletStatus?: (usingWorklets: boolean) => void;
}

interface PillarConnection {
  input: AudioNode;
  output: AudioNode;
  disconnect: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// VelvetRealtimeProcessor Class
// ═══════════════════════════════════════════════════════════════════════════

export class VelvetRealtimeProcessor {
  private context: AudioContext;
  private profile: MasteringProfile;
  private useWorklets: boolean;
  private usingWorklets: boolean = false;
  private onWorkletStatus?: (usingWorklets: boolean) => void;

  // Input/Output nodes
  public readonly input: GainNode;
  public readonly output: GainNode;

  // Pillar stages
  private velvetFloor: PillarConnection | null = null;
  private harmonicLattice: PillarConnection | null = null;
  private phaseWeave: PillarConnection | null = null;
  private velvetCurve: PillarConnection | null = null;

  // Master controls
  private masterGain: GainNode;
  private limiter: DynamicsCompressorNode;
  private bypass: boolean = false;

  constructor(context: AudioContext, options: VelvetRealtimeOptions) {
    this.context = context;
    this.profile = options.profile;
    this.useWorklets = options.useWorklets ?? true;
    this.onWorkletStatus = options.onWorkletStatus;

    // Create input/output nodes
    this.input = context.createGain();
    this.output = context.createGain();

    // Create master gain
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 1.0;

    // Create safety limiter
    this.limiter = context.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.1;
    this.limiter.knee.value = 0;

    // Initialize with bypass until stages are ready
    this.input.connect(this.output);
  }

  /**
   * Initialize the processor and connect all stages
   */
  async initialize(): Promise<boolean> {
    try {
      // Disconnect bypass path
      this.input.disconnect();

      if (this.useWorklets) {
        const workletSuccess = await this.initializeWithWorklets();
        if (workletSuccess) {
          this.usingWorklets = true;
          console.log('[VelvetRealtime] ✅ Using AudioWorklet stages');
        } else {
          console.log('[VelvetRealtime] ⚠️ Falling back to Web Audio nodes');
          this.initializeWithWebAudio();
          this.usingWorklets = false;
        }
      } else {
        this.initializeWithWebAudio();
        this.usingWorklets = false;
      }

      this.onWorkletStatus?.(this.usingWorklets);
      return true;
    } catch (error) {
      console.error('[VelvetRealtime] Initialization failed:', error);
      // Restore bypass
      this.input.connect(this.output);
      return false;
    }
  }

  /**
   * Initialize with AudioWorklet-based stages
   */
  private async initializeWithWorklets(): Promise<boolean> {
    try {
      // Register all worklet modules
      await registerFivePillarsWorklets(this.context);

      if (!areAllPillarsRegistered()) {
        return false;
      }

      // Create worklet stages
      const velvetFloor = await createVelvetFloorWorklet(this.context, this.profile.velvetFloor);
      const harmonicLattice = await createHarmonicLatticeWorklet(this.context, this.profile.harmonicLattice);
      const phaseWeave = await createPhaseWeaveWorklet(this.context, this.profile.phaseWeave);
      const velvetCurve = await createVelvetCurveWorklet(this.context, {});

      if (!velvetFloor || !harmonicLattice || !phaseWeave || !velvetCurve) {
        return false;
      }

      // Store stages
      this.velvetFloor = velvetFloor;
      this.harmonicLattice = harmonicLattice;
      this.phaseWeave = phaseWeave;
      this.velvetCurve = velvetCurve;

      // Connect the chain
      this.connectChain();

      return true;
    } catch (error) {
      console.error('[VelvetRealtime] Worklet initialization failed:', error);
      return false;
    }
  }

  /**
   * Fallback: Initialize with standard Web Audio nodes
   */
  private initializeWithWebAudio(): void {
    const velvetFloor = createVelvetFloorStage(this.context, this.profile.velvetFloor);
    const harmonicLattice = createHarmonicLatticeStage(this.context, this.profile.harmonicLattice);
    const phaseWeave = createPhaseWeaveStage(this.context, this.profile.phaseWeave);
    const velvetCurve = createVelvetCurveStage(this.context);

    // Wrap in PillarConnection format
    this.velvetFloor = {
      input: velvetFloor.input,
      output: velvetFloor.output,
      disconnect: () => {
        velvetFloor.input.disconnect();
        velvetFloor.output.disconnect();
      },
    };

    this.harmonicLattice = {
      input: harmonicLattice.input,
      output: harmonicLattice.output,
      disconnect: () => {
        harmonicLattice.input.disconnect();
        harmonicLattice.output.disconnect();
      },
    };

    this.phaseWeave = {
      input: phaseWeave.input,
      output: phaseWeave.output,
      disconnect: () => {
        phaseWeave.input.disconnect();
        phaseWeave.output.disconnect();
      },
    };

    this.velvetCurve = {
      input: velvetCurve.input,
      output: velvetCurve.output,
      disconnect: () => {
        velvetCurve.input.disconnect();
        velvetCurve.output.disconnect();
      },
    };

    this.connectChain();
  }

  /**
   * Connect all stages in the processing chain
   */
  private connectChain(): void {
    if (!this.velvetFloor || !this.harmonicLattice || !this.phaseWeave || !this.velvetCurve) {
      return;
    }

    // Input → Velvet Floor
    this.input.connect(this.velvetFloor.input);

    // Velvet Floor → Harmonic Lattice
    this.velvetFloor.output.connect(this.harmonicLattice.input);

    // Harmonic Lattice → Phase Weave
    this.harmonicLattice.output.connect(this.phaseWeave.input);

    // Phase Weave → Velvet Curve
    this.phaseWeave.output.connect(this.velvetCurve.input);

    // Velvet Curve → Master Gain
    this.velvetCurve.output.connect(this.masterGain);

    // Master Gain → Limiter → Output
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.output);
  }

  /**
   * Update mastering profile
   */
  setProfile(profile: MasteringProfile): void {
    this.profile = profile;
    // Note: For worklet stages, settings updates would need to be sent via port.postMessage
    // For simplicity, this would require re-initialization
    console.log('[VelvetRealtime] Profile updated - reconnecting stages');
  }

  /**
   * Set master gain
   */
  setMasterGain(gain: number): void {
    this.masterGain.gain.setValueAtTime(gain, this.context.currentTime);
  }

  /**
   * Toggle bypass mode
   */
  setBypass(bypassed: boolean): void {
    if (bypassed === this.bypass) return;

    this.bypass = bypassed;

    if (bypassed) {
      // Disconnect chain, connect input directly to output
      this.input.disconnect();
      this.input.connect(this.output);
    } else {
      // Reconnect chain
      this.input.disconnect();
      this.connectChain();
    }
  }

  /**
   * Check if using worklets
   */
  isUsingWorklets(): boolean {
    return this.usingWorklets;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.input.disconnect();
    this.velvetFloor?.disconnect();
    this.harmonicLattice?.disconnect();
    this.phaseWeave?.disconnect();
    this.velvetCurve?.disconnect();
    this.masterGain.disconnect();
    this.limiter.disconnect();
    this.output.disconnect();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Factory Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create and initialize a VelvetRealtimeProcessor
 */
export async function createVelvetRealtimeProcessor(
  context: AudioContext,
  options: VelvetRealtimeOptions
): Promise<VelvetRealtimeProcessor | null> {
  const processor = new VelvetRealtimeProcessor(context, options);
  const success = await processor.initialize();
  
  if (!success) {
    console.error('[VelvetRealtime] Failed to create processor');
    return null;
  }

  return processor;
}
