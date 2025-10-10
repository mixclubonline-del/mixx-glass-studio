/**
 * I/O Routing Panel - Input/Output routing controls
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export interface TrackIO {
  inputSource: 'file' | 'interface' | 'bus';
  inputChannel: number;
  outputDestination: 'master' | string; // 'master' or bus ID
  directMonitoring: boolean;
}

interface IORoutingPanelProps {
  trackId: string;
  trackName: string;
  io: TrackIO;
  availableBuses: Array<{ id: string; name: string }>;
  onIOChange: (trackId: string, io: Partial<TrackIO>) => void;
}

export const IORoutingPanel: React.FC<IORoutingPanelProps> = ({
  trackId,
  trackName,
  io,
  availableBuses,
  onIOChange,
}) => {
  return (
    <div className="glass-glow rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">I/O Routing</h3>
        <span className="text-xs text-muted-foreground">{trackName}</span>
      </div>
      
      {/* Input Routing */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ArrowDownToLine size={14} className="text-[hsl(var(--neon-blue))]" />
          <Label className="text-xs font-medium">Input Source</Label>
        </div>
        
        <Select
          value={io.inputSource}
          onValueChange={(value: 'file' | 'interface' | 'bus') => 
            onIOChange(trackId, { inputSource: value })
          }
        >
          <SelectTrigger className="glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="file">Audio File</SelectItem>
            <SelectItem value="interface">Audio Interface</SelectItem>
            <SelectItem value="bus">Bus/Aux</SelectItem>
          </SelectContent>
        </Select>
        
        {io.inputSource === 'interface' && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Channel</Label>
            <Select
              value={io.inputChannel.toString()}
              onValueChange={(value) => 
                onIOChange(trackId, { inputChannel: parseInt(value) })
              }
            >
              <SelectTrigger className="glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((ch) => (
                  <SelectItem key={ch} value={ch.toString()}>
                    Input {ch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Output Routing */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ArrowUpFromLine size={14} className="text-[hsl(var(--neon-pink))]" />
          <Label className="text-xs font-medium">Output Destination</Label>
        </div>
        
        <Select
          value={io.outputDestination}
          onValueChange={(value) => 
            onIOChange(trackId, { outputDestination: value })
          }
        >
          <SelectTrigger className="glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="master">Master Bus</SelectItem>
            {availableBuses.map((bus) => (
              <SelectItem key={bus.id} value={bus.id}>
                {bus.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Direct Monitoring */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <Label className="text-xs font-medium">Direct Monitoring</Label>
        <Switch
          checked={io.directMonitoring}
          onCheckedChange={(checked) => 
            onIOChange(trackId, { directMonitoring: checked })
          }
        />
      </div>
    </div>
  );
};
