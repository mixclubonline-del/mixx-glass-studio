/**
 * ROUTING MATRIX
 * 
 * Visual routing matrix showing tracks → plugins → buses with sidechain connections.
 * Flow-conscious: Color/temperature visualization, no numbers, glass aesthetic.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

import React, { useMemo } from 'react';
import { TrackData } from '../../App';
import { hexToRgba } from '../../utils/ALS';
import { FxWindowId } from '../../App';

export interface SidechainConnection {
  fromTrackId: string;
  toPluginId: string;
}

export interface RoutingMatrixProps {
  tracks: TrackData[];
  plugins: Array<{ id: FxWindowId; name: string; canBeSidechainTarget?: boolean }>;
  sidechainConnections: Map<string, SidechainConnection>;
  onConnectSidechain: (pluginId: string, sourceTrackId: string) => void;
  onDisconnectSidechain: (pluginId: string) => void;
  onClose?: () => void;
}

export const RoutingMatrix: React.FC<RoutingMatrixProps> = ({
  tracks,
  plugins,
  sidechainConnections,
  onConnectSidechain,
  onDisconnectSidechain,
  onClose,
}) => {
  // Get plugins that support sidechain
  const sidechainPlugins = useMemo(() => {
    return plugins.filter(p => p.canBeSidechainTarget);
  }, [plugins]);

  // Get track color swatches
  const getTrackColor = (track: TrackData) => {
    const swatches: Record<TrackData['trackColor'], { base: string; glow: string }> = {
      cyan: { base: '#06b6d4', glow: '#67e8f9' },
      magenta: { base: '#d946ef', glow: '#f0abfc' },
      blue: { base: '#3b82f6', glow: '#93c5fd' },
      green: { base: '#22c55e', glow: '#86efac' },
      crimson: { base: '#f43f5e', glow: '#fb7185' },
      purple: { base: '#8b5cf6', glow: '#c4b5fd' },
    };
    return swatches[track.trackColor] || swatches.purple;
  };

  const handleTrackClick = (trackId: string, pluginId: string) => {
    const existing = sidechainConnections.get(pluginId);
    if (existing && existing.fromTrackId === trackId) {
      // Disconnect if clicking same track
      onDisconnectSidechain(pluginId);
    } else {
      // Connect new sidechain
      onConnectSidechain(pluginId, trackId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-[90vw] max-w-6xl h-[80vh] rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 10, 22, 0.95) 70%)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Routing Matrix</h2>
            <p className="text-sm text-ink/60 mt-1">Connect sidechain sources to plugins</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-ink/70 hover:bg-white/10 hover:text-ink transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Matrix Content */}
        <div className="p-6 overflow-auto h-[calc(80vh-100px)]">
          {sidechainPlugins.length === 0 ? (
            <div className="flex items-center justify-center h-full text-ink/50">
              <p>No plugins support sidechain routing</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sidechainPlugins.map((plugin) => {
                const connection = sidechainConnections.get(plugin.id);
                const connectedTrack = connection
                  ? tracks.find(t => t.id === connection.fromTrackId)
                  : null;
                const trackColor = connectedTrack ? getTrackColor(connectedTrack) : null;

                return (
                  <div
                    key={plugin.id}
                    className="rounded-xl border border-white/10 p-4"
                    style={{
                      background: connection
                        ? `linear-gradient(135deg, ${hexToRgba(trackColor?.glow || '#8b5cf6', 0.1)} 0%, rgba(6, 10, 22, 0.8) 70%)`
                        : 'rgba(6, 10, 22, 0.8)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: connection
                              ? trackColor?.glow || '#8b5cf6'
                              : 'rgba(148, 163, 184, 0.3)',
                            boxShadow: connection
                              ? `0 0 8px ${hexToRgba(trackColor?.glow || '#8b5cf6', 0.5)}`
                              : undefined,
                          }}
                        />
                        <h3 className="text-lg font-semibold text-slate-100">{plugin.name}</h3>
                        {connection && connectedTrack && (
                          <span
                            className="text-xs px-2 py-1 rounded-full uppercase tracking-wider"
                            style={{
                              background: hexToRgba(trackColor!.glow, 0.2),
                              border: `1px solid ${hexToRgba(trackColor!.glow, 0.4)}`,
                              color: trackColor!.glow,
                            }}
                          >
                            {connectedTrack.trackName}
                          </span>
                        )}
                      </div>
                      {connection && (
                        <button
                          onClick={() => onDisconnectSidechain(plugin.id)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 border border-red-400/30 text-red-200 hover:bg-red-500/30 transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>

                    {/* Track Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {tracks.map((track) => {
                        const isConnected = connection?.fromTrackId === track.id;
                        const trackSwatch = getTrackColor(track);

                        return (
                          <button
                            key={track.id}
                            onClick={() => handleTrackClick(track.id, plugin.id)}
                            className={`relative p-3 rounded-lg border transition-all duration-200 ${
                              isConnected
                                ? 'border-2'
                                : 'border border-white/10 hover:border-white/20'
                            }`}
                            style={{
                              background: isConnected
                                ? `linear-gradient(135deg, ${hexToRgba(trackSwatch.base, 0.2)} 0%, ${hexToRgba(trackSwatch.base, 0.05)} 100%)`
                                : 'rgba(15, 23, 42, 0.5)',
                              borderColor: isConnected
                                ? trackSwatch.glow
                                : 'rgba(255, 255, 255, 0.1)',
                              boxShadow: isConnected
                                ? `0 0 12px ${hexToRgba(trackSwatch.glow, 0.4)}`
                                : undefined,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background: trackSwatch.glow,
                                  boxShadow: `0 0 4px ${trackSwatch.glow}`,
                                }}
                              />
                              <span
                                className="text-xs font-medium truncate"
                                style={{
                                  color: isConnected ? trackSwatch.glow : 'rgba(148, 163, 184, 0.8)',
                                }}
                              >
                                {track.trackName}
                              </span>
                            </div>
                            {isConnected && (
                              <div
                                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                                style={{
                                  background: trackSwatch.glow,
                                  boxShadow: `0 0 6px ${trackSwatch.glow}`,
                                  animation: 'pulse 2s ease-in-out infinite',
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default RoutingMatrix;

