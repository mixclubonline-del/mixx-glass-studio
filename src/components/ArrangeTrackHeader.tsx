

import React, { useState } from 'react';
import { TrackData, MixerSettings, FxWindowConfig, FxWindowId } from '../App';
import { RecordIcon, MuteIcon, SoloIcon, AutomationIcon, PlusCircleIcon, SlidersIcon } from './icons';
import PluginBadge from './PluginBadge';
import AutomationParamMenu from './AutomationParamMenu'; // Assuming this component exists or will be created

interface ArrangeTrackHeaderProps {
  track: TrackData;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  isArmed: boolean;
  onToggleArm: (trackId: string) => void;
  mixerSettings: MixerSettings;
  onMixerChange: (trackId: string, setting: keyof MixerSettings, value: number | boolean) => void;
  isSoloed: boolean;
  onToggleSolo: (trackId: string) => void;
  // FIX: Removed onToggleAutomationLane prop, replaced by onToggleAutomationLaneWithParam for consistency.
  // onToggleAutomationLane: () => void; // For track volume/pan automation by default
  isAutomationVisible: boolean;
  // Plugin Props
  inserts: Record<string, FxWindowId[]>;
  trackColor: TrackData['trackColor'];
  fxWindows: FxWindowConfig[];
  onAddPlugin: (trackId: string, pluginId: FxWindowId) => void;
  onRemovePlugin: (trackId: string, index: number) => void;
  onMovePlugin: (trackId: string, fromIndex: number, toIndex: number) => void;
  onOpenPluginBrowser: (trackId: string) => void;
  onOpenPluginSettings: (fxId: FxWindowId) => void;
  // Automation specific for plugin parameters
  automationParamMenu: { x: number; y: number; trackId: string; } | null;
  onOpenAutomationParamMenu: (x: number, y: number, trackId: string) => void;
  onCloseAutomationParamMenu: () => void;
  onToggleAutomationLaneWithParam: (trackId: string, fxId: string, paramName: string) => void;
}

const colorMap = {
  cyan:    { border: 'border-l-4 border-cyan-400', bg: 'bg-cyan-500/20', glow: 'shadow-[0_0_15px_theme(colors.cyan.400)]', node: 'border-cyan-400 bg-cyan-400', nodeGlow: 'shadow-[0_0_10px_2px_theme(colors.cyan.400)]' },
  magenta: { border: 'border-l-4 border-fuchsia-400', bg: 'bg-fuchsia-500/20', glow: 'shadow-[0_0_15px_theme(colors.fuchsia.400)]', node: 'border-fuchsia-400 bg-fuchsia-400', nodeGlow: 'shadow-[0_0_10px_2px_theme(colors.fuchsia.400)]' },
  blue:    { border: 'border-l-4 border-blue-400', bg: 'bg-blue-500/20', glow: 'shadow-[0_0_15px_theme(colors.blue.400)]', node: 'border-blue-400 bg-blue-400', nodeGlow: 'shadow-[0_0_10px_2px_theme(colors.blue.400)]' },
  green:   { border: 'border-l-4 border-green-400', bg: 'bg-green-500/20', glow: 'shadow-[0_0_15px_theme(colors.green.400)]', node: 'border-green-400 bg-green-400', nodeGlow: 'shadow-[0_0_10px_2px_theme(colors.green.400)]' },
  purple:  { border: 'border-l-4 border-violet-400', bg: 'bg-violet-500/20', glow: 'shadow-[0_0_15px_theme(colors.violet.400)]', node: 'border-violet-400 bg-violet-400', nodeGlow: 'shadow-[0_0_10px_2px_theme(colors.violet.400)]' },
};

