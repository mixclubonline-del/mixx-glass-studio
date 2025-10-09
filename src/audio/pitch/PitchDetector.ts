/**
 * Main Pitch Detector
 * Combines YIN for speed and will add CREPE for accuracy
 */

import { YINDetector } from './YINDetector';
import { PitchData } from '@/types/mixxtune';

export class PitchDetector {
  private yinDetector: YINDetector;
  private sampleRate: number;
  private lastPitch: number = 0;
  private pitchHistory: number[] = [];
  private readonly historySize = 5;
  
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.yinDetector = new YINDetector(sampleRate);
  }
  
  /**
   * Detect pitch from audio buffer
   */
  detect(audioBuffer: Float32Array, timestamp: number): PitchData | null {
    const { frequency, confidence } = this.yinDetector.detect(audioBuffer);
    
    if (frequency === 0 || confidence < 0.8) {
      return null;
    }
    
    const { note, cents } = YINDetector.getCentsOffset(frequency);
    
    // Detect vibrato and slides
    this.pitchHistory.push(frequency);
    if (this.pitchHistory.length > this.historySize) {
      this.pitchHistory.shift();
    }
    
    const isVibrato = this.detectVibrato();
    const isSlide = this.detectSlide(frequency);
    
    this.lastPitch = frequency;
    
    return {
      frequency,
      midiNote: note,
      cents,
      confidence,
      isVibrato,
      isSlide,
      timestamp
    };
  }
  
  /**
   * Detect vibrato by analyzing pitch variance
   */
  private detectVibrato(): boolean {
    if (this.pitchHistory.length < this.historySize) {
      return false;
    }
    
    const mean = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
    const variance = this.pitchHistory.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / this.pitchHistory.length;
    const stdDev = Math.sqrt(variance);
    
    // Vibrato: oscillation around mean, moderate std dev
    return stdDev > 2 && stdDev < 15;
  }
  
  /**
   * Detect intentional pitch slide
   */
  private detectSlide(currentFreq: number): boolean {
    if (this.lastPitch === 0) {
      return false;
    }
    
    const centsChange = Math.abs((currentFreq - this.lastPitch) / this.lastPitch * 1200);
    
    // Slide: consistent pitch change > 50 cents
    return centsChange > 50;
  }
  
  /**
   * Clear history (use when audio stops)
   */
  reset(): void {
    this.pitchHistory = [];
    this.lastPitch = 0;
  }
}
