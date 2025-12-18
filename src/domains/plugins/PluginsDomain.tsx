/**
 * PluginsDomain - FX windows, presets, and plugin state
 * Phase 31: App.tsx Decomposition
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { 
  loadPluginFavorites, 
  loadPluginPresets, 
  PluginPreset, 
  savePluginFavorites, 
  savePluginPresets 
} from '../../utils/pluginState';

// ============================================================================
// Types
// ============================================================================

export type FxWindowId = string;

export interface FXWindowState {
  id: FxWindowId;
  trackId: string;
  pluginId: string;
  isOpen: boolean;
  position: { x: number; y: number };
  params: Record<string, number>;
  isBypassed: boolean;
}

export interface PluginsState {
  fxVisibility: Record<FxWindowId, boolean>;
  fxBypassState: Record<FxWindowId, boolean>;
  pluginPresets: Record<string, PluginPreset[]>; // pluginId -> presets
  pluginFavorites: Record<string, boolean>; // pluginId -> isFavorite
}

export interface PluginsActions {
  setFxVisibility: (fxId: FxWindowId, visible: boolean | ((prev: boolean) => boolean)) => void;
  toggleFxBypass: (fxId: FxWindowId) => void;
  setAllFxBypass: (bypassState: Record<FxWindowId, boolean> | ((prev: Record<FxWindowId, boolean>) => Record<FxWindowId, boolean>)) => void;
  
  savePreset: (pluginId: string, preset: PluginPreset) => void;
  removePreset: (pluginId: string, presetId: string) => void;
  setAllPresets: (presets: Record<string, PluginPreset[]>) => void;
  
  toggleFavorite: (pluginId: string) => void;
  setAllFavorites: (favorites: Record<string, boolean>) => void;
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
// Provider
// ============================================================================

interface PluginsDomainProviderProps {
  children: ReactNode;
}

export function PluginsDomainProvider({ children }: PluginsDomainProviderProps) {
  // --- State ---
  const [fxVisibility, setFxVisibilityState] = useState<Record<FxWindowId, boolean>>({});
  const [fxBypassState, setFxBypassState] = useState<Record<FxWindowId, boolean>>({});
  
  // Hydrate from localStorage
  const [pluginFavorites, setPluginFavorites] = useState<Record<string, boolean>>(
    () => loadPluginFavorites() as Record<string, boolean>
  );
  const [pluginPresets, setPluginPresets] = useState<Record<string, PluginPreset[]>>(
    () => loadPluginPresets() as Record<string, PluginPreset[]>
  );

  // --- Persistence Effects ---
  useEffect(() => {
    savePluginFavorites(pluginFavorites);
  }, [pluginFavorites]);

  useEffect(() => {
    savePluginPresets(pluginPresets);
  }, [pluginPresets]);

  // --- Visibility Actions ---
  const setFxVisibility = useCallback((fxId: FxWindowId, visible: boolean | ((prev: boolean) => boolean)) => {
    setFxVisibilityState(prev => {
      const nextValue = typeof visible === 'function' ? visible(prev[fxId] || false) : visible;
      return { ...prev, [fxId]: nextValue };
    });
  }, []);

  // --- Bypass Actions ---
  const toggleFxBypass = useCallback((fxId: FxWindowId) => {
    setFxBypassState(prev => ({
      ...prev,
      [fxId]: !(prev[fxId] || false)
    }));
  }, []);

  const setAllFxBypass = useCallback((action: Record<FxWindowId, boolean> | ((prev: Record<FxWindowId, boolean>) => Record<FxWindowId, boolean>)) => {
    if (typeof action === 'function') {
      setFxBypassState(action);
    } else {
      setFxBypassState(action);
    }
  }, []);

  // --- Preset Actions ---
  const savePreset = useCallback((pluginId: string, preset: PluginPreset) => {
    setPluginPresets(prev => {
      const existing = prev[pluginId] ?? [];
      const filtered = existing.filter(p => p.id !== preset.id);
      return {
        ...prev,
        [pluginId]: [...filtered, preset]
      };
    });
  }, []);

  const removePreset = useCallback((pluginId: string, presetId: string) => {
    setPluginPresets(prev => {
      const existing = prev[pluginId] ?? [];
      return {
        ...prev,
        [pluginId]: existing.filter(p => p.id !== presetId)
      };
    });
  }, []);

  const setAllPresets = useCallback((presets: Record<string, PluginPreset[]>) => {
    setPluginPresets(presets);
  }, []);

  // --- Favorite Actions ---
  const toggleFavorite = useCallback((pluginId: string) => {
    setPluginFavorites(prev => ({
      ...prev,
      [pluginId]: !prev[pluginId]
    }));
  }, []);

  const setAllFavorites = useCallback((favorites: Record<string, boolean>) => {
    setPluginFavorites(favorites);
  }, []);

  // --- Context Value ---
  const contextValue: PluginsDomainContextType = {
    fxVisibility,
    fxBypassState,
    pluginPresets,
    pluginFavorites,
    setFxVisibility,
    toggleFxBypass,
    setAllFxBypass,
    savePreset,
    removePreset,
    setAllPresets,
    toggleFavorite,
    setAllFavorites,
  };

  return (
    <PluginsDomainContext.Provider value={contextValue}>
      {children}
    </PluginsDomainContext.Provider>
  );
}

export default PluginsDomainProvider;
