/**
 * Session Domain Provider
 * Phase 31: App.tsx Decomposition
 * 
 * Manages panel visibility and session state.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { SessionDomainContextType } from './types';

const SessionDomainContext = createContext<SessionDomainContextType | null>(null);

interface SessionDomainProviderProps {
  children: ReactNode;
}

export function SessionDomainProvider({ children }: SessionDomainProviderProps) {
  // Panel visibility
  const [isPianoRollOpen, setIsPianoRollOpen] = useState(false);
  const [isSpectralEditorOpen, setIsSpectralEditorOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAIHubOpen, setIsAIHubOpen] = useState(false);
  
  // Active selections for panels
  const [activePanelClipId, setActivePanelClipId] = useState<string | null>(null);
  const [activePanelTrackId, setActivePanelTrackId] = useState<string | null>(null);
  
  // Playhead following
  const [followPlayhead, setFollowPlayhead] = useState(true);
  
  // Piano Roll actions
  const openPianoRoll = useCallback((trackId: string, clipId: string) => {
    setActivePanelTrackId(trackId);
    setActivePanelClipId(clipId);
    setIsPianoRollOpen(true);
    console.log('[SessionDomain] Piano Roll opened for:', clipId);
  }, []);
  
  const closePianoRoll = useCallback(() => {
    setIsPianoRollOpen(false);
    console.log('[SessionDomain] Piano Roll closed');
  }, []);
  
  // Spectral Editor actions
  const openSpectralEditor = useCallback((trackId: string, clipId: string) => {
    setActivePanelTrackId(trackId);
    setActivePanelClipId(clipId);
    setIsSpectralEditorOpen(true);
    console.log('[SessionDomain] Spectral Editor opened for:', clipId);
  }, []);
  
  const closeSpectralEditor = useCallback(() => {
    setIsSpectralEditorOpen(false);
    console.log('[SessionDomain] Spectral Editor closed');
  }, []);
  
  // Mixer actions
  const toggleMixer = useCallback(() => {
    setIsMixerOpen(prev => !prev);
  }, []);
  
  // Export Modal actions
  const openExportModal = useCallback(() => {
    setIsExportModalOpen(true);
    console.log('[SessionDomain] Export Modal opened');
  }, []);
  
  const closeExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  // AI Hub actions
  const openAIHub = useCallback(() => {
    setIsAIHubOpen(true);
    console.log('[SessionDomain] AI Hub opened');
  }, []);

  const closeAIHub = useCallback(() => {
    setIsAIHubOpen(false);
  }, []);
  
  const value: SessionDomainContextType = {
    isPianoRollOpen,
    isSpectralEditorOpen,
    isMixerOpen,
    isExportModalOpen,
    isAIHubOpen,
    activePanelClipId,
    activePanelTrackId,
    followPlayhead,
    openPianoRoll,
    closePianoRoll,
    openSpectralEditor,
    closeSpectralEditor,
    toggleMixer,
    openExportModal,
    closeExportModal,
    openAIHub,
    closeAIHub,
    setFollowPlayhead,
  };
  
  return (
    <SessionDomainContext.Provider value={value}>
      {children}
    </SessionDomainContext.Provider>
  );
}

/**
 * Hook to access session domain
 */
export function useSession(): SessionDomainContextType {
  const context = useContext(SessionDomainContext);
  if (!context) {
    throw new Error('useSession must be used within SessionDomainProvider');
  }
  return context;
}

export default SessionDomainProvider;
