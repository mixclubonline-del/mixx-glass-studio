/**
 * Bus (Aux/Group)
 * Represents an auxiliary or group bus with its own channel strip
 */

import { ChannelStrip } from './ChannelStrip';
import { TrackColor } from '@/types/audio';

export type BusType = 'aux' | 'group' | 'master';

export class Bus {
  public id: string;
  public name: string;
  public type: BusType;
  public channelStrip: ChannelStrip;
  public input: GainNode;
  public color: TrackColor;
  public soloSafe: boolean;
  
  constructor(
    context: AudioContext,
    id: string,
    name: string,
    type: BusType = 'aux'
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.soloSafe = type === 'aux'; // Aux buses are solo-safe by default
    
    // Create input (receives from track sends)
    this.input = context.createGain();
    
    // Create channel strip
    this.channelStrip = new ChannelStrip(context);
    
    // Connect input to channel strip
    this.input.connect(this.channelStrip.input);
    
    // Default color based on type
    this.color = this.getDefaultColor(type);
  }
  
  private getDefaultColor(type: BusType): TrackColor {
    switch (type) {
      case 'aux':
        return { hue: 191, saturation: 100, lightness: 50 }; // Neon blue
      case 'group':
        return { hue: 314, saturation: 100, lightness: 65 }; // Neon pink
      case 'master':
        return { hue: 45, saturation: 100, lightness: 50 }; // Gold
      default:
        return { hue: 275, saturation: 100, lightness: 65 }; // Prime purple
    }
  }
  
  setName(name: string) {
    this.name = name;
  }
  
  setColor(color: TrackColor) {
    this.color = color;
  }
  
  setSoloSafe(soloSafe: boolean) {
    this.soloSafe = soloSafe;
  }
  
  dispose() {
    this.input.disconnect();
    this.channelStrip.dispose();
  }
}
