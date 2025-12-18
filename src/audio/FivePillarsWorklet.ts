/**
 * FivePillarsWorklet
 * Phase 35: Five Pillars AudioWorklet Migration
 * 
 * TypeScript wrapper for all Five Pillars AudioWorklet processors.
 * Provides unified API for creating and managing worklet-based pillar stages.
 */

import {
  HarmonicLatticeSettings,
  PhaseWeaveSettings,
  VelvetFloorSettings,
} from '../types/sonic-architecture';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface WorkletPillarStage<TSettings> {
  node: AudioWorkletNode;
  input: AudioWorkletNode;
  output: AudioWorkletNode;
  setSettings: (settings: TSettings) => void;
  disconnect: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Worklet Registration
// ═══════════════════════════════════════════════════════════════════════════

const registeredWorklets = new Set<string>();
let registrationPromise: Promise<void> | null = null;

/**
 * Register all Five Pillars worklet modules
 */
export async function registerFivePillarsWorklets(
  context: AudioContext
): Promise<boolean> {
  if (!('audioWorklet' in context)) {
    console.warn('[FivePillarsWorklet] AudioWorklet not supported');
    return false;
  }

  if (registrationPromise) {
    await registrationPromise;
    return registeredWorklets.size === 4;
  }

  registrationPromise = (async () => {
    const worklets = [
      { name: 'velvet-floor-processor', url: '../worklets/velvet-floor-processor.js' },
      { name: 'harmonic-lattice-processor', url: '../worklets/harmonic-lattice-processor.js' },
      { name: 'phase-weave-processor', url: '../worklets/phase-weave-processor.js' },
      { name: 'velvet-curve-processor', url: '../worklets/velvet-curve-processor.js' },
    ];

    for (const worklet of worklets) {
      if (registeredWorklets.has(worklet.name)) continue;

      try {
        await context.audioWorklet.addModule(
          new URL(worklet.url, import.meta.url)
        );
        registeredWorklets.add(worklet.name);
        console.log(`[FivePillarsWorklet] Registered ${worklet.name}`);
      } catch (error) {
        console.warn(`[FivePillarsWorklet] Failed to register ${worklet.name}:`, error);
      }
    }
  })();

  await registrationPromise;
  registrationPromise = null;
  return registeredWorklets.size === 4;
}

// ═══════════════════════════════════════════════════════════════════════════
// Velvet Floor Worklet Stage
// ═══════════════════════════════════════════════════════════════════════════

export async function createVelvetFloorWorklet(
  context: AudioContext,
  settings: VelvetFloorSettings
): Promise<WorkletPillarStage<VelvetFloorSettings> | null> {
  if (!registeredWorklets.has('velvet-floor-processor')) {
    await registerFivePillarsWorklets(context);
  }

  if (!registeredWorklets.has('velvet-floor-processor')) {
    return null;
  }

  try {
    const node = new AudioWorkletNode(context, 'velvet-floor-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    const setSettings = (next: VelvetFloorSettings) => {
      node.parameters.get('warmth')?.setValueAtTime(next.warmth / 100, context.currentTime);
      node.parameters.get('depth')?.setValueAtTime(next.depth / 100, context.currentTime);
    };

    setSettings(settings);

    return {
      node,
      input: node,
      output: node,
      setSettings,
      disconnect: () => node.disconnect(),
    };
  } catch (error) {
    console.error('[FivePillarsWorklet] Failed to create Velvet Floor:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Harmonic Lattice Worklet Stage
// ═══════════════════════════════════════════════════════════════════════════

export async function createHarmonicLatticeWorklet(
  context: AudioContext,
  settings: HarmonicLatticeSettings
): Promise<WorkletPillarStage<HarmonicLatticeSettings> | null> {
  if (!registeredWorklets.has('harmonic-lattice-processor')) {
    await registerFivePillarsWorklets(context);
  }

  if (!registeredWorklets.has('harmonic-lattice-processor')) {
    return null;
  }

  try {
    const node = new AudioWorkletNode(context, 'harmonic-lattice-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    const getCharacterValue = (character: string): number => {
      switch (character) {
        case 'vintage': return 0.6;
        case 'warm': return 0.4;
        case 'bright': return 0.2;
        case 'neutral': return 0.1;
        default: return 0.1;
      }
    };

    const setSettings = (next: HarmonicLatticeSettings) => {
      node.parameters.get('presence')?.setValueAtTime(next.presence, context.currentTime);
      node.parameters.get('airiness')?.setValueAtTime(next.airiness, context.currentTime);
      node.parameters.get('character')?.setValueAtTime(
        getCharacterValue(next.character),
        context.currentTime
      );
    };

    setSettings(settings);

    return {
      node,
      input: node,
      output: node,
      setSettings,
      disconnect: () => node.disconnect(),
    };
  } catch (error) {
    console.error('[FivePillarsWorklet] Failed to create Harmonic Lattice:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase Weave Worklet Stage
// ═══════════════════════════════════════════════════════════════════════════

export async function createPhaseWeaveWorklet(
  context: AudioContext,
  settings: PhaseWeaveSettings
): Promise<WorkletPillarStage<PhaseWeaveSettings> | null> {
  if (!registeredWorklets.has('phase-weave-processor')) {
    await registerFivePillarsWorklets(context);
  }

  if (!registeredWorklets.has('phase-weave-processor')) {
    return null;
  }

  try {
    const node = new AudioWorkletNode(context, 'phase-weave-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    const setSettings = (next: PhaseWeaveSettings) => {
      node.parameters.get('width')?.setValueAtTime(next.width, context.currentTime);
    };

    setSettings(settings);

    return {
      node,
      input: node,
      output: node,
      setSettings,
      disconnect: () => node.disconnect(),
    };
  } catch (error) {
    console.error('[FivePillarsWorklet] Failed to create Phase Weave:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Velvet Curve Worklet Stage
// ═══════════════════════════════════════════════════════════════════════════

interface VelvetCurveSettings {
  crossoverFreq?: number;
  lowThreshold?: number;
  lowRatio?: number;
  attack?: number;
  release?: number;
}

export async function createVelvetCurveWorklet(
  context: AudioContext,
  settings: VelvetCurveSettings = {}
): Promise<WorkletPillarStage<VelvetCurveSettings> | null> {
  if (!registeredWorklets.has('velvet-curve-processor')) {
    await registerFivePillarsWorklets(context);
  }

  if (!registeredWorklets.has('velvet-curve-processor')) {
    return null;
  }

  try {
    const node = new AudioWorkletNode(context, 'velvet-curve-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    const setSettings = (next: VelvetCurveSettings) => {
      if (next.crossoverFreq !== undefined) {
        node.parameters.get('crossoverFreq')?.setValueAtTime(next.crossoverFreq, context.currentTime);
      }
      if (next.lowThreshold !== undefined) {
        node.parameters.get('lowThreshold')?.setValueAtTime(next.lowThreshold, context.currentTime);
      }
      if (next.lowRatio !== undefined) {
        node.parameters.get('lowRatio')?.setValueAtTime(next.lowRatio, context.currentTime);
      }
      if (next.attack !== undefined) {
        node.parameters.get('attack')?.setValueAtTime(next.attack, context.currentTime);
      }
      if (next.release !== undefined) {
        node.parameters.get('release')?.setValueAtTime(next.release, context.currentTime);
      }
    };

    setSettings(settings);

    return {
      node,
      input: node,
      output: node,
      setSettings,
      disconnect: () => node.disconnect(),
    };
  } catch (error) {
    console.error('[FivePillarsWorklet] Failed to create Velvet Curve:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if all Five Pillars worklets are available
 */
export function areAllPillarsRegistered(): boolean {
  return registeredWorklets.size === 4;
}

/**
 * Get list of registered pillar worklets
 */
export function getRegisteredPillars(): string[] {
  return Array.from(registeredWorklets);
}
