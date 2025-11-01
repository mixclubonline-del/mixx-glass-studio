/**
 * Edge Bloom Hook - Detects mouse proximity to screen edges
 */

import { useEffect, useState } from 'react';
import { useBloomStore } from '@/store/bloomStore';

interface EdgeBloomConfig {
  edge: 'top' | 'bottom' | 'left' | 'right';
  thickness?: number; // trigger zone thickness in px
  offset?: number; // offset from edge in px
}

export const useEdgeBloom = (config: EdgeBloomConfig) => {
  const { edge, thickness = 40, offset = 0 } = config;
  const [isNearEdge, setIsNearEdge] = useState(false);
  const { activateZone, deactivateZone } = useBloomStore();
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      let isInZone = false;
      
      switch (edge) {
        case 'top':
          isInZone = clientY <= thickness + offset;
          break;
        case 'bottom':
          isInZone = clientY >= innerHeight - thickness - offset;
          break;
        case 'left':
          isInZone = clientX <= thickness + offset;
          break;
        case 'right':
          isInZone = clientX >= innerWidth - thickness - offset;
          break;
      }
      
      if (isInZone !== isNearEdge) {
        setIsNearEdge(isInZone);
        
        if (isInZone) {
          activateZone(edge);
        } else {
          deactivateZone(edge);
        }
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [edge, thickness, offset, isNearEdge, activateZone, deactivateZone]);
  
  return { isNearEdge };
};
