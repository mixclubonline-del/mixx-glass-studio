/**
 * Global Keyboard Shortcuts - Studio-wide hotkeys
 */

import { useEffect } from 'react';
import { useTransport } from '@/contexts/ProjectContext';

export const useGlobalKeyboardShortcuts = () => {
  const { transport, play, pause, stop, toggleLoop, toggleRecord, prevBar, nextBar } = useTransport();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      // Spacebar: Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Space: Record
          toggleRecord();
        } else {
          // Space: Play/Pause
          if (transport.isPlaying) {
            pause();
          } else {
            play();
          }
        }
        return;
      }
      
      // Stop (Shift+Return)
      if (e.code === 'Enter' && e.shiftKey) {
        e.preventDefault();
        stop();
        return;
      }
      
      // Loop toggle (Ctrl/Cmd+L)
      if (e.code === 'KeyL' && cmdOrCtrl) {
        e.preventDefault();
        toggleLoop();
        return;
      }
      
      // Left Arrow: Move playhead left
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (cmdOrCtrl) {
          // Ctrl/Cmd+Left: Previous bar
          prevBar();
        }
        return;
      }
      
      // Right Arrow: Move playhead right
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (cmdOrCtrl) {
          // Ctrl/Cmd+Right: Next bar
          nextBar();
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transport, play, pause, stop, toggleLoop, toggleRecord, prevBar, nextBar]);
};
