/**
 * Beast Mode Store - Controls AI enhancement features
 */

import { create } from 'zustand';

export type BeastModeLevel = 'off' | 'observe' | 'suggest' | 'enhance' | 'beast';

interface BeastModeState {
  // Core state
  level: BeastModeLevel;
  isActive: boolean;
  
  // Feature toggles
  visualEnhancement: boolean;
  aiSuggestions: boolean;
  autoEnhance: boolean;
  predictivePreload: boolean;
  ambientIntensity: number; // 0-1
  
  // AI activity
  currentSuggestions: AISuggestion[];
  processingActivity: ProcessingActivity[];
  confidenceScore: number; // 0-1
  
  // Actions
  setLevel: (level: BeastModeLevel) => void;
  toggleFeature: (feature: keyof Omit<BeastModeState, 'level' | 'isActive' | 'currentSuggestions' | 'processingActivity' | 'confidenceScore' | 'setLevel' | 'toggleFeature' | 'addSuggestion' | 'removeSuggestion' | 'addActivity' | 'clearActivity' | 'setConfidence' | 'setAmbientIntensity'>) => void;
  addSuggestion: (suggestion: AISuggestion) => void;
  removeSuggestion: (id: string) => void;
  addActivity: (activity: ProcessingActivity) => void;
  clearActivity: () => void;
  setConfidence: (score: number) => void;
  setAmbientIntensity: (intensity: number) => void;
}

export interface AISuggestion {
  id: string;
  type: 'eq' | 'compression' | 'volume' | 'pan' | 'effect' | 'arrangement';
  trackId: string;
  trackName: string;
  title: string;
  description: string;
  confidence: number;
  action: () => void;
  timestamp: number;
}

export interface ProcessingActivity {
  id: string;
  type: 'analyze' | 'predict' | 'enhance' | 'learn';
  description: string;
  progress: number; // 0-1
  timestamp: number;
}

export const useBeastModeStore = create<BeastModeState>((set, get) => ({
  // Initial state
  level: 'off',
  isActive: false,
  visualEnhancement: false,
  aiSuggestions: false,
  autoEnhance: false,
  predictivePreload: false,
  ambientIntensity: 0.5,
  currentSuggestions: [],
  processingActivity: [],
  confidenceScore: 0.5,
  
  setLevel: (level) => {
    const config = {
      off: {
        isActive: false,
        visualEnhancement: false,
        aiSuggestions: false,
        autoEnhance: false,
        predictivePreload: false,
        ambientIntensity: 0.3,
      },
      observe: {
        isActive: true,
        visualEnhancement: true,
        aiSuggestions: false,
        autoEnhance: false,
        predictivePreload: false,
        ambientIntensity: 0.5,
      },
      suggest: {
        isActive: true,
        visualEnhancement: true,
        aiSuggestions: true,
        autoEnhance: false,
        predictivePreload: true,
        ambientIntensity: 0.7,
      },
      enhance: {
        isActive: true,
        visualEnhancement: true,
        aiSuggestions: true,
        autoEnhance: true,
        predictivePreload: true,
        ambientIntensity: 0.85,
      },
      beast: {
        isActive: true,
        visualEnhancement: true,
        aiSuggestions: true,
        autoEnhance: true,
        predictivePreload: true,
        ambientIntensity: 1.0,
      },
    };
    
    set({ level, ...config[level] });
  },
  
  toggleFeature: (feature) => {
    set((state) => ({ [feature]: !state[feature as keyof BeastModeState] }));
  },
  
  addSuggestion: (suggestion) => {
    set((state) => ({
      currentSuggestions: [...state.currentSuggestions, suggestion].slice(-10) // Keep last 10
    }));
  },
  
  removeSuggestion: (id) => {
    set((state) => ({
      currentSuggestions: state.currentSuggestions.filter(s => s.id !== id)
    }));
  },
  
  addActivity: (activity) => {
    set((state) => ({
      processingActivity: [...state.processingActivity, activity].slice(-5) // Keep last 5
    }));
  },
  
  clearActivity: () => {
    set({ processingActivity: [] });
  },
  
  setConfidence: (score) => {
    set({ confidenceScore: Math.max(0, Math.min(1, score)) });
  },
  
  setAmbientIntensity: (intensity) => {
    set({ ambientIntensity: Math.max(0, Math.min(1, intensity)) });
  },
}));
