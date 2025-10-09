/**
 * Mixer Panel - Bottom mixer view with channel strips
 */

import { useState } from 'react';
import { ChannelFader } from './ChannelFader';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelState {
  id: string;
  name: string;
  value: number;
  muted: boolean;
  solo: boolean;
  record: boolean;
  color: string;
}

const INITIAL_CHANNELS: ChannelState[] = [
  { id: '1', name: 'Bar 1', value: 75, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '2', name: 'Bar 2', value: 45, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '3', name: 'Bar 3', value: 60, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '4', name: 'Bar 4', value: 70, muted: false, solo: false, record: false, color: 'hsl(280, 60%, 50%)' },
  { id: '5', name: 'Bar 5', value: 75, muted: false, solo: false, record: false, color: 'hsl(280, 60%, 50%)' },
  { id: '6', name: 'Bar 6', value: 55, muted: false, solo: false, record: false, color: 'hsl(280, 60%, 50%)' },
  { id: '7', name: 'Bar 7', value: 50, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '8', name: 'Bar 8', value: 65, muted: false, solo: false, record: false, color: 'hsl(280, 60%, 50%)' },
  { id: '9', name: 'Bar 9', value: 40, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '10', name: 'Bar 10', value: 70, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '11', name: 'Bar 11', value: 55, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '12', name: 'Bar 12', value: 80, muted: false, solo: false, record: false, color: 'hsl(200, 70%, 50%)' },
  { id: '13', name: 'Bar 13', value: 90, muted: false, solo: false, record: false, color: 'hsl(280, 60%, 50%)' },
];

export function MixerPanel() {
  const [channels, setChannels] = useState<ChannelState[]>(INITIAL_CHANNELS);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const updateChannel = (id: string, updates: Partial<ChannelState>) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };
  
  if (!isExpanded) {
    return (
      <div className="h-12 border-t border-border/50 bg-muted/30 flex items-center justify-center">
        <button
          onClick={() => setIsExpanded(true)}
          className="px-4 py-1 rounded hover:bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ChevronUp className="w-4 h-4" />
          Show Mixer
        </button>
      </div>
    );
  }
  
  return (
    <div className="h-80 border-t border-border/50 bg-background flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center justify-between px-4">
        <div className="text-sm font-medium">Mixer</div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 rounded hover:bg-muted/50"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      {/* Channel Strips */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex items-end gap-4 px-8 py-4">
          {channels.map((channel) => (
            <ChannelFader
              key={channel.id}
              value={channel.value}
              color={channel.color}
              muted={channel.muted}
              solo={channel.solo}
              record={channel.record}
              label={channel.name}
              onChange={(value) => updateChannel(channel.id, { value })}
              onMuteToggle={() => updateChannel(channel.id, { muted: !channel.muted })}
              onSoloToggle={() => updateChannel(channel.id, { solo: !channel.solo })}
              onRecordToggle={() => updateChannel(channel.id, { record: !channel.record })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
