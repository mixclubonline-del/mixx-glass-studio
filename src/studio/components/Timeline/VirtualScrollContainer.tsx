/**
 * Virtual Scroll Container - Optimized rendering for large timelines
 * Only renders regions visible in viewport
 */

import React, { useMemo } from 'react';
import { Region } from '@/types/timeline';

interface VirtualScrollContainerProps {
  regions: Region[];
  zoom: number;
  scrollX: number;
  containerWidth: number;
  renderRegion: (region: Region) => React.ReactNode;
}

export const VirtualScrollContainer: React.FC<VirtualScrollContainerProps> = ({
  regions,
  zoom,
  scrollX,
  containerWidth,
  renderRegion,
}) => {
  // Calculate visible region range
  const visibleRegions = useMemo(() => {
    const visibleStart = scrollX / zoom;
    const visibleEnd = (scrollX + containerWidth) / zoom;
    
    // Add buffer (1 screen width on each side) for smooth scrolling
    const bufferSize = containerWidth / zoom;
    const bufferStart = Math.max(0, visibleStart - bufferSize);
    const bufferEnd = visibleEnd + bufferSize;
    
    return regions.filter(region => {
      const regionEnd = region.startTime + region.duration;
      
      // Region is visible if it overlaps with buffered viewport
      return region.startTime < bufferEnd && regionEnd > bufferStart;
    });
  }, [regions, zoom, scrollX, containerWidth]);
  
  return (
    <>
      {visibleRegions.map(renderRegion)}
    </>
  );
};
