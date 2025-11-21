/**
 * MIXER CONSOLE AUDIT & CALIBRATION SYSTEM
 * 
 * Comprehensive diagnostic and calibration tool for the Flow Console mixer.
 * Verifies all routing, controls, and signal flow integrity.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 * @version 1.0.0
 */

import type { VelvetMasterChain } from '../audio/masterChain';

export interface MixerAuditResult {
  timestamp: number;
  overall: 'pass' | 'warning' | 'fail';
  summary: string;
  sections: {
    routing: RoutingAudit;
    controls: ControlsAudit;
    sends: SendsAudit;
    inserts: InsertsAudit;
    metering: MeteringAudit;
    gainStaging: GainStagingAudit;
  };
  recommendations: string[];
  criticalIssues: string[];
}

export interface RoutingAudit {
  status: 'pass' | 'warning' | 'fail';
  trackRouting: {
    [trackId: string]: {
      hasInput: boolean;
      hasGain: boolean;
      hasPanner: boolean;
      hasAnalyser: boolean;
      connectedToMaster: boolean;
      issues: string[];
    };
  };
  masterRouting: {
    hasMasterInput: boolean;
    hasMasterOutput: boolean;
    hasMasterGain: boolean;
    connectedToDestination: boolean;
    issues: string[];
  };
  issues: string[];
}

export interface ControlsAudit {
  status: 'pass' | 'warning' | 'fail';
  volumeControls: {
    trackVolumes: { [trackId: string]: number };
    masterVolume: number;
    issues: string[];
  };
  panControls: {
    trackPans: { [trackId: string]: number };
    masterBalance: number;
    issues: string[];
  };
  muteSolo: {
    mutedTracks: string[];
    soloedTracks: string[];
    issues: string[];
  };
  issues: string[];
}

export interface SendsAudit {
  status: 'pass' | 'warning' | 'fail';
  sendLevels: { [trackId: string]: { [busId: string]: number } };
  busDefinitions: string[];
  issues: string[];
}

export interface InsertsAudit {
  status: 'pass' | 'warning' | 'fail';
  insertChains: { [trackId: string]: string[] };
  fxNodes: { [fxId: string]: { exists: boolean; initialized: boolean } };
  issues: string[];
}

export interface MeteringAudit {
  status: 'pass' | 'warning' | 'fail';
  trackMeters: { [trackId: string]: { exists: boolean; active: boolean } };
  masterMeter: { exists: boolean; active: boolean };
  alsFeedback: { active: boolean };
  issues: string[];
}

export interface GainStagingAudit {
  status: 'pass' | 'warning' | 'fail';
  trackGains: { [trackId: string]: number };
  masterGain: number;
  totalGain: number;
  headroom: number;
  issues: string[];
  recommendations: string[];
}

export interface MixerAuditContext {
  trackNodes: Record<string, {
    input?: AudioNode;
    gain?: GainNode;
    panner?: StereoPannerNode;
    analyser?: AnalyserNode;
    preFaderMeter?: AnalyserNode;
  }>;
  masterChain: VelvetMasterChain | null;
  mixerSettings: Record<string, {
    volume: number;
    pan: number;
    isMuted: boolean;
  }>;
  masterVolume: number;
  masterBalance: number;
  soloedTracks: Set<string>;
  trackSendLevels: Record<string, Record<string, number>>;
  inserts: Record<string, string[]>;
  fxNodes: Record<string, { input?: AudioNode; output?: AudioNode }>;
  audioContext: AudioContext | null;
}

/**
 * Run comprehensive mixer console audit
 */
