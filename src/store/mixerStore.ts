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
  
  // Actions
  addChannel: (channel: ChannelState) => void;
  updateChannel: (id: string, updates: Partial<ChannelState>) => void;
  removeChannel: (id: string) => void;
  setMasterVolume: (volume: number) => void;
  setMasterPeakLevel: (level: { left: number; right: number }) => void;
  updatePeakLevel: (id: string, level: { left: number; right: number }) => void;
  selectChannel: (id: string | null) => void;
}

export const useMixerStore = create<MixerState>((set) => ({
  channels: new Map(),
  masterVolume: 0.75,
  masterPeakLevel: { left: -60, right: -60 },
  selectedChannelId: null,
  
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
  
  selectChannel: (id) => set({ selectedChannelId: id })
}));