const ArrangeTrackHeader: React.FC<ArrangeTrackHeaderProps> = ({ 
    track, 
    selectedTrackId, onSelectTrack, isArmed, onToggleArm, mixerSettings, 
    onMixerChange, isSoloed, onToggleSolo, /* onToggleAutomationLane, */ isAutomationVisible,
    inserts, trackColor, fxWindows, onAddPlugin, onRemovePlugin, onMovePlugin, 
    onOpenPluginBrowser, onOpenPluginSettings,
    automationParamMenu, onOpenAutomationParamMenu, onCloseAutomationParamMenu, onToggleAutomationLaneWithParam
}) => {
  const selectedColor = colorMap[track.trackColor];
  const isSelected = selectedTrackId === track.id;
  const trackInserts = inserts[track.id] || [];

  return (
    <div 
      className={`w-full h-full flex flex-col justify-between p-2 border-b border-white/10 transition-all duration-200 group relative
        ${selectedColor.border} 
        ${isSelected ? `${selectedColor.bg}` : ''}
        ${isArmed ? 'bg-red-600/30 border-red-500' : ''}
      `}
      onClick={() => onSelectTrack(track.id)}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {/* Signal Flow Glow */}
      <div className={`absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
      <div className={`absolute top-1/2 -translate-y-1/2 right-2 w-2 h-2 rounded-full border-2 ${selectedColor.node} opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ${isSelected ? selectedColor.nodeGlow : ''}`} />

      <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            {track.isProcessing && (
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-processing-pulse flex-shrink-0" title="Processing Stems..."></div>
            )}
            <span className={`text-lg font-bold truncate ${isArmed ? 'text-white' : 'text-gray-200'}`}>{track.trackName}</span>
          </div>
      </div>
      
      {/* Mute, Solo, Arm buttons */}
        <div className="flex items-center space-x-1.5 transition-all duration-200 mb-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onMixerChange(track.id, 'isMuted', !mixerSettings.isMuted); }}
                title="Mute"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${mixerSettings.isMuted ? 'bg-red-600/80 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'}`}
            >
                <MuteIcon className="w-3 h-3"/>
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onToggleSolo(track.id); }}
                title="Solo"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSoloed ? 'bg-yellow-500/80 text-black' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'}`}
            >
                <SoloIcon className="w-3 h-3"/>
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onToggleArm(track.id); }}
                title="Record Arm"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isArmed ? 'bg-red-700 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'}`}
            >
                <RecordIcon className="w-3 h-3"/>
            </button>
            <button
                // FIX: Changed to use onToggleAutomationLaneWithParam for consistency
                onClick={(e) => { e.stopPropagation(); onToggleAutomationLaneWithParam(track.id, 'track', 'volume'); }}
                title="Toggle Track Automation Lane"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isAutomationVisible ? `bg-${track.trackColor}-500/80 text-white` : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'}`}
            >
                <AutomationIcon className="w-4 h-4" />
            </button>
        </div>

        {/* Plugin Inserts Section */}
        <div className="flex-grow flex flex-col justify-start items-center space-y-1 mb-2 overflow-y-auto custom-scrollbar pr-1">
            {trackInserts.map((fxId, index) => {
              const fxConfig = fxWindows.find(f => f.id === fxId);
              return fxConfig ? (
                <PluginBadge
                  key={fxId}
                  trackId={track.id}
                  fxId={fxId}
                  name={fxConfig.name}
                  trackColor={trackColor}
                  index={index}
                  onRemove={() => onRemovePlugin(track.id, index)}
                  onMove={(from, to) => onMovePlugin(track.id, from, to)}
                  onOpenPluginSettings={onOpenPluginSettings}
                  onOpenAutomationParamMenu={(e) => onOpenAutomationParamMenu(e.clientX, e.clientY, track.id)}
                />
              ) : null;
            })}
            <button
                onClick={(e) => { e.stopPropagation(); onOpenPluginBrowser(track.id); }}
                className={`w-full h-8 rounded-lg flex items-center justify-center text-sm font-bold uppercase transition-all bg-gray-700/50 text-gray-400 hover:bg-${trackColor}-500/50 hover:text-white`}
            >
                <PlusCircleIcon className="w-4 h-4 mr-1" /> Add FX
            </button>
        </div>

        {/* Automation Parameters Menu */}
        {automationParamMenu && automationParamMenu.trackId === track.id && (
            <AutomationParamMenu
                x={automationParamMenu.x}
                y={automationParamMenu.y}
                trackId={track.id}
                fxWindows={fxWindows}
                inserts={inserts}
                onToggleAutomationLane={onToggleAutomationLaneWithParam}
                onClose={onCloseAutomationParamMenu}
            />
        )}
    </div>
  );
};

export default ArrangeTrackHeader;