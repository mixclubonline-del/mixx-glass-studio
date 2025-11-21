/**
 * Audio Device Manager
 * 
 * Handles audio input/output device enumeration and selection.
 * Provides device selection UI and manages device switching.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId?: string;
}

export interface AudioDeviceManager {
  getInputDevices: () => Promise<AudioDevice[]>;
  getOutputDevices: () => Promise<AudioDevice[]>;
  setInputDevice: (deviceId: string) => Promise<void>;
  setOutputDevice: (deviceId: string) => Promise<void>;
  getCurrentInputDevice: () => AudioDevice | null;
  getCurrentOutputDevice: () => AudioDevice | null;
}

// Cache for permission state to avoid repeated getUserMedia calls
let permissionRequested = false;
let permissionStream: MediaStream | null = null;

/**
 * Get all available audio input devices
 * Only requests permission once to avoid device switching issues
 */
export async function getInputDevices(): Promise<AudioDevice[]> {
  try {
    // Request permission only once (required for device labels)
    // Reusing the same stream prevents device switching
    if (!permissionRequested) {
      try {
        permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permissionRequested = true;
        console.log('[AUDIO DEVICES] Permission granted, device labels available');
      } catch (permError) {
        console.warn('[AUDIO DEVICES] Permission denied, device labels may be generic:', permError);
        // Continue anyway - we can still enumerate devices, just without labels
      }
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === 'audioinput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        kind: 'audioinput' as const,
        groupId: device.groupId,
      }));
  } catch (error) {
    console.warn('[AUDIO DEVICES] Failed to enumerate input devices:', error);
    return [];
  }
}

/**
 * Clean up permission stream (call when component unmounts or app closes)
 */
export function cleanupAudioPermissions(): void {
  if (permissionStream) {
    permissionStream.getTracks().forEach(track => track.stop());
    permissionStream = null;
    permissionRequested = false;
    console.log('[AUDIO DEVICES] Permission stream cleaned up');
  }
}

/**
 * Get all available audio output devices
 * Note: Web Audio API doesn't directly support output device selection
 * This is a placeholder for future implementation (requires setSinkId or similar)
 */
export async function getOutputDevices(): Promise<AudioDevice[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === 'audiooutput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`,
        kind: 'audiooutput' as const,
        groupId: device.groupId,
      }));
  } catch (error) {
    console.warn('[AUDIO DEVICES] Failed to enumerate output devices:', error);
    return [];
  }
}

/**
 * Resume AudioContext if suspended
 * Modern browsers require user interaction to start audio
 */
export async function ensureAudioContextResumed(
  audioContext: AudioContext | null
): Promise<boolean> {
  if (!audioContext) {
    console.warn('[AUDIO] AudioContext is null');
    return false;
  }

  if (audioContext.state === 'closed') {
    console.error('[AUDIO] AudioContext is closed - cannot resume');
    return false;
  }

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('[AUDIO] AudioContext resumed from suspended state');
      return true;
    } catch (error) {
      console.error('[AUDIO] Failed to resume AudioContext:', error);
      return false;
    }
  }

  if (audioContext.state === 'running') {
    return true;
  }

  return false;
}

/**
 * Check if AudioContext needs user interaction to start
 */
export function needsUserInteraction(audioContext: AudioContext | null): boolean {
  if (!audioContext) return true;
  return audioContext.state === 'suspended';
}

/**
 * Get user-friendly message about audio context state
 */
export function getAudioContextStateMessage(audioContext: AudioContext | null): string {
  if (!audioContext) {
    return 'Audio system not initialized. Please refresh the page.';
  }

  switch (audioContext.state) {
    case 'suspended':
      return 'Audio is paused. Click play or interact with the page to start audio.';
    case 'running':
      return 'Audio is active and ready.';
    case 'closed':
      return 'Audio system is closed. Please refresh the page.';
    default:
      return `Audio state: ${audioContext.state}`;
  }
}

