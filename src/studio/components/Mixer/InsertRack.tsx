/**
 * Insert Rack - Vertical list of 8 insert slots
 * Phase 4: Enhanced with plugin name display and visual feedback
 */

import React from 'react';
import { InsertSlot } from './InsertSlot';
import { PluginInsert } from '@/audio/Track';
import { PluginManager } from '@/audio/plugins/PluginManager';

interface InsertRackProps {
  inserts: PluginInsert[];
  onPluginClick: (slotNumber: number) => void;
  onAddPlugin: (slotNumber: number) => void;
  onRemovePlugin: (slotNumber: number) => void;
  onBypassToggle: (slotNumber: number) => void;
  onDoubleClick?: (slotNumber: number) => void;
}

export const InsertRack: React.FC<InsertRackProps> = ({
  inserts,
  onPluginClick,
  onAddPlugin,
  onRemovePlugin,
  onBypassToggle,
  onDoubleClick,
}) => {
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground font-medium mb-1 px-1 uppercase tracking-wider">
        Insert Chain
      </div>
      {inserts.map((insert) => {
        // Get plugin metadata to show real name
        const pluginMeta = insert.pluginId ? PluginManager.getMetadata(insert.pluginId) : null;
        const displayName = pluginMeta?.name || insert.pluginId || undefined;
        
        return (
          <InsertSlot
            key={insert.slotNumber}
            slotNumber={insert.slotNumber}
            pluginName={displayName}
            pluginId={insert.pluginId || undefined}
            bypass={insert.bypass}
            onPluginClick={() => onPluginClick(insert.slotNumber)}
            onAddPlugin={() => onAddPlugin(insert.slotNumber)}
            onRemovePlugin={() => onRemovePlugin(insert.slotNumber)}
            onBypassToggle={() => onBypassToggle(insert.slotNumber)}
            onDoubleClick={onDoubleClick ? () => onDoubleClick(insert.slotNumber) : undefined}
          />
        );
      })}
    </div>
  );
};
