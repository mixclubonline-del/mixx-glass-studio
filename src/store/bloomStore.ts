/**
 * Bloom Store - Manages smart UI visibility and fade states
 */

import { create } from 'zustand';

interface BloomZone {
  isActive: boolean;
  opacity: number;
}

interface BloomPreferences {
  [key: string]: {
    frequency: number;
    avgDuration: number;
  };
}

interface BloomState {
  // Current bloom zones
  zones: {
    top: BloomZone;
    bottom: BloomZone;
    left: BloomZone;
    right: BloomZone;
  };
  
  // Global states
  isIdle: boolean;
  ultraMinimalMode: boolean;
  debugMode: boolean;
  
  // User preferences (learned behavior)
  preferences: BloomPreferences;
  
  // Actions
  activateZone: (zone: 'top' | 'bottom' | 'left' | 'right') => void;
  deactivateZone: (zone: 'top' | 'bottom' | 'left' | 'right') => void;
  setIdle: (idle: boolean) => void;
  toggleUltraMinimal: () => void;
  toggleDebugMode: () => void;
  updatePreference: (key: string, duration: number) => void;
  loadPreferences: () => void;
  savePreferences: () => void;
}

const STORAGE_KEY = 'mixx-bloom-preferences';

export const useBloomStore = create<BloomState>((set, get) => ({
  zones: {
    top: { isActive: false, opacity: 0.2 },
    bottom: { isActive: false, opacity: 0.2 },
    left: { isActive: false, opacity: 0.2 },
    right: { isActive: false, opacity: 0.2 },
  },
  
  isIdle: false,
  ultraMinimalMode: false,
  debugMode: false,
  preferences: {},
  
  activateZone: (zone) => {
    set((state) => ({
      zones: {
        ...state.zones,
        [zone]: { isActive: true, opacity: 1 }
      }
    }));
  },
  
  deactivateZone: (zone) => {
    set((state) => ({
      zones: {
        ...state.zones,
        [zone]: { isActive: false, opacity: state.isIdle ? 0.2 : 0.6 }
      }
    }));
  },
  
  setIdle: (idle) => {
    set({ isIdle: idle });
    
    // Update all inactive zones opacity based on idle state
    const { zones } = get();
    const updatedZones = Object.entries(zones).reduce((acc, [key, zone]) => ({
      ...acc,
      [key]: {
        ...zone,
        opacity: zone.isActive ? 1 : (idle ? 0.2 : 0.6)
      }
    }), {} as typeof zones);
    
    set({ zones: updatedZones });
  },
  
  toggleUltraMinimal: () => {
    set((state) => ({ ultraMinimalMode: !state.ultraMinimalMode }));
  },
  
  toggleDebugMode: () => {
    set((state) => ({ debugMode: !state.debugMode }));
  },
  
  updatePreference: (key, duration) => {
    set((state) => {
      const current = state.preferences[key] || { frequency: 0, avgDuration: 0 };
      const newFrequency = current.frequency + 1;
      const newAvgDuration = (current.avgDuration * current.frequency + duration) / newFrequency;
      
      return {
        preferences: {
          ...state.preferences,
          [key]: {
            frequency: newFrequency,
            avgDuration: newAvgDuration
          }
        }
      };
    });
    
    get().savePreferences();
  },
  
  loadPreferences: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        set({ preferences });
      }
    } catch (error) {
      console.error('Failed to load bloom preferences:', error);
    }
  },
  
  savePreferences: () => {
    try {
      const { preferences } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save bloom preferences:', error);
    }
  }
}));

// Load preferences on store creation
useBloomStore.getState().loadPreferences();
