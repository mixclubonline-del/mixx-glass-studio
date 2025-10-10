/**
 * Collapsible Timeline Toolbar - Can minimize to save space
 */

import React from 'react';
import { 
  MousePointer, 
  SplitSquareVertical, 
  Scissors, 
  Minimize2, 
  Maximize2,
  Pencil,
  ZoomIn,
  Grid3x3
} from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';
import { useViewStore } from '@/store/viewStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const CollapsibleTimelineToolbar: React.FC = () => {
  const { currentTool, setCurrentTool } = useTimelineStore();
  const { isPanelOpen, togglePanel } = useViewStore();
  const isCollapsed = !isPanelOpen.toolbar;
  
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select', shortcut: 'V' },
    { id: 'range' as const, icon: SplitSquareVertical, label: 'Range', shortcut: 'R' },
    { id: 'split' as const, icon: Scissors, label: 'Split', shortcut: 'S' },
    { id: 'pencil' as const, icon: Pencil, label: 'Pencil', shortcut: 'D' },
    { id: 'zoom' as const, icon: ZoomIn, label: 'Zoom', shortcut: 'Z' },
    { id: 'multi' as const, icon: Grid3x3, label: 'Multi', shortcut: 'Cmd+Shift' },
  ];
  
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      const tool = tools.find(t => t.shortcut.toLowerCase().includes(key));
      
      if (tool && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCurrentTool(tool.id);
      }
      
      // Multi-tool with Cmd+Shift
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        setCurrentTool('multi');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTool]);
  
  if (isCollapsed) {
    return (
      <div className="absolute top-2 left-2 z-10 glass rounded-lg p-1 flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => togglePanel('toolbar')}
              >
                <Maximize2 size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expand Toolbar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Show current tool icon only */}
        <div className="px-2 py-1 bg-primary/20 rounded text-primary">
          {React.createElement(tools.find(t => t.id === currentTool)?.icon || MousePointer, { size: 14 })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass rounded-lg p-2 flex items-center gap-1 border border-border/30">
      <TooltipProvider>
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentTool(tool.id)}
                className="h-8 w-8 p-0"
              >
                <tool.icon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {tool.label} ({tool.shortcut})
            </TooltipContent>
          </Tooltip>
        ))}
        
        <div className="w-px h-6 bg-border/30 mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => togglePanel('toolbar')}
            >
              <Minimize2 size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Collapse Toolbar</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
