/**
 * Timeline Keyboard Shortcuts - Comprehensive DAW-style keyboard controls
 */

import { useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { usePatternStore } from '@/store/patternStore';
import { toast } from 'sonner';

export const useTimelineKeyboardShortcuts = (
  onSeek?: (time: number) => void,
  onPlayPause?: () => void,
  onStop?: () => void,
  onRecord?: () => void
) => {
  const { 
    currentTime, 
    isPlaying,
    loopEnabled,
    setLoopEnabled,
    setCurrentTool,
    toggleRippleEdit,
    setZoom,
    zoom
  } = useTimelineStore();
  
  const {
    selectedTrackId,
    selectedRegionIds,
    tracks,
    updateTrack,
    deleteRegionWithRipple,
    duplicateRegion,
    clearRegionSelection
  } = useTracksStore();
  
  const {
    createPatternFromSelection
  } = usePatternStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPause?.();
        return;
      }

      // R - Record
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRecord?.();
        toast.info('Record mode toggled');
        return;
      }

      // Escape - Stop
      if (e.key === 'Escape') {
        e.preventDefault();
        onStop?.();
        clearRegionSelection();
        return;
      }

      // L - Toggle Loop
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setLoopEnabled(!loopEnabled);
        toast.info(`Loop ${!loopEnabled ? 'enabled' : 'disabled'}`);
        return;
      }

      // S - Solo selected track
      if ((e.key === 's' || e.key === 'S') && !cmdCtrl && selectedTrackId) {
        e.preventDefault();
        const track = tracks.find(t => t.id === selectedTrackId);
        if (track) {
          updateTrack(selectedTrackId, { solo: !track.solo });
          toast.info(`Track ${track.solo ? 'un-soloed' : 'soloed'}`);
        }
        return;
      }

      // M - Mute selected track
      if ((e.key === 'm' || e.key === 'M') && !cmdCtrl && selectedTrackId) {
        e.preventDefault();
        const track = tracks.find(t => t.id === selectedTrackId);
        if (track) {
          updateTrack(selectedTrackId, { muted: !track.muted });
          toast.info(`Track ${track.muted ? 'unmuted' : 'muted'}`);
        }
        return;
      }

      // Delete/Backspace - Remove selected regions
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRegionIds.length > 0) {
        e.preventDefault();
        const rippleEnabled = e.shiftKey;
        selectedRegionIds.forEach(id => {
          deleteRegionWithRipple(id, rippleEnabled);
        });
        toast.success(`Deleted ${selectedRegionIds.length} region(s)${rippleEnabled ? ' with ripple' : ''}`);
        return;
      }

      // Cmd/Ctrl+A - Select all regions
      if (cmdCtrl && e.key === 'a') {
        e.preventDefault();
        // This would be implemented in the tracks store
        toast.info('Select all');
        return;
      }

      // Arrow Keys - Navigate (or octave shift with Shift modifier)
      if (e.key === 'ArrowLeft' && !e.shiftKey) {
        e.preventDefault();
        const step = 0.1;
        onSeek?.(Math.max(0, currentTime - step));
        return;
      }

      if (e.key === 'ArrowRight' && !e.shiftKey) {
        e.preventDefault();
        const step = 0.1;
        onSeek?.(currentTime + step);
        return;
      }
      
      // Shift+ArrowUp - Octave up (for 808s)
      if (e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        toast.info('Octave +1 (808 mode)');
        // Would transpose selected regions up an octave
        return;
      }

      // Shift+ArrowDown - Octave down (for 808s)
      if (e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        toast.info('Octave -1 (808 mode)');
        // Would transpose selected regions down an octave
        return;
      }

      // Home - Go to start
      if (e.key === 'Home') {
        e.preventDefault();
        onSeek?.(0);
        return;
      }

      // End - Go to end (would need to know total duration)
      if (e.key === 'End') {
        e.preventDefault();
        // onSeek?.(totalDuration);
        toast.info('Go to end');
        return;
      }

      // Tool shortcuts
      if (e.key === '1') {
        e.preventDefault();
        setCurrentTool('select');
        toast.info('Select tool');
        return;
      }

      if (e.key === '2') {
        e.preventDefault();
        setCurrentTool('range');
        toast.info('Range tool');
        return;
      }

      if (e.key === '3') {
        e.preventDefault();
        setCurrentTool('split');
        toast.info('Split tool');
        return;
      }

      if (e.key === '4') {
        e.preventDefault();
        setCurrentTool('trim');
        toast.info('Trim tool');
        return;
      }

      if (e.key === '5') {
        e.preventDefault();
        setCurrentTool('fade');
        toast.info('Fade tool');
        return;
      }

      // Zoom shortcuts
      if (cmdCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom * 1.2);
        return;
      }

      if (cmdCtrl && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom(zoom * 0.8);
        return;
      }

      if (cmdCtrl && e.key === '0') {
        e.preventDefault();
        setZoom(100);
        toast.info('Zoom reset');
        return;
      }

      // Cmd/Ctrl+Shift+R - Toggle ripple edit
      if (cmdCtrl && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        toggleRippleEdit();
        toast.info('Ripple edit toggled');
        return;
      }

      // J - Jump back and play
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        onSeek?.(Math.max(0, currentTime - 5));
        if (!isPlaying) onPlayPause?.();
        return;
      }

      // K - Stop/Pause
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (isPlaying) onPlayPause?.();
        return;
      }

      // L - Jump forward and play  
      if (e.key === 'l' && cmdCtrl) {
        e.preventDefault();
        onSeek?.(currentTime + 5);
        if (!isPlaying) onPlayPause?.();
        return;
      }

      // I - Set loop in point
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        // Would set loop start at current time
        toast.info('Set loop in point');
        return;
      }

      // O - Set loop out point
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        // Would set loop end at current time
        toast.info('Set loop out point');
        return;
      }

      // Cmd/Ctrl+B - Create pattern from selection
      if (cmdCtrl && e.key === 'b') {
        e.preventDefault();
        if (selectedRegionIds.length === 0) {
          toast.error('Select regions to create pattern');
          return;
        }
        const patternName = `Pattern ${Date.now()}`;
        const pattern = createPatternFromSelection(patternName, 'drums', selectedRegionIds);
        if (pattern) {
          toast.success(`Pattern "${pattern.name}" created from ${selectedRegionIds.length} region(s)`);
        }
        return;
      }

      // Z - Undo (handled by browser/system)
      // Y - Redo (handled by browser/system)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    isPlaying,
    loopEnabled,
    selectedTrackId,
    selectedRegionIds,
    tracks,
    zoom,
    onSeek,
    onPlayPause,
    onStop,
    onRecord
  ]);
};
