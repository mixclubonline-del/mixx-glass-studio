/**
 * Edge Bloom Trigger - Invisible hitbox for edge detection
 */

import React from 'react';
import { useEdgeBloom } from '@/hooks/useEdgeBloom';
import { useBloomStore } from '@/store/bloomStore';
import { cn } from '@/lib/utils';

interface EdgeBloomTriggerProps {
  edge: 'top' | 'bottom' | 'left' | 'right';
  thickness?: number;
  offset?: number;
}

export const EdgeBloomTrigger: React.FC<EdgeBloomTriggerProps> = ({
  edge,
  thickness = 40,
  offset = 0
}) => {
  const { isNearEdge } = useEdgeBloom({ edge, thickness, offset });
  const { debugMode } = useBloomStore();
  
  const positionClasses = {
    top: `top-[${offset}px] left-0 right-0 h-[${thickness}px]`,
    bottom: `bottom-[${offset}px] left-0 right-0 h-[${thickness}px]`,
    left: `left-[${offset}px] top-0 bottom-0 w-[${thickness}px]`,
    right: `right-[${offset}px] top-0 bottom-0 w-[${thickness}px]`
  };
  
  // Only render visual indicator in debug mode
  if (!debugMode) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'fixed pointer-events-none z-[9999] transition-all duration-300',
        positionClasses[edge],
        isNearEdge ? 'bg-primary/30' : 'bg-border/10'
      )}
      style={{
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-mono text-muted-foreground">
          {edge.toUpperCase()} BLOOM ZONE {isNearEdge ? '✓' : ''}
        </span>
      </div>
    </div>
  );
};
