/**
 * RippleEditManager - Handles automatic gap closing when ripple edit is enabled
 */

import { Region } from '@/types/timeline';

export class RippleEditManager {
  /**
   * Adjusts regions after a deletion in ripple mode
   */
  static handleDelete(
    deletedRegion: Region,
    allRegions: Region[],
    trackId: string
  ): Region[] {
    const trackRegions = allRegions.filter(r => r.trackId === trackId);
    const affectedRegions = trackRegions.filter(
      r => r.startTime > deletedRegion.startTime && r.id !== deletedRegion.id
    );

    return allRegions.map(region => {
      if (affectedRegions.find(r => r.id === region.id)) {
        return {
          ...region,
          startTime: region.startTime - deletedRegion.duration,
        };
      }
      return region;
    });
  }

  /**
   * Adjusts regions after a move in ripple mode
   */
  static handleMove(
    movedRegion: Region,
    oldStartTime: number,
    newStartTime: number,
    allRegions: Region[],
    trackId: string
  ): Region[] {
    const delta = newStartTime - oldStartTime;
    const trackRegions = allRegions.filter(r => r.trackId === trackId);
    
    // If moving forward, push regions ahead
    if (delta > 0) {
      const affectedRegions = trackRegions.filter(
        r => r.startTime >= oldStartTime + movedRegion.duration && r.id !== movedRegion.id
      );

      return allRegions.map(region => {
        if (affectedRegions.find(r => r.id === region.id)) {
          return {
            ...region,
            startTime: region.startTime + delta,
          };
        }
        return region;
      });
    }
    
    // If moving backward, pull regions back
    else if (delta < 0) {
      const affectedRegions = trackRegions.filter(
        r => r.startTime > newStartTime + movedRegion.duration && r.id !== movedRegion.id
      );

      return allRegions.map(region => {
        if (affectedRegions.find(r => r.id === region.id)) {
          return {
            ...region,
            startTime: Math.max(newStartTime + movedRegion.duration, region.startTime + delta),
          };
        }
        return region;
      });
    }

    return allRegions;
  }

  /**
   * Closes gaps between regions on a track
   */
  static closeGaps(allRegions: Region[], trackId: string): Region[] {
    const trackRegions = allRegions
      .filter(r => r.trackId === trackId)
      .sort((a, b) => a.startTime - b.startTime);

    let currentTime = 0;
    const adjustedRegions = new Map<string, number>();

    trackRegions.forEach(region => {
      if (region.startTime > currentTime) {
        adjustedRegions.set(region.id, currentTime);
        currentTime += region.duration;
      } else {
        adjustedRegions.set(region.id, region.startTime);
        currentTime = region.startTime + region.duration;
      }
    });

    return allRegions.map(region => {
      const newStartTime = adjustedRegions.get(region.id);
      if (newStartTime !== undefined) {
        return { ...region, startTime: newStartTime };
      }
      return region;
    });
  }

  /**
   * Checks if regions overlap after a move
   */
  static detectOverlap(
    region: Region,
    allRegions: Region[],
    trackId: string
  ): boolean {
    const trackRegions = allRegions.filter(
      r => r.trackId === trackId && r.id !== region.id
    );

    return trackRegions.some(
      r =>
        (region.startTime >= r.startTime && region.startTime < r.startTime + r.duration) ||
        (region.startTime + region.duration > r.startTime &&
          region.startTime + region.duration <= r.startTime + r.duration) ||
        (region.startTime <= r.startTime && region.startTime + region.duration >= r.startTime + r.duration)
    );
  }
}
