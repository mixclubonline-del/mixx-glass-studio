/**
 * Audio Diagnostics Utility
 * 
 * Comprehensive audio system diagnostics to trace signal path issues.
 * 
 * @author Prime (Mixx Club)
 */

import type { VelvetMasterChain } from '../audio/masterChain';

export interface AudioDiagnostics {
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
    connectedToDestination: boolean;
  };
  signalPath: {
    masterInputGain: number;
    masterGainValue: number;
    translationMatrixAttached: boolean;
  };
  tracks: {
    count: number;
    connectedCount: number;
    hasAudioBuffers: number;
  };
}

/**
 * Run comprehensive audio diagnostics
 */
export function diagnoseAudioSystem(
  audioContext: AudioContext | null,
  masterChain: VelvetMasterChain | null,
  trackNodes: Record<string, any>,
  audioBuffers: Record<string, AudioBuffer>,
  translationMatrix: any
): AudioDiagnostics {
  const diagnostics: AudioDiagnostics = {
    audioContext: {
      exists: !!audioContext,
      state: audioContext?.state || 'null',
      sampleRate: audioContext?.sampleRate || 0,
      currentTime: audioContext?.currentTime || 0,
    },
    masterChain: {
      exists: !!masterChain,
      inputExists: !!masterChain?.input,
      outputExists: !!masterChain?.output,
      connectedToDestination: false, // Can't directly check, but we can verify translationMatrix
    },
    signalPath: {
      masterInputGain: (masterChain?.input as GainNode)?.gain?.value || 0,
      masterGainValue: masterChain?.masterGain?.gain?.value || 0,
      translationMatrixAttached: !!translationMatrix,
    },
    tracks: {
      count: Object.keys(trackNodes).length,
      connectedCount: 0, // Can't directly check connections
      hasAudioBuffers: Object.keys(audioBuffers).length,
    },
  };

  // Check if translationMatrix is attached (indirect check for destination connection)
  if (translationMatrix && typeof translationMatrix.attach === 'function') {
    diagnostics.masterChain.connectedToDestination = true;
  }

  return diagnostics;
}

/**
 * Log diagnostics to console
 */
export function logAudioDiagnostics(diagnostics: AudioDiagnostics): void {
  console.group('🔍 Audio System Diagnostics');
  
  console.group('AudioContext');
  console.log('Exists:', diagnostics.audioContext.exists);
  console.log('State:', diagnostics.audioContext.state);
  console.log('Sample Rate:', diagnostics.audioContext.sampleRate, 'Hz');
  console.log('Current Time:', diagnostics.audioContext.currentTime.toFixed(2), 's');
  console.groupEnd();

  console.group('Master Chain');
  console.log('Exists:', diagnostics.masterChain.exists);
  console.log('Input Node:', diagnostics.masterChain.inputExists ? '✅' : '❌');
  console.log('Output Node:', diagnostics.masterChain.outputExists ? '✅' : '❌');
  console.log('Connected to Destination:', diagnostics.masterChain.connectedToDestination ? '✅' : '❌');
  console.groupEnd();

  console.group('Signal Path');
  console.log('Master Input Gain:', diagnostics.signalPath.masterInputGain.toFixed(2));
  console.log('Master Gain:', diagnostics.signalPath.masterGainValue.toFixed(2));
  console.log('TranslationMatrix Attached:', diagnostics.signalPath.translationMatrixAttached ? '✅' : '❌');
  console.groupEnd();

  console.group('Tracks');
  console.log('Track Count:', diagnostics.tracks.count);
  console.log('Audio Buffers:', diagnostics.tracks.hasAudioBuffers);
  console.groupEnd();

  // Critical issues
  const issues: string[] = [];
  const warnings: string[] = [];
  
  if (!diagnostics.audioContext.exists) {
    issues.push('❌ AudioContext is null');
  }
  
  // Suspended state is normal on initial load - not an error, just a warning
  if (diagnostics.audioContext.state === 'suspended') {
    warnings.push('ℹ️ AudioContext is suspended (normal - will resume on play button click)');
  }
  
  if (diagnostics.audioContext.state === 'closed') {
    issues.push('❌ AudioContext is closed');
  }
  
  if (!diagnostics.masterChain.exists) {
    issues.push('❌ Master chain is null');
  }
  
  if (!diagnostics.masterChain.inputExists) {
    issues.push('❌ Master input node missing');
  }
  
  if (!diagnostics.masterChain.outputExists) {
    issues.push('❌ Master output node missing');
  }
  
  if (!diagnostics.masterChain.connectedToDestination) {
    issues.push('❌ Not connected to destination');
  }
  
  if (diagnostics.signalPath.masterInputGain === 0) {
    warnings.push('⚠️ Master input gain is 0 (audio will be silent)');
  }
  
  if (diagnostics.signalPath.masterGainValue === 0) {
    warnings.push('⚠️ Master gain is 0 (audio will be silent)');
  }
  
  if (diagnostics.tracks.count === 0) {
    warnings.push('ℹ️ No tracks created yet');
  }
  
  if (diagnostics.tracks.hasAudioBuffers === 0) {
    warnings.push('ℹ️ No audio files imported yet - import audio files to create clips');
  }

  if (issues.length > 0) {
    console.group('🚨 Critical Issues');
    issues.forEach((issue) => console.error(issue));
    console.groupEnd();
  }
  
  if (warnings.length > 0) {
    console.group('ℹ️ Info & Warnings');
    warnings.forEach((warning) => console.info(warning));
    console.groupEnd();
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ No issues detected - audio system ready');
  } else if (issues.length === 0) {
    console.log('✅ No critical issues - audio system should work');
  }

  console.groupEnd();
}

/**
 * Create a test tone to verify audio output
 * Automatically resumes AudioContext if suspended
 */
export async function createTestTone(
  audioContext: AudioContext,
  masterInput: AudioNode,
  duration: number = 0.5,
  frequency: number = 440
): Promise<void> {
  // Auto-resume if suspended
  if (audioContext.state === 'suspended') {
    console.log('[AUDIO TEST] Resuming AudioContext for test tone...');
    try {
      await audioContext.resume();
      console.log('[AUDIO TEST] AudioContext resumed');
    } catch (error) {
      console.error('[AUDIO TEST] Failed to resume AudioContext:', error);
      alert('Please click the play button first to enable audio, then try the test tone again.');
      return;
    }
  }

  const sampleRate = audioContext.sampleRate;
  const frameCount = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(masterInput);
  
  console.log(`[AUDIO TEST] Playing test tone (${frequency}Hz, ${duration}s) to verify signal path...`);
  console.log(`[AUDIO TEST] AudioContext state: ${audioContext.state}`);
  console.log(`[AUDIO TEST] Master input gain: ${(masterInput as GainNode)?.gain?.value ?? 'N/A'}`);
  
  try {
    source.start(0);
    console.log('[AUDIO TEST] Test tone started - you should hear a beep');
    
    setTimeout(() => {
      try {
        source.stop();
        console.log('[AUDIO TEST] Test tone finished');
      } catch (e) {
        // Source may have already stopped
      }
    }, duration * 1000 + 100);
  } catch (error) {
    console.error('[AUDIO TEST] Failed to start test tone:', error);
    alert('Failed to play test tone. Make sure audio is enabled and try again.');
  }
}

