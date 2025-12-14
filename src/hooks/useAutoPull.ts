/**
 * useAutoPull Hook
 * what: React hook for auto-pull functionality
 * why: Integrate git auto-pull into components with reactive state
 * how: Wraps autoPullService with React state and Tauri commands
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { autoPullService } from '../core/autosave/autoPullService';
import { invoke } from '@tauri-apps/api/core';

interface AutoPullStatus {
  isEnabled: boolean;
  lastPullTime: number | null;
  pullInProgress: boolean;
  lastError: string | null;
  interval: number;
}

export function useAutoPull() {
  const [status, setStatus] = useState<AutoPullStatus>({
    isEnabled: false,
    lastPullTime: null,
    pullInProgress: false,
    lastError: null,
    interval: 300000,
  });
  const initializedRef = useRef(false);
  const consumerAddedRef = useRef(false); // Track if we've added ourselves as a consumer

  // Initialize service
  useEffect(() => {
    if (!initializedRef.current) {
      const invokeCommand = async (cmd: string, args?: any) => {
        return await invoke(cmd, args);
      };

      autoPullService
        .initialize(invokeCommand)
        .then(() => {
          autoPullService.onStatusChangeCallback(setStatus);
          autoPullService.addConsumer();
          consumerAddedRef.current = true;
          initializedRef.current = true;
        })
        .catch((error) => {
          console.error('[useAutoPull] Failed to initialize auto-pull service:', error);
          // Mark as initialized to prevent infinite retry loops
          // Service will remain non-functional, but won't spam console
          initializedRef.current = true;
        });
    }

    return () => {
      // Always remove consumer if we added one, even if initialization didn't complete
      // This prevents consumer count leaks when components unmount before init completes
      if (consumerAddedRef.current) {
        autoPullService.removeConsumer();
        consumerAddedRef.current = false;
      }
      if (initializedRef.current) {
        initializedRef.current = false;
      }
    };
  }, []);

  const pullNow = useCallback(async () => {
    return await autoPullService.pullNow();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    autoPullService.setEnabled(enabled);
  }, []);

  const setInterval = useCallback((intervalMs: number) => {
    autoPullService.setInterval(intervalMs);
  }, []);

  const getGitStatus = useCallback(async () => {
    return await autoPullService.getGitStatus();
  }, []);

  return {
    status,
    pullNow,
    setEnabled,
    setInterval,
    getGitStatus,
    isEnabled: status.isEnabled,
  };
}

