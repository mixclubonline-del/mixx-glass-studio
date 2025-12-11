/**
 * FIVE PILLARS WASM BRIDGE
 * 
 * Provides WASM/AudioWorklet-accelerated Five Pillars stages
 * with graceful fallback to JS implementation.
 * 
 * @author Prime (Mixx Club)
 * @version 1.0.0 - Phase 3 WASM DSP
 */

import {
  HarmonicLatticeSettings,
  PhaseWeaveSettings,
  VelvetFloorSettings,
  type PillarStage,
} from '../fivePillars';
import { getWASMDSPManager, isWorkletActive } from '../../core/wasm/WASMDSPManager';
import { scheduleAudioTask } from '../../core/quantum';

/**
 * Create Velvet Floor stage with WASM/AudioWorklet acceleration
 */
export async function createVelvetFloorStageWASM(
  ctx: AudioContext,
  settings: VelvetFloorSettings
): Promise<PillarStage<VelvetFloorSettings> | null> {
  const dspManager = getWASMDSPManager();
  const status = dspManager.getStatus();
  
  // Only use WASM/Worklet if available and initialized
  if (!status.initialized || !isWorkletActive()) {
    return null; // Fallback to JS implementation
  }
  
  try {
    // Load AudioWorklet processor
    await ctx.audioWorklet.addModule(
      new URL('../../worklets/velvet-floor-processor.js', import.meta.url)
    );
    
    // Create AudioWorkletNode
    const processor = new AudioWorkletNode(ctx, 'velvet-floor-processor', {
      parameterData: {
        warmth: settings.warmth / 100,
        depth: settings.depth / 100,
        frequency: 150,
        q: 0.7,
      },
    });
    
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    input.connect(processor);
    processor.connect(output);
    
    // Also connect dry path for coherence
    input.connect(output);
    
    const setSettings = (next: VelvetFloorSettings) => {
      processor.parameters.get('warmth')?.setTargetAtTime(
        next.warmth / 100,
        ctx.currentTime,
        0.01
      );
      processor.parameters.get('depth')?.setTargetAtTime(
        next.depth / 100,
        ctx.currentTime,
        0.01
      );
      processor.parameters.get('frequency')?.setTargetAtTime(
        150,
        ctx.currentTime,
        0.01
      );
      processor.parameters.get('q')?.setTargetAtTime(
        0.7,
        ctx.currentTime,
        0.01
      );
    };
    
    setSettings(settings);
    
    return { input, output, setSettings };
  } catch (error) {
    console.warn('[Velvet Floor WASM] Failed to create AudioWorklet, falling back to JS:', error);
    return null; // Fallback to JS implementation
  }
}

/**
 * Create Harmonic Lattice stage with WASM/AudioWorklet acceleration
 */
export async function createHarmonicLatticeStageWASM(
  ctx: AudioContext,
  settings: HarmonicLatticeSettings
): Promise<PillarStage<HarmonicLatticeSettings> | null> {
  // TODO: Implement AudioWorklet processor for Harmonic Lattice
  // For now, return null to use JS fallback
  return null;
}

/**
 * Create Phase Weave stage with WASM/AudioWorklet acceleration
 */
export async function createPhaseWeaveStageWASM(
  ctx: AudioContext,
  settings: PhaseWeaveSettings
): Promise<PillarStage<PhaseWeaveSettings> | null> {
  // TODO: Implement AudioWorklet processor for Phase Weave
  // For now, return null to use JS fallback
  return null;
}

/**
 * Create Velvet Curve stage with WASM/AudioWorklet acceleration
 */
export async function createVelvetCurveStageWASM(
  ctx: AudioContext
): Promise<{ input: AudioNode; output: AudioNode } | null> {
  // TODO: Implement AudioWorklet processor for Velvet Curve
  // For now, return null to use JS fallback
  return null;
}

/**
 * Wrapper that tries WASM/Worklet first, falls back to JS
 */
export async function createVelvetFloorStageWithFallback(
  ctx: BaseAudioContext,
  settings: VelvetFloorSettings
): Promise<PillarStage<VelvetFloorSettings>> {
  // Try WASM/Worklet if AudioContext (not OfflineAudioContext)
  if (ctx instanceof AudioContext) {
    const wasmStage = await createVelvetFloorStageWASM(ctx, settings);
    if (wasmStage) {
      return wasmStage;
    }
  }
  
  // Fallback to JS implementation
  const { createVelvetFloorStage } = await import('../fivePillars');
  return createVelvetFloorStage(ctx, settings);
}

