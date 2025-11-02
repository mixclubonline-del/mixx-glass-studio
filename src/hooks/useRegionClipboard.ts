/**
 * Region Clipboard Hook - Handles copy/paste/duplicate operations
 */

import { useEffect, useCallback } from 'react';
import { useTracksStore } from '@/store/tracksStore';
import { Region } from '@/types/timeline';
import { toast } from 'sonner';

export const useRegionClipboard = () => {
  const { 
    regions, 
    selectedRegionIds, 
    addRegion,
    duplicateRegion,
    copyRegionsToClipboard,
    pasteRegionsFromClipboard,
    clipboardRegions
  } = useTracksStore();

  const handleCopy = useCallback(() => {
    if (selectedRegionIds.length === 0) return;
    
    const selectedRegions = regions.filter(r => selectedRegionIds.includes(r.id));
    copyRegionsToClipboard(selectedRegions);
    toast.success(`Copied ${selectedRegions.length} region(s)`);
  }, [selectedRegionIds, regions, copyRegionsToClipboard]);

  const handlePaste = useCallback((targetTime?: number) => {
    if (clipboardRegions.length === 0) {
      toast.error('Nothing to paste');
      return;
    }
    
    pasteRegionsFromClipboard(targetTime);
    toast.success(`Pasted ${clipboardRegions.length} region(s)`);
  }, [clipboardRegions, pasteRegionsFromClipboard]);

  const handleDuplicate = useCallback(() => {
    if (selectedRegionIds.length === 0) return;
    
    selectedRegionIds.forEach(id => duplicateRegion(id));
    toast.success(`Duplicated ${selectedRegionIds.length} region(s)`);
  }, [selectedRegionIds, duplicateRegion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl+C - Copy
      if (cmdCtrl && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      
      // Cmd/Ctrl+V - Paste
      if (cmdCtrl && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      
      // Cmd/Ctrl+D - Duplicate
      if (cmdCtrl && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, handleDuplicate]);

  return {
    handleCopy,
    handlePaste,
    handleDuplicate,
    hasClipboard: clipboardRegions.length > 0
  };
};
