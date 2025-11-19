/**
 * Audio Output Diagnostics
 * Checks all critical points in the audio signal chain to diagnose why there's no sound
 */

export interface AudioOutputDiagnostics {
  audioContext: {
    exists: boolean;
    state: string;
    sampleRate: number;
    currentTime: number;
  };
  masterChain: {
    exists: boolean;
    inputExists: boolean;
    outputExists: boolean;
    inputGain: number;
    outputGain: number;
  };
  translationMatrix: {
    exists: boolean;
    attached: boolean;
    connectedToDestination: boolean;
  };
  tracks: {
    count: number;
    connectedToMaster: number;
    hasBuffers: number;
  };
  clips: {
    total: number;
    scheduled: number;
    hasBuffers: number;
  };
  audioBuffers: {
    count: number;
    keys: string[];
  };
  issues: string[];
}

export function diagnoseAudioOutput(
  audioContext: AudioContext | null,
  masterNodes: any | null,
  translationMatrix: any | null,
  trackNodes: Record<string, any>,
  clips: any[],
  audioBuffers: Record<string, AudioBuffer>
): AudioOutputDiagnostics {
  const issues: string[] = [];
  
  // Check AudioContext
  const ctxInfo = {
    exists: !!audioContext,
    state: audioContext?.state ?? 'null',
    sampleRate: audioContext?.sampleRate ?? 0,
    currentTime: audioContext?.currentTime ?? 0,
  };
  
  if (!audioContext) {
    issues.push('❌ AudioContext is null');
  } else if (audioContext.state === 'suspended') {
    issues.push('⚠️ AudioContext is suspended - needs user interaction to resume');
  } else if (audioContext.state === 'closed') {
    issues.push('❌ AudioContext is closed');
  }
  
  // Check Master Chain
  const masterInfo = {
    exists: !!masterNodes,
    inputExists: !!masterNodes?.input,
    outputExists: !!masterNodes?.output,
    inputGain: (masterNodes?.input as GainNode)?.gain?.value ?? 0,
    outputGain: (masterNodes?.output as GainNode)?.gain?.value ?? 0,
  };
  
  if (!masterNodes) {
    issues.push('❌ Master chain not initialized');
  } else if (!masterNodes.input) {
    issues.push('❌ Master input node missing');
  } else if (!masterNodes.output) {
    issues.push('❌ Master output node missing');
  } else if (masterInfo.inputGain === 0) {
    issues.push('⚠️ Master input gain is 0');
  } else if (masterInfo.outputGain === 0) {
    issues.push('⚠️ Master output gain is 0');
  }
  
  // Check Translation Matrix
  const matrixInfo = {
    exists: !!translationMatrix,
    attached: translationMatrix?.attached ?? false,
    connectedToDestination: false, // Can't directly check, but if attached should be connected
  };
  
  if (!translationMatrix) {
    issues.push('❌ TranslationMatrix not initialized');
  } else if (!matrixInfo.attached) {
    issues.push('❌ TranslationMatrix not attached to master output');
  }
  
  // Check Tracks
  const trackKeys = Object.keys(trackNodes);
  const connectedTracks = trackKeys.filter(trackId => {
    const nodes = trackNodes[trackId];
    if (!nodes?.input) return false;
    // Check if track input has any connections
    try {
      // Can't directly check connections, but if nodes exist assume connected
      return true;
    } catch {
      return false;
    }
  });
  
  const tracksWithBuffers = clips.filter(c => audioBuffers[c.bufferId]).length;
  
  const trackInfo = {
    count: trackKeys.length,
    connectedToMaster: connectedTracks.length,
    hasBuffers: tracksWithBuffers,
  };
  
  if (trackInfo.count === 0) {
    issues.push('⚠️ No tracks exist');
  }
  
  // Check Clips
  const clipsWithBuffers = clips.filter(c => audioBuffers[c.bufferId]);
  const clipInfo = {
    total: clips.length,
    scheduled: 0, // Can't check this directly
    hasBuffers: clipsWithBuffers.length,
  };
  
  if (clipInfo.total === 0) {
    issues.push('⚠️ No clips in arrangement');
  } else if (clipInfo.hasBuffers === 0) {
    issues.push('❌ No clips have audio buffers loaded');
  } else if (clipInfo.hasBuffers < clipInfo.total) {
    issues.push(`⚠️ Only ${clipInfo.hasBuffers}/${clipInfo.total} clips have buffers`);
  }
  
  // Check Audio Buffers
  const bufferKeys = Object.keys(audioBuffers);
  const bufferInfo = {
    count: bufferKeys.length,
    keys: bufferKeys,
  };
  
  if (bufferInfo.count === 0) {
    issues.push('❌ No audio buffers loaded - import a file first');
  }
  
  return {
    audioContext: ctxInfo,
    masterChain: masterInfo,
    translationMatrix: matrixInfo,
    tracks: trackInfo,
    clips: clipInfo,
    audioBuffers: bufferInfo,
    issues,
  };
}

export function logAudioOutputDiagnostics(diagnostics: AudioOutputDiagnostics) {
  console.group('🔍 Audio Output Diagnostics');
  console.log('AudioContext:', diagnostics.audioContext);
  console.log('Master Chain:', diagnostics.masterChain);
  console.log('Translation Matrix:', diagnostics.translationMatrix);
  console.log('Tracks:', diagnostics.tracks);
  console.log('Clips:', diagnostics.clips);
  console.log('Audio Buffers:', diagnostics.audioBuffers);
  
  if (diagnostics.issues.length > 0) {
    console.group('🚨 Issues Found');
    diagnostics.issues.forEach(issue => console.warn(issue));
    console.groupEnd();
  } else {
    console.log('✅ No issues detected - audio should be working');
  }
  console.groupEnd();
}

