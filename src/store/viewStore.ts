/**
 * View Store - Zustand store for managing DAW view state
 */

import { create } from 'zustand';

export type ViewType = 'arrange' | 'mix' | 'edit' | 'ai-studio' | 'producer-lab' | 'master';

interface ViewState {
  currentView: ViewType;
  activePluginId: string | null;
  pluginParams: Record<string, number>;
  isPanelOpen: {
    mixer: boolean;
    effects: boolean;
    automation: boolean;
    browser: boolean;
    metering: boolean;
    inspector: boolean;
    toolbar: boolean;
    pianoRoll: boolean;
    stepSequencer: boolean;
    grooveEngine: boolean;
    timeStretch: boolean;
    comping: boolean;
    routing: boolean;
    stemSeparation: boolean;
    audioRestoration: boolean;
    advancedPitch: boolean;
    audioToMIDI: boolean;
    voiceIsolation: boolean;
  };
  analyzerMode: 'spectrum' | 'phase' | 'waveform';
  exportDialogOpen: boolean;
  
  // Actions
  setView: (view: ViewType) => void;
  setActivePlugin: (pluginId: string | null, params?: Record<string, number>) => void;
  togglePanel: (panel: keyof ViewState['isPanelOpen']) => void;
  setAnalyzerMode: (mode: 'spectrum' | 'phase' | 'waveform') => void;
  closeAllPlugins: () => void;
  collapseAll: () => void;
  restorePanels: () => void;
  setExportDialogOpen: (open: boolean) => void;
}

export const useViewStore = create<ViewState>((set, get) => ({
  currentView: 'arrange',
  activePluginId: null,
  pluginParams: {},
  isPanelOpen: {
    mixer: false,
    effects: false,
    automation: false,
    browser: false,
    metering: false,
    inspector: false,
    toolbar: true,
    pianoRoll: false,
    stepSequencer: false,
    grooveEngine: false,
    timeStretch: false,
    comping: false,
    routing: false,
    stemSeparation: false,
    audioRestoration: false,
    advancedPitch: false,
    audioToMIDI: false,
    voiceIsolation: false,
  },
  analyzerMode: 'spectrum',
  exportDialogOpen: false,
  
  setView: (view) => set({ currentView: view }),
  
  setActivePlugin: (pluginId, params = {}) => 
    set({ activePluginId: pluginId, pluginParams: params }),
  
  togglePanel: (panel) => {
    set((state) => ({
      isPanelOpen: {
        ...state.isPanelOpen,
        [panel]: !state.isPanelOpen[panel],
      },
    }));
    // Persist to localStorage
    const newState = get();
    localStorage.setItem('viewStore:panels', JSON.stringify(newState.isPanelOpen));
  },
  
  setAnalyzerMode: (mode) => set({ analyzerMode: mode }),
  
  closeAllPlugins: () => 
    set({ activePluginId: null, pluginParams: {} }),
  
  collapseAll: () => {
    set({
      isPanelOpen: {
        mixer: false,
        effects: false,
        automation: false,
        browser: false,
        metering: false,
        inspector: false,
        toolbar: false,
        pianoRoll: false,
        stepSequencer: false,
        grooveEngine: false,
        timeStretch: false,
        comping: false,
        routing: false,
        stemSeparation: false,
        audioRestoration: false,
        advancedPitch: false,
        audioToMIDI: false,
        voiceIsolation: false,
      },
    });
    localStorage.setItem('viewStore:panels', JSON.stringify(get().isPanelOpen));
  },
  
  restorePanels: () => {
    const saved = localStorage.getItem('viewStore:panels');
    if (saved) {
      set({ isPanelOpen: JSON.parse(saved) });
    }
  },
  
  setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
}));
