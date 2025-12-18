/**
 * ALS Sync Engine
 * 
 * Layer 6 of Flow Pulse → ALS Thermal Sync Engine.
 * The "physiology" layer — the DAW's nervous system.
 * 
 * This is the real magic: syncs Flow Pulse to ALS Thermal System
 * so the whole DAW breathes with the song.
 */

import { thermalState } from './thermalMap';
import { computeMomentum } from './momentum';
import { computePressure } from './pressure';
import { computeHarmony } from './harmony';
import { computeFlowPercent } from './flowPercent';
import type { StemMetadata } from '../import/metadata';
import type { FlowPulseResult } from '../pulse/flowPulseEngine';

export interface ALSSyncResult {
  pulse: number; // Pulse % (0-100)
  flow: number; // Flow % (0-100)
  temperature: string; // Thermal state ('cold' | 'warming' | 'warm' | 'hot' | 'blazing')
  momentum: number; // Momentum score (0-100)
  pressure: number; // Pressure score (0-100)
  harmony: number; // Harmony score (0-100)
}

/**
 * Sync ALS to Flow Pulse.
 * 
 * This runs once per Pulse update and computes all ALS metrics
 * from the current pulse value, metadata, and energy profile.
 * 
 * @param pulseValue - Current pulse value (0-100)
 * @param metadata - Stem metadata (includes BPM, transients, harmonics)
 * @param energy - Energy profile array (from computeEnergyProfile)
 * @param harmonicBoost - Harmonic boost value (0-100, optional)
 * @returns Complete ALS sync result
 */
export function syncALSToPulse(
  pulseValue: number,
  metadata: StemMetadata,
  energy: number[],
  harmonicBoost?: number
): ALSSyncResult {
  // Contextual check: Only compute values if there's actual audio
  // If pulse is 0 and no energy, return zero values
  const hasEnergy = energy.length > 0 && energy.some(e => e > 0.001);
  const hasPulse = pulseValue > 0.1;
  
  if (!hasEnergy && !hasPulse) {
    // No audio - return zero values
    return {
      pulse: 0,
      flow: 0,
      temperature: 'cold',
      momentum: 0,
      pressure: 0,
      harmony: 0,
    };
  }
  
  // Compute momentum from BPM and transients
  const momentum = computeMomentum(
    metadata.bpm,
    metadata.transients.length
  );
  
  // Compute pressure from energy profile
  const pressure = computePressure(energy);
  
  // Compute harmony from harmonic boost (use metadata harmonics if available)
  const effectiveHarmonicBoost = harmonicBoost !== undefined
    ? harmonicBoost
    : (metadata.headroom?.peakDB ? Math.abs(metadata.headroom.peakDB) / 2 : 0);
  
  const harmony = computeHarmony(effectiveHarmonicBoost);
  
  // Compute Flow % from all metrics
  const flow = computeFlowPercent({
    pulse: pulseValue,
    momentum,
    pressure,
    harmony,
  });
  
  // Map pulse to thermal state
  const temp = thermalState(pulseValue);
  
  return {
    pulse: Math.round(pulseValue),
    flow: Math.round(flow),
    temperature: temp,
    momentum: Math.round(momentum),
    pressure: Math.round(pressure),
    harmony: Math.round(harmony),
  };
}

/**
 * Sync ALS to Flow Pulse with full pulse result.
 * 
 * Uses the complete FlowPulseResult for more accurate sync.
 * 
 * @param pulseResult - Complete Flow Pulse result
 * @param metadata - Stem metadata
 * @returns Complete ALS sync result
 */
export function syncALSToPulseResult(
  pulseResult: FlowPulseResult,
  metadata: StemMetadata
): ALSSyncResult {
  // Use average pulse for overall sync
  const avgPulse = pulseResult.pulse.length > 0
    ? pulseResult.pulse.reduce((a, b) => a + b, 0) / pulseResult.pulse.length
    : 0;
  
  // Add harmonic boost to pulse value
  const totalPulse = Math.min(100, avgPulse + pulseResult.harmonicBoost);
  
  return syncALSToPulse(
    totalPulse,
    metadata,
    pulseResult.energy,
    pulseResult.harmonicBoost
  );
}

/**
 * Update global ALS object with sync result.
 * 
 * IMPORTANT: Only updates if there's actual audio playing.
 * This ensures ALS values are contextual - they only show when there's real sound.
 * 
 * @param syncResult - ALS sync result
 * @param hasAudio - Whether there's actual audio playing (from audioLevelDetector)
 */
export function updateGlobalALS(
  syncResult: ALSSyncResult,
  hasAudio: boolean = true
): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Initialize window.__als with ALL properties at zero
  window.__als = (window.__als || {
    flow: 0,
    temperature: 'cold',
    guidance: '',
    pulse: 0,
    momentum: 0,
    pressure: 0,
    harmony: 0,
  }) as any;
  
  // Initialize momentum, pressure, harmony to 0 if they don't exist
  if (!(window.__als as any).momentum) (window.__als as any).momentum = 0;
  if (!(window.__als as any).pressure) (window.__als as any).pressure = 0;
  if (!(window.__als as any).harmony) (window.__als as any).harmony = 0;
  
  // Only update if there's actual audio OR if values are being reset to zero
  // This ensures ALS is contextual - it only shows values when there's real sound
  if (hasAudio || (syncResult.pulse === 0 && syncResult.flow === 0 && syncResult.momentum === 0 && syncResult.harmony === 0)) {
    // Update all ALS properties
    window.__als!.pulse = syncResult.pulse;
    window.__als!.flow = syncResult.flow;
    window.__als!.temperature = syncResult.temperature;
    
    // Add new ALS properties
    (window.__als as any).momentum = syncResult.momentum;
    (window.__als as any).pressure = syncResult.pressure;
    (window.__als as any).harmony = syncResult.harmony;
  } else {
    // No audio - reset to zero
    window.__als!.pulse = 0;
    window.__als!.flow = 0;
    window.__als!.temperature = 'cold';
    (window.__als as any).momentum = 0;
    (window.__als as any).pressure = 0;
    (window.__als as any).harmony = 0;
  }
}

