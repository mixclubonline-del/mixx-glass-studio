/**
 * Resizable Split View - Vertical split panel with collapse functionality
 */

import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResizableSplitViewProps {
  topPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
  defaultTopSize?: number; // Percentage (0-100)
  minTopSize?: number;
  minBottomSize?: number;
  storageKey?: string; // For persisting split ratio
  className?: string;
}

export const ResizableSplitView: React.FC<ResizableSplitViewProps> = ({
  topPanel,
  bottomPanel,
  defaultTopSize = 60,
  minTopSize = 20,
  minBottomSize = 20,
  storageKey = 'splitView',
  className
}) => {
  const [topCollapsed, setTopCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [sizes, setSizes] = useState<number[]>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}-sizes`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [defaultTopSize, 100 - defaultTopSize];
        }
      }
    }
    return [defaultTopSize, 100 - defaultTopSize];
  });

  // Save sizes to localStorage
  useEffect(() => {
    if (storageKey && !topCollapsed && !bottomCollapsed) {
      localStorage.setItem(`${storageKey}-sizes`, JSON.stringify(sizes));
    }
  }, [sizes, storageKey, topCollapsed, bottomCollapsed]);

  const handleTopCollapse = () => {
    setTopCollapsed(!topCollapsed);
    setBottomCollapsed(false);
  };

  const handleBottomCollapse = () => {
    setBottomCollapsed(!bottomCollapsed);
    setTopCollapsed(false);
  };

  return (
    <div className={cn('h-full relative', className)}>
      <ResizablePanelGroup 
        direction="vertical"
        onLayout={(newSizes) => {
          if (!topCollapsed && !bottomCollapsed) {
            setSizes(newSizes);
          }
        }}
      >
        {/* Top Panel */}
        <ResizablePanel
          defaultSize={topCollapsed ? 0 : sizes[0]}
          minSize={topCollapsed ? 0 : minTopSize}
          maxSize={bottomCollapsed ? 100 : 100 - minBottomSize}
          collapsible
          className="relative"
        >
          {!topCollapsed && (
            <>
              {topPanel}
              {/* Collapse button - top right */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTopCollapse}
                className="absolute top-2 right-2 z-10 h-6 w-6 p-0 glass hover:glass-glow"
                title="Collapse timeline"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            </>
          )}
          {topCollapsed && (
            <div className="h-full flex items-center justify-center glass">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTopCollapse}
                className="gap-2 glass-glow"
              >
                <ChevronDown className="h-4 w-4" />
                <span className="text-sm">Show Timeline</span>
              </Button>
            </div>
          )}
        </ResizablePanel>

        {/* Resizable Handle */}
        {!topCollapsed && !bottomCollapsed && (
          <ResizableHandle 
            className={cn(
              'relative h-1 bg-border/50 hover:bg-primary/50 transition-colors',
              'cursor-row-resize group'
            )}
          >
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
          </ResizableHandle>
        )}

        {/* Bottom Panel */}
        <ResizablePanel
          defaultSize={bottomCollapsed ? 0 : sizes[1]}
          minSize={bottomCollapsed ? 0 : minBottomSize}
          maxSize={topCollapsed ? 100 : 100 - minTopSize}
          collapsible
          className="relative"
        >
          {!bottomCollapsed && (
            <>
              {bottomPanel}
              {/* Collapse button - top right */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBottomCollapse}
                className="absolute top-2 right-2 z-10 h-6 w-6 p-0 glass hover:glass-glow"
                title="Collapse mixer"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </>
          )}
          {bottomCollapsed && (
            <div className="h-full flex items-center justify-center glass">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBottomCollapse}
                className="gap-2 glass-glow"
              >
                <ChevronUp className="h-4 w-4" />
                <span className="text-sm">Show Mixer</span>
              </Button>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
