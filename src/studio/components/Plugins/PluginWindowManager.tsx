/**
 * Plugin Window Manager - Manages multiple open plugin windows
 * Phase 5: Enhanced with pluginStore integration
 */

import React, { useCallback } from 'react';
import { PluginWindow } from './PluginWindow';
import { PluginManager } from '@/audio/plugins/PluginManager';
import { PluginSkinHost } from './PluginSkinHost';
import { pluginSkinMappings } from '@/audio/plugins/registry/pluginSkinMappings';
import { usePluginStore } from '@/store/pluginStore';

interface PluginWindowManagerProps {
  onParameterChange: (trackId: string, slotNumber: number, paramName: string, value: number) => void;
}

export const PluginWindowManager: React.FC<PluginWindowManagerProps> = ({
  onParameterChange,
}) => {
  const { windows, closeWindow, bringToFront, getInstance } = usePluginStore();

  return (
    <>
      {Array.from(windows.values()).map((window) => {
        const plugin = PluginManager.getMetadata(window.pluginId);
        if (!plugin) return null;

        const instance = getInstance(window.trackId, window.slotNumber);
        
        // Check if plugin has a skin and mappings
        const hasSkin = plugin.skinPath && pluginSkinMappings[window.pluginId];
        const skinImageUrl = plugin.skinPath ? `/src/assets/plugins/${plugin.skinPath}` : '';
        
        // Build parameter list from mappings with actual values from store
        const parameters = hasSkin 
          ? pluginSkinMappings[window.pluginId].map(mapping => ({
              ...mapping,
              value: instance?.parameters[mapping.name] ?? 50 // Use stored value or default
            }))
          : [];

        return (
          <div
            key={window.id}
            style={{
              position: 'fixed',
              zIndex: window.zIndex,
              pointerEvents: 'auto',
            }}
            onClick={() => bringToFront(window.id)}
          >
            <PluginWindow
              title={`${plugin.name} - ${window.trackId.slice(0, 8)} / Slot ${window.slotNumber}`}
              onClose={() => closeWindow(window.id)}
              defaultWidth={hasSkin ? 600 : 500}
              defaultHeight={hasSkin ? 500 : 400}
            >
              {hasSkin ? (
                <PluginSkinHost
                  pluginId={window.pluginId}
                  skinImageUrl={skinImageUrl}
                  parameters={parameters}
                  onParameterChange={(paramName, value) => 
                    onParameterChange(window.trackId, window.slotNumber, paramName, value)
                  }
                />
              ) : (
                <div className="p-4 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Plugin: {plugin.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Track: {window.trackId} | Slot: {window.slotNumber}
                  </div>
                  <div className="text-xs text-muted-foreground italic">
                    Plugin UI coming soon - Parameter controls will appear here
                  </div>
                  {instance && Object.keys(instance.parameters).length > 0 && (
                    <div className="text-xs">
                      <div className="font-semibold mb-1">Current Parameters:</div>
                      {Object.entries(instance.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span>{value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </PluginWindow>
          </div>
        );
      })}
    </>
  );
};
