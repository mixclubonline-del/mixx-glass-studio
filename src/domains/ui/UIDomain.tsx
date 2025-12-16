/**
 * UIDomain - Theme, layout, and dock positions
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface DockState {
  position: Point;
  isVisible: boolean;
  isExpanded: boolean;
}

export interface UILayout {
  panelViewEnabled: boolean;
  mixerVisible: boolean;
  timelineVisible: boolean;
  pianoRollVisible: boolean;
  aiHubVisible: boolean;
  browserVisible: boolean;
}

export interface UIState {
  theme: 'dark' | 'light' | 'aura';
  dockState: DockState;
  hubPosition: Point;
  layout: UILayout;
  activePanel: string | null;
  isFullscreen: boolean;
}

export interface UIActions {
  setTheme: (theme: 'dark' | 'light' | 'aura') => void;
  setDockPosition: (position: Point) => void;
  setDockVisible: (visible: boolean) => void;
  setDockExpanded: (expanded: boolean) => void;
  setHubPosition: (position: Point) => void;
  setLayoutPanel: (panel: keyof UILayout, visible: boolean) => void;
  setActivePanel: (panel: string | null) => void;
  toggleFullscreen: () => void;
}

export interface UIDomainContextType extends UIState, UIActions {}

// ============================================================================
// Context
// ============================================================================

const UIDomainContext = createContext<UIDomainContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useUI(): UIDomainContextType {
  const context = useContext(UIDomainContext);
  if (!context) {
    throw new Error('useUI must be used within UIDomainProvider');
  }
  return context;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_DOCK_STATE: DockState = {
  position: { x: window.innerWidth / 2 - 150, y: window.innerHeight - 100 },
  isVisible: true,
  isExpanded: false,
};

const DEFAULT_LAYOUT: UILayout = {
  panelViewEnabled: true,
  mixerVisible: true,
  timelineVisible: true,
  pianoRollVisible: false,
  aiHubVisible: false,
  browserVisible: false,
};

// ============================================================================
// Provider
// ============================================================================

interface UIDomainProviderProps {
  children: ReactNode;
}

export function UIDomainProvider({ children }: UIDomainProviderProps) {
  const [theme, setThemeState] = useState<'dark' | 'light' | 'aura'>('aura');
  const [dockState, setDockState] = useState<DockState>(DEFAULT_DOCK_STATE);
  const [hubPosition, setHubPositionState] = useState<Point>({ x: 100, y: 100 });
  const [layout, setLayout] = useState<UILayout>(DEFAULT_LAYOUT);
  const [activePanel, setActivePanelState] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Set theme
  const setTheme = useCallback((newTheme: 'dark' | 'light' | 'aura') => {
    setThemeState(newTheme);
  }, []);

  // Set dock position
  const setDockPosition = useCallback((position: Point) => {
    setDockState(prev => ({ ...prev, position }));
  }, []);

  // Set dock visible
  const setDockVisible = useCallback((visible: boolean) => {
    setDockState(prev => ({ ...prev, isVisible: visible }));
  }, []);

  // Set dock expanded
  const setDockExpanded = useCallback((expanded: boolean) => {
    setDockState(prev => ({ ...prev, isExpanded: expanded }));
  }, []);

  // Set hub position
  const setHubPosition = useCallback((position: Point) => {
    setHubPositionState(position);
  }, []);

  // Set layout panel visibility
  const setLayoutPanel = useCallback((panel: keyof UILayout, visible: boolean) => {
    setLayout(prev => ({ ...prev, [panel]: visible }));
  }, []);

  // Set active panel
  const setActivePanel = useCallback((panel: string | null) => {
    setActivePanelState(panel);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const contextValue: UIDomainContextType = {
    theme,
    dockState,
    hubPosition,
    layout,
    activePanel,
    isFullscreen,
    setTheme,
    setDockPosition,
    setDockVisible,
    setDockExpanded,
    setHubPosition,
    setLayoutPanel,
    setActivePanel,
    toggleFullscreen,
  };

  return (
    <UIDomainContext.Provider value={contextValue}>
      {children}
    </UIDomainContext.Provider>
  );
}

export default UIDomainProvider;
