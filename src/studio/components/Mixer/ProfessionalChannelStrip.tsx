/**
 * Professional Channel Strip - Complete DAW-style channel strip
 */

import React, { useState } from 'react';
import { ChannelState, BusState } from '@/store/mixerStore';
import { PluginInsert } from '@/audio/Track';
import { EQParams, CompressorParams } from '@/types/audio';
import { 
  Volume2, Mic, Circle, Settings, ChevronDown, ChevronUp,
  Maximize2, Power, Plus, Edit3
} from 'lucide-react';
import { ProfessionalPeakMeter } from '../Metering/ProfessionalPeakMeter';
import { IceFireFader } from '../Controls/IceFireFader';
import { IceFireKnob } from '../Controls/IceFireKnob';
import { InsertRack } from './InsertRack';
import { SendKnobSimple } from './SendKnobSimple';
import { normalizedToDb } from '@/studio/utils/TemperatureGradient';
import { cn } from '@/lib/utils';

interface ProfessionalChannelStripProps {
  channel: ChannelState;
  isSelected: boolean;
  inserts?: PluginInsert[];
  buses?: BusState[];
  viewMode?: 'narrow' | 'medium' | 'wide';
  sectionsExpanded?: {
    inserts: boolean;
    sends: boolean;
    io: boolean;
    eq: boolean;
    dynamics: boolean;
  };
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
  onSectionToggle?: (section: string, expanded: boolean) => void;
  onNameChange?: (id: string, name: string) => void;
}

export const ProfessionalChannelStrip: React.FC<ProfessionalChannelStripProps> = ({
  channel,
  isSelected,
  inserts,
  buses,
  viewMode = 'medium',
  sectionsExpanded,
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
  onSectionToggle,
  onNameChange,
}) => {
  const [showInserts, setShowInserts] = useState(sectionsExpanded?.inserts ?? false);
  const [showSends, setShowSends] = useState(sectionsExpanded?.sends ?? false);
  const [showIO, setShowIO] = useState(sectionsExpanded?.io ?? false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(channel.name);

  const widthClass = {
    narrow: 'w-[90px]',
    medium: 'w-[150px]',
    wide: 'w-[220px]'
  }[viewMode];

  const toggleSection = (section: string, currentState: boolean) => {
    const newState = !currentState;
    if (section === 'inserts') setShowInserts(newState);
    if (section === 'sends') setShowSends(newState);
    if (section === 'io') setShowIO(newState);
    onSectionToggle?.(section, newState);
  };

  const handleNameSubmit = () => {
    if (editedName.trim() && editedName !== channel.name) {
      onNameChange?.(channel.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col h-full glass rounded-lg overflow-hidden transition-all",
        widthClass,
        isSelected 
          ? 'ring-2 ring-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)]' 
          : 'hover:ring-1 hover:ring-primary/30'
      )}
      onClick={() => onSelect(channel.id)}
      style={{
        borderLeft: `4px solid ${channel.color}`,
      }}
    >
      {/* Header Section */}
      <div className="p-2 border-b border-border/30 bg-muted/10">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] text-muted-foreground font-mono">
            CH {channel.id}
          </div>
          <Circle size={8} fill={channel.color} stroke="none" />
        </div>
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') {
                setEditedName(channel.name);
                setIsEditingName(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-1 py-0.5 text-[11px] font-medium bg-background/50 border border-primary/50 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        ) : (
          <div 
            className="text-[11px] font-medium text-foreground truncate text-center cursor-text hover:text-primary transition-colors"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
          >
            {channel.name}
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {/* Peak Meter */}
        <div className="p-2 flex justify-center border-b border-border/20">
          <ProfessionalPeakMeter
            level={channel.peakLevel}
            height={viewMode === 'narrow' ? 120 : viewMode === 'medium' ? 160 : 200}
            width={viewMode === 'narrow' ? 3 : 4}
            stereo={true}
            showRMS={viewMode !== 'narrow'}
            clipIndicator={true}
          />
        </div>

        {/* Insert Rack */}
        {inserts && inserts.length > 0 && (
          <div className="border-b border-border/20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection('inserts', showInserts);
              }}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            >
              <span>INSERTS</span>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-primary">
                  {inserts.filter(i => i.pluginId).length}/8
                </span>
                {showInserts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </button>
            {showInserts && (
              <div className="px-2 pb-2">
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

        {/* Sends Section */}
        {buses && buses.length > 0 && onSendChange && (
          <div className="border-b border-border/20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection('sends', showSends);
              }}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            >
              <span>SENDS</span>
              {showSends ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showSends && (
              <div className="px-2 pb-2 space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
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

        {/* I/O Section */}
        {viewMode !== 'narrow' && (
          <div className="border-b border-border/20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection('io', showIO);
              }}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            >
              <span>I/O</span>
              {showIO ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showIO && (
              <div className="px-2 pb-2 space-y-1">
                <div className="text-[9px] text-muted-foreground">
                  <div className="flex justify-between items-center py-1">
                    <span>Input:</span>
                    <span className="text-foreground">File</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Output:</span>
                    <span className="text-foreground">Master</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pan Control */}
        <div className="p-2 flex justify-center border-b border-border/20">
          <IceFireKnob
            value={(channel.pan + 1) / 2}
            onChange={(value) => onPanChange(channel.id, (value * 2) - 1)}
            size={viewMode === 'narrow' ? 28 : viewMode === 'medium' ? 36 : 44}
            label="PAN"
            valueLabel={
              channel.pan === 0 
                ? 'C' 
                : channel.pan < 0 
                  ? `L${Math.abs(channel.pan * 100).toFixed(0)}` 
                  : `R${(channel.pan * 100).toFixed(0)}`
            }
            min={-100}
            max={100}
          />
        </div>
      </div>

      {/* Bottom Fixed Section - Fader & Controls */}
      <div className="border-t border-border/30 bg-muted/10">
        {/* Fader */}
        <div className="flex items-center justify-center py-3">
          <IceFireFader
            value={channel.volume}
            onChange={(value) => onVolumeChange(channel.id, value)}
            height={viewMode === 'narrow' ? 200 : viewMode === 'medium' ? 280 : 320}
            width={viewMode === 'narrow' ? 12 : 16}
            showScale={viewMode !== 'narrow'}
          />
        </div>

        {/* dB Readout */}
        <div className="text-center text-[10px] font-mono text-muted-foreground mb-2">
          {normalizedToDb(channel.volume).toFixed(1)} dB
        </div>

        {/* Transport Buttons */}
        <div className="flex gap-1 justify-center pb-2 px-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle(channel.id);
            }}
            className={cn(
              "flex-1 p-1.5 rounded text-[9px] font-medium transition-all",
              channel.muted 
                ? 'bg-destructive/20 text-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.3)]' 
                : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
            title="Mute"
          >
            M
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSoloToggle(channel.id);
            }}
            className={cn(
              "flex-1 p-1.5 rounded text-[9px] font-medium transition-all",
              channel.solo 
                ? 'bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' 
                : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
            title="Solo"
          >
            S
          </button>
        </div>
      </div>
    </div>
  );
};