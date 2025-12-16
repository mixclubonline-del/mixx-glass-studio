/**
 * useAudioExport - React hook for audio export workflow
 * Phase 25: React Integration Layer
 */

import { useState, useCallback } from 'react';
import { rustAudio, ExportBitDepth, ExportFormat } from '../types/rust-audio';

export interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  lastExportPath: string | null;
}

export interface ExportOptions {
  sampleRate?: number;
  channels?: number;
  bitDepth?: ExportBitDepth;
  samples: Float32Array;
}

// Check if we're in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Helper to dynamically import Tauri dialog at runtime (bypasses Vite static analysis)
async function getTauriDialog(): Promise<{ save: (options: unknown) => Promise<string | null> } | null> {
  if (!isTauri) return null;
  try {
    // Use Function constructor to create truly dynamic import that Vite won't analyze
    const importFn = new Function('specifier', 'return import(specifier)');
    const module = await importFn('@tauri-apps/api/dialog');
    return module;
  } catch {
    return null;
  }
}

export function useAudioExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null,
    lastExportPath: null,
  });
  
  const [formats, setFormats] = useState<ExportFormat[]>([]);

  // Load available formats
  const loadFormats = useCallback(async () => {
    try {
      const fmts = await rustAudio.export.getFormats();
      setFormats(fmts);
      return fmts;
    } catch (err) {
      console.error('Failed to load export formats:', err);
      return [];
    }
  }, []);

  // Export with file dialog (dynamically imports dialog module)
  const exportWithDialog = useCallback(async (options: ExportOptions) => {
    const {
      sampleRate = 48000,
      channels = 2,
      bitDepth = 24,
      samples,
    } = options;

    try {
      let path: string | null = null;
      
      // Try to use Tauri dialog if available
      const dialogModule = await getTauriDialog();
      if (dialogModule) {
        path = await dialogModule.save({
          filters: [{
            name: 'Audio Files',
            extensions: ['wav'],
          }],
          defaultPath: `export_${Date.now()}.wav`,
        });
      }
      
      // Web fallback
      if (!path && !isTauri) {
        console.log('[AudioExport] Web mode - using default path');
        path = `export_${Date.now()}.wav`;
      }

      if (!path) {
        return null; // User cancelled
      }

      setState(prev => ({
        ...prev,
        isExporting: true,
        progress: 0,
        error: null,
      }));

      // Perform export
      const result = await rustAudio.export.wav({
        path,
        sampleRate,
        channels,
        bitDepth,
        samples,
      });

      setState(prev => ({
        ...prev,
        isExporting: false,
        progress: 100,
        lastExportPath: path,
      }));

      return { path, result };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: errorMsg,
      }));
      throw err;
    }
  }, []);

  // Export to specific path (no dialog)
  const exportToPath = useCallback(async (path: string, options: ExportOptions) => {
    const {
      sampleRate = 48000,
      channels = 2,
      bitDepth = 24,
      samples,
    } = options;

    setState(prev => ({
      ...prev,
      isExporting: true,
      progress: 0,
      error: null,
    }));

    try {
      const result = await rustAudio.export.wav({
        path,
        sampleRate,
        channels,
        bitDepth,
        samples,
      });

      setState(prev => ({
        ...prev,
        isExporting: false,
        progress: 100,
        lastExportPath: path,
      }));

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: errorMsg,
      }));
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    formats,
    loadFormats,
    exportWithDialog,
    exportToPath,
    clearError,
  };
}

export default useAudioExport;
