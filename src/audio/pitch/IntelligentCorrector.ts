/**
 * Intelligent Pitch Correction Engine
 * Context-aware pitch correction with musical understanding
 */

import { PitchData, MixxTuneSettings, MusicalContext } from '@/types/mixxtune';

export class IntelligentCorrector {
  private settings: MixxTuneSettings;
  private context: MusicalContext | null = null;
  private recentCorrections: number[] = [];
  
  constructor(settings: MixxTuneSettings) {
    this.settings = settings;
  }
  
  updateSettings(settings: Partial<MixxTuneSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
  
  updateContext(context: MusicalContext | null): void {
    this.context = context;
  }
  
  /**
   * Calculate target pitch for correction
   */
  calculateTargetPitch(pitchData: PitchData): number {
    const { midiNote, cents, isVibrato, isSlide } = pitchData;
    
    // Don't correct if below tolerance threshold
    if (Math.abs(cents) < this.settings.tolerance) {
      return pitchData.frequency;
    }
    
    // Preserve vibrato if enabled
    if (isVibrato && this.settings.preserveVibrato) {
      return pitchData.frequency;
    }
    
    // Preserve slides if enabled
    if (isSlide && this.settings.preserveSlides) {
      return pitchData.frequency;
    }
    
    // Use AI context for intelligent target selection
    if (this.context && this.settings.useAIContext) {
      const contextualNote = this.getContextualTarget(midiNote);
      return this.midiToFrequency(contextualNote);
    }
    
    // Default: snap to nearest semitone
    return this.midiToFrequency(midiNote);
  }
  
  /**
   * Get contextually appropriate target note
   */
  private getContextualTarget(detectedNote: number): number {
    if (!this.context) {
      return Math.round(detectedNote);
    }
    
    const { melodyContour, chord, scale } = this.context;
    
    // Get scale degrees from key/scale
    const scaleNotes = this.getScaleNotes(scale);
    
    // Find closest note in scale
    const rootNote = this.parseKey(this.context.key);
    const closestInScale = this.findClosestScaleNote(detectedNote, rootNote, scaleNotes);
    
    // Check if it's a passing tone (between two melody notes)
    if (this.settings.detectPassingTones && this.isPassingTone(detectedNote, melodyContour)) {
      // Allow passing tones to be slightly off
      return Math.round(detectedNote);
    }
    
    // Check chord tones for stronger pull
    const chordNotes = this.getChordNotes(chord);
    const closestChordTone = this.findClosestNote(detectedNote, chordNotes);
    
    // If very close to chord tone, prefer it
    if (Math.abs(detectedNote - closestChordTone) < 0.3) {
      return closestChordTone;
    }
    
    return closestInScale;
  }
  
  /**
   * Calculate correction amount based on speed setting
   */
  calculateCorrectionAmount(currentFreq: number, targetFreq: number): number {
    const ratio = targetFreq / currentFreq;
    
    // Apply strength
    const strengthMultiplier = this.settings.strength / 100;
    const adjustedRatio = 1 + (ratio - 1) * strengthMultiplier;
    
    // Apply speed (interpolation)
    const speed = this.settings.speed / 100;
    const correctionRatio = 1 + (adjustedRatio - 1) * speed;
    
    // Add humanization (subtle randomness)
    if (this.settings.humanize) {
      const randomness = (Math.random() - 0.5) * 0.02; // ±1%
      return correctionRatio * (1 + randomness);
    }
    
    return correctionRatio;
  }
  
  /**
   * Check if note is a passing tone
   */
  private isPassingTone(note: number, melody: number[]): boolean {
    if (melody.length < 2) return false;
    
    const lastTwo = melody.slice(-2);
    const [prev, current] = lastTwo;
    
    // Passing tone: between previous and current melody note
    return (note > prev && note < current) || (note < prev && note > current);
  }
  
  private getScaleNotes(scale: string): number[] {
    const scales: Record<string, number[]> = {
      'major': [0, 2, 4, 5, 7, 9, 11],
      'minor': [0, 2, 3, 5, 7, 8, 10],
      'pentatonic': [0, 2, 4, 7, 9],
      'blues': [0, 3, 5, 6, 7, 10],
      'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
      'melodic-minor': [0, 2, 3, 5, 7, 9, 11]
    };
    return scales[scale] || scales['major'];
  }
  
  private getChordNotes(chord: string): number[] {
    // Simple chord parser (e.g., "Cmaj7", "Gm", "D7")
    const root = 60; // C4 for now
    
    if (chord.includes('maj7')) return [root, root + 4, root + 7, root + 11];
    if (chord.includes('7')) return [root, root + 4, root + 7, root + 10];
    if (chord.includes('m')) return [root, root + 3, root + 7];
    return [root, root + 4, root + 7]; // Major triad
  }
  
  private parseKey(key: string): number {
    const noteMap: Record<string, number> = {
      'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
      'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
      'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
    };
    return noteMap[key.replace('m', '')] || 60;
  }
  
  private findClosestScaleNote(note: number, root: number, scale: number[]): number {
    const octave = Math.floor((note - root) / 12);
    const noteInOctave = ((note - root) % 12 + 12) % 12;
    
    let closest = scale[0];
    let minDiff = Math.abs(noteInOctave - scale[0]);
    
    for (const degree of scale) {
      const diff = Math.abs(noteInOctave - degree);
      if (diff < minDiff) {
        minDiff = diff;
        closest = degree;
      }
    }
    
    return root + octave * 12 + closest;
  }
  
  private findClosestNote(note: number, notes: number[]): number {
    return notes.reduce((prev, curr) => 
      Math.abs(curr - note) < Math.abs(prev - note) ? curr : prev
    );
  }
  
  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
}
