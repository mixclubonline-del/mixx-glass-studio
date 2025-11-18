/**
 * Native Audio Bridge - JavaScript/TypeScript side
 * 
 * Bridges audio from Flow's Web Audio API master chain to the native Rust engine.
 * 
 * @author Prime (Mixx Club)
 */

export interface NativeAudioBridge {
  pushSamples: (samples: Float32Array) => Promise<number>;
  getStatus: () => Promise<{
    active: boolean;
    sample_rate: number;
    channels: number;
    queue_level: number;
  }>;
}

/**
 * Create native audio bridge for Tauri
 */
export function createNativeAudioBridge(): NativeAudioBridge | null {
  // Check if we're in Tauri
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    return null; // Not in Tauri, use Web Audio API
  }

  const tauriInvoke = (window as any).__TAURI__.invoke;

  return {
    /**
     * Push audio samples to native engine
     */
    async pushSamples(samples: Float32Array): Promise<number> {
      try {
        const count = await tauriInvoke('push_audio_samples', {
          samples: Array.from(samples),
        });
        return count as number;
      } catch (error) {
        console.error('[NativeAudioBridge] Failed to push samples:', error);
        return 0;
      }
    },

    /**
     * Get bridge status
     */
    async getStatus() {
      try {
        const status = await tauriInvoke('get_audio_bridge_status');
        return status as {
          active: boolean;
          sample_rate: number;
          channels: number;
          queue_level: number;
        };
      } catch (error) {
        console.error('[NativeAudioBridge] Failed to get status:', error);
        return {
          active: false,
          sample_rate: 48000,
          channels: 2,
          queue_level: 0,
        };
      }
    },
  };
}

/**
 * Create an AudioWorkletNode that streams audio to native engine
 */
export async function createNativeAudioStreamNode(
  audioContext: AudioContext,
  bridge: NativeAudioBridge
): Promise<AudioWorkletNode | null> {
  try {
    // Register the worklet processor
    await audioContext.audioWorklet.addModule(
      new URL('../worklets/nativeAudioStreamProcessor.js', import.meta.url)
    );

    const node = new AudioWorkletNode(audioContext, 'native-audio-stream-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 0, // No output - we're streaming to native engine
      channelCount: 2,
    });

    // Handle audio data from worklet and forward to native engine
    node.port.onmessage = async (event) => {
      if (event.data.type === 'audio_data') {
        // Convert array back to Float32Array for efficiency
        const samples = new Float32Array(event.data.samples);
        await bridge.pushSamples(samples);
      }
    };

    return node;
  } catch (error) {
    console.error('[NativeAudioBridge] Failed to create stream node:', error);
    return null;
  }
}

