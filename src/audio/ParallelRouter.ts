/**
 * PARALLEL ROUTER
 * 
 * Supports multiple plugin chains in parallel with mix control.
 * Flow-conscious: Maintains signal flow without breaking momentum.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

export interface ParallelPath {
  pluginId: string;
  mix: number; // 0-1, mix level for this parallel path
}

export interface ParallelRouter {
  /**
   * Set parallel processing paths for a track.
   * @param trackId The track to configure
   * @param paths Array of parallel paths with mix levels
   */
  setParallelPaths(trackId: string, paths: ParallelPath[]): void;

  /**
   * Get parallel processing paths for a track.
   * @param trackId The track to query
   * @returns Array of parallel paths, or empty array if not configured
   */
  getParallelPaths(trackId: string): ParallelPath[];

  /**
   * Clear parallel processing for a track.
   * @param trackId The track to clear
   */
  clearParallelPaths(trackId: string): void;

  /**
   * Get all parallel processing configurations.
   * @returns Map of trackId to parallel paths
   */
  getAllPaths(): Map<string, ParallelPath[]>;
}

/**
 * Create a new ParallelRouter instance.
 */
export function createParallelRouter(): ParallelRouter {
  const paths = new Map<string, ParallelPath[]>();

  return {
    setParallelPaths(trackId: string, pathsArray: ParallelPath[]): void {
      // Validate mix levels sum to reasonable range
      const totalMix = pathsArray.reduce((sum, path) => sum + path.mix, 0);
      if (totalMix > 2.0) {
        console.warn(`[PARALLEL] Total mix for ${trackId} exceeds 2.0, normalizing`);
        pathsArray = pathsArray.map(p => ({ ...p, mix: p.mix / totalMix * 1.5 }));
      }

      paths.set(trackId, pathsArray);
      console.log(`[PARALLEL] Set ${pathsArray.length} parallel paths for ${trackId}`);
    },

    getParallelPaths(trackId: string): ParallelPath[] {
      return paths.get(trackId) || [];
    },

    clearParallelPaths(trackId: string): void {
      paths.delete(trackId);
      console.log(`[PARALLEL] Cleared parallel paths for ${trackId}`);
    },

    getAllPaths(): Map<string, ParallelPath[]> {
      return new Map(paths);
    },
  };
}

