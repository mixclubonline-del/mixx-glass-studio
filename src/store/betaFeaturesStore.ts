/**
 * Beta Features Store - Experimental features and tools
 */

import { create } from 'zustand';

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  description: string;
  state: any; // Complete project state
}

export interface ExportProfile {
  id: string;
  name: string;
  format: 'wav' | 'mp3' | 'flac' | 'stems';
  sampleRate: number;
  bitDepth: number;
  quality: 'high' | 'medium' | 'low';
  normalize: boolean;
  dithering: boolean;
}

interface BetaFeaturesState {
  // Snapshots
  snapshots: Snapshot[];
  currentSnapshot: string | null;
  
  // A/B Compare
  compareMode: boolean;
  versionA: Snapshot | null;
  versionB: Snapshot | null;
  activeVersion: 'A' | 'B';
  
  // Export Profiles
  exportProfiles: ExportProfile[];
  selectedProfile: string | null;
  
  // Actions
  createSnapshot: (name: string, description: string, state: any) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  
  enableCompareMode: (snapshotA: string, snapshotB: string) => void;
  switchVersion: () => void;
  exitCompareMode: () => void;
  
  addExportProfile: (profile: Omit<ExportProfile, 'id'>) => void;
  selectProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
}

const DEFAULT_PROFILES: ExportProfile[] = [
  {
    id: 'master-wav',
    name: 'Master WAV (24-bit)',
    format: 'wav',
    sampleRate: 48000,
    bitDepth: 24,
    quality: 'high',
    normalize: true,
    dithering: false,
  },
  {
    id: 'master-mp3',
    name: 'Master MP3 (320kbps)',
    format: 'mp3',
    sampleRate: 48000,
    bitDepth: 16,
    quality: 'high',
    normalize: true,
    dithering: true,
  },
  {
    id: 'stems-wav',
    name: 'Stems Package (WAV)',
    format: 'stems',
    sampleRate: 48000,
    bitDepth: 24,
    quality: 'high',
    normalize: false,
    dithering: false,
  },
  {
    id: 'streaming-mp3',
    name: 'Streaming MP3 (128kbps)',
    format: 'mp3',
    sampleRate: 44100,
    bitDepth: 16,
    quality: 'medium',
    normalize: true,
    dithering: true,
  },
];

export const useBetaFeaturesStore = create<BetaFeaturesState>((set, get) => ({
  // Initial state
  snapshots: [],
  currentSnapshot: null,
  compareMode: false,
  versionA: null,
  versionB: null,
  activeVersion: 'A',
  exportProfiles: DEFAULT_PROFILES,
  selectedProfile: 'master-wav',
  
  // Snapshot actions
  createSnapshot: (name, description, state) => {
    const snapshot: Snapshot = {
      id: `snapshot-${Date.now()}`,
      name,
      timestamp: Date.now(),
      description,
      state,
    };
    
    set((prevState) => ({
      snapshots: [...prevState.snapshots, snapshot],
      currentSnapshot: snapshot.id,
    }));
  },
  
  loadSnapshot: (id) => {
    set({ currentSnapshot: id });
    // Would apply snapshot state here
  },
  
  deleteSnapshot: (id) => {
    set((prevState) => ({
      snapshots: prevState.snapshots.filter((s) => s.id !== id),
      currentSnapshot: prevState.currentSnapshot === id ? null : prevState.currentSnapshot,
    }));
  },
  
  // Compare actions
  enableCompareMode: (snapshotA, snapshotB) => {
    const { snapshots } = get();
    const versionA = snapshots.find((s) => s.id === snapshotA) || null;
    const versionB = snapshots.find((s) => s.id === snapshotB) || null;
    
    set({
      compareMode: true,
      versionA,
      versionB,
      activeVersion: 'A',
    });
  },
  
  switchVersion: () => {
    set((prevState) => ({
      activeVersion: prevState.activeVersion === 'A' ? 'B' : 'A',
    }));
  },
  
  exitCompareMode: () => {
    set({
      compareMode: false,
      versionA: null,
      versionB: null,
      activeVersion: 'A',
    });
  },
  
  // Export profile actions
  addExportProfile: (profile) => {
    const newProfile: ExportProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
    };
    
    set((prevState) => ({
      exportProfiles: [...prevState.exportProfiles, newProfile],
    }));
  },
  
  selectProfile: (id) => {
    set({ selectedProfile: id });
  },
  
  deleteProfile: (id) => {
    set((prevState) => ({
      exportProfiles: prevState.exportProfiles.filter((p) => p.id !== id),
      selectedProfile: prevState.selectedProfile === id ? null : prevState.selectedProfile,
    }));
  },
}));
