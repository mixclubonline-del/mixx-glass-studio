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
      // Dynamic import to avoid build errors if dialog plugin not installed
      const { save } = await import('@tauri-apps/api/dialog');
      
      // Show save dialog
      const path = await save({
        filters: [{
          name: 'Audio Files',
          extensions: ['wav'],
        }],
        defaultPath: `export_${Date.now()}.wav`,
      });

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
