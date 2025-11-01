/**
 * Glass Channel Strip - Next-gen mixer channel with glass morphism
 * ALIGNED: Using standard channel width
 */

import React, { useState } from 'react';
import { ChannelState, BusState } from '@/store/mixerStore';
import { Volume2, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { SlimPeakMeter } from '../Metering/SlimPeakMeter';
import { IceFireFader } from '../Controls/IceFireFader';
import { IceFireKnob } from '../Controls/IceFireKnob';
import { InsertRack } from './InsertRack';
import { SendKnobSimple } from './SendKnobSimple';
import { dbToNormalized, normalizedToDb } from '@/studio/utils/TemperatureGradient';
import { PluginInsert } from '@/audio/Track';
import { CHANNEL_WIDTH_DEFAULT } from '@/lib/layout-constants';

interface GlassChannelStripProps {
  channel: ChannelState;
  isSelected: boolean;
  analysers?: { left: AnalyserNode; right: AnalyserNode } | null;
  inserts?: PluginInsert[];
  buses?: BusState[];
  onSelect: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onPanChange: (id: string, pan: number) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onLoadPlugin?: (slotNumber: number, pluginId: string) => void;
  onUnloadPlugin?: (slotNumber: number) => void;
  onBypassPlugin?: (slotNumber: number, bypass: boolean) => void;
  onSendChange?: (busId: string, amount: number) => void;
  onOpenPluginWindow?: (slotNumber: number, pluginId: string) => void;
  onOpenPluginBrowser?: (slotNumber: number) => void;
}

export const GlassChannelStrip: React.FC<GlassChannelStripProps> = ({
  channel,
  isSelected,
  analysers,
  inserts,
  buses,
  onSelect,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onLoadPlugin,
  onUnloadPlugin,
  onBypassPlugin,
  onSendChange,
  onOpenPluginWindow,
  onOpenPluginBrowser,
}) => {
  const [showInserts, setShowInserts] = useState(false);
  const [showSends, setShowSends] = useState(false);
  
  return (
    <div 
      className={`relative flex flex-col h-full glass border border-border/30 overflow-hidden ${
        isSelected 
          ? 'ring-2 ring-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)]' 
          : 'hover:ring-1 hover:ring-primary/30'
      }`}
      style={{
        width: `${CHANNEL_WIDTH_DEFAULT}px`,
        borderLeft: `3px solid ${channel.color}`,
      }}
      onClick={() => onSelect(channel.id)}
    >
      {/* Channel name */}
      <div className="text-[10px] font-medium text-foreground mb-1 truncate text-center px-1">
        {channel.name}
      </div>
      
      {/* Peak meter */}
      <div className="mb-1 flex justify-center">
        <SlimPeakMeter
          analysers={analysers}
          height={100}
          barWidth={3}
          gap={1}
        />
      </div>
      
      {/* Pan knob */}
      <div className="mb-1 flex justify-center">
        <IceFireKnob
          value={(channel.pan + 1) / 2}
          onChange={(value) => onPanChange(channel.id, (value * 2) - 1)}
          size={28}
          label="PAN"
          valueLabel={channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.abs(channel.pan * 100).toFixed(0)}` : `R${(channel.pan * 100).toFixed(0)}`}
          min={-100}
          max={100}
        />
      </div>
      
      {/* Collapsible Insert Rack */}
      {inserts && inserts.length > 0 && (
        <div className="mb-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInserts(!showInserts);
            }}
            className="w-full flex items-center justify-between px-1 py-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>FX</span>
            {showInserts ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          {showInserts && (
            <div className="mt-1 px-1">
              <InsertRack
                inserts={inserts}
                onPluginClick={(slotNumber) => {
                  const insert = inserts.find(i => i.slotNumber === slotNumber);
                  if (insert?.pluginId && onLoadPlugin) {
                    onLoadPlugin(slotNumber, insert.pluginId);
                  }
                }}
                onAddPlugin={(slotNumber) => {
                  if (onOpenPluginBrowser) {
                    onOpenPluginBrowser(slotNumber);
                  }
                }}
                onRemovePlugin={onUnloadPlugin || (() => {})}
                onBypassToggle={(slotNumber) => {
                  const insert = inserts.find(i => i.slotNumber === slotNumber);
                  if (insert && onBypassPlugin) {
                    onBypassPlugin(slotNumber, !insert.bypass);
                  }
                }}
                onDoubleClick={(slotNumber) => {
                  const insert = inserts.find(i => i.slotNumber === slotNumber);
                  if (insert?.pluginId && onOpenPluginWindow) {
                    onOpenPluginWindow(slotNumber, insert.pluginId);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Collapsible Send Controls */}
      {buses && buses.length > 0 && onSendChange && (
        <div className="mb-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSends(!showSends);
            }}
            className="w-full flex items-center justify-between px-1 py-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>SENDS</span>
            {showSends ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          {showSends && (
            <div className="mt-1 space-y-1 max-h-24 overflow-y-auto scrollbar-thin">
              {buses.map((bus) => (
                <SendKnobSimple
                  key={bus.id}
                  busName={bus.name}
                  busColor={bus.color}
                  amount={channel.sends?.get(bus.id) || 0}
                  onAmountChange={(amount) => onSendChange(bus.id, amount)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Fader */}
      <div className="flex-1 flex items-end justify-center mb-1 min-h-0">
        <IceFireFader
          value={channel.volume}
          onChange={(value) => onVolumeChange(channel.id, value)}
          height={180}
          width={12}
          showScale={false}
        />
      </div>
      
      {/* Transport buttons */}
      <div className="flex gap-0.5 justify-center mb-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle(channel.id);
          }}
          className={`p-1 rounded transition-all ${
            channel.muted 
              ? 'bg-destructive/20 text-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.3)]' 
              : 'hover:bg-muted/50 text-muted-foreground'
          }`}
          title="Mute"
        >
          <Volume2 size={11} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSoloToggle(channel.id);
          }}
          className={`p-1 rounded transition-all ${
            channel.solo 
              ? 'bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' 
              : 'hover:bg-muted/50 text-muted-foreground'
          }`}
          title="Solo"
        >
          <Mic size={11} />
        </button>
      </div>
      
      {/* dB readout */}
      <div className="text-[8px] text-center text-muted-foreground mb-1 font-mono">
        {normalizedToDb(channel.volume).toFixed(1)}
      </div>
    </div>
  );
};
