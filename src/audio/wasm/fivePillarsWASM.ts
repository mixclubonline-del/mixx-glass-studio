/**
 * FIVE PILLARS WASM BRIDGE
 * 
 * Provides WASM/AudioWorklet-accelerated Five Pillars stages
 * with graceful fallback to JS implementation.
 * 
 * Phase 38: Complete WASM DSP Integration for all Five Pillars.
 * 
 * @author Prime (Mixx Club)
 * @version 2.0.0 - Phase 38 WASM DSP Integration
 */

import {
  HarmonicLatticeSettings,
  PhaseWeaveSettings,
  VelvetFloorSettings,
  type PillarStage,
} from '../fivePillars';
import { getWASMDSPManager, isWorkletActive } from '../../core/wasm/WASMDSPManager';

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
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
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
    };
    
    setSettings(settings);
    console.log('[WASM] ✅ Velvet Floor stage created with AudioWorklet');
    
    return { input, output, setSettings };
  } catch (error) {
    console.warn('[WASM] Velvet Floor worklet failed, using JS fallback:', error);
    return null;
  }
}

/**
 * Create Harmonic Lattice stage with WASM/AudioWorklet acceleration
 */
export async function createHarmonicLatticeStageWASM(
  ctx: AudioContext,
  settings: HarmonicLatticeSettings
): Promise<PillarStage<HarmonicLatticeSettings> | null> {
  const dspManager = getWASMDSPManager();
  const status = dspManager.getStatus();
  
  if (!status.initialized || !isWorkletActive()) {
    return null;
  }
  
  try {
    await ctx.audioWorklet.addModule(
      new URL('../../worklets/harmonic-lattice-processor.js', import.meta.url)
    );
    
    const processor = new AudioWorkletNode(ctx, 'harmonic-lattice-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: {
        presence: settings.presence,
        airiness: settings.airiness,
        character: settings.character === 'neutral' ? 0.1 :
                   settings.character === 'bright' ? 0.2 :
                   settings.character === 'warm' ? 0.4 : 0.6,
      },
    });
    
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    input.connect(processor);
    processor.connect(output);
    
    const setSettings = (next: HarmonicLatticeSettings) => {
      processor.parameters.get('presence')?.setTargetAtTime(
        next.presence,
        ctx.currentTime,
        0.01
      );
      processor.parameters.get('airiness')?.setTargetAtTime(
        next.airiness,
        ctx.currentTime,
        0.01
      );
      const charValue = next.character === 'neutral' ? 0.1 :
                        next.character === 'bright' ? 0.2 :
                        next.character === 'warm' ? 0.4 : 0.6;
      processor.parameters.get('character')?.setTargetAtTime(
        charValue,
        ctx.currentTime,
        0.01
      );
    };
    
    setSettings(settings);
    console.log('[WASM] ✅ Harmonic Lattice stage created with AudioWorklet');
    
    return { input, output, setSettings };
  } catch (error) {
    console.warn('[WASM] Harmonic Lattice worklet failed, using JS fallback:', error);
    return null;
  }
}

/**
 * Create Phase Weave stage with WASM/AudioWorklet acceleration
 */
export async function createPhaseWeaveStageWASM(
  ctx: AudioContext,
  settings: PhaseWeaveSettings
): Promise<PillarStage<PhaseWeaveSettings> | null> {
  const dspManager = getWASMDSPManager();
  const status = dspManager.getStatus();
  
  if (!status.initialized || !isWorkletActive()) {
    return null;
  }
  
  try {
    await ctx.audioWorklet.addModule(
      new URL('../../worklets/phase-weave-processor.js', import.meta.url)
    );
    
    const processor = new AudioWorkletNode(ctx, 'phase-weave-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: {
        width: settings.width,
        monoBelow: settings.monoCompatibility ?? 0,
      },
    });
    
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    input.connect(processor);
    processor.connect(output);
    
    const setSettings = (next: PhaseWeaveSettings) => {
      processor.parameters.get('width')?.setTargetAtTime(
        next.width,
        ctx.currentTime,
        0.01
      );
      processor.parameters.get('monoBelow')?.setTargetAtTime(
        next.monoCompatibility ?? 0,
        ctx.currentTime,
        0.01
      );
    };
    
    setSettings(settings);
    console.log('[WASM] ✅ Phase Weave stage created with AudioWorklet');
    
    return { input, output, setSettings };
  } catch (error) {
    console.warn('[WASM] Phase Weave worklet failed, using JS fallback:', error);
    return null;
  }
}

/**
 * Create Velvet Curve stage with WASM/AudioWorklet acceleration
 */
export async function createVelvetCurveStageWASM(
  ctx: AudioContext
): Promise<{ input: AudioNode; output: AudioNode } | null> {
  const dspManager = getWASMDSPManager();
  const status = dspManager.getStatus();
  
  if (!status.initialized || !isWorkletActive()) {
    return null;
  }
  
  try {
    await ctx.audioWorklet.addModule(
      new URL('../../worklets/velvet-curve-processor.js', import.meta.url)
    );
    
    const processor = new AudioWorkletNode(ctx, 'velvet-curve-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: {
        crossoverFreq: 200,
        lowThreshold: -24,
        lowRatio: 3,
        attack: 0.01,
        release: 0.25,
      },
    });
    
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    input.connect(processor);
    processor.connect(output);
    
    console.log('[WASM] ✅ Velvet Curve stage created with AudioWorklet');
    
    return { input, output };
  } catch (error) {
    console.warn('[WASM] Velvet Curve worklet failed, using JS fallback:', error);
    return null;
  }
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

/**
 * Wrapper that tries WASM/Worklet first, falls back to JS for Harmonic Lattice
 */
export async function createHarmonicLatticeStageWithFallback(
  ctx: BaseAudioContext,
  settings: HarmonicLatticeSettings
): Promise<PillarStage<HarmonicLatticeSettings>> {
  if (ctx instanceof AudioContext) {
    const wasmStage = await createHarmonicLatticeStageWASM(ctx, settings);
    if (wasmStage) {
      return wasmStage;
    }
  }
  
  const { createHarmonicLatticeStage } = await import('../fivePillars');
  return createHarmonicLatticeStage(ctx, settings);
}

/**
 * Wrapper that tries WASM/Worklet first, falls back to JS for Phase Weave
 */
export async function createPhaseWeaveStageWithFallback(
  ctx: BaseAudioContext,
  settings: PhaseWeaveSettings
): Promise<PillarStage<PhaseWeaveSettings>> {
  if (ctx instanceof AudioContext) {
    const wasmStage = await createPhaseWeaveStageWASM(ctx, settings);
    if (wasmStage) {
      return wasmStage;
    }
  }
  
  const { createPhaseWeaveStage } = await import('../fivePillars');
  return createPhaseWeaveStage(ctx, settings);
}

/**
 * Wrapper that tries WASM/Worklet first, falls back to JS for Velvet Curve
 */
export async function createVelvetCurveStageWithFallback(
  ctx: BaseAudioContext
): Promise<{ input: AudioNode; output: AudioNode }> {
  if (ctx instanceof AudioContext) {
    const wasmStage = await createVelvetCurveStageWASM(ctx);
    if (wasmStage) {
      return wasmStage;
    }
  }
  
  const { createVelvetCurveStage } = await import('../fivePillars');
  return createVelvetCurveStage(ctx);
}


