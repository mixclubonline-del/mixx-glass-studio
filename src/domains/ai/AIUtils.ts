import { PrimeBrainALSChannel, PrimeBrainSnapshotInputs, PrimeBrainAIFlag, PrimeBrainMode } from '../../ai/PrimeBrainSnapshot';
import { PrimeBrainALSChannelState, PrimeBrainHealthTone, VelvetAnchorDescriptor, VelvetLensState } from '../../types/primeBrainStatus';
import { FourAnchors, calculateVelvetScore, getVelvetColor } from '../../types/sonic-architecture';

export const HEALTH_TONES: Record<PrimeBrainHealthTone['overall'], any> = {
  excellent: { color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.4)', temperature: 'cool', pulse: 0.2, flow: 0.8, energy: 0.1, caption: 'System harmonic.' },
  good: { color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.3)', temperature: 'warm', pulse: 0.3, flow: 0.7, energy: 0.3, caption: 'Flow is stable.' },
  fair: { color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.3)', temperature: 'warm', pulse: 0.5, flow: 0.5, energy: 0.6, caption: 'Pressure building.' },
  poor: { color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', temperature: 'hot', pulse: 0.8, flow: 0.3, energy: 0.8, caption: 'Sustained load.' },
  critical: { color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.6)', temperature: 'hot', pulse: 1.0, flow: 0.1, energy: 1.0, caption: 'Thermal ceiling.' },
};

export const MODE_CAPTIONS: Record<PrimeBrainMode, string> = {
  passive: 'Prime Brain listening for cues.',
  active: 'Prime Brain guiding in real-time.',
  learning: 'Prime Brain memorizing creator moves.',
  optimizing: 'Prime Brain easing system load.',
};

export const ALS_CHANNEL_STYLES: Record<PrimeBrainALSChannel, any> = {
  temperature: { low: 'Subzero', mid: 'Liquid', high: 'Ignited', peak: 'Plasma', accent: '#3b82f6', aura: 'rgba(59, 130, 246, 0.2)' },
  momentum: { low: 'Static', mid: 'Drifting', high: 'Driving', peak: 'Warp', accent: '#a855f7', aura: 'rgba(168, 85, 247, 0.2)' },
  pressure: { low: 'Vacuum', mid: 'Balanced', high: 'Crushed', peak: 'Solid', accent: '#f97316', aura: 'rgba(249, 115, 22, 0.2)' },
  harmony: { low: 'Neutral', mid: 'Resonant', high: 'Luminous', peak: 'Absolute', accent: '#10b981', aura: 'rgba(16, 185, 129, 0.2)' },
};

export const ANCHOR_STYLES: Record<keyof FourAnchors, any> = {
  body: { label: 'Body', accents: ['#2563eb', '#38bdf8', '#f97316'], descriptors: ['Featherlight', 'Grounded', 'Thunderous'] },
  soul: { label: 'Soul', accents: ['#7c3aed', '#c084fc', '#f472b6'], descriptors: ['Muted', 'Glowing', 'Radiant'] },
  air: { label: 'Air', accents: ['#0ea5e9', '#38bdf8', '#a855f7'], descriptors: ['Closed', 'Shining', 'Celestial'] },
  silk: { label: 'Silk', accents: ['#8b5cf6', '#c4b5fd', '#f9a8d4'], descriptors: ['Raw', 'Polished', 'Velvet'] },
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const describeAlsChannel = (channel: PrimeBrainALSChannel, value: number): PrimeBrainALSChannelState => {
  const style = ALS_CHANNEL_STYLES[channel];
  const normalized = clamp01(value);
  let descriptor = style.low;
  if (normalized >= 0.85) descriptor = style.peak;
  else if (normalized >= 0.65) descriptor = style.high;
  else if (normalized >= 0.35) descriptor = style.mid;
  
  return { channel, value: normalized, descriptor, accent: style.accent, aura: style.aura };
};

export const derivePrimeBrainHealth = (metrics: PrimeBrainSnapshotInputs['audioMetrics'], flags: PrimeBrainAIFlag[]): PrimeBrainHealthTone => {
  const cpuLoad = metrics.cpuLoad ?? 0;
  const dropouts = metrics.dropoutsPerMinute ?? 0;
  const hasCritical = flags.some(f => f.severity === 'critical');
  const hasWarn = flags.some(f => f.severity === 'warn');

  let overall: PrimeBrainHealthTone['overall'] = 'excellent';
  if (hasCritical || cpuLoad > 0.92 || dropouts > 3) overall = 'critical';
  else if (cpuLoad > 0.85 || dropouts > 2) overall = 'poor';
  else if (hasWarn || cpuLoad > 0.7 || dropouts > 1) overall = 'fair';
  else if (cpuLoad > 0.45) overall = 'good';

  const tone = HEALTH_TONES[overall];
  return { overall, ...tone };
};

export const describeAnchor = (key: keyof FourAnchors, value: number): VelvetAnchorDescriptor => {
  const style = ANCHOR_STYLES[key];
  let index = 0;
  if (value >= 72) index = 2;
  else if (value >= 38) index = 1;
  return { key, label: style.label, descriptor: style.descriptors[index], accent: style.accents[index] };
};

export const deriveVelvetLensState = (analysis: FourAnchors | null): VelvetLensState => {
  if (!analysis) return {
    label: 'Listening',
    gradient: 'from-indigo-500 via-purple-500 to-cyan-500',
    tagline: 'Prime Brain awaiting anchors to settle.',
    anchors: (['body', 'soul', 'air', 'silk'] as Array<keyof FourAnchors>).map(k => describeAnchor(k, 0))
  };

  const anchors = (['body', 'soul', 'air', 'silk'] as Array<keyof FourAnchors>).map(k => describeAnchor(k, analysis[k]));
  const velvetScore = calculateVelvetScore(analysis);
  const velvetColor = getVelvetColor(velvetScore);

  let label = 'Anchors Aligning';
  let tagline = 'Mix fabric is settling into comfort.';
  if (analysis.silk > 72 && analysis.soul > 64) { label = 'Velvet Steady'; tagline = 'Silk and soul are hugging the mix fabric.'; }
  else if (analysis.body > 68) { label = 'Low Anchor Driving'; tagline = 'Body is delivering club weight through the floor.'; }
  else if (analysis.air > 70) { label = 'Air Drifting'; tagline = 'Air anchor is lifting the scene into glow.'; }

  return { label, gradient: velvetColor.gradient, tagline, anchors };
};
