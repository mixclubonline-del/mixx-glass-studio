/**
 * AutoSaveSettings Component
 * what: Settings panel for auto-save and auto-pull configuration
 * why: Give users control over auto-save/pull behavior
 * how: Toggle switches and interval controls
 */

import React from 'react';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAutoPull } from '../hooks/useAutoPull';
import type { PersistedProjectState } from '../App';

interface AutoSaveSettingsProps {
  getProjectState: () => PersistedProjectState;
}

export const AutoSaveSettings: React.FC<AutoSaveSettingsProps> = ({ getProjectState }) => {
  const autoSave = useAutoSave(getProjectState);
  const autoPull = useAutoPull();

  const formatInterval = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
          Auto-Save
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm">Enable Auto-Save</div>
              <div className="text-white/50 text-xs mt-1">
                Automatically save project state every 30 seconds
              </div>
            </div>
            <button
              onClick={() => autoSave.setEnabled(!autoSave.isEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoSave.isEnabled ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoSave.isEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {autoSave.status.lastSaveTime && (
            <div className="text-white/50 text-xs">
              Last saved: {new Date(autoSave.status.lastSaveTime).toLocaleTimeString()}
            </div>
          )}

          {autoSave.status.pendingChanges && (
            <div className="text-yellow-400 text-xs">Pending changes...</div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
          Auto-Pull
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm">Enable Auto-Pull</div>
              <div className="text-white/50 text-xs mt-1">
                Automatically sync with git repository (disabled by default)
              </div>
            </div>
            <button
              onClick={() => autoPull.setEnabled(!autoPull.isEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoPull.isEnabled ? 'bg-blue-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoPull.isEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {autoPull.status.lastError && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded p-2">
              Error: {autoPull.status.lastError}
            </div>
          )}

          {autoPull.status.lastPullTime && (
            <div className="text-white/50 text-xs">
              Last synced: {new Date(autoPull.status.lastPullTime).toLocaleTimeString()}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-white text-sm">Pull Interval</div>
            <div className="text-white/50 text-xs">
              {formatInterval(autoPull.status.interval)}
            </div>
          </div>

          <button
            onClick={() => autoPull.pullNow()}
            disabled={autoPull.status.pullInProgress}
            className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded px-4 py-2 text-white text-sm transition-colors disabled:opacity-50"
          >
            {autoPull.status.pullInProgress ? 'Pulling...' : 'Pull Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

