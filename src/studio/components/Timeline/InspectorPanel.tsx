/**
 * Inspector Panel - Shows properties of selected track
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTracksStore } from '@/store/tracksStore';
import { Info, Volume2, Activity } from 'lucide-react';

interface InspectorPanelProps {
  selectedTrackId?: string;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ selectedTrackId }) => {
  const { tracks } = useTracksStore();
  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  if (!selectedTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Info size={32} className="text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Select a track to view its properties
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Track Info */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Track Info</h4>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={selectedTrack.name}
                className="h-8 text-sm mt-1"
                readOnly
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Color</Label>
              <div
                className="w-8 h-8 rounded border border-border"
                style={{ backgroundColor: selectedTrack.color }}
              />
            </div>
          </div>
        </div>

        {/* Track State */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">State</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Muted</span>
              <span className={selectedTrack.muted ? 'text-accent' : 'text-muted-foreground'}>
                {selectedTrack.muted ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Solo</span>
              <span className={selectedTrack.solo ? 'text-primary' : 'text-muted-foreground'}>
                {selectedTrack.solo ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Record Armed</span>
              <span className={selectedTrack.recordArmed ? 'text-destructive' : 'text-muted-foreground'}>
                {selectedTrack.recordArmed ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Routing */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Activity size={12} />
            Routing
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Input</span>
              <span>-</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Output</span>
              <span>Master</span>
            </div>
          </div>
        </div>

        {/* Effects */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Volume2 size={12} />
            Insert Effects
          </h4>
          {selectedTrack.inserts && selectedTrack.inserts.length > 0 ? (
            <div className="space-y-1">
              {selectedTrack.inserts.map((insert, index) => (
                <div
                  key={index}
                  className="p-2 rounded bg-background/50 text-xs"
                >
                  {insert.pluginId || 'Empty Slot'}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No effects loaded</p>
          )}
        </div>

        {/* Region Count */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Regions</h4>
          <p className="text-sm">{selectedTrack.regions?.length || 0} region(s)</p>
        </div>
      </div>
    </ScrollArea>
  );
};
