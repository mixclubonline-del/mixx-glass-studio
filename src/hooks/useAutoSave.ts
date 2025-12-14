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
  const consumerAddedRef = useRef(false); // Track if we've added ourselves as a consumer
  const isPrimaryConsumerRef = useRef(false); // Track if we're the primary consumer (first to register getter)
  const getProjectStateRef = useRef(getProjectState);

  // Keep getProjectState ref up to date without re-initializing
  useEffect(() => {
    getProjectStateRef.current = getProjectState;
    // Only update the service's state getter if we're the primary consumer
    // This prevents multiple components from overwriting each other's getters
    if (initializedRef.current && isPrimaryConsumerRef.current) {
      autoSaveService.registerStateGetter(getProjectState);
    }
  }, [getProjectState]);

  // Initialize service only once (empty deps like useAutoPull)
  useEffect(() => {
    if (!initializedRef.current) {
      // Service tracks its own initialization state, safe to call multiple times
      autoSaveService
        .initialize()
        .then(() => {
          // Only register state getter if we're the first consumer (primary)
          // This prevents multiple components from overwriting each other's getters
          const isFirstConsumer = !autoSaveService.hasConsumers();
          if (isFirstConsumer) {
            autoSaveService.registerStateGetter(() => getProjectStateRef.current());
            isPrimaryConsumerRef.current = true;
          }
          autoSaveService.onStatusChange(setStatus);
          autoSaveService.addConsumer();
          consumerAddedRef.current = true;
          initializedRef.current = true;
        })
        .catch((error) => {
          console.error('[useAutoSave] Failed to initialize auto-save service:', error);
          // Mark as initialized to prevent infinite retry loops
          // Service will remain non-functional, but won't spam console
          initializedRef.current = true;
        });
    }

    return () => {
      // Always remove consumer if we added one, even if initialization didn't complete
      // This prevents consumer count leaks when components unmount before init completes
      if (consumerAddedRef.current) {
        autoSaveService.removeConsumer();
        consumerAddedRef.current = false;
      }
      if (initializedRef.current) {
        initializedRef.current = false;
        isPrimaryConsumerRef.current = false;
      }
    };
  }, []); // Empty deps - only initialize once

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

