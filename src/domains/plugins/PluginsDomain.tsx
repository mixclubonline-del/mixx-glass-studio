/**
 * PluginsDomain - FX windows, presets, and plugin state
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface FXWindowState {
  id: string;
  trackId: string;
  pluginId: string;
  isOpen: boolean;
  position: { x: number; y: number };
  params: Record<string, number>;
}

export interface PluginPreset {
  id: string;
  name: string;
  pluginId: string;
  params: Record<string, number>;
  createdAt: number;
}

export interface PluginsState {
  openFxWindows: FXWindowState[];
  presets: Record<string, PluginPreset[]>; // pluginId -> presets
  favorites: string[]; // pluginIds
}

export interface PluginsActions {
  openFxWindow: (trackId: string, pluginId: string, position?: { x: number; y: number }) => string;
  closeFxWindow: (windowId: string) => void;
  updateFxWindowParams: (windowId: string, params: Record<string, number>) => void;
  updateFxWindowPosition: (windowId: string, position: { x: number; y: number }) => void;
  
  savePreset: (pluginId: string, name: string, params: Record<string, number>) => string;
  loadPreset: (presetId: string) => PluginPreset | null;
  deletePreset: (presetId: string) => void;
  
  toggleFavorite: (pluginId: string) => void;
  isFavorite: (pluginId: string) => boolean;
}

export interface PluginsDomainContextType extends PluginsState, PluginsActions {}

// ============================================================================
// Context
// ============================================================================

const PluginsDomainContext = createContext<PluginsDomainContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function usePlugins(): PluginsDomainContextType {
  const context = useContext(PluginsDomainContext);
  if (!context) {
    throw new Error('usePlugins must be used within PluginsDomainProvider');
  }
  return context;
}

// ============================================================================
// Utilities
// ============================================================================

let windowIdCounter = 0;
const generateWindowId = () => `fx-window-${++windowIdCounter}-${Date.now().toString(36)}`;

let presetIdCounter = 0;
const generatePresetId = () => `preset-${++presetIdCounter}-${Date.now().toString(36)}`;

// ============================================================================
// Provider
// ============================================================================

interface PluginsDomainProviderProps {
  children: ReactNode;
}

export function PluginsDomainProvider({ children }: PluginsDomainProviderProps) {
  const [openFxWindows, setOpenFxWindows] = useState<FXWindowState[]>([]);
  const [presets, setPresets] = useState<Record<string, PluginPreset[]>>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  // Open FX window
  const openFxWindow = useCallback((
    trackId: string, 
    pluginId: string, 
    position = { x: 100, y: 100 }
  ): string => {
    const id = generateWindowId();
    const newWindow: FXWindowState = {
      id,
      trackId,
      pluginId,
      isOpen: true,
      position,
      params: {},
    };
    setOpenFxWindows(prev => [...prev, newWindow]);
    return id;
  }, []);

  // Close FX window
  const closeFxWindow = useCallback((windowId: string) => {
    setOpenFxWindows(prev => prev.filter(w => w.id !== windowId));
  }, []);

  // Update FX window params
  const updateFxWindowParams = useCallback((windowId: string, params: Record<string, number>) => {
    setOpenFxWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, params: { ...w.params, ...params } } : w
    ));
  }, []);

  // Update FX window position
  const updateFxWindowPosition = useCallback((windowId: string, position: { x: number; y: number }) => {
    setOpenFxWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, position } : w
    ));
  }, []);

  // Save preset
  const savePreset = useCallback((
    pluginId: string, 
    name: string, 
    params: Record<string, number>
  ): string => {
    const id = generatePresetId();
    const preset: PluginPreset = {
      id,
      name,
      pluginId,
      params,
      createdAt: Date.now(),
    };
    setPresets(prev => ({
      ...prev,
      [pluginId]: [...(prev[pluginId] || []), preset]
    }));
    return id;
  }, []);

  // Load preset
  const loadPreset = useCallback((presetId: string): PluginPreset | null => {
    for (const pluginPresets of Object.values(presets)) {
      const preset = pluginPresets.find(p => p.id === presetId);
      if (preset) return preset;
    }
    return null;
  }, [presets]);

  // Delete preset
  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => {
      const next: Record<string, PluginPreset[]> = {};
      for (const [pluginId, pluginPresets] of Object.entries(prev)) {
        next[pluginId] = pluginPresets.filter(p => p.id !== presetId);
      }
      return next;
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((pluginId: string) => {
    setFavorites(prev => 
      prev.includes(pluginId) 
        ? prev.filter(id => id !== pluginId)
        : [...prev, pluginId]
    );
  }, []);

  // Is favorite
  const isFavorite = useCallback((pluginId: string): boolean => {
    return favorites.includes(pluginId);
  }, [favorites]);

  const contextValue: PluginsDomainContextType = {
    openFxWindows,
    presets,
    favorites,
    openFxWindow,
    closeFxWindow,
    updateFxWindowParams,
    updateFxWindowPosition,
    savePreset,
    loadPreset,
    deletePreset,
    toggleFavorite,
    isFavorite,
  };

  return (
    <PluginsDomainContext.Provider value={contextValue}>
      {children}
    </PluginsDomainContext.Provider>
  );
}

export default PluginsDomainProvider;
