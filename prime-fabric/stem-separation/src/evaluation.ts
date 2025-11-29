/**
 * Evaluation System for Stem Separation Quality
 * 
 * Measures separation quality using standard metrics:
 * - SDR (Signal-to-Distortion Ratio)
 * - SIR (Signal-to-Interference Ratio)
 * - SAR (Signal-to-Artifacts Ratio)
 */

import { SanitizedStemRecord } from './schema.js';

export interface EvaluationMetrics {
  sdr: number; // Signal-to-Distortion Ratio (dB)
  sir: number; // Signal-to-Interference Ratio (dB)
  sar: number; // Signal-to-Artifacts Ratio (dB)
  overall: number; // Overall quality score (0-1)
}

export interface EvaluationReport {
  recordId: string;
  metrics: EvaluationMetrics;
  stemMetrics: Record<string, EvaluationMetrics>;
  timestamp: string;
}

/**
 * Evaluate separation quality for a single record
 */
export function evaluateSeparation(record: SanitizedStemRecord): EvaluationReport {
  // Calculate metrics for each stem
  const stemMetrics: Record<string, EvaluationMetrics> = {};
  
  if (record.groundTruthFeatures) {
    Object.keys(record.groundTruthFeatures).forEach(stemType => {
      const groundTruth = record.groundTruthFeatures![stemType as keyof typeof record.groundTruthFeatures];
      if (groundTruth) {
        stemMetrics[stemType] = calculateMetrics(
          new Float32Array(groundTruth),
          record.quantumFeatures
        );
      }
    });
  }
  
  // Calculate overall metrics (average across stems)
  const overallMetrics = calculateOverallMetrics(stemMetrics);
  
  return {
    recordId: record.id,
    metrics: overallMetrics,
    stemMetrics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate SDR, SIR, SAR metrics
 * (Simplified implementation - full version would use reference signals)
 */
function calculateMetrics(
  groundTruth: Float32Array,
  features: SanitizedStemRecord['quantumFeatures']
): EvaluationMetrics {
  // Simplified metric calculation
  // Real implementation would compare separated stems to ground truth
  
  // Signal energy
  const signalEnergy = calculateEnergy(groundTruth);
  
  // Estimate distortion from feature analysis
  const distortion = estimateDistortion(features);
  const interference = estimateInterference(features);
  const artifacts = estimateArtifacts(features);
  
  // Calculate ratios (in dB)
  const sdr = signalEnergy > 0 ? 10 * Math.log10(signalEnergy / (distortion + 1e-10)) : -Infinity;
  const sir = signalEnergy > 0 ? 10 * Math.log10(signalEnergy / (interference + 1e-10)) : -Infinity;
  const sar = signalEnergy > 0 ? 10 * Math.log10(signalEnergy / (artifacts + 1e-10)) : -Infinity;
  
  // Overall quality (normalized 0-1)
  const overall = normalizeQualityScore(sdr, sir, sar);
  
  return { sdr, sir, sar, overall };
}

function calculateEnergy(signal: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < signal.length; i++) {
    sum += signal[i] * signal[i];
  }
  return Math.sqrt(sum / signal.length);
}

function estimateDistortion(features: SanitizedStemRecord['quantumFeatures']): number {
  // Estimate distortion from feature analysis
  // Simplified - real implementation would analyze actual separation artifacts
  const spectralVariance = calculateVariance(features.spectral);
  return spectralVariance * 0.1; // Scaling factor
}

function estimateInterference(features: SanitizedStemRecord['quantumFeatures']): number {
  // Estimate interference from other stems
  const stereoCorrelation = features.stereo[0] || 0;
  return (1 - Math.abs(stereoCorrelation)) * 0.1;
}

function estimateArtifacts(features: SanitizedStemRecord['quantumFeatures']): number {
  // Estimate artifacts from percussive/harmonic leakage
  const percEnergy = calculateEnergy(new Float32Array(features.percussive));
  const harmEnergy = calculateEnergy(new Float32Array(features.harmonic));
  const leakage = Math.abs(percEnergy - harmEnergy);
  return leakage * 0.05;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

function normalizeQualityScore(sdr: number, sir: number, sar: number): number {
  // Normalize to 0-1 range
  // Typical good separation: SDR > 10dB, SIR > 15dB, SAR > 10dB
  const normalizedSdr = Math.max(0, Math.min(1, (sdr + 20) / 40)); // -20 to 20 dB
  const normalizedSir = Math.max(0, Math.min(1, (sir + 20) / 40));
  const normalizedSar = Math.max(0, Math.min(1, (sar + 20) / 40));
  
  // Weighted average
  return (normalizedSdr * 0.4 + normalizedSir * 0.4 + normalizedSar * 0.2);
}

function calculateOverallMetrics(
  stemMetrics: Record<string, EvaluationMetrics>
): EvaluationMetrics {
  const stems = Object.values(stemMetrics);
  if (stems.length === 0) {
    return { sdr: 0, sir: 0, sar: 0, overall: 0 };
  }
  
  const avgSdr = stems.reduce((sum, m) => sum + m.sdr, 0) / stems.length;
  const avgSir = stems.reduce((sum, m) => sum + m.sir, 0) / stems.length;
  const avgSar = stems.reduce((sum, m) => sum + m.sar, 0) / stems.length;
  const avgOverall = stems.reduce((sum, m) => sum + m.overall, 0) / stems.length;
  
  return {
    sdr: avgSdr,
    sir: avgSir,
    sar: avgSar,
    overall: avgOverall,
  };
}

