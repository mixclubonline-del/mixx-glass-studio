/**
 * Contextual Mixer Panel - Slides up from bottom when needed
 */

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewStore } from '@/store/viewStore';
import { MixerChannel } from '@/studio/components/Mixer/MixerChannel';
import { useTracksStore } from '@/store/tracksStore';

export const ContextualMixerPanel: React.FC = () => {
  const isPanelOpen = useViewStore((state) => state.isPanelOpen.mixer);
  const togglePanel = useViewStore((state) => state.togglePanel);
  const tracks = useTracksStore((state) => state.tracks);

  if (!isPanelOpen) return null;

  return (
    <div className="fixed bottom-[64px] left-0 right-0 h-[400px] bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl animate-slide-in-bottom z-50">
      {/* Header */}
      <div className="h-12 border-b border-border/30 flex items-center justify-between px-4">
        <h3 className="text-sm font-medium">Mixer Console</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('mixer')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Mixer Channels */}
      <div className="h-[calc(100%-48px)] overflow-x-auto overflow-y-hidden">
        <div className="flex gap-2 p-4 h-full">
          <div className="text-sm text-muted-foreground p-4">
            Mixer channels loading...
          </div>
        </div>
      </div>
    </div>
  );
};