export function auditMixerConsole(context: MixerAuditContext): MixerAuditResult {
  const timestamp = Date.now();
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  // 1. ROUTING AUDIT
  const routingAudit = auditRouting(context);
  if (routingAudit.status === 'fail') {
    criticalIssues.push('Routing failures detected - audio may not reach output');
  }

  // 2. CONTROLS AUDIT
  const controlsAudit = auditControls(context);
  if (controlsAudit.status === 'fail') {
    criticalIssues.push('Control failures detected - mixer controls may not function');
  }

  // 3. SENDS AUDIT
  const sendsAudit = auditSends(context);
  if (sendsAudit.status === 'fail') {
    recommendations.push('Send routing issues detected - check bus connections');
  }

  // 4. INSERTS AUDIT
  const insertsAudit = auditInserts(context);
  if (insertsAudit.status === 'fail') {
    recommendations.push('Insert routing issues detected - check FX chain connections');
  }

  // 5. METERING AUDIT
  const meteringAudit = auditMetering(context);
  if (meteringAudit.status === 'fail') {
    recommendations.push('Metering issues detected - meters may not display correctly');
  }

  // 6. GAIN STAGING AUDIT
  const gainStagingAudit = auditGainStaging(context);
  if (gainStagingAudit.status === 'fail') {
    criticalIssues.push('Gain staging issues detected - risk of clipping or silence');
  }
  recommendations.push(...gainStagingAudit.recommendations);

  // Determine overall status
  const hasCriticalFailures = criticalIssues.length > 0 || 
    routingAudit.status === 'fail' || 
    controlsAudit.status === 'fail' || 
    gainStagingAudit.status === 'fail';
  
  const hasWarnings = routingAudit.status === 'warning' || 
    controlsAudit.status === 'warning' || 
    sendsAudit.status === 'warning' || 
    insertsAudit.status === 'warning' || 
    meteringAudit.status === 'warning' || 
    gainStagingAudit.status === 'warning';

  const overall: 'pass' | 'warning' | 'fail' = hasCriticalFailures ? 'fail' : 
    hasWarnings ? 'warning' : 'pass';

  const summary = hasCriticalFailures 
    ? `❌ ${criticalIssues.length} critical issue(s) found - mixer may not function correctly`
    : hasWarnings
    ? `⚠️ ${recommendations.length} recommendation(s) - mixer functional but may need calibration`
    : `✅ All systems operational - mixer console ready`;

  return {
    timestamp,
    overall,
    summary,
    sections: {
      routing: routingAudit,
      controls: controlsAudit,
      sends: sendsAudit,
      inserts: insertsAudit,
      metering: meteringAudit,
      gainStaging: gainStagingAudit,
    },
    recommendations,
    criticalIssues,
  };
}

function auditRouting(context: MixerAuditContext): RoutingAudit {
  const issues: string[] = [];
  const trackRouting: RoutingAudit['trackRouting'] = {};

  // Audit each track's routing
  Object.entries(context.trackNodes).forEach(([trackId, nodes]) => {
    const trackIssues: string[] = [];
    
    if (!nodes.input) trackIssues.push('Missing input node');
    if (!nodes.gain) trackIssues.push('Missing gain node');
    if (!nodes.panner) trackIssues.push('Missing panner node');
    if (!nodes.analyser) trackIssues.push('Missing analyser node');
    
    // Check if track is connected to master (indirect check)
    const connectedToMaster = !!context.masterChain?.input && !!nodes.panner;
    
    trackRouting[trackId] = {
      hasInput: !!nodes.input,
      hasGain: !!nodes.gain,
      hasPanner: !!nodes.panner,
      hasAnalyser: !!nodes.analyser,
      connectedToMaster,
      issues: trackIssues,
    };

    if (trackIssues.length > 0) {
      issues.push(`Track ${trackId}: ${trackIssues.join(', ')}`);
    }
  });

  // Audit master routing
  const masterIssues: string[] = [];
  if (!context.masterChain) {
    masterIssues.push('Master chain not initialized');
  } else {
    if (!context.masterChain.input) masterIssues.push('Missing master input');
    if (!context.masterChain.output) masterIssues.push('Missing master output');
    if (!context.masterChain.masterGain) masterIssues.push('Missing master gain');
  }

  const status: 'pass' | 'warning' | 'fail' = 
    issues.length > 0 || masterIssues.length > 0 ? 'fail' : 'pass';

  return {
    status,
    trackRouting,
    masterRouting: {
      hasMasterInput: !!context.masterChain?.input,
      hasMasterOutput: !!context.masterChain?.output,
      hasMasterGain: !!context.masterChain?.masterGain,
      connectedToDestination: !!context.masterChain?.output, // Indirect check
      issues: masterIssues,
    },
    issues,
  };
}

