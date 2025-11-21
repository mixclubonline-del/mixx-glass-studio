/**
 * VCA GROUP MANAGER
 * 
 * Volume control groups (VCA faders).
 * Multiple tracks controlled by single VCA.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

export interface VCAGroup {
  id: string;
  name: string;
  trackIds: string[];
  level: number; // 0-1, master level for all tracks in group
}

export interface VCAGroupManager {
  /**
   * Create a new VCA group.
   */
  createVCAGroup(name: string): string;

  /**
   * Add a track to a VCA group.
   */
  addTrackToVCAGroup(vcaGroupId: string, trackId: string): void;

  /**
   * Remove a track from a VCA group.
   */
  removeTrackFromVCAGroup(vcaGroupId: string, trackId: string): void;

  /**
   * Get VCA group for a track.
   */
  getTrackVCAGroup(trackId: string): VCAGroup | null;

  /**
   * Get all VCA groups.
   */
  getAllVCAGroups(): Map<string, VCAGroup>;

  /**
   * Set VCA group level.
   */
  setVCAGroupLevel(vcaGroupId: string, level: number): void;

  /**
   * Get VCA group level.
   */
  getVCAGroupLevel(vcaGroupId: string): number;

  /**
   * Delete a VCA group.
   */
  deleteVCAGroup(vcaGroupId: string): void;
}

/**
 * Create a new VCAGroupManager instance.
 */
export function createVCAGroupManager(): VCAGroupManager {
  const vcaGroups = new Map<string, VCAGroup>();
  const trackToVCAGroup = new Map<string, string>(); // trackId -> vcaGroupId

  return {
    createVCAGroup(name: string): string {
      const id = `vca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      vcaGroups.set(id, {
        id,
        name,
        trackIds: [],
        level: 1.0,
      });
      console.log(`[VCA] Created VCA group: ${name} (${id})`);
      return id;
    },

    addTrackToVCAGroup(vcaGroupId: string, trackId: string): void {
      const vcaGroup = vcaGroups.get(vcaGroupId);
      if (!vcaGroup) {
        console.warn(`[VCA] VCA group ${vcaGroupId} not found`);
        return;
      }

      // Remove from previous VCA group if any
      const previousVCAGroup = trackToVCAGroup.get(trackId);
      if (previousVCAGroup && previousVCAGroup !== vcaGroupId) {
        const prev = vcaGroups.get(previousVCAGroup);
        if (prev) {
          prev.trackIds = prev.trackIds.filter(id => id !== trackId);
        }
      }

      if (!vcaGroup.trackIds.includes(trackId)) {
        vcaGroup.trackIds.push(trackId);
      }
      trackToVCAGroup.set(trackId, vcaGroupId);
      console.log(`[VCA] Added track ${trackId} to VCA group ${vcaGroup.name}`);
    },

    removeTrackFromVCAGroup(vcaGroupId: string, trackId: string): void {
      const vcaGroup = vcaGroups.get(vcaGroupId);
      if (vcaGroup) {
        vcaGroup.trackIds = vcaGroup.trackIds.filter(id => id !== trackId);
        trackToVCAGroup.delete(trackId);
        console.log(`[VCA] Removed track ${trackId} from VCA group ${vcaGroup.name}`);
      }
    },

    getTrackVCAGroup(trackId: string): VCAGroup | null {
      const vcaGroupId = trackToVCAGroup.get(trackId);
      if (!vcaGroupId) return null;
      return vcaGroups.get(vcaGroupId) || null;
    },

    getAllVCAGroups(): Map<string, VCAGroup> {
      return new Map(vcaGroups);
    },

    setVCAGroupLevel(vcaGroupId: string, level: number): void {
      const vcaGroup = vcaGroups.get(vcaGroupId);
      if (vcaGroup) {
        vcaGroup.level = Math.max(0, Math.min(1, level));
        console.log(`[VCA] Set ${vcaGroup.name} level to ${(vcaGroup.level * 100).toFixed(0)}%`);
      }
    },

    getVCAGroupLevel(vcaGroupId: string): number {
      const vcaGroup = vcaGroups.get(vcaGroupId);
      return vcaGroup?.level ?? 1.0;
    },

    deleteVCAGroup(vcaGroupId: string): void {
      const vcaGroup = vcaGroups.get(vcaGroupId);
      if (vcaGroup) {
        // Remove all tracks from this VCA group
        vcaGroup.trackIds.forEach(trackId => {
          trackToVCAGroup.delete(trackId);
        });
        vcaGroups.delete(vcaGroupId);
        console.log(`[VCA] Deleted VCA group: ${vcaGroup.name}`);
      }
    },
  };
}

