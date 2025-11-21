/**
 * React hook for project state management
 * 
 * Provides access to project save/load, auto-save status, and settings.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  projectStateManager,
  type ProjectState,
  type DAWSettings,
  type AutoSaveStatus,
  type AutoSaveState,
} from './ProjectStateManager';

export interface UseProjectManagerReturn {
  autoSaveStatus: AutoSaveState;
  settings: DAWSettings;
  saveProject: (state: ProjectState, filename?: string) => Promise<void>;
  loadProject: (serialized?: string) => Promise<ProjectState | null>;
  updateSettings: (settings: Partial<DAWSettings>) => void;
  markDirty: () => void;
  hasUnsavedChanges: boolean;
  getLastProjectState: () => ProjectState | null;
}

export function useProjectManager(): UseProjectManagerReturn {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveState>(
    projectStateManager.getAutoSaveStatus()
  );
  const [settings, setSettings] = useState<DAWSettings>(
    projectStateManager.getSettings()
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(
    projectStateManager.hasUnsavedChanges()
  );

  // Subscribe to auto-save status changes
  useEffect(() => {
    const unsubscribe = projectStateManager.subscribeToAutoSaveStatus((status: AutoSaveStatus) => {
      setAutoSaveStatus(projectStateManager.getAutoSaveStatus());
    });

    // Poll for unsaved changes status
    const interval = setInterval(() => {
      setHasUnsavedChanges(projectStateManager.hasUnsavedChanges());
      setAutoSaveStatus(projectStateManager.getAutoSaveStatus());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const saveProject = useCallback(async (state: ProjectState, filename?: string) => {
    await projectStateManager.saveProject(state, filename);
    setAutoSaveStatus(projectStateManager.getAutoSaveStatus());
    setHasUnsavedChanges(false);
  }, []);

  const loadProject = useCallback(async (serialized?: string) => {
    const loaded = await projectStateManager.loadProject(serialized);
    setAutoSaveStatus(projectStateManager.getAutoSaveStatus());
    setHasUnsavedChanges(false);
    return loaded;
  }, []);

  const updateSettings = useCallback((newSettings: Partial<DAWSettings>) => {
    projectStateManager.saveSettings(newSettings);
    setSettings(projectStateManager.getSettings());
  }, []);

  const markDirty = useCallback(() => {
    projectStateManager.markDirty();
    setHasUnsavedChanges(true);
  }, []);

  const getLastProjectState = useCallback(() => {
    return projectStateManager.getLastProjectState();
  }, []);

  return {
    autoSaveStatus,
    settings,
    saveProject,
    loadProject,
    updateSettings,
    markDirty,
    hasUnsavedChanges,
    getLastProjectState,
  };
}