function auditControls(context: MixerAuditContext): ControlsAudit {
  const issues: string[] = [];
  
  // Volume controls
  const trackVolumes: { [trackId: string]: number } = {};
  Object.entries(context.mixerSettings).forEach(([trackId, settings]) => {
    trackVolumes[trackId] = settings.volume;
    if (settings.volume === 0) {
      issues.push(`Track ${trackId}: Volume is 0 (silent)`);
    }
    if (settings.volume > 1.2) {
      issues.push(`Track ${trackId}: Volume exceeds 120% (risk of clipping)`);
    }
  });

  const masterVolume = context.masterVolume;
  if (masterVolume === 0) {
    issues.push('Master volume is 0 (no output)');
  }
  if (masterVolume > 1.2) {
    issues.push('Master volume exceeds 120% (risk of clipping)');
  }

  // Pan controls
  const trackPans: { [trackId: string]: number } = {};
  Object.entries(context.mixerSettings).forEach(([trackId, settings]) => {
    trackPans[trackId] = settings.pan;
    if (Math.abs(settings.pan) > 1) {
      issues.push(`Track ${trackId}: Pan value out of range (${settings.pan})`);
    }
  });

  if (Math.abs(context.masterBalance) > 1) {
    issues.push(`Master balance out of range (${context.masterBalance})`);
  }

  // Mute/Solo
  const mutedTracks: string[] = [];
  const soloedTracks: string[] = [];
  Object.entries(context.mixerSettings).forEach(([trackId, settings]) => {
    if (settings.isMuted) mutedTracks.push(trackId);
  });
  context.soloedTracks.forEach(trackId => soloedTracks.push(trackId));

  if (soloedTracks.length > 0 && mutedTracks.length > 0) {
    issues.push('Both solo and mute active - may cause unexpected behavior');
  }

  const status: 'pass' | 'warning' | 'fail' = 
    issues.some(i => i.includes('out of range') || i.includes('no output')) ? 'fail' :
    issues.length > 0 ? 'warning' : 'pass';

  return {
    status,
    volumeControls: {
      trackVolumes,
      masterVolume,
      issues: issues.filter(i => i.includes('volume') || i.includes('Volume')),
    },
    panControls: {
      trackPans,
      masterBalance: context.masterBalance,
      issues: issues.filter(i => i.includes('pan') || i.includes('Pan') || i.includes('balance')),
    },
    muteSolo: {
      mutedTracks,
      soloedTracks,
      issues: issues.filter(i => i.includes('mute') || i.includes('solo')),
    },
    issues,
  };
}

function auditSends(context: MixerAuditContext): SendsAudit {
  const issues: string[] = [];
  const sendLevels = context.trackSendLevels || {};
  
  // Check for excessive send levels
  Object.entries(sendLevels).forEach(([trackId, sends]) => {
    Object.entries(sends).forEach(([busId, level]) => {
      if (level > 1.5) {
        issues.push(`Track ${trackId} → Bus ${busId}: Send level too high (${(level * 100).toFixed(0)}%)`);
      }
    });
  });

  const busDefinitions = Object.keys(sendLevels[Object.keys(sendLevels)[0]] || {});

  const status: 'pass' | 'warning' | 'fail' = 
    issues.length > 0 ? 'warning' : 'pass';

  return {
    status,
    sendLevels,
    busDefinitions,
    issues,
  };
}

function auditInserts(context: MixerAuditContext): InsertsAudit {
  const issues: string[] = [];
  const insertChains: { [trackId: string]: string[] } = {};
  const fxNodes: { [fxId: string]: { exists: boolean; initialized: boolean } } = {};

  Object.entries(context.inserts).forEach(([trackId, insertIds]) => {
    insertChains[trackId] = insertIds;
    
    insertIds.forEach(fxId => {
      const fxNode = context.fxNodes[fxId];
      if (!fxNode) {
        issues.push(`Track ${trackId}: FX ${fxId} node missing`);
      } else {
        fxNodes[fxId] = {
          exists: !!fxNode.input && !!fxNode.output,
          initialized: !!fxNode.input && !!fxNode.output,
        };
        if (!fxNode.input || !fxNode.output) {
          issues.push(`FX ${fxId}: Missing input or output node`);
        }
      }
    });
  });

  const status: 'pass' | 'warning' | 'fail' = 
    issues.length > 0 ? 'warning' : 'pass';

  return {
    status,
    insertChains,
    fxNodes,
    issues,
  };
}

function auditMetering(context: MixerAuditContext): MeteringAudit {
  const issues: string[] = [];
  const trackMeters: { [trackId: string]: { exists: boolean; active: boolean } } = {};

  Object.entries(context.trackNodes).forEach(([trackId, nodes]) => {
    const hasAnalyser = !!nodes.analyser;
    const hasPreFaderMeter = !!nodes.preFaderMeter;
    trackMeters[trackId] = {
      exists: hasAnalyser || hasPreFaderMeter,
      active: hasAnalyser || hasPreFaderMeter,
    };
    
    if (!hasAnalyser && !hasPreFaderMeter) {
      issues.push(`Track ${trackId}: No meter nodes found`);
    }
  });

  const masterMeter = {
    exists: !!context.masterChain?.analyser,
    active: !!context.masterChain?.analyser,
  };

  if (!masterMeter.exists) {
    issues.push('Master meter missing');
  }

  const status: 'pass' | 'warning' | 'fail' = 
    issues.length > 0 ? 'warning' : 'pass';

  return {
    status,
    trackMeters,
    masterMeter,
    alsFeedback: { active: true }, // Assume active if we're running audit
    issues,
  };
}

