/**
 * Region Context Menu - Right-click operations for regions
 */

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { Region } from '@/types/timeline';
import { Copy, Scissors, Volume2, RotateCcw, Lock, Unlock, Palette, FileDown } from 'lucide-react';

interface RegionContextMenuProps {
  region: Region;
  children: React.ReactNode;
  onDuplicate: (regionId: string) => void;
  onSplit: (regionId: string) => void;
  onNormalize: (regionId: string) => void;
  onReverse: (regionId: string) => void;
  onLock: (regionId: string, locked: boolean) => void;
  onExport: (regionId: string) => void;
  onColorChange: (regionId: string, color: string) => void;
  onRename: (regionId: string) => void;
  onChopSample?: (regionId: string) => void;
}

export const RegionContextMenu: React.FC<RegionContextMenuProps> = ({
  region,
  children,
  onDuplicate,
  onSplit,
  onNormalize,
  onReverse,
  onLock,
  onExport,
  onColorChange,
  onRename,
  onChopSample,
}) => {
  const colors = [
    { name: 'Red', value: 'hsl(0, 70%, 50%)' },
    { name: 'Orange', value: 'hsl(30, 70%, 50%)' },
    { name: 'Yellow', value: 'hsl(60, 70%, 50%)' },
    { name: 'Green', value: 'hsl(120, 70%, 50%)' },
    { name: 'Blue', value: 'hsl(210, 70%, 50%)' },
    { name: 'Purple', value: 'hsl(270, 70%, 50%)' },
    { name: 'Pink', value: 'hsl(330, 70%, 50%)' },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onDuplicate(region.id)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate (D)
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onSplit(region.id)}>
          <Scissors className="mr-2 h-4 w-4" />
          Split at Playhead (S)
        </ContextMenuItem>
        
        {onChopSample && (
          <ContextMenuItem onClick={() => onChopSample(region.id)}>
            <Scissors className="mr-2 h-4 w-4" />
            Chop Sample...
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onNormalize(region.id)}>
          <Volume2 className="mr-2 h-4 w-4" />
          Normalize
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onReverse(region.id)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reverse
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onLock(region.id, !region.locked)}>
          {region.locked ? (
            <Unlock className="mr-2 h-4 w-4" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {region.locked ? 'Unlock' : 'Lock'}
        </ContextMenuItem>
        
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            Change Color
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {colors.map((color) => (
              <ContextMenuItem
                key={color.name}
                onClick={() => onColorChange(region.id, color.value)}
              >
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: color.value }}
                />
                {color.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onExport(region.id)}>
          <FileDown className="mr-2 h-4 w-4" />
          Export Region
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
