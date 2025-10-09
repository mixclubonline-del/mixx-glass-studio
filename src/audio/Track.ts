/**
 * Track
 * Represents an audio track with buffer, channel strip, and metadata
 */

import { ChannelStrip } from './ChannelStrip';
import { TrackColor, AutomationMode } from '@/types/audio';

export class Track {
  public id: string;
  public name: string;
  public buffer: AudioBuffer | null;
  public channelStrip: ChannelStrip;
  public color: TrackColor;
  public offset: number; // Start position in timeline (seconds)
  public recordArmed: boolean;
  public automationMode: AutomationMode;
  
  // Playback state
  public source: AudioBufferSourceNode | null;
  
  constructor(
    context: AudioContext,
    id: string,
    name: string,
    buffer: AudioBuffer | null = null
  ) {
    this.id = id;
    this.name = name;
    this.buffer = buffer;
    this.channelStrip = new ChannelStrip(context);
    this.offset = 0;
    this.recordArmed = false;
    this.automationMode = 'off';
    this.source = null;
    
    // Random color for new tracks
    this.color = this.generateRandomColor();
  }
  
  private generateRandomColor(): TrackColor {
    const hues = [275, 191, 314]; // Prime purple, neon blue, neon pink
    const hue = hues[Math.floor(Math.random() * hues.length)];
    return {
      hue,
      saturation: 100,
      lightness: 65,
    };
  }
  
  setBuffer(buffer: AudioBuffer) {
    this.buffer = buffer;
  }
  
  setName(name: string) {
    this.name = name;
  }
  
  setColor(color: TrackColor) {
    this.color = color;
  }
  
  setOffset(offset: number) {
    this.offset = Math.max(0, offset);
  }
  
  setRecordArmed(armed: boolean) {
    this.recordArmed = armed;
  }
  
  setAutomationMode(mode: AutomationMode) {
    this.automationMode = mode;
  }
  
  getDuration(): number {
    return this.buffer ? this.buffer.duration : 0;
  }
  
  dispose() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    this.channelStrip.dispose();
  }
}
