/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcut handling for DAW operations
 */

import { useEffect } from 'react';
import { useViewStore } from '@/store/viewStore';

interface ShortcutHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAIAssistant?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { setView, togglePanel } = useViewStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      // Prevent shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      // Playback controls
      if (e.code === 'Space' && !e.shiftKey) {
        e.preventDefault();
        if (handlers.onPlay) handlers.onPlay();
        return;
      }
      
      if (e.code === 'Space' && e.shiftKey) {
        e.preventDefault();
        if (handlers.onRecord) handlers.onRecord();
        return;
      }
      
      if (e.code === 'Enter') {
        e.preventDefault();
        if (handlers.onStop) handlers.onStop();
        return;
      }
      
      // View switching (Cmd/Ctrl + 1/2/3)
      if (cmdOrCtrl && e.code === 'Digit1') {
        e.preventDefault();
        setView('arrange');
        return;
      }
      
      if (cmdOrCtrl && e.code === 'Digit2') {
        e.preventDefault();
        setView('mix');
        return;
      }
      
      if (cmdOrCtrl && e.code === 'Digit3') {
        e.preventDefault();
        setView('edit');
        return;
      }
      
      // File operations
      if (cmdOrCtrl && e.code === 'KeyS') {
        e.preventDefault();
        if (handlers.onSave) handlers.onSave();
        return;
      }
      
      if (cmdOrCtrl && e.code === 'KeyE') {
        e.preventDefault();
        if (handlers.onExport) handlers.onExport();
        return;
      }
      
      // Undo/Redo
      if (cmdOrCtrl && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (handlers.onUndo) handlers.onUndo();
        return;
      }
      
      if (cmdOrCtrl && e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (handlers.onRedo) handlers.onRedo();
        return;
      }
      
      // Panel toggles
      if (cmdOrCtrl && e.code === 'KeyB') {
        e.preventDefault();
        togglePanel('browser');
        return;
      }
      
      if (e.code === 'KeyM' && !cmdOrCtrl) {
        e.preventDefault();
        togglePanel('mixer');
        return;
      }
      
      if (e.code === 'KeyE' && !cmdOrCtrl) {
        e.preventDefault();
        togglePanel('effects');
        return;
      }
      
      if (e.code === 'KeyI' && !cmdOrCtrl) {
        e.preventDefault();
        if (handlers.onAIAssistant) handlers.onAIAssistant();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, setView, togglePanel]);
}
