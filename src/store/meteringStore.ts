import { create } from 'zustand';

type ClipCounts = Record<string, { L: number; R: number; total: number }>;

export interface LufsState {
  /** EBU R128 Momentary (400 ms) */
  momentary: number;
  /** EBU R128 Short-Term (3 s) */
  shortTerm: number;
  /** Integrated program loudness */
  integrated: number;
  /** Loudness range (LRA) */
  range: number;
}

interface MeteringState {
  /** Sample-accurate / oversampled true-peak (dBTP) */
  truePeak: number;
  /** Album-style DR value (integer-ish) */
  dynamicRange: number;
  /** Peak - RMS (dB) */
  crestFactor: number;
  /** 0..1 = mono..wide */
  stereoWidth: number;
  /** -1..+1 phase correlation */
  phaseCorrelation: number;

  /** LUFS bucket (R128-style) */
  lufs: LufsState;

  /** Optional spectrum data (copy as plain array for immutability) */
  spectrum: number[];

  /** Clip counters keyed by bus name (e.g., 'master', 'track-3') */
  clipCounts: ClipCounts;

  // --- Actions (all return NEW objects to trigger renders) ---
  setTruePeak: (v: number) => void;
  setDynamicRange: (v: number) => void;
  setCrestFactor: (v: number) => void;
  setStereoWidth: (v: number) => void;
  setPhaseCorrelation: (v: number) => void;

  setLUFS: (partial: Partial<LufsState>) => void;
  setSpectrum: (bins: ArrayLike<number>) => void;

  bumpClipCount: (bus: string, channel?: 'L' | 'R' | 'LR') => void;
  resetClipCount: (bus: string) => void;

  /** Convenience: batch master metering update */
  updateMasterStats: (stats: {
    truePeak?: number;
    dynamicRange?: number;
    crestFactor?: number;
    stereoWidth?: number;
    phaseCorrelation?: number;
    lufs?: Partial<LufsState>;
  }) => void;
}

const clamp = (v: number, min: number, max: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

// sensible defaults (nothing “hot” on boot)
const initialLUFS: LufsState = {
  momentary: -24,
  shortTerm: -22,
  integrated: -18,
  range: 5,
};

export const useMeteringStore = create<MeteringState>((set) => ({
  truePeak: -40,
  dynamicRange: 12,
  crestFactor: 8,
  stereoWidth: 0.5,
  phaseCorrelation: 0.9,

  lufs: initialLUFS,
  spectrum: [],
  clipCounts: {},

  setTruePeak: (v) =>
    set(() => ({ truePeak: Number.isFinite(v) ? v : -40 })),

  setDynamicRange: (v) =>
    set(() => ({ dynamicRange: Number.isFinite(v) ? Math.round(v) : 12 })),

  setCrestFactor: (v) =>
    set(() => ({ crestFactor: Number.isFinite(v) ? v : 8 })),

  setStereoWidth: (v) =>
    set(() => ({ stereoWidth: clamp(v, 0, 1) })),

  setPhaseCorrelation: (v) =>
    set(() => ({ phaseCorrelation: clamp(v, -1, 1) })),

  setLUFS: (partial) =>
    set((state) => ({
      lufs: {
        ...state.lufs,
        ...Object.fromEntries(
          Object.entries(partial).map(([k, val]) => [
            k,
            Number.isFinite(val as number) ? (val as number) : (state.lufs as any)[k],
          ])
        ),
      },
    })),

  setSpectrum: (bins) =>
    set(() => ({
      // create a NEW array; don’t hold references to shared Float32Array
      spectrum: Array.from(bins as number[] | ArrayLike<number>),
    })),

  bumpClipCount: (bus, channel = 'LR') =>
    set((state) => {
      const prev = state.clipCounts[bus] ?? { L: 0, R: 0, total: 0 };
      let L = prev.L;
      let R = prev.R;
      if (channel === 'L') L += 1;
      else if (channel === 'R') R += 1;
      else {
        L += 1;
        R += 1;
      }
      const total = L + R;
      return {
        clipCounts: {
          ...state.clipCounts,
          [bus]: { L, R, total },
        },
      };
    }),

  resetClipCount: (bus) =>
    set((state) => ({
      clipCounts: {
        ...state.clipCounts,
        [bus]: { L: 0, R: 0, total: 0 },
      },
    })),

  updateMasterStats: (stats) =>
    set((state) => ({
      truePeak:
        stats.truePeak !== undefined
          ? stats.truePeak
          : state.truePeak,
      dynamicRange:
        stats.dynamicRange !== undefined
          ? Math.round(stats.dynamicRange)
          : state.dynamicRange,
      crestFactor:
        stats.crestFactor !== undefined
          ? stats.crestFactor
          : state.crestFactor,
      stereoWidth:
        stats.stereoWidth !== undefined
          ? clamp(stats.stereoWidth, 0, 1)
          : state.stereoWidth,
      phaseCorrelation:
        stats.phaseCorrelation !== undefined
          ? clamp(stats.phaseCorrelation, -1, 1)
          : state.phaseCorrelation,
      lufs: stats.lufs ? { ...state.lufs, ...stats.lufs } : state.lufs,
    })),
}));
