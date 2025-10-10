/**
 * Plugin Window Manager - Manages multiple open plugin windows
 */

import React, { useState, useCallback } from 'react';
import { PluginWindow } from './PluginWindow';
import { PluginManager } from '@/audio/plugins/PluginManager';
import { PluginSkinHost } from './PluginSkinHost';
import { newPluginParameters } from '@/audio/plugins/registry/newPlugins';
import { pluginSkinMappings, SkinParameterMapping } from '@/audio/plugins/registry/pluginSkinMappings';

interface PluginWindowManagerProps {
  openWindows: Map<string, { trackId: string; slotNumber: number; pluginId: string }>;
  onCloseWindow: (windowId: string) => void;
  onParameterChange: (trackId: string, slotNumber: number, paramName: string, value: number) => void;
}

export const PluginWindowManager: React.FC<PluginWindowManagerProps> = ({
  openWindows,
  onCloseWindow,
  onParameterChange,
}) => {
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [windowZIndexes, setWindowZIndexes] = useState<Map<string, number>>(new Map());

  const bringToFront = useCallback((windowId: string) => {
    setWindowZIndexes(prev => {
      const newMap = new Map(prev);
      newMap.set(windowId, nextZIndex);
      return newMap;
    });
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  return (
    <>
      {Array.from(openWindows.entries()).map(([windowId, windowData]) => {
        const plugin = PluginManager.getMetadata(windowData.pluginId);
        if (!plugin) return null;

        const zIndex = windowZIndexes.get(windowId) || 1000;
        
        // Check if plugin has a skin and mappings
        const hasSkin = plugin.skinPath && pluginSkinMappings[windowData.pluginId];
        const skinImageUrl = plugin.skinPath ? `/src/assets/plugins/${plugin.skinPath}` : '';
        
        // Build parameter list from mappings
        const parameters = hasSkin 
          ? pluginSkinMappings[windowData.pluginId].map(mapping => ({
              ...mapping,
              value: 50 as number // Default value, would come from actual plugin state
            }))
          : [];

        return (
          <div
            key={windowId}
            style={{
              position: 'fixed',
              zIndex,
              pointerEvents: 'auto',
            }}
            onClick={() => bringToFront(windowId)}
          >
            <PluginWindow
              title={`${plugin.name} - Track ${windowData.trackId.slice(0, 8)} / Slot ${windowData.slotNumber}`}
              onClose={() => onCloseWindow(windowId)}
              defaultWidth={hasSkin ? 600 : 500}
              defaultHeight={hasSkin ? 500 : 400}
            >
              {hasSkin ? (
                <PluginSkinHost
                  pluginId={windowData.pluginId}
                  skinImageUrl={skinImageUrl}
                  parameters={parameters}
                  onParameterChange={(paramName, value) => 
                    onParameterChange(windowData.trackId, windowData.slotNumber, paramName, value)
                  }
                />
              ) : (
                <div className="p-4 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Plugin: {plugin.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Track: {windowData.trackId} | Slot: {windowData.slotNumber}
                  </div>
                  <div className="text-xs text-muted-foreground italic">
                    Plugin UI coming soon - Parameter controls will appear here
                  </div>
                </div>
              )}
            </PluginWindow>
          </div>
        );
      })}
    </>
  );
};
