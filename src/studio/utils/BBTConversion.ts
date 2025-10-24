/**
 * BBT (Bars:Beats:Ticks) Conversion Utilities
 * Single source of truth for time <-> BBT conversion
 */

export interface BBT {
  bars: number;
  beats: number;
  ticks: number;
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface TempoInfo {
  bpm: number;
  sampleRate: number;
}

const TICKS_PER_BEAT = 960; // Standard MIDI resolution

export class BBTConverter {
  private bpm: number;
  private timeSignature: TimeSignature;
  private sampleRate: number;

  constructor(bpm: number, timeSignature: TimeSignature, sampleRate: number = 44100) {
    this.bpm = bpm;
    this.timeSignature = timeSignature;
    this.sampleRate = sampleRate;
  }

  /**
   * Convert seconds to samples
   */
  secondsToSamples(seconds: number): number {
    return Math.floor(seconds * this.sampleRate);
  }

  /**
   * Convert samples to seconds
   */
  samplesToSeconds(samples: number): number {
    return samples / this.sampleRate;
  }

  /**
   * Convert seconds to BBT
   */
  secondsToBBT(seconds: number): BBT {
    const beatsPerSecond = this.bpm / 60;
    const totalBeats = seconds * beatsPerSecond;
    
    const beatsPerBar = this.timeSignature.numerator;
    
    const bars = Math.floor(totalBeats / beatsPerBar);
    const beats = Math.floor(totalBeats % beatsPerBar);
    const ticks = Math.floor((totalBeats % 1) * TICKS_PER_BEAT);
    
    return {
      bars: bars + 1, // 1-indexed
      beats: beats + 1, // 1-indexed
      ticks
    };
  }

  /**
   * Convert BBT to seconds
   */
  bbtToSeconds(bbt: BBT): number {
    const beatsPerBar = this.timeSignature.numerator;
    const totalBeats = (bbt.bars - 1) * beatsPerBar + (bbt.beats - 1) + (bbt.ticks / TICKS_PER_BEAT);
    const beatsPerSecond = this.bpm / 60;
    return totalBeats / beatsPerSecond;
  }

  /**
   * Convert samples to BBT
   */
  samplesToBBT(samples: number): BBT {
    return this.secondsToBBT(this.samplesToSeconds(samples));
  }

  /**
   * Convert BBT to samples
   */
  bbtToSamples(bbt: BBT): number {
    return this.secondsToSamples(this.bbtToSeconds(bbt));
  }

  /**
   * Format BBT as string
   */
  formatBBT(bbt: BBT): string {
    return `${bbt.bars}.${bbt.beats}.${String(bbt.ticks).padStart(3, '0')}`;
  }

  /**
   * Format time as MM:SS.mmm
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  /**
   * Get grid interval in seconds for given unit
   */
  getGridInterval(unit: GridUnit): number {
    const secondsPerBeat = 60 / this.bpm;
    const beatsPerBar = this.timeSignature.numerator;
    
    switch (unit) {
      case 'bar': return secondsPerBeat * beatsPerBar;
      case 'beat': return secondsPerBeat;
      case '1/2': return secondsPerBeat / 2;
      case '1/4': return secondsPerBeat;
      case '1/8': return secondsPerBeat / 2;
      case '1/16': return secondsPerBeat / 4;
      case '1/32': return secondsPerBeat / 8;
      case '1/64': return secondsPerBeat / 16;
      case 'triplet-1/4': return secondsPerBeat / 1.5;
      case 'triplet-1/8': return secondsPerBeat / 3;
      case 'triplet-1/16': return secondsPerBeat / 6;
      case 'frame': return 1 / 30; // 30 fps
      case 'sample': return 1 / this.sampleRate;
      default: return secondsPerBeat / 4;
    }
  }

  /**
   * Snap time to grid with quantize strength
   */
  snapToGrid(time: number, unit: GridUnit, quantizeStrength: number = 1.0): number {
    const interval = this.getGridInterval(unit);
    const snappedTime = Math.round(time / interval) * interval;
    
    // Blend between free and snapped based on quantize strength
    return time + (snappedTime - time) * quantizeStrength;
  }

  /**
   * Get adaptive grid unit based on zoom (pixels per second)
   */
  getAdaptiveGridUnit(zoom: number): GridUnit {
    const pixelsPerBeat = zoom * (60 / this.bpm);
    
    if (pixelsPerBeat < 20) return 'bar';
    if (pixelsPerBeat < 40) return 'beat';
    if (pixelsPerBeat < 80) return '1/4';
    if (pixelsPerBeat < 120) return '1/8';
    if (pixelsPerBeat < 200) return '1/16';
    if (pixelsPerBeat < 400) return '1/32';
    return '1/64';
  }
}

export type GridUnit = 
  | 'bar' 
  | 'beat' 
  | '1/2' 
  | '1/4' 
  | '1/8' 
  | '1/16' 
  | '1/32' 
  | '1/64'
  | 'triplet-1/4'
  | 'triplet-1/8'
  | 'triplet-1/16'
  | 'frame'
  | 'sample';
