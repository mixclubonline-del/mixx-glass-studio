/**
 * Timeline Toolbar - 8 professional cursor tools
 * Selection, Range, Split, Trim, Fade, Pencil, Zoom, Multi-Tool
 */

import React from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { 
  MousePointer2, 
  Square, 
  Scissors, 
  MoveHorizontal, 
  SigmaSquare,
  Pencil,
  ZoomIn,
  Move
} from 'lucide-react';

export type CursorTool = 'select' | 'range' | 'split' | 'trim' | 'fade' | 'pencil' | 'zoom' | 'multi';

export const TimelineToolbar: React.FC = () => {
  const { currentTool, setCurrentTool } = useTimelineStore();
  
  const tools: { id: CursorTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer2 size={16} />, label: 'Selection', shortcut: 'V' },
    { id: 'range', icon: <Square size={16} />, label: 'Range', shortcut: 'R' },
    { id: 'split', icon: <Scissors size={16} />, label: 'Split', shortcut: 'B' },
    { id: 'trim', icon: <MoveHorizontal size={16} />, label: 'Trim', shortcut: 'T' },
    { id: 'fade', icon: <SigmaSquare size={16} />, label: 'Fade', shortcut: 'F' },
    { id: 'pencil', icon: <Pencil size={16} />, label: 'Pencil', shortcut: 'P' },
    { id: 'zoom', icon: <ZoomIn size={16} />, label: 'Zoom', shortcut: 'Z' },
    { id: 'multi', icon: <Move size={16} />, label: 'Multi-Tool', shortcut: 'Cmd+Shift' }
  ];
  
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for multi-tool (Cmd/Ctrl + Shift)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && currentTool !== 'multi') {
        setCurrentTool('multi');
        return;
      }
      
      // Single key shortcuts
      const keyMap: Record<string, CursorTool> = {
        'v': 'select',
        'r': 'range',
        'b': 'split',
        't': 'trim',
        'f': 'fade',
        'p': 'pencil',
        'z': 'zoom'
      };
      
      const tool = keyMap[e.key.toLowerCase()];
      if (tool && !e.metaKey && !e.ctrlKey) {
        setCurrentTool(tool);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Release multi-tool when Cmd/Ctrl + Shift is released
      if (currentTool === 'multi' && (!e.metaKey && !e.ctrlKey || !e.shiftKey)) {
        setCurrentTool('select');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentTool, setCurrentTool]);
  
  return (
    <div className="flex items-center gap-1 glass rounded-lg p-1.5">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setCurrentTool(tool.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all group relative ${
            currentTool === tool.id
              ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.icon}
          <span className="text-xs font-medium hidden lg:inline">{tool.label}</span>
          
          {/* Tooltip with shortcut */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {tool.label} ({tool.shortcut})
          </div>
        </button>
      ))}
    </div>
  );
};
