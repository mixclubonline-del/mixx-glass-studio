/**
 * AutoSaveRecovery Component
 * what: UI for recovering from auto-save history
 * why: Enable Mixx Recall by allowing users to restore previous states
 * how: Modal showing auto-save history with preview and restore
 */

import React, { useState, useEffect } from 'react';
import { useAutoSave } from '../hooks/useAutoSave';
import type { PersistedProjectState } from '../App';

interface AutoSaveRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (state: PersistedProjectState) => void;
  getProjectState: () => PersistedProjectState;
}

export const AutoSaveRecovery: React.FC<AutoSaveRecoveryProps> = ({
  isOpen,
  onClose,
  onRestore,
  getProjectState,
}) => {
  const autoSave = useAutoSave(getProjectState);
  const [saves, setSaves] = useState<Array<{ timestamp: number; state: PersistedProjectState }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      autoSave.getAllSaves().then((allSaves) => {
        setSaves(allSaves);
        setLoading(false);
      });
    }
  }, [isOpen, autoSave]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-black/90 to-purple-900/20 border border-purple-500/30 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recover Auto-Save</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/50">Loading saves...</div>
          </div>
        ) : saves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/50">
            <div className="text-lg mb-2">No auto-saves found</div>
            <div className="text-sm">Auto-saves will appear here as you work</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {saves.map((save) => (
              <div
                key={save.timestamp}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-medium">{formatDate(save.timestamp)}</div>
                  <div className="text-white/50 text-sm">{formatRelativeTime(save.timestamp)}</div>
                </div>
                <div className="text-white/70 text-sm mb-3">
                  {save.state.tracks?.length || 0} tracks • {save.state.clips?.length || 0} clips
                  {save.state.bpm && ` • ${save.state.bpm} BPM`}
                </div>
                <button
                  onClick={() => {
                    onRestore(save.state);
                    onClose();
                  }}
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded px-4 py-2 text-white text-sm transition-colors"
                >
                  Restore This State
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50">
          Auto-saves are stored locally and kept for recovery. Last 10 saves are retained.
        </div>
      </div>
    </div>
  );
};

