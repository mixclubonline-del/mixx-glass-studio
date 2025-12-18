/**
 * Project Domain Types
 * Phase 31: App.tsx Decomposition
 * 
 * Types for project persistence and state management.
 */

import type { MidiNote } from '../../types/midi';
import type { MusicalContext } from '../../types/sonic-architecture';
import type { IngestHistoryEntry } from '../../state/ingestHistory';
import type { PersistedIngestSnapshot } from '../../ingest/IngestQueueManager';

// Re-export from App.tsx for backwards compatibility during migration
export interface MixerSettings {
  volume: number;
  pan: number;
  isMuted: boolean;
}

export type FxWindowId = string;

export interface TrackData {
  id: string;
  trackName: string;
  trackColor: 'cyan' | 'magenta' | 'blue' | 'green' | 'purple' | 'crimson';
  waveformType: 'dense' | 'sparse' | 'varied' | 'bass';
  group: 'Vocals' | 'Harmony' | 'Adlibs' | 'Bass' | 'Drums' | 'Instruments';
  isProcessing?: boolean;
  role: 'twoTrack' | 'hushRecord' | 'standard';
  locked?: boolean;
}

/**
 * Persisted project state for save/load
 */
export interface PersistedProjectState {
  tracks?: TrackData[];
  clips?: any[];
  mixerSettings?: Record<string, MixerSettings>;
  inserts?: Record<string, FxWindowId[]>;
  masterVolume?: number | string;
  masterBalance?: number | string;
  isLooping?: boolean;
  bpm?: number | string;
  ppsValue?: number | string;
  scrollX?: number | string;
  audioBuffers?: Record<string, any>;
  automationData?: Record<string, any>;
  visibleAutomationLanes?: Record<string, any>;
  musicalContext?: MusicalContext;
  fxBypassState?: Record<string, boolean>;
  bloomPosition?: { x: number; y: number };
  floatingBloomPosition?: { x: number; y: number };
  ingestSnapshot?: PersistedIngestSnapshot;
  ingestHistoryEntries?: IngestHistoryEntry[];
  followPlayhead?: boolean;
  pianoRollSketches?: Record<string, MidiNote[]>;
  pianoRollZoom?: { scrollX: number; zoomX: number; zoomY: number };
}

export interface ProjectDomainContextType {
  // Current project state
  projectName: string;
  isDirty: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  save: () => Promise<void>;
  load: (state: PersistedProjectState) => void;
  reset: () => void;
  setProjectName: (name: string) => void;
  markDirty: () => void;
  
  // State getter (for persistence)
  getState: () => PersistedProjectState | null;
  setStateGetter: (getter: () => PersistedProjectState) => void;
}
