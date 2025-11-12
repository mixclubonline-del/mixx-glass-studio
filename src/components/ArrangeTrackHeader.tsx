

import React from 'react';
import { TrackData, MixerSettings, FxWindowConfig, FxWindowId } from '../App';
import { RecordIcon, MuteIcon, SoloIcon, AutomationIcon, PlusCircleIcon } from './icons';
import PluginBadge from './PluginBadge';
import AutomationParamMenu from './AutomationParamMenu'; // Assuming this component exists or will be created
import { hexToRgba } from '../utils/ALS';

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
  alsPalette?: {
    base: string;
    glow: string;
    halo: string;
    intensity: number;
    transient: boolean;
  };
}

const ArrangeTrackHeader: React.FC<ArrangeTrackHeaderProps> = ({ 
    track, 
    selectedTrackId, onSelectTrack, isArmed, onToggleArm, mixerSettings, 
    onMixerChange, isSoloed, onToggleSolo, /* onToggleAutomationLane, */ isAutomationVisible,
    inserts, trackColor, fxWindows, onAddPlugin, onRemovePlugin, onMovePlugin, 
    onOpenPluginBrowser, onOpenPluginSettings,
    automationParamMenu, onOpenAutomationParamMenu, onCloseAutomationParamMenu, onToggleAutomationLaneWithParam,
    alsPalette,
}) => {
  const fallbackSwatch = (() => {
    switch (track.trackColor) {
      case 'cyan':
        return { base: '#06b6d4', glow: '#67e8f9' };
      case 'magenta':
        return { base: '#d946ef', glow: '#f0abfc' };
      case 'blue':
        return { base: '#3b82f6', glow: '#93c5fd' };
      case 'green':
        return { base: '#22c55e', glow: '#86efac' };
      case 'purple':
      default:
        return { base: '#8b5cf6', glow: '#c4b5fd' };
    }
  })();

  const palette = alsPalette ?? {
    base: fallbackSwatch.base,
    glow: fallbackSwatch.glow,
    halo: fallbackSwatch.glow,
    intensity: 0,
    transient: false,
  };

  const isSelected = selectedTrackId === track.id;
  const trackInserts = inserts[track.id] || [];

  const baseGradientAlpha = 0.08 + palette.intensity * 0.2;
  const selectedGradientAlpha = 0.22 + palette.intensity * 0.25;
  const rootStyle: React.CSSProperties = {
    borderLeft: `4px solid ${hexToRgba(palette.glow, 0.9)}`,
    background: `linear-gradient(135deg, ${hexToRgba(palette.base, baseGradientAlpha)} 0%, rgba(3,4,11,0.82) 70%)`,
    boxShadow: isSelected ? `0 0 28px ${hexToRgba(palette.halo, 0.35 + palette.intensity * 0.25)}` : undefined,
  };

  if (isSelected) {
    rootStyle.background = `linear-gradient(135deg, ${hexToRgba(palette.base, selectedGradientAlpha)} 0%, rgba(3,4,11,0.86) 65%)`;
  }

  if (isArmed) {
    rootStyle.borderLeft = `4px solid rgba(248, 113, 113, 0.95)`;
    rootStyle.boxShadow = `0 0 26px ${hexToRgba('#ef4444', 0.45)}`;
    rootStyle.background = `linear-gradient(135deg, ${hexToRgba('#ef4444', 0.32)} 0%, rgba(3,4,11,0.92) 65%)`;
  }

  const statusNodeStyle: React.CSSProperties = {
    borderColor: hexToRgba(palette.glow, 0.85),
    background: hexToRgba(palette.halo, isSelected ? 0.85 : 0.65),
    boxShadow: `0 0 12px ${hexToRgba(palette.halo, 0.5)}`,
    opacity: isSelected ? 1 : 0,
  };

  const automationActiveStyle = isAutomationVisible
    ? {
        background: hexToRgba(palette.glow, 0.45),
        color: '#fff',
        boxShadow: `0 0 8px ${hexToRgba(palette.halo, 0.45)}`,
      }
    : undefined;

  const addFxButtonStyle: React.CSSProperties = {
    border: `1px solid ${hexToRgba(palette.glow, 0.25)}`,
    background: `linear-gradient(135deg, ${hexToRgba(palette.base, 0.12)} 0%, rgba(24,24,38,0.72) 70%)`,
    color: '#e2e8f0',
    boxShadow: `0 0 12px ${hexToRgba(palette.halo, 0.25)}`,
  };

  return (
    <div 
      className="w-full h-full flex flex-col justify-between p-2 border-b border-white/10 transition-all duration-200 group relative"
      onClick={() => onSelectTrack(track.id)}
      onMouseUp={(e) => e.stopPropagation()}
      style={rootStyle}
    >
      <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div
        className="absolute top-1/2 -translate-y-1/2 right-2 w-2 h-2 rounded-full border-2 transition-all duration-300 pointer-events-none"
        style={statusNodeStyle}
      />

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
                onClick={(e) => { e.stopPropagation(); onToggleAutomationLaneWithParam(track.id, 'track', 'volume'); }}
                title="Toggle Track Automation Lane"
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all bg-gray-700/50 text-gray-400 hover:bg-gray-600/50"
                style={automationActiveStyle}
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
                className="w-full h-8 rounded-lg flex items-center justify-center text-sm font-bold uppercase transition-all hover:bg-slate-700/70"
                style={addFxButtonStyle}
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