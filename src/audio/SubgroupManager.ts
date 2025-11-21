/**
 * SUBGROUP MANAGER
 * 
 * Allows tracks to route to subgroups instead of direct buses.
 * Subgroups can have their own processing chain.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

export interface Subgroup {
  id: string;
  name: string;
  trackIds: string[];
  processingChain: string[]; // Plugin IDs in processing order
  outputBusId: string; // Which bus this subgroup routes to
}

export interface SubgroupManager {
  /**
   * Create a new subgroup.
   */
  createSubgroup(name: string, outputBusId: string): string;

  /**
   * Add a track to a subgroup.
   */
  addTrackToSubgroup(subgroupId: string, trackId: string): void;

  /**
   * Remove a track from a subgroup.
   */
  removeTrackFromSubgroup(subgroupId: string, trackId: string): void;

  /**
   * Get subgroup for a track.
   */
  getTrackSubgroup(trackId: string): Subgroup | null;

  /**
   * Get all subgroups.
   */
  getAllSubgroups(): Map<string, Subgroup>;

  /**
   * Delete a subgroup.
   */
  deleteSubgroup(subgroupId: string): void;

  /**
   * Add plugin to subgroup processing chain.
   */
  addPluginToSubgroup(subgroupId: string, pluginId: string, position?: number): void;

  /**
   * Remove plugin from subgroup processing chain.
   */
  removePluginFromSubgroup(subgroupId: string, pluginId: string): void;
}

/**
 * Create a new SubgroupManager instance.
 */
export function createSubgroupManager(): SubgroupManager {
  const subgroups = new Map<string, Subgroup>();
  const trackToSubgroup = new Map<string, string>(); // trackId -> subgroupId

  return {
    createSubgroup(name: string, outputBusId: string): string {
      const id = `subgroup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      subgroups.set(id, {
        id,
        name,
        trackIds: [],
        processingChain: [],
        outputBusId,
      });
      console.log(`[SUBGROUP] Created subgroup: ${name} (${id})`);
      return id;
    },

    addTrackToSubgroup(subgroupId: string, trackId: string): void {
      const subgroup = subgroups.get(subgroupId);
      if (!subgroup) {
        console.warn(`[SUBGROUP] Subgroup ${subgroupId} not found`);
        return;
      }

      // Remove from previous subgroup if any
      const previousSubgroup = trackToSubgroup.get(trackId);
      if (previousSubgroup && previousSubgroup !== subgroupId) {
        const prev = subgroups.get(previousSubgroup);
        if (prev) {
          prev.trackIds = prev.trackIds.filter(id => id !== trackId);
        }
      }

      if (!subgroup.trackIds.includes(trackId)) {
        subgroup.trackIds.push(trackId);
      }
      trackToSubgroup.set(trackId, subgroupId);
      console.log(`[SUBGROUP] Added track ${trackId} to subgroup ${subgroup.name}`);
    },

    removeTrackFromSubgroup(subgroupId: string, trackId: string): void {
      const subgroup = subgroups.get(subgroupId);
      if (subgroup) {
        subgroup.trackIds = subgroup.trackIds.filter(id => id !== trackId);
        trackToSubgroup.delete(trackId);
        console.log(`[SUBGROUP] Removed track ${trackId} from subgroup ${subgroup.name}`);
      }
    },

    getTrackSubgroup(trackId: string): Subgroup | null {
      const subgroupId = trackToSubgroup.get(trackId);
      if (!subgroupId) return null;
      return subgroups.get(subgroupId) || null;
    },

    getAllSubgroups(): Map<string, Subgroup> {
      return new Map(subgroups);
    },

    deleteSubgroup(subgroupId: string): void {
      const subgroup = subgroups.get(subgroupId);
      if (subgroup) {
        // Remove all tracks from this subgroup
        subgroup.trackIds.forEach(trackId => {
          trackToSubgroup.delete(trackId);
        });
        subgroups.delete(subgroupId);
        console.log(`[SUBGROUP] Deleted subgroup: ${subgroup.name}`);
      }
    },

    addPluginToSubgroup(subgroupId: string, pluginId: string, position?: number): void {
      const subgroup = subgroups.get(subgroupId);
      if (!subgroup) {
        console.warn(`[SUBGROUP] Subgroup ${subgroupId} not found`);
        return;
      }

      if (position !== undefined) {
        subgroup.processingChain.splice(position, 0, pluginId);
      } else {
        subgroup.processingChain.push(pluginId);
      }
      console.log(`[SUBGROUP] Added plugin ${pluginId} to subgroup ${subgroup.name}`);
    },

    removePluginFromSubgroup(subgroupId: string, pluginId: string): void {
      const subgroup = subgroups.get(subgroupId);
      if (subgroup) {
        subgroup.processingChain = subgroup.processingChain.filter(id => id !== pluginId);
        console.log(`[SUBGROUP] Removed plugin ${pluginId} from subgroup ${subgroup.name}`);
      }
    },
  };
}

