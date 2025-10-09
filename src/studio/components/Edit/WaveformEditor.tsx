/**
 * Waveform Editor - Sample-accurate editing view
 */

import React from 'react';
import { Scissors, Copy, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

export const WaveformEditor: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Editor toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 glass border-b border-border/30">
        <button className="p-1.5 rounded hover:bg-muted/50 transition-colors" title="Cut">
          <Scissors size={16} />
        </button>
        <button className="p-1.5 rounded hover:bg-muted/50 transition-colors" title="Copy">
          <Copy size={16} />
        </button>
        <button className="p-1.5 rounded hover:bg-muted/50 transition-colors text-destructive" title="Delete">
          <Trash2 size={16} />
        </button>
        
        <div className="w-px h-4 bg-border/50 mx-2" />
        
        <button className="p-1.5 rounded hover:bg-muted/50 transition-colors" title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="p-1.5 rounded hover:bg-muted/50 transition-colors" title="Zoom Out">
          <ZoomOut size={16} />
        </button>
      </div>
      
      {/* Editor content */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Edit3 className="mx-auto mb-3 opacity-50" size={48} />
          <p className="text-lg mb-2">Sample Editor</p>
          <p className="text-sm">Select a region to edit</p>
        </div>
      </div>
    </div>
  );
};

function Edit3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
