/**
 * Insert Slot - Single plugin insert slot
 */

import React from 'react';
import { Plus, X, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsertSlotProps {
  slotNumber: number;
  pluginName?: string;
  pluginId?: string;
  bypass: boolean;
  onPluginClick: () => void;
  onAddPlugin: () => void;
  onRemovePlugin: () => void;
  onBypassToggle: () => void;
}

export const InsertSlot: React.FC<InsertSlotProps> = ({
  slotNumber,
  pluginName,
  pluginId,
  bypass,
  onPluginClick,
  onAddPlugin,
  onRemovePlugin,
  onBypassToggle,
}) => {
  const isEmpty = !pluginId;
  
  return (
    <div
      className={cn(
        "relative group h-8 px-2 rounded border transition-all",
        isEmpty 
          ? "border-border/30 bg-background/20 hover:border-primary/30 hover:bg-background/30 cursor-pointer"
          : bypass
          ? "border-muted bg-muted/20"
          : "border-primary/40 bg-primary/5 hover:border-primary/60"
      )}
      onClick={isEmpty ? onAddPlugin : onPluginClick}
    >
      <div className="flex items-center justify-between h-full">
        {/* Slot number */}
        <span className="text-[9px] text-muted-foreground font-mono w-4">
          {slotNumber}
        </span>
        
        {isEmpty ? (
          <Plus size={12} className="text-muted-foreground" />
        ) : (
          <>
            {/* Plugin name */}
            <span className={cn(
              "text-[10px] font-medium truncate flex-1 mx-1",
              bypass ? "text-muted-foreground" : "text-foreground"
            )}>
              {pluginName}
            </span>
            
            {/* Controls (show on hover) */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBypassToggle();
                }}
                className={cn(
                  "p-0.5 rounded transition-colors",
                  bypass 
                    ? "bg-muted/50 text-muted-foreground hover:bg-muted" 
                    : "hover:bg-primary/20 text-primary"
                )}
                title="Bypass"
              >
                <Power size={10} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePlugin();
                }}
                className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove"
              >
                <X size={10} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
