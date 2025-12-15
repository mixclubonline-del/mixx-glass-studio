/**
 * TypeScript interfaces for Rust Audio DSP integration
 * Phase 25: React Integration Layer
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Mastering Profiles
// ============================================================================

export enum MasteringProfile {
  Streaming = 0,   // -14 LUFS, -1 dBTP
  Club = 1,        // -8 LUFS, -0.5 dBTP
  Broadcast = 2,   // -24 LUFS, -2 dBTP
  Vinyl = 3,       // -12 LUFS, -1 dBTP
  Audiophile = 4,  // -16 LUFS, -1 dBTP
}

export const PROFILE_INFO: Record<MasteringProfile, { name: string; lufs: number; truePeak: number }> = {
  [MasteringProfile.Streaming]: { name: 'Streaming', lufs: -14, truePeak: -1 },
  [MasteringProfile.Club]: { name: 'Club', lufs: -8, truePeak: -0.5 },
  [MasteringProfile.Broadcast]: { name: 'Broadcast', lufs: -24, truePeak: -2 },
  [MasteringProfile.Vinyl]: { name: 'Vinyl', lufs: -12, truePeak: -1 },
  [MasteringProfile.Audiophile]: { name: 'Audiophile', lufs: -16, truePeak: -1 },
};

// ============================================================================
// Loudness Meters
// ============================================================================

export interface LoudnessMeters {
  momentary_lufs: number;
  short_term_lufs: number;
  integrated_lufs: number;
  true_peak_db: number;
}

export interface MasterChainMeters extends LoudnessMeters {
  profile: string;
}

// ============================================================================
// Audio Export
// ============================================================================

export type ExportBitDepth = 16 | 24 | 32;

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
}

export interface ExportConfig {
  path: string;
  sampleRate: number;
  channels: number;
  bitDepth: ExportBitDepth;
  samples: Float32Array;
}

// ============================================================================
// Plugin Info
// ============================================================================

export interface PluginInfo {
  name: string;
  type: string;
  params: string[];
}

// ============================================================================
// Tauri Command Wrappers
// ============================================================================

export const rustAudio = {
  // Master Chain
  masterChain: {
    create: (sampleRate: number, profile: MasteringProfile): Promise<string> =>
      invoke('master_chain_create', { sampleRate, profile }),
    
    setProfile: (profile: MasteringProfile): Promise<string> =>
      invoke('master_chain_set_profile', { profile }),
    
    getMeters: (): Promise<MasterChainMeters> =>
      invoke('master_chain_get_meters'),
    
    setParameter: (name: string, value: number): Promise<string> =>
      invoke('master_chain_set_parameter', { name, value }),
  },
  
  // Audio Export
  export: {
    wav: (config: ExportConfig): Promise<string> =>
      invoke('audio_export_wav', {
        path: config.path,
        sampleRate: config.sampleRate,
        channels: config.channels,
        bitDepth: config.bitDepth,
        samples: Array.from(config.samples), // Convert Float32Array to array
      }),
    
    getFormats: (): Promise<ExportFormat[]> =>
      invoke('audio_export_formats'),
  },
  
  // Plugins
  plugins: {
    getInfo: (): Promise<PluginInfo[]> =>
      invoke('mixx_plugins_info'),
    
    setEnabled: (slotId: number, enabled: boolean): Promise<string> =>
      invoke('plugin_set_enabled', { slotId, enabled }),
    
    setBypass: (slotId: number, bypass: boolean): Promise<string> =>
      invoke('plugin_set_bypass', { slotId, bypass }),
  },
};

export default rustAudio;
