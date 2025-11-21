/**
 * SIDECHAIN ROUTER
 * 
 * Centralized sidechain routing management for Mixx Club Studio.
 * Manages all sidechain connections between tracks and plugins.
 * 
 * Flow-conscious: Maintains routing state without breaking creator momentum.
 * Reductionist: Only tracks what matters - source, destination, connection state.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

export interface SidechainConnection {
  sourceTrackId: string;
  sourceNode: AudioNode;
  toPluginId: string;
  connected: boolean;
}

export interface SidechainRouter {
  /**
   * Connect a sidechain source to a plugin.
   * @param pluginId The plugin receiving the sidechain signal
   * @param sourceTrackId The track providing the sidechain signal
   * @param sourceNode The audio node from the source track
   */
  connectSidechain(pluginId: string, sourceTrackId: string, sourceNode: AudioNode): void;

  /**
   * Disconnect sidechain from a plugin.
   * @param pluginId The plugin to disconnect
   */
  disconnectSidechain(pluginId: string): void;

  /**
   * Get the sidechain source for a plugin.
   * @param pluginId The plugin to query
   * @returns The sidechain connection info, or null if not connected
   */
  getSidechainSource(pluginId: string): SidechainConnection | null;

  /**
   * Get all sidechain connections.
   * @returns Map of pluginId to connection info
   */
  getAllConnections(): Map<string, SidechainConnection>;

  /**
   * Check if a track is being used as a sidechain source.
   * @param trackId The track to check
   * @returns Array of plugin IDs using this track as sidechain source
   */
  getTracksSidechainTargets(trackId: string): string[];

  /**
   * Disconnect all sidechain connections for a track (when track is removed).
   * @param trackId The track being removed
   */
  disconnectTrackSidechains(trackId: string): void;

  /**
   * Clear all sidechain connections.
   */
  clearAll(): void;
}

/**
 * Create a new SidechainRouter instance.
 */
export function createSidechainRouter(): SidechainRouter {
  const connections = new Map<string, SidechainConnection>();

  return {
    connectSidechain(pluginId: string, sourceTrackId: string, sourceNode: AudioNode): void {
      // Disconnect existing connection if any
      const existing = connections.get(pluginId);
      if (existing?.connected) {
        // Disconnect old source if different
        if (existing.sourceTrackId !== sourceTrackId) {
          try {
            existing.sourceNode.disconnect();
          } catch (e) {
            // Already disconnected, ignore
          }
        }
      }

      connections.set(pluginId, {
        sourceTrackId,
        sourceNode,
        toPluginId: pluginId,
        connected: true,
      });

      console.log(`[SIDECHAIN] Connected ${sourceTrackId} → ${pluginId}`);
    },

    disconnectSidechain(pluginId: string): void {
      const connection = connections.get(pluginId);
      if (connection) {
        try {
          connection.sourceNode.disconnect();
        } catch (e) {
          // Already disconnected, ignore
        }
        connections.delete(pluginId);
        console.log(`[SIDECHAIN] Disconnected ${pluginId}`);
      }
    },

    getSidechainSource(pluginId: string): SidechainConnection | null {
      return connections.get(pluginId) || null;
    },

    getAllConnections(): Map<string, SidechainConnection> {
      return new Map(connections);
    },

    getTracksSidechainTargets(trackId: string): string[] {
      const targets: string[] = [];
      connections.forEach((conn, pluginId) => {
        if (conn.sourceTrackId === trackId && conn.connected) {
          targets.push(pluginId);
        }
      });
      return targets;
    },

    disconnectTrackSidechains(trackId: string): void {
      const toDisconnect: string[] = [];
      connections.forEach((conn, pluginId) => {
        if (conn.sourceTrackId === trackId) {
          toDisconnect.push(pluginId);
        }
      });
      toDisconnect.forEach(pluginId => {
        this.disconnectSidechain(pluginId);
      });
    },

    clearAll(): void {
      connections.forEach((conn) => {
        try {
          conn.sourceNode.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      });
      connections.clear();
      console.log('[SIDECHAIN] Cleared all connections');
    },
  };
}

