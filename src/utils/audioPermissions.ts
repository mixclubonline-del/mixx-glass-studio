/**
 * Audio Permissions Utility
 * 
 * Handles macOS audio permission checks and requests.
 * On macOS, audio input (microphone) requires explicit user permission.
 * Audio output does not require permission but may prompt for device access.
 */

/**
 * Check if we're running in Tauri
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined';
}

/**
 * Check if we're on macOS
 */
export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Request microphone permission (macOS)
 * 
 * Note: On macOS, the permission prompt appears automatically when the app
 * first tries to access audio input devices. This function provides a way to
 * check permission status if using the tauri-plugin-macos-permissions plugin.
 * 
 * For now, permissions are handled automatically by macOS when cpal accesses
 * audio devices. The Info.plist provides the user-facing permission message.
 */
export async function checkAudioPermissions(): Promise<{
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  audioOutput: 'granted' | 'denied' | 'prompt' | 'unknown';
}> {
  if (!isMacOS() || !isTauri()) {
    // Non-macOS or browser: permissions handled by browser
    return {
      microphone: 'unknown',
      audioOutput: 'granted', // Browser handles this
    };
  }

  // On macOS with Tauri, permissions are requested automatically when accessing devices
  // The Info.plist provides the permission prompt message
  // If using tauri-plugin-macos-permissions, you can check here:
  // const micStatus = await checkMicrophonePermission();
  
  return {
    microphone: 'prompt', // Will prompt when first accessing
    audioOutput: 'granted', // No permission needed for output
  };
}

/**
 * Show a user-friendly message about audio permissions
 */
export function getAudioPermissionMessage(): string {
  if (!isMacOS()) {
    return 'Audio permissions are handled by your browser.';
  }
  
  return 'Mixx Club Studio needs microphone access for audio input and recording. ' +
         'You will be prompted to grant permission when you first use audio input features. ' +
         'Your audio data stays private and is processed locally.';
}

