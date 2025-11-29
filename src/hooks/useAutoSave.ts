/**
 * useAutoSave Hook
 * what: React hook for auto-save functionality
 * why: Integrate auto-save into components with reactive state
 * how: Wraps autoSaveService with React state management
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { autoSaveService } from '../core/autosave/autoSaveService';
import type { PersistedProjectState } from '../App';

interface AutoSaveStatus {
  isEnabled: boolean;
  lastSaveTime: number | null;
  pendingChanges: boolean;
  saveInProgress: boolean;
}

export function useAutoSave(getProjectState: () => PersistedProjectState) {
  const [status, setStatus] = useState<AutoSaveStatus>({
    isEnabled: false,
    lastSaveTime: null,
    pendingChanges: false,
    saveInProgress: false,
  });
  const initializedRef = useRef(false);

  // Initialize service
  useEffect(() => {
    if (!initializedRef.current) {
      autoSaveService.initialize().then(() => {
        autoSaveService.registerStateGetter(getProjectState);
        autoSaveService.onStatusChange(setStatus);
        initializedRef.current = true;
      });
    }

    return () => {
      if (initializedRef.current) {
        autoSaveService.shutdown();
      }
    };
  }, [getProjectState]);

  const saveNow = useCallback(() => {
    autoSaveService.saveNow();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    autoSaveService.setEnabled(enabled);
  }, []);

  const loadLatest = useCallback(async () => {
    return await autoSaveService.loadLatest();
  }, []);

  const getAllSaves = useCallback(async () => {
    return await autoSaveService.getAllSaves();
  }, []);

  return {
    status,
    saveNow,
    setEnabled,
    loadLatest,
    getAllSaves,
    isEnabled: status.isEnabled,
  };
}

