import { invoke } from '@tauri-apps/api/core';
import { MasteringProfile } from '../types/rust-audio';

// Check if we are running in a Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export interface RustMasterMeters {
  momentary_lufs: number;
  short_term_lufs: number;
  integrated_lufs: number;
  true_peak_db: number;
  profile: string;
}

/**
 * Maps string names to MasteringProfile enum.
 */
const PROFILE_NAME_MAP: Record<string, MasteringProfile> = {
  'streaming': MasteringProfile.Streaming,
  'club': MasteringProfile.Club,
  'broadcast': MasteringProfile.Broadcast,
  'vinyl': MasteringProfile.Vinyl,
  'audiophile': MasteringProfile.Audiophile,
  'spotify': MasteringProfile.Streaming,
  'applemusic': MasteringProfile.Broadcast,
  'tidal': MasteringProfile.Broadcast,
  'dolbyatmos': MasteringProfile.Broadcast,
};

export class RustMasterBridge {
  private static instance: RustMasterBridge;
  private isInitialized = false;
  private currentProfile: string = 'streaming';

  private constructor() {}

  static getInstance(): RustMasterBridge {
    if (!RustMasterBridge.instance) {
      RustMasterBridge.instance = new RustMasterBridge();
    }
    return RustMasterBridge.instance;
  }

  /**
   * Initialize the Rust master chain.
   * This should be called when the AudioContext is first created.
   */
  async initialize(sampleRate: number, initialProfile: string = 'streaming'): Promise<void> {
    if (!isTauri || this.isInitialized) return;

    try {
      this.currentProfile = initialProfile;
      const profileId = PROFILE_NAME_MAP[initialProfile.toLowerCase()] ?? MasteringProfile.Streaming;
      
      // The Rust command 'master_chain_create' initializes the core engine's master stage
      await invoke('master_chain_create', { sampleRate, profile: profileId });
      this.isInitialized = true;
      
      if (import.meta.env.DEV) {
        console.log(`[RustMasterBridge] Native Engine Initialized (${sampleRate}Hz, Profile: ${initialProfile})`);
      }
    } catch (error) {
      console.error('[RustMasterBridge] Failed to initialize native engine:', error);
    }
  }

  /**
   * Sync the mastering profile to the Rust backend.
   */
  async setProfile(profileName: string): Promise<void> {
    if (!isTauri || !this.isInitialized) return;

    try {
      this.currentProfile = profileName;
      const profileId = PROFILE_NAME_MAP[profileName.toLowerCase()] ?? MasteringProfile.Streaming;
      await invoke('master_chain_set_profile', { profile: profileId });
      
      if (import.meta.env.DEV) {
        console.log(`[RustMasterBridge] Profile synced: ${profileName} (ID: ${profileId})`);
      }
    } catch (error) {
      console.error('[RustMasterBridge] Failed to sync profile:', error);
    }
  }

  /**
   * Fetch native meters from the Rust engine.
   */
  async getMeters(): Promise<RustMasterMeters | null> {
    if (!isTauri || !this.isInitialized) return null;

    try {
      // Returns { momentary_lufs, short_term_lufs, integrated_lufs, true_peak_db, profile }
      return await invoke<RustMasterMeters>('master_chain_get_meters');
    } catch (error) {
      // Don't log on every poll failure to avoid console noise
      return null;
    }
  }

  /**
   * Set a specific DSP parameter on the Rust master chain.
   */
  async setParameter(name: string, value: number): Promise<void> {
    if (!isTauri || !this.isInitialized) return;

    try {
      await invoke('master_chain_set_parameter', { name, value });
    } catch (error) {
      console.error(`[RustMasterBridge] Failed to set parameter ${name}:`, error);
    }
  }

  /**
   * Check if the bridge is ready.
   */
  getReady(): boolean {
    return this.isInitialized;
  }
    /**
     * Set SIMD optimization status (Phase 34)
     */
    async setSimdEnabled(enabled: boolean): Promise<void> {
        if (!this.isInitialized) return;
        try {
            await invoke('dsp_set_simd_enabled', { enabled });
        } catch (e) {
            console.error('Failed to set SIMD status:', e);
        }
    }

    /**
     * Get current SIMD optimization status (Phase 34)
     */
    async getSimdEnabled(): Promise<boolean> {
        if (!this.isInitialized) return true;
        try {
            return await invoke<boolean>('dsp_get_simd_enabled');
        } catch (e) {
            console.error('Failed to get SIMD status:', e);
            return true;
        }
    }
}

export const rustMasterBridge = RustMasterBridge.getInstance();
