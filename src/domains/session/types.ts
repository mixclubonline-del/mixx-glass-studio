/**
 * Session Domain Types
 * Phase 31: App.tsx Decomposition
 * 
 * Types for session/UI panel state management.
 */

export interface SessionDomainContextType {
  // Panel visibility
  isPianoRollOpen: boolean;
  isSpectralEditorOpen: boolean;
  isMixerOpen: boolean;
  isExportModalOpen: boolean;
  isAIHubOpen: boolean;
  isStemSeparationModalOpen: boolean;
  
  // Active selections for panels
  activePanelClipId: string | null;
  activePanelTrackId: string | null;
  activeStemClipId: string | null;
  
  // Playhead following
  followPlayhead: boolean;
  
  // Actions
  openPianoRoll: (trackId: string, clipId: string) => void;
  closePianoRoll: () => void;
  openSpectralEditor: (trackId: string, clipId: string) => void;
  closeSpectralEditor: () => void;
  toggleMixer: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  openAIHub: () => void;
  closeAIHub: () => void;
  openStemSeparation: (clipId: string) => void;
  closeStemSeparation: () => void;
  setFollowPlayhead: (follow: boolean | ((prev: boolean) => boolean)) => void;
}
