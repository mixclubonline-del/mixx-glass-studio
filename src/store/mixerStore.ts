/**
 * Mixer Store - Manages mixer state and channel strip parameters
 */

import { create } from 'zustand';

export interface ChannelState {
  id: string;
  name: string;
  volume: number; // 0-1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  color: string;
  peakLevel: { left: number; right: number };
}

interface MixerState {
  channels: Map<string, ChannelState>;
  masterVolume: number;
  masterPeakLevel: { left: number; right: number };
  selectedChannelId: string | null;
  
  // Enhanced metering
  truePeakEnabled: boolean;
  meteringStandard: 'ITU-R-BS.1770-5' | 'EBU-R128';
  targetLoudness: -23 | -16 | -14 | -8;
  
  // Actions
  addChannel: (channel: ChannelState) => void;
  updateChannel: (id: string, updates: Partial<ChannelState>) => void;
  removeChannel: (id: string) => void;
  setMasterVolume: (volume: number) => void;
  setMasterPeakLevel: (level: { left: number; right: number }) => void;
  updatePeakLevel: (id: string, level: { left: number; right: number }) => void;
  selectChannel: (id: string | null) => void;
  
  // New actions
  setTruePeakEnabled: (enabled: boolean) => void;
  setMeteringStandard: (standard: 'ITU-R-BS.1770-5' | 'EBU-R128') => void;
  setTargetLoudness: (loudness: -23 | -16 | -14 | -8) => void;
}

export const useMixerStore = create<MixerState>((set) => ({
  channels: new Map(),
  masterVolume: 0.75,
  masterPeakLevel: { left: -60, right: -60 },
  selectedChannelId: null,
  
  // New defaults
  truePeakEnabled: true,
  meteringStandard: 'ITU-R-BS.1770-5',
  targetLoudness: -14,
  
  addChannel: (channel) => set((state) => {
    const newChannels = new Map(state.channels);
    newChannels.set(channel.id, channel);
    return { channels: newChannels };
  }),
  
  updateChannel: (id, updates) => set((state) => {
    const newChannels = new Map(state.channels);
    const channel = newChannels.get(id);
    if (channel) {
      newChannels.set(id, { ...channel, ...updates });
    }
    return { channels: newChannels };
  }),
  
  removeChannel: (id) => set((state) => {
    const newChannels = new Map(state.channels);
    newChannels.delete(id);
    return { channels: newChannels };
  }),
  
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  
  setMasterPeakLevel: (level) => set({ masterPeakLevel: level }),
  
  updatePeakLevel: (id, level) => set((state) => {
    const newChannels = new Map(state.channels);
    const channel = newChannels.get(id);
    if (channel) {
      newChannels.set(id, { ...channel, peakLevel: level });
    }
    return { channels: newChannels };
  }),
  
  selectChannel: (id) => set({ selectedChannelId: id }),
  
  // New actions
  setTruePeakEnabled: (enabled) => set({ truePeakEnabled: enabled }),
  setMeteringStandard: (standard) => set({ meteringStandard: standard }),
  setTargetLoudness: (loudness) => set({ targetLoudness: loudness })
}));
