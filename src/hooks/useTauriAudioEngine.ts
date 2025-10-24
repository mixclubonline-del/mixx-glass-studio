/**
 * Tauri Audio Engine Bridge
 * Connects React frontend to Rust backend for real-time audio processing
 */

import { invoke } from '@tauri-apps/api/tauri';

export const audioEngineAPI = {
  /**
   * Start the audio engine - initializes input device and stream
   */
  async startAudioEngine(): Promise<string> {
    try {
      return await invoke('start_audio_engine');
    } catch (error) {
      console.error('❌ Failed to start audio engine:', error);
      throw error;
    }
  },

  /**
   * Stop the audio engine
   */
  async stopAudioEngine(): Promise<string> {
    try {
      return await invoke('stop_audio_engine');
    } catch (error) {
      console.error('❌ Failed to stop audio engine:', error);
      throw error;
    }
  },

  /**
   * Get current audio engine metrics (latency, CPU load, etc.)
   */
  async getAudioMetrics(): Promise<any> {
    try {
      return await invoke('get_audio_metrics');
    } catch (error) {
      console.error('❌ Failed to get audio metrics:', error);
      throw error;
    }
  },

  /**
   * Analyze audio buffer and get FFT, RMS, loudness, etc.
   */
  async analyzeAudio(samples: number[]): Promise<any> {
    try {
      return await invoke('analyze_audio', { samples });
    } catch (error) {
      console.error('❌ Failed to analyze audio:', error);
      throw error;
    }
  },

  /**
   * Get AI-powered mixing recommendations based on current signal
   */
  async getMixingRecommendations(loudnessLufs: number): Promise<any> {
    try {
      return await invoke('get_mixing_recommendations', { loudness_lufs: loudnessLufs });
    } catch (error) {
      console.error('❌ Failed to get mixing recommendations:', error);
      throw error;
    }
  },
};

/**
 * Hook for React components to access audio engine
 * Usage: const audioAPI = useAudioEngine();
 */
export function useAudioEngine() {
  return audioEngineAPI;
}
