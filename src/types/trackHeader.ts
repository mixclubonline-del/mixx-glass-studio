/**
 * Professional Track Header Types & Controls
 * 
 * Comprehensive track header system for all track types in Mixx Club Studio.
 * Each track type has specific controls relevant to its function.
 */

export type TrackType = 
  | 'audio'           // Standard audio track
  | 'midi'            // MIDI track
  | 'instrument'      // Software instrument track
  | 'bus'             // Bus/aux track
  | 'master'          // Master output track
  | 'two-track'       // Two-track reference
  | 'hush-record';    // Hush recording track

export interface TrackHeaderSettings {
  // Core controls (all track types)
  volume: number;              // 0-1.2 (can go above unity)
  pan: number;                 // -1 to 1
  mute: boolean;
  solo: boolean;
  arm: boolean;                // Recording arm
  
  // Audio-specific controls
  inputMonitoring?: boolean;   // Monitor input while recording
  phaseInvert?: boolean;       // Phase invert (180°)
  stereoWidth?: number;        // 0-2 (0=mono, 1=normal, 2=wide)
  inputSource?: string;        // Input device/channel
  outputRouting?: string;      // Bus assignment
  
  // MIDI/Instrument-specific
  midiChannel?: number;         // MIDI channel (1-16)
  inputDevice?: string;         // MIDI input device
  instrument?: string;          // Loaded instrument
  
  // Bus-specific
  busType?: 'aux' | 'group' | 'fx';  // Bus type
  sendLevels?: Record<string, number>; // Send levels to other buses
  
  // Advanced controls
  automationMode?: 'read' | 'write' | 'touch' | 'latch' | 'off';
  trackHeight?: number;         // Track height in pixels
  locked?: boolean;             // Lock track from editing
  color?: string;                // Track color
  
  // Inserts & Sends
  insertCount?: number;         // Number of active inserts
  sendCount?: number;           // Number of active sends
  
  // Recording
  recordInputLevel?: number;    // Input level meter (0-1)
  recordMode?: 'normal' | 'punch' | 'loop' | 'replace';
}

export interface TrackHeaderProps {
  trackId: string;
  trackName: string;
  trackType: TrackType;
  trackColor: string;
  settings: TrackHeaderSettings;
  isSelected: boolean;
  isCollapsed: boolean;
  alsIntensity?: number;
  
  // Callbacks
  onSelect: () => void;
  onSettingChange: (setting: keyof TrackHeaderSettings, value: any) => void;
  onInvokeBloom?: () => void;
  onToggleCollapse?: () => void;
  onRename?: (newName: string) => void;
}

/**
 * Get default settings for a track type
 */
export function getDefaultTrackHeaderSettings(trackType: TrackType): TrackHeaderSettings {
  const base: TrackHeaderSettings = {
    volume: 0.75,
    pan: 0,
    mute: false,
    solo: false,
    arm: false,
  };
  
  switch (trackType) {
    case 'audio':
      return {
        ...base,
        inputMonitoring: false,
        phaseInvert: false,
        stereoWidth: 1.0,
        automationMode: 'read',
        trackHeight: 108,
      };
    
    case 'midi':
      return {
        ...base,
        midiChannel: 1,
        automationMode: 'read',
        trackHeight: 108,
      };
    
    case 'instrument':
      return {
        ...base,
        midiChannel: 1,
        stereoWidth: 1.0,
        automationMode: 'read',
        trackHeight: 108,
      };
    
    case 'bus':
      return {
        ...base,
        busType: 'aux',
        sendLevels: {},
        automationMode: 'read',
        trackHeight: 96,
      };
    
    case 'master':
      return {
        ...base,
        automationMode: 'read',
        trackHeight: 120,
        locked: true,
      };
    
    case 'two-track':
      return {
        ...base,
        inputMonitoring: false,
        stereoWidth: 1.0,
        locked: true,
        trackHeight: 96,
      };
    
    case 'hush-record':
      return {
        ...base,
        inputMonitoring: true,
        phaseInvert: false,
        stereoWidth: 1.0,
        recordMode: 'normal',
        trackHeight: 108,
      };
    
    default:
      return base;
  }
}

/**
 * Get controls that should be visible for a track type
 */
export function getVisibleControls(trackType: TrackType): Set<keyof TrackHeaderSettings> {
  const allControls = new Set<keyof TrackHeaderSettings>([
    'volume',
    'pan',
    'mute',
    'solo',
    'arm',
  ]);
  
  switch (trackType) {
    case 'audio':
    case 'hush-record':
      allControls.add('inputMonitoring');
      allControls.add('phaseInvert');
      allControls.add('stereoWidth');
      allControls.add('inputSource');
      allControls.add('outputRouting');
      allControls.add('recordInputLevel');
      break;
    
    case 'midi':
      allControls.add('midiChannel');
      allControls.add('inputDevice');
      break;
    
    case 'instrument':
      allControls.add('midiChannel');
      allControls.add('inputDevice');
      allControls.add('instrument');
      allControls.add('stereoWidth');
      break;
    
    case 'bus':
      allControls.add('busType');
      allControls.add('sendLevels');
      break;
    
    case 'master':
      // Master has minimal controls
      break;
    
    case 'two-track':
      allControls.add('stereoWidth');
      break;
  }
  
  // Common advanced controls
  allControls.add('automationMode');
  allControls.add('trackHeight');
  allControls.add('locked');
  allControls.add('insertCount');
  allControls.add('sendCount');
  
  return allControls;
}










