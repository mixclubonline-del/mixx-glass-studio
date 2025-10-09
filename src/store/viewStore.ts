/**
 * View Store - Zustand store for managing DAW view state
 */

import { create } from 'zustand';

export type ViewType = 'arrange' | 'mix' | 'edit';

interface ViewState {
  currentView: ViewType;
  activePluginId: string | null;
  pluginParams: Record<string, number>;
  isPanelOpen: {
    mixer: boolean;
    effects: boolean;
    automation: boolean;
    browser: boolean;
  };
  
  // Actions
  setView: (view: ViewType) => void;
  setActivePlugin: (pluginId: string | null, params?: Record<string, number>) => void;
  togglePanel: (panel: keyof ViewState['isPanelOpen']) => void;
  closeAllPlugins: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: 'arrange',
  activePluginId: null,
  pluginParams: {},
  isPanelOpen: {
    mixer: false,
    effects: false,
    automation: false,
    browser: false,
  },
  
  setView: (view) => set({ currentView: view }),
  
  setActivePlugin: (pluginId, params = {}) => 
    set({ activePluginId: pluginId, pluginParams: params }),
  
  togglePanel: (panel) => 
    set((state) => ({
      isPanelOpen: {
        ...state.isPanelOpen,
        [panel]: !state.isPanelOpen[panel],
      },
    })),
  
  closeAllPlugins: () => 
    set({ activePluginId: null, pluginParams: {} }),
}));
