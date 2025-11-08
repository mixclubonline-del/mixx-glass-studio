/**
 * Pattern Store - FL Studio-style pattern management
 */

import { create } from 'zustand';
import { Pattern, PatternInstance, ColorPalette, TRAP_COLOR_PALETTES } from '@/types/timeline';

interface PatternState {
  patterns: Pattern[];
  patternInstances: PatternInstance[];
  selectedPatternId: string | null;
  timelineMode: 'audio' | 'pattern';
  
  // Actions
  createPattern: (name: string, category: ColorPalette, regionIds: string[]) => Pattern;
  createPatternFromSelection: (name: string, category: ColorPalette, selectedRegionIds: string[]) => Pattern | null;
  updatePattern: (id: string, updates: Partial<Pattern>) => void;
  deletePattern: (id: string) => void;
  duplicatePattern: (id: string) => Pattern;
  makePatternUnique: (instanceId: string) => void;
  
  // Pattern instances
  addPatternInstance: (instance: PatternInstance) => void;
  removePatternInstance: (id: string) => void;
  updatePatternInstance: (id: string, updates: Partial<PatternInstance>) => void;
  getPatternInstances: (patternId: string) => PatternInstance[];
  
  // Selection
  selectPattern: (id: string | null) => void;
  
  // Mode
  setTimelineMode: (mode: 'audio' | 'pattern') => void;
}

export const usePatternStore = create<PatternState>((set, get) => ({
  patterns: [],
  patternInstances: [],
  selectedPatternId: null,
  timelineMode: 'audio',
  
  createPattern: (name, category, regionIds) => {
    const pattern: Pattern = {
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color: TRAP_COLOR_PALETTES[category],
      category,
      regionIds,
      duration: 8, // Default 8 seconds (4 bars at 120 BPM)
      createdAt: Date.now(),
      variants: 0,
    };
    
    set((state) => ({
      patterns: [...state.patterns, pattern],
    }));
    
    return pattern;
  },
  
  createPatternFromSelection: (name, category, selectedRegionIds) => {
    const { createPattern } = get();
    
    if (selectedRegionIds.length === 0) {
      return null;
    }
    
    const pattern = createPattern(name, category, [...selectedRegionIds]);
    return pattern;
  },
  
  updatePattern: (id, updates) => {
    set((state) => ({
      patterns: state.patterns.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
  
  deletePattern: (id) => {
    set((state) => ({
      patterns: state.patterns.filter((p) => p.id !== id),
      patternInstances: state.patternInstances.filter((i) => i.patternId !== id),
      selectedPatternId: state.selectedPatternId === id ? null : state.selectedPatternId,
    }));
  },
  
  duplicatePattern: (id) => {
    const { patterns } = get();
    const pattern = patterns.find((p) => p.id === id);
    
    if (!pattern) {
      throw new Error(`Pattern ${id} not found`);
    }
    
    const newPattern: Pattern = {
      ...pattern,
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${pattern.name} (Copy)`,
      createdAt: Date.now(),
      variants: 0,
    };
    
    set((state) => ({
      patterns: [...state.patterns, newPattern],
    }));
    
    return newPattern;
  },
  
  makePatternUnique: (instanceId) => {
    const { patternInstances, patterns, duplicatePattern } = get();
    const instance = patternInstances.find((i) => i.id === instanceId);
    
    if (!instance || instance.unique) return;
    
    // Create a unique variant
    const originalPattern = patterns.find((p) => p.id === instance.patternId);
    if (!originalPattern) return;
    
    const newPattern = duplicatePattern(instance.patternId);
    
    // Update variant count
    set((state) => ({
      patterns: state.patterns.map((p) =>
        p.id === originalPattern.id
          ? { ...p, variants: p.variants + 1 }
          : p
      ),
      patternInstances: state.patternInstances.map((i) =>
        i.id === instanceId
          ? { ...i, patternId: newPattern.id, unique: true }
          : i
      ),
    }));
  },
  
  addPatternInstance: (instance) => {
    set((state) => ({
      patternInstances: [...state.patternInstances, instance],
    }));
  },
  
  removePatternInstance: (id) => {
    set((state) => ({
      patternInstances: state.patternInstances.filter((i) => i.id !== id),
    }));
  },
  
  updatePatternInstance: (id, updates) => {
    set((state) => ({
      patternInstances: state.patternInstances.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));
  },
  
  getPatternInstances: (patternId) => {
    return get().patternInstances.filter((i) => i.patternId === patternId);
  },
  
  selectPattern: (id) => {
    set({ selectedPatternId: id });
  },
  
  setTimelineMode: (mode) => {
    set({ timelineMode: mode });
  },
}));
