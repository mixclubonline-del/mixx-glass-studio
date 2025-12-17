/**
 * useBloomActions Hook
 * 
 * Centralizes all actions triggered by the AURA Bloom Menu.
 * Subscribes to bloom signals from the flow event bus and
 * executes corresponding DAW functions.
 */

import { useEffect, useCallback } from 'react';
import { subscribeToFlow, FlowSignal } from '../../state/flowSignals';

export interface BloomActionHandlers {
  // Project actions
  onSaveProject?: () => void;
  onNewProject?: () => void;
  onOpenProject?: () => void;
  
  // Import/Export actions
  onImportAudio?: () => void;
  onShowExport?: () => void;
  
  // View actions
  onToggleMixer?: () => void;
  onOpenPluginBrowser?: () => void;
  onOpenSettings?: () => void;
  
  // Transport actions
  onToggleRecord?: () => void;
  onPlay?: () => void;
  onStop?: () => void;
  
  // AI actions
  onOpenAIHub?: () => void;
  
  // Other actions
  onOpenHelp?: () => void;
  onOpenLearn?: () => void;
  onConnectOnline?: () => void;
  onStartCollab?: () => void;
}

/**
 * Hook to handle bloom menu action signals
 */
export function useBloomActions(handlers: BloomActionHandlers) {
  const handleBloomSignal = useCallback((signal: FlowSignal) => {
    if (signal.channel !== 'bloom') return;
    
    const { action } = signal.payload as { action: string };
    
    console.log('[BloomActions] Received action:', action);
    
    switch (action) {
      case 'project:save':
        handlers.onSaveProject?.();
        break;
      case 'project:new':
        handlers.onNewProject?.();
        break;
      case 'project:open':
        handlers.onOpenProject?.();
        break;
      case 'importAudio':
        handlers.onImportAudio?.();
        break;
      case 'export:show':
        handlers.onShowExport?.();
        break;
      case 'view:mixer':
        handlers.onToggleMixer?.();
        break;
      case 'plugins:browser:open':
        handlers.onOpenPluginBrowser?.();
        break;
      case 'settings:open':
        handlers.onOpenSettings?.();
        break;
      case 'transport:record':
        handlers.onToggleRecord?.();
        break;
      case 'transport:play':
        handlers.onPlay?.();
        break;
      case 'transport:stop':
        handlers.onStop?.();
        break;
      case 'ai:hub:open':
        handlers.onOpenAIHub?.();
        break;
      case 'help:open':
        handlers.onOpenHelp?.();
        break;
      case 'learn:open':
        handlers.onOpenLearn?.();
        break;
      case 'online:connect':
        handlers.onConnectOnline?.();
        break;
      case 'collab:start':
        handlers.onStartCollab?.();
        break;
      default:
        console.log('[BloomActions] Unhandled action:', action);
    }
  }, [handlers]);
  
  // Subscribe to flow signals on mount
  useEffect(() => {
    const unsubscribe = subscribeToFlow(handleBloomSignal);
    return () => {
      unsubscribe();
    };
  }, [handleBloomSignal]);
}

export default useBloomActions;
