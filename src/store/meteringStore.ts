/**
 * Metering Store - Professional audio metering state
 * ITU-R BS.1770-5 / EBU R128 compliant
 */

import { create } from 'zustand';

export interface MeteringState {
  // Peak metering
  truePeakEnabled: boolean;
  peakHoldTime: number; // milliseconds
  clipCount: Map<string, number>; // channelId -> count
  
  // LUFS metering (ITU-R BS.1770-5)
  lufsIntegrated: number; // Overall program loudness
  lufsShortTerm: number; // 3-second rolling window
  lufsMomentary: number; // 400ms window
  loudnessRange: number; // LRA in LU
  truePeak: number; // Inter-sample peak
  
  // Phase & stereo
  phaseCorrelation: number; // -1 to +1
  stereoWidth: number; // 0 to 1
  
  // Dynamic range
  dynamicRange: number; // DR score (EBU Tech 3342)
  crestFactor: number; // Peak-to-RMS ratio
  
  // Analysis settings
  meteringStandard: 'ITU-R-BS.1770-5' | 'EBU-R128';
  targetLoudness: -23 | -16 | -14 | -8; // LUFS
  rmsWindow: 100 | 300 | 400; // milliseconds
  
  // Spectrum analyzer
  spectrumBands: number; // FFT band count
  spectrumData: Float32Array;
  
  // Export readiness
  exportReady: boolean; // True if mix meets target standards
  
  // Actions
  setTruePeakEnabled: (enabled: boolean) => void;
  setPeakHoldTime: (time: number) => void;
  incrementClipCount: (channelId: string) => void;
  resetClipCount: (channelId: string) => void;
  updateLUFS: (integrated: number, shortTerm: number, momentary: number) => void;
  updateLoudnessRange: (lra: number) => void;
  updateTruePeak: (peak: number) => void;
  updatePhaseCorrelation: (correlation: number) => void;
  updateStereoWidth: (width: number) => void;
  updateDynamicRange: (dr: number, crest: number) => void;
  setMeteringStandard: (standard: 'ITU-R-BS.1770-5' | 'EBU-R128') => void;
  setTargetLoudness: (loudness: -23 | -16 | -14 | -8) => void;
  updateSpectrum: (data: Float32Array) => void;
  checkExportReadiness: () => void;
}

export const useMeteringStore = create<MeteringState>((set, get) => ({
  // Initial state
  truePeakEnabled: true,
  peakHoldTime: 3000,
  clipCount: new Map(),
  
  lufsIntegrated: -23,
  lufsShortTerm: -23,
  lufsMomentary: -23,
  loudnessRange: 0,
  truePeak: -60,
  
  phaseCorrelation: 1.0,
  stereoWidth: 0.5,
  
  dynamicRange: 14,
  crestFactor: 10,
  
  meteringStandard: 'ITU-R-BS.1770-5',
  targetLoudness: -14, // Streaming default
  rmsWindow: 300,
  
  spectrumBands: 32,
  spectrumData: new Float32Array(32),
  
  exportReady: false,
  
  // Actions
  setTruePeakEnabled: (enabled) => set({ truePeakEnabled: enabled }),
  
  setPeakHoldTime: (time) => set({ peakHoldTime: time }),
  
  incrementClipCount: (channelId) => set((state) => {
    const newCount = new Map(state.clipCount);
    newCount.set(channelId, (newCount.get(channelId) || 0) + 1);
    return { clipCount: newCount };
  }),
  
  resetClipCount: (channelId) => set((state) => {
    const newCount = new Map(state.clipCount);
    newCount.set(channelId, 0);
    return { clipCount: newCount };
  }),
  
  updateLUFS: (integrated, shortTerm, momentary) => {
    set({
      lufsIntegrated: integrated,
      lufsShortTerm: shortTerm,
      lufsMomentary: momentary
    });
    get().checkExportReadiness();
  },
  
  updateLoudnessRange: (lra) => set({ loudnessRange: lra }),
  
  updateTruePeak: (peak) => set({ truePeak: peak }),
  
  updatePhaseCorrelation: (correlation) => set({ phaseCorrelation: correlation }),
  
  updateStereoWidth: (width) => set({ stereoWidth: width }),
  
  updateDynamicRange: (dr, crest) => set({ 
    dynamicRange: dr, 
    crestFactor: crest 
  }),
  
  setMeteringStandard: (standard) => set({ meteringStandard: standard }),
  
  setTargetLoudness: (loudness) => {
    set({ targetLoudness: loudness });
    get().checkExportReadiness();
  },
  
  updateSpectrum: (data) => set({ spectrumData: data }),
  
  checkExportReadiness: () => {
    const { lufsIntegrated, targetLoudness, truePeak, phaseCorrelation } = get();
    
    // Check if mix meets standards:
    // 1. LUFS within ±2 LU of target
    // 2. True peak below -1 dBTP
    // 3. Phase correlation above -0.3 (mono compatibility)
    const lufsOk = Math.abs(lufsIntegrated - targetLoudness) <= 2;
    const peakOk = truePeak < -1;
    const phaseOk = phaseCorrelation > -0.3;
    
    set({ exportReady: lufsOk && peakOk && phaseOk });
  }
}));
