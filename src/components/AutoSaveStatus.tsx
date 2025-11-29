/**
 * AutoSaveStatus Component
 * what: Visual indicator for auto-save and auto-pull status
 * why: Provide feedback without breaking Flow
 * how: Minimal UI showing save/pull state with temperature-based colors
 */

import React from 'react';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAutoPull } from '../hooks/useAutoPull';
import type { PersistedProjectState } from '../App';

interface AutoSaveStatusProps {
  getProjectState: () => PersistedProjectState;
}

export const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({ getProjectState }) => {
  const autoSave = useAutoSave(getProjectState);
  const autoPull = useAutoPull();

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getSaveColor = (): string => {
    if (autoSave.status.saveInProgress) return 'text-purple-400';
    if (autoSave.status.pendingChanges) return 'text-yellow-400';
    if (autoSave.status.lastSaveTime) return 'text-green-400';
    return 'text-gray-500';
  };

  const getPullColor = (): string => {
    if (autoPull.status.pullInProgress) return 'text-purple-400';
    if (autoPull.status.lastError) return 'text-red-400';
    if (autoPull.status.lastPullTime) return 'text-blue-400';
    return 'text-gray-500';
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 items-end z-50 pointer-events-none">
      {/* Auto-Save Status */}
      {autoSave.isEnabled && (
        <div className={`flex items-center gap-2 text-xs ${getSaveColor()} pointer-events-auto`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="font-mono">
            {autoSave.status.saveInProgress
              ? 'Saving...'
              : autoSave.status.pendingChanges
              ? 'Pending'
              : `Saved ${formatTime(autoSave.status.lastSaveTime)}`}
          </span>
        </div>
      )}

      {/* Auto-Pull Status */}
      {autoPull.isEnabled && (
        <div className={`flex items-center gap-2 text-xs ${getPullColor()} pointer-events-auto`}>
          <div className="w-2 h-2 rounded-full bg-current" />
          <span className="font-mono">
            {autoPull.status.pullInProgress
              ? 'Pulling...'
              : autoPull.status.lastError
              ? 'Error'
              : `Synced ${formatTime(autoPull.status.lastPullTime)}`}
          </span>
        </div>
      )}
    </div>
  );
};

