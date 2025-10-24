/**
 * Professional Timeline Keyboard Shortcuts
 * Implements industry-standard DAW shortcuts
 */

import { useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { primeBrain } from '@/ai/primeBrain';
import { markerManager } from '@/studio/utils/MarkerSystem';

export function useTimelineKeyboardShortcuts(enabled: boolean = true) {
  const {
    currentTime,
    loopEnabled,
    loopStart,
    loopEnd,
    returnOnStop,
    setLoopEnabled,
    setLoopStart,
    setLoopEnd,
    setCurrentTool,
    setGridSnap,
    toggleRippleEdit,
  } = useTimelineStore();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Log shortcut for debugging
      console.log(`[Timeline Shortcuts] ${ctrl ? 'Ctrl+' : ''}${shift ? 'Shift+' : ''}${alt ? 'Alt+' : ''}${key}`);

      // SPACE - Play/Pause
      if (key === ' ' && !ctrl && !shift && !alt) {
        e.preventDefault();
        const isRunning = primeBrain.getIsRunning();
        if (isRunning) {
          primeBrain.pause();
        } else {
          primeBrain.start();
        }
        console.log('[Timeline] Play/Pause toggled');
        return;
      }

      // ENTER/RETURN - Play from selection or current position
      if ((key === 'ENTER' || key === 'RETURN') && !ctrl && !shift && !alt) {
        e.preventDefault();
        primeBrain.start();
        console.log('[Timeline] Play from current position');
        return;
      }

      // STOP - Return to start (if returnOnStop enabled)
      if ((key === 'S' && !ctrl) || (key === '0' && !ctrl)) {
        e.preventDefault();
        primeBrain.stop();
        if (returnOnStop) {
          primeBrain.seek(0);
          console.log('[Timeline] Stop and return to start');
        } else {
          console.log('[Timeline] Stop at current position');
        }
        return;
      }

      // L - Toggle Loop
      if (key === 'L' && !ctrl && !shift && !alt) {
        e.preventDefault();
        setLoopEnabled(!loopEnabled);
        console.log('[Timeline] Loop toggled:', !loopEnabled);
        
        // If enabling loop and no range set, create default 4-bar loop at playhead
        if (!loopEnabled && loopStart === 0 && loopEnd === 0) {
          const start = Math.floor(currentTime);
          const end = start + 8; // 8 seconds ~= 4 bars at 120 BPM
          setLoopStart(start);
          setLoopEnd(end);
          primeBrain.setLoop(true, start, end);
          console.log('[Timeline] Created default loop:', start, '-', end);
        } else {
          primeBrain.setLoop(!loopEnabled, loopStart, loopEnd);
        }
        return;
      }

      // M - Drop Marker
      if (key === 'M' && !ctrl && !shift && !alt) {
        e.preventDefault();
        const samples = Math.floor(currentTime * 44100); // 44.1kHz sample rate
        const marker = markerManager.addMarker(samples, currentTime);
        console.log('[Timeline] Dropped marker at', currentTime, marker);
        return;
      }

      // G - Toggle Grid Snap
      if (key === 'G' && !ctrl && !shift && !alt) {
        e.preventDefault();
        const snap = useTimelineStore.getState().gridSnap;
        setGridSnap(!snap);
        console.log('[Timeline] Grid snap toggled:', !snap);
        return;
      }

      // R - Toggle Ripple Edit
      if (key === 'R' && !ctrl && !shift && !alt) {
        e.preventDefault();
        toggleRippleEdit();
        const ripple = useTimelineStore.getState().rippleEdit;
        console.log('[Timeline] Ripple edit toggled:', ripple);
        return;
      }

      // Tool shortcuts
      // V - Select tool
      if (key === 'V' && !ctrl && !shift && !alt) {
        e.preventDefault();
        setCurrentTool('select');
        console.log('[Timeline] Tool: Select');
        return;
      }

      // T - Trim tool
      if (key === 'T' && !ctrl && !shift && !alt) {
        e.preventDefault();
        setCurrentTool('trim');
        console.log('[Timeline] Tool: Trim');
        return;
      }

      // F - Fade tool
      if (key === 'F' && !ctrl && !shift && !alt) {
        e.preventDefault();
        setCurrentTool('fade');
        console.log('[Timeline] Tool: Fade');
        return;
      }

      // B - Split tool
      if (key === 'B' && !ctrl && !shift && !alt) {
        e.preventDefault();
        setCurrentTool('split');
        console.log('[Timeline] Tool: Split');
        return;
      }

      // Z - Zoom tool
      if (key === 'Z' && !ctrl && !shift && !alt) {
        e.preventDefault();
        setCurrentTool('zoom');
        console.log('[Timeline] Tool: Zoom');
        return;
      }

      // Arrow Keys - Navigation
      if (key === 'ARROWLEFT' && !ctrl && !shift && !alt) {
        e.preventDefault();
        // Jump to previous bar
        primeBrain.seek(Math.max(0, currentTime - 2));
        console.log('[Timeline] Navigate: Previous bar');
        return;
      }

      if (key === 'ARROWRIGHT' && !ctrl && !shift && !alt) {
        e.preventDefault();
        // Jump to next bar
        primeBrain.seek(currentTime + 2);
        console.log('[Timeline] Navigate: Next bar');
        return;
      }

      // HOME - Go to start
      if (key === 'HOME' && !ctrl && !shift && !alt) {
        e.preventDefault();
        primeBrain.seek(0);
        console.log('[Timeline] Jump to start');
        return;
      }

      // END - Go to end (not implemented yet - would need duration)
      if (key === 'END' && !ctrl && !shift && !alt) {
        e.preventDefault();
        const duration = useTimelineStore.getState().duration;
        if (duration > 0) {
          primeBrain.seek(duration);
          console.log('[Timeline] Jump to end');
        }
        return;
      }

      // Ctrl+Z - Undo (placeholder for future)
      if (key === 'Z' && ctrl && !shift && !alt) {
        e.preventDefault();
        console.log('[Timeline] Undo (not implemented yet)');
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y - Redo (placeholder for future)
      if ((key === 'Z' && ctrl && shift) || (key === 'Y' && ctrl)) {
        e.preventDefault();
        console.log('[Timeline] Redo (not implemented yet)');
        return;
      }

      // Delete - Delete selected regions (placeholder for future)
      if ((key === 'DELETE' || key === 'BACKSPACE') && !ctrl && !shift && !alt) {
        const selectedRegions = useTimelineStore.getState().selectedRegions;
        if (selectedRegions.size > 0) {
          e.preventDefault();
          console.log('[Timeline] Delete regions (not implemented yet):', Array.from(selectedRegions));
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, currentTime, loopEnabled, loopStart, loopEnd, returnOnStop]);
}
