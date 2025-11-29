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

  // Initialize service
  useEffect(() => {
    if (!initializedRef.current) {
      const invokeCommand = async (cmd: string, args?: any) => {
        try {
          return await invoke(cmd, args);
        } catch (error) {
          throw error;
        }
      };

      autoPullService.initialize(invokeCommand).then(() => {
        autoPullService.onStatusChangeCallback(setStatus);
        initializedRef.current = true;
      });
    }

    return () => {
      if (initializedRef.current) {
        autoPullService.shutdown();
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

