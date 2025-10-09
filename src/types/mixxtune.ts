/**
 * MixxTune: AI-Powered Context-Aware Pitch Correction
 */

export interface MixxTuneSettings {
  // Core correction parameters
  speed: number; // 0-100, how fast to correct (0=natural, 100=instant)
  strength: number; // 0-100, how much to correct (0=off, 100=full)
  tolerance: number; // 0-100, cents off before correction kicks in
  
  // Intelligent features
  preserveVibrato: boolean;
  preserveSlides: boolean;
  detectPassingTones: boolean;
  humanize: boolean; // Add subtle randomness
  
  // Context awareness
  useAIContext: boolean; // Use full mix for harmonic understanding
  adaptToMelody: boolean; // Follow melodic contour
  
  // Algorithm
  algorithm: 'psola' | 'phase-vocoder' | 'hybrid';
  
  // Style
  style: 'future' | 'drake' | 'natural' | 't-pain' | 'custom';
}

export interface MusicalContext {
  key: string; // e.g., "C", "Gm"
  scale: string; // e.g., "minor", "pentatonic"
  chord: string; // Current chord
  nextChord?: string; // Predicted next chord
  tension: number; // 0-1, harmonic tension
  melodyContour: number[]; // Recent melody notes (MIDI)
  timeSignature: { numerator: number; denominator: number };
  bpm: number;
}

export interface PitchData {
  frequency: number; // Hz
  midiNote: number; // 0-127
  cents: number; // -50 to +50
  confidence: number; // 0-1
  isVibrato: boolean;
  isSlide: boolean;
  timestamp: number;
}

export interface MixxTunePreset {
  id: string;
  name: string;
  settings: MixxTuneSettings;
  description?: string;
  artist?: string;
  genre?: string;
  isPublic?: boolean;
  userId?: string;
}

export const DEFAULT_MIXXTUNE_SETTINGS: MixxTuneSettings = {
  speed: 50,
  strength: 80,
  tolerance: 30,
  preserveVibrato: true,
  preserveSlides: true,
  detectPassingTones: true,
  humanize: true,
  useAIContext: true,
  adaptToMelody: true,
  algorithm: 'hybrid',
  style: 'natural'
};

export const STYLE_PRESETS: Record<string, Partial<MixxTuneSettings>> = {
  future: {
    speed: 85,
    strength: 95,
    tolerance: 15,
    preserveVibrato: false,
    humanize: true
  },
  drake: {
    speed: 60,
    strength: 85,
    tolerance: 25,
    preserveVibrato: true,
    humanize: true
  },
  natural: {
    speed: 30,
    strength: 60,
    tolerance: 40,
    preserveVibrato: true,
    humanize: true
  },
  't-pain': {
    speed: 100,
    strength: 100,
    tolerance: 5,
    preserveVibrato: false,
    humanize: false
  }
};
