/**
 * Plugin Chain Manager - Drag-and-drop plugin reordering and chain management
 * Phase 5: Advanced plugin routing
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Copy, Trash2 } from 'lucide-react';
import { usePluginStore } from '@/store/pluginStore';

interface PluginChainManagerProps {
  trackId: string;
  onReorder: (fromSlot: number, toSlot: number) => void;
  onCopy: (slotNumber: number) => void;
  onPaste: (slotNumber: number) => void;
  onDelete: (slotNumber: number) => void;
}

export const PluginChainManager: React.FC<PluginChainManagerProps> = ({
  trackId,
  onReorder,
  onCopy,
  onPaste,
  onDelete
}) => {
  const { instances } = usePluginStore();
  const [copiedSlot, setCopiedSlot] = useState<number | null>(null);
  
  // Get all plugin instances for this track
  const trackPlugins = Array.from(instances.values())
    .filter(instance => instance.trackId === trackId)
    .sort((a, b) => a.slotNumber - b.slotNumber);
  
  if (trackPlugins.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No plugins loaded in chain
      </div>
    );
  }
  
  const handleCopy = (slotNumber: number) => {
    setCopiedSlot(slotNumber);
    onCopy(slotNumber);
  };
  
  const handlePaste = (slotNumber: number) => {
    if (copiedSlot !== null) {
      onPaste(slotNumber);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold mb-3">Plugin Chain</div>
      {trackPlugins.map((plugin, index) => (
        <div 
          key={plugin.slotNumber}
          className="glass p-2 rounded flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {plugin.slotNumber}
            </span>
            <span className="text-sm font-medium">{plugin.pluginId}</span>
            {plugin.bypass && (
              <span className="text-xs text-muted-foreground">(bypassed)</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Move up */}
            {index > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onReorder(plugin.slotNumber, trackPlugins[index - 1].slotNumber)}
              >
                <ArrowUp size={12} />
              </Button>
            )}
            
            {/* Move down */}
            {index < trackPlugins.length - 1 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onReorder(plugin.slotNumber, trackPlugins[index + 1].slotNumber)}
              >
                <ArrowDown size={12} />
              </Button>
            )}
            
            {/* Copy */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleCopy(plugin.slotNumber)}
            >
              <Copy size={12} />
            </Button>
            
            {/* Paste */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              disabled={copiedSlot === null}
              onClick={() => handlePaste(plugin.slotNumber)}
            >
              <Copy size={12} className="rotate-180" />
            </Button>
            
            {/* Delete */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(plugin.slotNumber)}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