function auditGainStaging(context: MixerAuditContext): GainStagingAudit {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const trackGains: { [trackId: string]: number } = {};

  // Calculate track gains
  Object.entries(context.mixerSettings).forEach(([trackId, settings]) => {
    const trackGain = settings.volume;
    trackGains[trackId] = trackGain;
    
    if (trackGain > 1.0) {
      issues.push(`Track ${trackId}: Gain above unity (${(trackGain * 100).toFixed(0)}%)`);
      recommendations.push(`Consider reducing track ${trackId} volume to prevent clipping`);
    }
    if (trackGain < 0.1) {
      issues.push(`Track ${trackId}: Gain very low (${(trackGain * 100).toFixed(0)}%)`);
      recommendations.push(`Track ${trackId} may be too quiet - consider increasing volume`);
    }
  });

  const masterGain = context.masterVolume;
  const totalGain = Object.values(trackGains).reduce((sum, gain) => sum + gain, 0) / Object.keys(trackGains).length * masterGain;
  const headroom = 1.0 - totalGain;

  if (totalGain > 1.2) {
    issues.push(`Total system gain too high (${(totalGain * 100).toFixed(0)}%) - high risk of clipping`);
    recommendations.push('Reduce track volumes or master volume to prevent clipping');
  } else if (totalGain > 1.0) {
    issues.push(`Total system gain above unity (${(totalGain * 100).toFixed(0)}%) - monitor for clipping`);
    recommendations.push('Consider reducing gain slightly for headroom');
  }

  if (headroom < 0.1 && totalGain > 0.9) {
    recommendations.push('Low headroom - reduce gain to prevent clipping');
  }

  const status: 'pass' | 'warning' | 'fail' = 
    totalGain > 1.2 ? 'fail' :
    totalGain > 1.0 || issues.length > 0 ? 'warning' : 'pass';

  return {
    status,
    trackGains,
    masterGain,
    totalGain,
    headroom,
    issues,
    recommendations,
  };
}

/**
 * Log audit results to console
 */
export function logMixerAudit(result: MixerAuditResult): void {
  console.group('🔍 MIXER CONSOLE AUDIT');
  console.log(result.summary);
  console.log(`Overall Status: ${result.overall.toUpperCase()}`);
  
  if (result.criticalIssues.length > 0) {
    console.group('❌ Critical Issues');
    result.criticalIssues.forEach(issue => console.error(issue));
    console.groupEnd();
  }

  console.group('📊 Routing Audit');
  console.log(`Status: ${result.sections.routing.status.toUpperCase()}`);
  console.log(`Tracks: ${Object.keys(result.sections.routing.trackRouting).length}`);
  console.log(`Master Input: ${result.sections.routing.masterRouting.hasMasterInput ? '✅' : '❌'}`);
  console.log(`Master Output: ${result.sections.routing.masterRouting.hasMasterOutput ? '✅' : '❌'}`);
  if (result.sections.routing.issues.length > 0) {
    result.sections.routing.issues.forEach(issue => console.warn(issue));
  }
  console.groupEnd();

  console.group('🎛️ Controls Audit');
  console.log(`Status: ${result.sections.controls.status.toUpperCase()}`);
  console.log(`Master Volume: ${(result.sections.controls.volumeControls.masterVolume * 100).toFixed(0)}%`);
  if (result.sections.controls.issues.length > 0) {
    result.sections.controls.issues.forEach(issue => console.warn(issue));
  }
  console.groupEnd();

  console.group('📈 Gain Staging');
  console.log(`Status: ${result.sections.gainStaging.status.toUpperCase()}`);
  console.log(`Total Gain: ${(result.sections.gainStaging.totalGain * 100).toFixed(0)}%`);
  console.log(`Headroom: ${(result.sections.gainStaging.headroom * 100).toFixed(0)}%`);
  if (result.sections.gainStaging.issues.length > 0) {
    result.sections.gainStaging.issues.forEach(issue => console.warn(issue));
  }
  console.groupEnd();

  if (result.recommendations.length > 0) {
    console.group('💡 Recommendations');
    result.recommendations.forEach(rec => console.info(rec));
    console.groupEnd();
  }

  console.groupEnd();
}





