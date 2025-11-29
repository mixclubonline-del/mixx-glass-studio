/**
 * Stem Separation Exporter Wrapper Component
 * 
 * Sets up the stem separation exporter for training data collection.
 * Wraps FileInput to export snapshots when stems are separated.
 */

import { useStemSeparationExporter } from '../../core/import/useStemSeparationExporter';
import { buildStemSeparationSnapshot } from '../../core/import/stemSeparationSnapshot';
import type { StemSeparationSnapshot } from '../../core/import/stemSeparationSnapshot';

const STEM_SEPARATION_EXPORT_URL_STORAGE_KEY = 'mixxclub:stem-separation-export-url';

/**
 * Hook to get stem separation export URL
 */
function resolveStemSeparationExportUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check localStorage first
  const stored = window.localStorage.getItem(STEM_SEPARATION_EXPORT_URL_STORAGE_KEY);
  if (stored) return stored;
  
  // Check window override
  if ((window as any).__MIXX_STEM_SEPARATION_EXPORT_URL) {
    return (window as any).__MIXX_STEM_SEPARATION_EXPORT_URL;
  }
  
  // Check environment variables
  if (import.meta.env.VITE_STEM_SEPARATION_EXPORT_URL) {
    return import.meta.env.VITE_STEM_SEPARATION_EXPORT_URL;
  }
  
  return null;
}

/**
 * Export snapshot helper
 * This will be called from the pipeline when stems are separated
 */
export function useStemSeparationDataCollection() {
  const exportUrl = resolveStemSeparationExportUrl();
  const enabled = Boolean(exportUrl);
  
  const { exportSnapshot } = useStemSeparationExporter({
    enabled,
    exportUrl,
    debug: import.meta.env.DEV && import.meta.env.VITE_STEM_SEPARATION_EXPORT_DEBUG === '1',
  });
  
  // Expose export function globally for pipeline callback
  if (typeof window !== 'undefined') {
    (window as any).__mixx_stem_separation_exporter = {
      exportSnapshot,
      enabled,
    };
  }
  
  return { exportSnapshot, enabled };
}

