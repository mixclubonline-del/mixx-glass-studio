/**
 * Multi-Region Operations - Batch operations for multiple selected regions
 */

import { Region } from '@/types/timeline';

export class MultiRegionOperations {
  /**
   * Move all selected regions by a delta time
   */
  static moveRegions(regions: Region[], deltaTime: number): Region[] {
    return regions.map(region => ({
      ...region,
      startTime: Math.max(0, region.startTime + deltaTime),
    }));
  }
  
  /**
   * Apply gain adjustment to all selected regions
   */
  static adjustGain(regions: Region[], gainMultiplier: number): Region[] {
    return regions.map(region => ({
      ...region,
      gain: Math.max(0, Math.min(2, region.gain * gainMultiplier)),
    }));
  }
  
  /**
   * Apply fade in/out to all selected regions
   */
  static applyFades(regions: Region[], fadeIn: number, fadeOut: number): Region[] {
    return regions.map(region => ({
      ...region,
      fadeIn: Math.max(0, Math.min(region.duration / 2, fadeIn)),
      fadeOut: Math.max(0, Math.min(region.duration / 2, fadeOut)),
    }));
  }
  
  /**
   * Lock/unlock all selected regions
   */
  static setLocked(regions: Region[], locked: boolean): Region[] {
    return regions.map(region => ({
      ...region,
      locked,
    }));
  }
  
  /**
   * Set color for all selected regions
   */
  static setColor(regions: Region[], color: string): Region[] {
    return regions.map(region => ({
      ...region,
      color,
    }));
  }
  
  /**
   * Duplicate all selected regions
   */
  static duplicateRegions(regions: Region[], offsetTime: number = 0): Region[] {
    return regions.map(region => ({
      ...region,
      id: `${region.id}-copy-${Date.now()}`,
      startTime: region.startTime + (offsetTime || region.duration),
    }));
  }
  
  /**
   * Align all selected regions to a specific time
   */
  static alignToTime(regions: Region[], alignTime: number, alignPoint: 'start' | 'center' | 'end'): Region[] {
    return regions.map(region => {
      let newStartTime = alignTime;
      
      if (alignPoint === 'center') {
        newStartTime = alignTime - (region.duration / 2);
      } else if (alignPoint === 'end') {
        newStartTime = alignTime - region.duration;
      }
      
      return {
        ...region,
        startTime: Math.max(0, newStartTime),
      };
    });
  }
  
  /**
   * Ripple delete - remove regions and shift subsequent regions left
   */
  static rippleDelete(
    allRegions: Region[], 
    regionsToDelete: Region[], 
    trackId: string
  ): Region[] {
    const deleteIds = new Set(regionsToDelete.map(r => r.id));
    const minDeleteTime = Math.min(...regionsToDelete.map(r => r.startTime));
    const maxDeleteEnd = Math.max(...regionsToDelete.map(r => r.startTime + r.duration));
    const rippleAmount = maxDeleteEnd - minDeleteTime;
    
    return allRegions
      .filter(r => !deleteIds.has(r.id))
      .map(region => {
        // Shift regions on same track that start after deleted regions
        if (region.trackId === trackId && region.startTime >= maxDeleteEnd) {
          return {
            ...region,
            startTime: Math.max(0, region.startTime - rippleAmount),
          };
        }
        return region;
      });
  }
  
  /**
   * Calculate bounding box for selected regions
   */
  static getBoundingBox(regions: Region[]): {
    startTime: number;
    endTime: number;
    duration: number;
  } | null {
    if (regions.length === 0) return null;
    
    const startTime = Math.min(...regions.map(r => r.startTime));
    const endTime = Math.max(...regions.map(r => r.startTime + r.duration));
    
    return {
      startTime,
      endTime,
      duration: endTime - startTime,
    };
  }
}
