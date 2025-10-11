/**
 * Plugin Store - Global plugin window and parameter state management
 * Phase 5: Plugin System
 */

import { create } from 'zustand';

interface PluginInstance {
  trackId: string;
  slotNumber: number;
  pluginId: string;
  parameters: Record<string, number>;
  bypass: boolean;
}

interface PluginWindow {
  id: string;
  trackId: string;
  slotNumber: number;
  pluginId: string;
  position: { x: number; y: number };
  zIndex: number;
}

interface PluginState {
  // Plugin instances (one per insert slot)
  instances: Map<string, PluginInstance>; // Key: `${trackId}-${slotNumber}`
  
  // Open plugin windows
  windows: Map<string, PluginWindow>; // Key: window ID
  
  nextZIndex: number;
  
  // Actions
  createInstance: (trackId: string, slotNumber: number, pluginId: string) => void;
  removeInstance: (trackId: string, slotNumber: number) => void;
  updateParameter: (trackId: string, slotNumber: number, paramName: string, value: number) => void;
  setBypass: (trackId: string, slotNumber: number, bypass: boolean) => void;
  
  openWindow: (trackId: string, slotNumber: number, pluginId: string) => void;
  closeWindow: (windowId: string) => void;
  bringToFront: (windowId: string) => void;
  
  getInstance: (trackId: string, slotNumber: number) => PluginInstance | undefined;
  getParameter: (trackId: string, slotNumber: number, paramName: string) => number | undefined;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  instances: new Map(),
  windows: new Map(),
  nextZIndex: 1000,
  
  createInstance: (trackId, slotNumber, pluginId) => {
    const key = `${trackId}-${slotNumber}`;
    set((state) => {
      const newInstances = new Map(state.instances);
      newInstances.set(key, {
        trackId,
        slotNumber,
        pluginId,
        parameters: {},
        bypass: false,
      });
      return { instances: newInstances };
    });
  },
  
  removeInstance: (trackId, slotNumber) => {
    const key = `${trackId}-${slotNumber}`;
    set((state) => {
      const newInstances = new Map(state.instances);
      newInstances.delete(key);
      
      // Close any open windows for this instance
      const newWindows = new Map(state.windows);
      for (const [windowId, window] of state.windows) {
        if (window.trackId === trackId && window.slotNumber === slotNumber) {
          newWindows.delete(windowId);
        }
      }
      
      return { instances: newInstances, windows: newWindows };
    });
  },
  
  updateParameter: (trackId, slotNumber, paramName, value) => {
    const key = `${trackId}-${slotNumber}`;
    set((state) => {
      const instance = state.instances.get(key);
      if (!instance) return state;
      
      const newInstances = new Map(state.instances);
      newInstances.set(key, {
        ...instance,
        parameters: {
          ...instance.parameters,
          [paramName]: value,
        },
      });
      return { instances: newInstances };
    });
  },
  
  setBypass: (trackId, slotNumber, bypass) => {
    const key = `${trackId}-${slotNumber}`;
    set((state) => {
      const instance = state.instances.get(key);
      if (!instance) return state;
      
      const newInstances = new Map(state.instances);
      newInstances.set(key, { ...instance, bypass });
      return { instances: newInstances };
    });
  },
  
  openWindow: (trackId, slotNumber, pluginId) => {
    const windowId = `window-${trackId}-${slotNumber}`;
    set((state) => {
      const newWindows = new Map(state.windows);
      const newZIndex = state.nextZIndex;
      
      newWindows.set(windowId, {
        id: windowId,
        trackId,
        slotNumber,
        pluginId,
        position: { x: 100 + (newWindows.size * 30), y: 100 + (newWindows.size * 30) },
        zIndex: newZIndex,
      });
      
      return {
        windows: newWindows,
        nextZIndex: newZIndex + 1,
      };
    });
  },
  
  closeWindow: (windowId) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.delete(windowId);
      return { windows: newWindows };
    });
  },
  
  bringToFront: (windowId) => {
    set((state) => {
      const window = state.windows.get(windowId);
      if (!window) return state;
      
      const newWindows = new Map(state.windows);
      const newZIndex = state.nextZIndex;
      
      newWindows.set(windowId, { ...window, zIndex: newZIndex });
      return {
        windows: newWindows,
        nextZIndex: newZIndex + 1,
      };
    });
  },
  
  getInstance: (trackId, slotNumber) => {
    const key = `${trackId}-${slotNumber}`;
    return get().instances.get(key);
  },
  
  getParameter: (trackId, slotNumber, paramName) => {
    const instance = get().getInstance(trackId, slotNumber);
    return instance?.parameters[paramName];
  },
}));
