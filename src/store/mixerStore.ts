import { create } from 'zustand';

export type ChannelLevel = { left: number; right: number };

interface MixerState {
  /** Peak levels in dBFS for the master bus (L/R). */
  masterPeakLevel: ChannelLevel;
  /** RMS levels in dBFS for the master bus (L/R). Optional but handy. */
  masterRMSLevel: ChannelLevel;

  /** Set master peak levels (creates a NEW object every call). */
  setMasterPeaks: (left: number, right: number) => void;
  /** Set master RMS levels (creates a NEW object every call). */
  setMasterRMS: (left: number, right: number) => void;
  /** Reset master bus metering. */
  resetMasterMetering: () => void;
}

const clampDb = (v: number) => (Number.isFinite(v) ? Math.max(-120, Math.min(6, v)) : -120);

export const useMixerStore = create<MixerState>((set) => ({
  masterPeakLevel: { left: -60, right: -60 },
  masterRMSLevel: { left: -60, right: -60 },

  setMasterPeaks: (left, right) =>
    set(() => ({
      masterPeakLevel: { left: clampDb(left), right: clampDb(right) }, // NEW object
    })),

  setMasterRMS: (left, right) =>
    set(() => ({
      masterRMSLevel: { left: clampDb(left), right: clampDb(right) }, // NEW object
    })),

  resetMasterMetering: () =>
    set(() => ({
      masterPeakLevel: { left: -60, right: -60 },
      masterRMSLevel: { left: -60, right: -60 },
    })),
}));
