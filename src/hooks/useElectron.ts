import { useEffect, useCallback, useState } from 'react';

// Electron API types
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  showMessageBox: (options: any) => Promise<any>;
  openExternal: (url: string) => Promise<boolean>;
  onMenuNewProject: (callback: () => void) => void;
  onMenuOpenProject: (callback: (filePath: string) => void) => void;
  onMenuSaveProject: (callback: () => void) => void;
  onMenuImportAudio: (callback: (filePaths: string[]) => void) => void;
  onMenuExportMix: (callback: () => void) => void;
  onTransportPlayPause: (callback: () => void) => void;
  onTransportStop: (callback: () => void) => void;
  onTransportRecord: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const useElectron = () => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
  const [platform, setPlatform] = useState<string>('unknown');

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      setPlatform(window.electronAPI.platform);
    }
  }, [isElectron]);

  const showSaveDialog = useCallback(async (options: any) => {
    if (!isElectron || !window.electronAPI) return null;
    return await window.electronAPI.showSaveDialog(options);
  }, [isElectron]);

  const showOpenDialog = useCallback(async (options: any) => {
    if (!isElectron || !window.electronAPI) return null;
    return await window.electronAPI.showOpenDialog(options);
  }, [isElectron]);

  const showMessageBox = useCallback(async (options: any) => {
    if (!isElectron || !window.electronAPI) return null;
    return await window.electronAPI.showMessageBox(options);
  }, [isElectron]);

  const setupMenuHandlers = useCallback((handlers: {
    onNewProject?: () => void;
    onOpenProject?: (filePath: string) => void;
    onSaveProject?: () => void;
    onImportAudio?: (filePaths: string[]) => void;
    onExportMix?: () => void;
    onPlayPause?: () => void;
    onStop?: () => void;
    onRecord?: () => void;
  }) => {
    if (!isElectron || !window.electronAPI) return;

    if (handlers.onNewProject) {
      window.electronAPI.onMenuNewProject(handlers.onNewProject);
    }
    if (handlers.onOpenProject) {
      window.electronAPI.onMenuOpenProject(handlers.onOpenProject);
    }
    if (handlers.onSaveProject) {
      window.electronAPI.onMenuSaveProject(handlers.onSaveProject);
    }
    if (handlers.onImportAudio) {
      window.electronAPI.onMenuImportAudio(handlers.onImportAudio);
    }
    if (handlers.onExportMix) {
      window.electronAPI.onMenuExportMix(handlers.onExportMix);
    }
    if (handlers.onPlayPause) {
      window.electronAPI.onTransportPlayPause(handlers.onPlayPause);
    }
    if (handlers.onStop) {
      window.electronAPI.onTransportStop(handlers.onStop);
    }
    if (handlers.onRecord) {
      window.electronAPI.onTransportRecord(handlers.onRecord);
    }
  }, [isElectron]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (!isElectron) return;
    
    // Remove all listeners
    window.electronAPI?.removeAllListeners('menu-new-project');
    window.electronAPI?.removeAllListeners('menu-open-project');
    window.electronAPI?.removeAllListeners('menu-save-project');
    window.electronAPI?.removeAllListeners('menu-import-audio');
    window.electronAPI?.removeAllListeners('menu-export-mix');
    window.electronAPI?.removeAllListeners('transport-play-pause');
    window.electronAPI?.removeAllListeners('transport-stop');
    window.electronAPI?.removeAllListeners('transport-record');
  }, [isElectron]);

  // Desktop-specific styling
  useEffect(() => {
    if (isElectron) {
      document.body.classList.add('desktop-app');
      
      // Add platform-specific classes
      document.body.classList.add(`platform-${platform}`);
      
      // Prevent drag and drop on desktop (use native file dialogs instead)
      document.addEventListener('dragover', (e) => e.preventDefault());
      document.addEventListener('drop', (e) => e.preventDefault());
    }
  }, [isElectron, platform]);

  return {
    isElectron,
    platform,
    showSaveDialog,
    showOpenDialog,
    showMessageBox,
    setupMenuHandlers,
    cleanup
  };
};
