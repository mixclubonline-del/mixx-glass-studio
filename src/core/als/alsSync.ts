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
 * @param syncResult - ALS sync result
 */
export function updateGlobalALS(syncResult: ALSSyncResult): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  window.__als = window.__als || {
    flow: 0,
    temperature: 'cold',
    guidance: '',
    pulse: 0,
  };
  
  // Update all ALS properties
  window.__als.pulse = syncResult.pulse;
  window.__als.flow = syncResult.flow;
  window.__als.temperature = syncResult.temperature;
  
  // Add new ALS properties
  (window.__als as any).momentum = syncResult.momentum;
  (window.__als as any).pressure = syncResult.pressure;
  (window.__als as any).harmony = syncResult.harmony;
}

