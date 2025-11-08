/**
 * Advanced Routing Matrix - Professional audio routing with sidechaining
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  GitBranch, 
  Link, 
  Unlink,
  Volume2,
  X,
  Save,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RoutingConnection {
  from: string; // track ID
  to: string; // bus ID or track ID
  type: 'send' | 'sidechain' | 'insert';
  amount: number; // 0-1
  preFader: boolean;
}

interface AdvancedRoutingMatrixProps {
  tracks: Array<{ id: string; name: string; type: string }>;
  buses: Array<{ id: string; name: string }>;
  onClose?: () => void;
}

export const AdvancedRoutingMatrix: React.FC<AdvancedRoutingMatrixProps> = ({
  tracks,
  buses,
  onClose,
}) => {
  const [connections, setConnections] = useState<RoutingConnection[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ from: string; to: string } | null>(null);

  const getConnection = (from: string, to: string): RoutingConnection | undefined => {
    return connections.find((c) => c.from === from && c.to === to);
  };

  const hasConnection = (from: string, to: string): boolean => {
    return connections.some((c) => c.from === from && c.to === to);
  };

  const toggleConnection = (from: string, to: string, type: 'send' | 'sidechain') => {
    const existing = getConnection(from, to);
    
    if (existing) {
      // Remove connection
      setConnections((prev) => prev.filter((c) => !(c.from === from && c.to === to)));
      toast.info('Connection removed');
    } else {
      // Add connection
      const newConnection: RoutingConnection = {
        from,
        to,
        type,
        amount: 0.7,
        preFader: false,
      };
      setConnections((prev) => [...prev, newConnection]);
      toast.success(`${type} connection added`);
    }
  };

  const adjustAmount = (from: string, to: string, delta: number) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.from === from && c.to === to
          ? { ...c, amount: Math.max(0, Math.min(1, c.amount + delta)) }
          : c
      )
    );
  };

  const togglePreFader = (from: string, to: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.from === from && c.to === to ? { ...c, preFader: !c.preFader } : c
      )
    );
  };

  const clearAllConnections = () => {
    setConnections([]);
    toast.info('All connections cleared');
  };

  const allDestinations = [...buses, ...tracks];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Advanced Routing Matrix</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={clearAllConnections}>
            <Unlink className="h-3 w-3 mr-1" />
            Clear All
          </Button>
          <Button size="sm" variant="default" onClick={onClose}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-2 border-b border-border/30 bg-muted/20 text-xs text-muted-foreground">
        <span className="text-primary font-medium">Left-click:</span> Send • 
        <span className="text-primary font-medium ml-2">Right-click:</span> Sidechain • 
        <span className="text-primary font-medium ml-2">Scroll:</span> Adjust amount • 
        <span className="text-primary font-medium ml-2">Middle-click:</span> Pre/Post fader
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-auto p-4">
        <div className="inline-block min-w-full">
          {/* Column Headers */}
          <div className="flex mb-2">
            <div className="w-32 flex-shrink-0" /> {/* Empty corner */}
            {allDestinations.map((dest) => (
              <div
                key={dest.id}
                className="w-16 flex-shrink-0 text-center text-xs font-medium text-muted-foreground px-1"
              >
                <div className="transform -rotate-45 origin-bottom-left whitespace-nowrap">
                  {dest.name}
                </div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center mb-1">
              {/* Row Header */}
              <div className="w-32 flex-shrink-0 text-xs font-medium truncate pr-2">
                {track.name}
              </div>

              {/* Cells */}
              {allDestinations.map((dest) => {
                const connection = getConnection(track.id, dest.id);
                const isConnected = hasConnection(track.id, dest.id);
                const isSelf = track.id === dest.id;

                return (
                  <div
                    key={dest.id}
                    className={cn(
                      "w-16 h-12 flex-shrink-0 border border-border/30 m-0.5 transition-all",
                      isSelf && "bg-muted/30 cursor-not-allowed",
                      !isSelf && "cursor-pointer hover:border-primary/50",
                      isConnected && connection?.type === 'send' && "bg-primary/30 border-primary",
                      isConnected && connection?.type === 'sidechain' && "bg-purple-500/30 border-purple-500"
                    )}
                    onClick={() => !isSelf && toggleConnection(track.id, dest.id, 'send')}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!isSelf) toggleConnection(track.id, dest.id, 'sidechain');
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      if (isConnected) {
                        adjustAmount(track.id, dest.id, e.deltaY > 0 ? -0.1 : 0.1);
                      }
                    }}
                    onAuxClick={(e) => {
                      e.preventDefault();
                      if (isConnected && e.button === 1) {
                        togglePreFader(track.id, dest.id);
                      }
                    }}
                  >
                    {isConnected && connection && (
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        {/* Connection Icon */}
                        {connection.type === 'send' && (
                          <Share2 className="h-4 w-4 text-primary" />
                        )}
                        {connection.type === 'sidechain' && (
                          <Link className="h-4 w-4 text-purple-400" />
                        )}
                        
                        {/* Amount */}
                        <div className="text-[9px] font-mono text-white">
                          {Math.round(connection.amount * 100)}%
                        </div>

                        {/* Pre-fader indicator */}
                        {connection.preFader && (
                          <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-yellow-400" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border/30 bg-muted/20">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/30 border border-primary rounded" />
            <span>Send</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500/30 border border-purple-500 rounded" />
            <span>Sidechain</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span>Pre-fader</span>
          </div>
          <div className="ml-auto text-muted-foreground">
            {connections.length} active connections
          </div>
        </div>
      </div>
    </div>
  );
};
