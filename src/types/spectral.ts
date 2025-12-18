/**
 * spectral.ts - Types for Melodyne-like audio editing in AURA.
 */

export interface PitchPoint {
  time: number; // Seconds relative to clip start
  frequency: number; // Hz
  confidence: number; // 0-1
}

export interface AudioBlob {
  id: string;
  startTime: number; // Seconds
  duration: number; // Seconds
  pitch: number; // Detected fundamental frequency (Hz)
  note: number; // MIDI note number equivalent
  drift: PitchPoint[]; // Micro-pitch changes within the blob
  amplitude: number; // Average volume (0-1)
  formantShift: number; // Semitones (-12 to 12)
  velocity: number; // Intensity (0-127)
  isManuallyEdited: boolean;
}

export interface SpectralAnalysisResult {
  blobs: AudioBlob[];
  sampleRate: number;
  duration: number;
  peakFrequency: number;
}

export interface PitchCorrectionCommand {
  blobId: string;
  pitchOffset: number; // Semitones
  timeOffset: number; // Seconds
  formantOffset: number; // Semitones
}
