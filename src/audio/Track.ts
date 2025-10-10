/**
 * Track
 * Represents an audio track with buffer, channel strip, and metadata
 */

import { ChannelStrip } from './ChannelStrip';
import { TrackColor, AutomationMode } from '@/types/audio';

export interface PluginInsert {
  slotNumber: number;
  pluginId: string | null;
  instanceId: string | null;
  bypass: boolean;
}

export class Track {
  public id: string;
  public name: string;
  public buffer: AudioBuffer | null;
  public channelStrip: ChannelStrip;
  public color: TrackColor;
  public offset: number; // Start position in timeline (seconds)
  public recordArmed: boolean;
  public automationMode: AutomationMode;
  public inserts: PluginInsert[];
  
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
    
    // Initialize 8 insert slots
    this.inserts = Array(8).fill(null).map((_, i) => ({
      slotNumber: i + 1,
      pluginId: null,
      instanceId: null,
      bypass: false
    }));
    
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
  
  // Plugin management
  loadPlugin(slotNumber: number, pluginId: string, instanceId: string) {
    const insert = this.inserts.find(i => i.slotNumber === slotNumber);
    if (insert) {
      insert.pluginId = pluginId;
      insert.instanceId = instanceId;
      insert.bypass = false;
    }
  }
  
  unloadPlugin(slotNumber: number) {
    const insert = this.inserts.find(i => i.slotNumber === slotNumber);
    if (insert) {
      insert.pluginId = null;
      insert.instanceId = null;
      insert.bypass = false;
    }
  }
  
  bypassPlugin(slotNumber: number, bypass: boolean) {
    const insert = this.inserts.find(i => i.slotNumber === slotNumber);
    if (insert) {
      insert.bypass = bypass;
    }
  }
  
  dispose() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    this.channelStrip.dispose();
  }
}
