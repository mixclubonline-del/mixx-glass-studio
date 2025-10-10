/**
 * Plugin Window Manager - Manages multiple open plugin windows
 */

import React, { useState, useCallback } from 'react';
import { PluginWindow } from './PluginWindow';
import { useViewStore } from '@/store/viewStore';
import { PluginManager } from '@/audio/plugins/PluginManager';

interface WindowState {
  id: string;
  pluginId: string;
  trackId: string;
  slotNumber: number;
  zIndex: number;
  minimized: boolean;
  position?: { x: number; y: number };
}

export const PluginWindowManager: React.FC = () => {
  const { activePluginId, pluginParams, closeAllPlugins } = useViewStore();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);

  const handleCloseWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    if (activePluginId === windowId) {
      closeAllPlugins();
    }
  }, [activePluginId, closeAllPlugins]);

  const bringToFront = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: nextZIndex }
        : w
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const toggleMinimize = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId
        ? { ...w, minimized: !w.minimized }
        : w
    ));
  }, []);

  // Sync active plugin from store
  React.useEffect(() => {
    if (activePluginId && !windows.find(w => w.id === activePluginId)) {
      const newWindow: WindowState = {
        id: activePluginId,
        pluginId: activePluginId,
        trackId: '', // Should come from context
        slotNumber: 0,
        zIndex: nextZIndex,
        minimized: false,
      };
      setWindows(prev => [...prev, newWindow]);
      setNextZIndex(prev => prev + 1);
    }
  }, [activePluginId, windows, nextZIndex]);

  return (
    <>
      {windows.map(window => {
        const plugin = PluginManager.getMetadata(window.pluginId);
        if (!plugin || window.minimized) return null;

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
              title={plugin.name}
              onClose={() => handleCloseWindow(window.id)}
              defaultWidth={600}
              defaultHeight={400}
            >
              <div className="text-sm text-muted-foreground">
                Plugin content: {plugin.name}
              </div>
            </PluginWindow>
          </div>
        );
      })}
    </>
  );
};
