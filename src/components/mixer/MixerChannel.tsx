import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrackData, MixerSettings, TrackAnalysisData, FxWindowConfig, FxWindowId } from '../../App';
import { MuteIcon, SoloIcon, RecordIcon, PlusCircleIcon } from '../icons';
import PluginBadge from '../PluginBadge'; // Import PluginBadge
import PanSlider from './PanSlider';

interface MixerChannelProps {
  track: TrackData;
  settings: MixerSettings;
  analysis: TrackAnalysisData;
  onMixerChange: (trackId: string, setting: keyof MixerSettings, value: number | boolean) => void;
  isSoloed: boolean;
  onToggleSolo: (trackId: string) => void;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  isArmed: boolean;
  onToggleArm: (trackId: string) => void;
  onRenameTrack: (trackId: string, newName: string) => void;
  // New Plugin Props
  inserts: FxWindowId[];
  trackColor: TrackData['trackColor'];
  fxWindows: FxWindowConfig[];
  onAddPlugin: (pluginId: FxWindowId) => void;
  onRemovePlugin: (index: number) => void;
  onMovePlugin: (fromIndex: number, toIndex: number) => void;
  onOpenPluginBrowser: () => void;
  onOpenPluginSettings: (fxId: FxWindowId) => void;
}

const colorMap: { [key in TrackData['trackColor']]: { glow: string; base: string; mid: string; low: string; border: string; shadow: string } } = {
  cyan:    { glow: 'rgba(6, 182, 212, 0.7)', base: '#67e8f9', mid: '#06b6d4', low: '#0891b2', border: 'border-cyan-400/30', shadow: 'shadow-[0_0_20px_theme(colors.cyan.500/0.2)]' },
  magenta: { glow: 'rgba(217, 70, 239, 0.7)', base: '#f0abfc', mid: '#d946ef', low: '#c026d3', border: 'border-fuchsia-400/30', shadow: 'shadow-[0_0_20px_theme(colors.fuchsia.500/0.2)]' },
  blue:    { glow: 'rgba(59, 130, 246, 0.7)', base: '#93c5fd', mid: '#3b82f6', low: '#2563eb', border: 'border-blue-400/30', shadow: 'shadow-[0_0_20px_theme(colors.blue.500/0.2)]' },
  green:   { glow: 'rgba(34, 197, 94, 0.7)',  base: '#86efac', mid: '#22c55e', low: '#16a34a', border: 'border-green-400/30', shadow: 'shadow-[0_0_20px_theme(colors.green.500/0.2)]' },
  purple:  { glow: 'rgba(139, 92, 246, 0.7)', base: '#c4b5fd', mid: '#8b5cf6', low: '#7c3aed', border: 'border-violet-400/30', shadow: 'shadow-[0_0_20px_theme(colors.violet.500/0.2)]' },
};

const panSliderColorMap: { [key in TrackData['trackColor']]: string } = {
  cyan: 'bg-cyan-400 border-cyan-300',
  magenta: 'bg-fuchsia-400 border-fuchsia-300',
  blue: 'bg-blue-400 border-blue-300',
  green: 'bg-green-400 border-green-300',
  purple: 'bg-violet-400 border-violet-300',
};

const MixerChannel: React.FC<MixerChannelProps> = ({ 
  track, settings, analysis, onMixerChange, isSoloed, onToggleSolo, 
  selectedTrackId, onSelectTrack, isArmed, onToggleArm, onRenameTrack,
  // New Plugin Props
  inserts, trackColor, fxWindows, onAddPlugin, onRemovePlugin, onMovePlugin, onOpenPluginBrowser, onOpenPluginSettings
}) => {
  const selectedColor = colorMap[track.trackColor];
  const isSelected = selectedTrackId === track.id;
  const trackId = track.id; // For convenience

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedName, setEditedName] = useState(track.trackName);

  const handleInteraction = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const newPercentage = 1 - (clientY - rect.top) / rect.height;
    const clampedValue = Math.max(0, Math.min(1.2, newPercentage));
    onMixerChange(track.id, 'volume', clampedValue);
  }, [onMixerChange, track.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientY);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 100);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) handleInteraction(e.clientY);
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleRename = () => {
    if (editedName.trim()) {
        onRenameTrack(track.id, editedName.trim());
    }
    setIsRenaming(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleInteraction]);

  const height = Math.pow(analysis.level, 0.5) * 100;
  const faderPosition = Math.max(0, Math.min(100, (settings.volume / 1.2) * 100));

  return (
    <div 
        className={`h-full w-24 flex flex-col items-center p-2 rounded-2xl bg-black/40 border-2 ${isArmed ? 'border-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : `${selectedColor.border} ${selectedColor.shadow}`} backdrop-blur-lg transition-all duration-200 cursor-pointer ${isSelected ? 'scale-[1.02] shadow-[0_0_20px_theme(colors.white/0.4)]' : ''}`}
        onClick={() => onSelectTrack(track.id)}
    >
      {/* Pan Control */}
      <div className="flex-shrink-0 w-full mb-4">
          <PanSlider 
            value={settings.pan} 
            onChange={(val) => onMixerChange(track.id, 'pan', val)} 
            label="PAN" 
            colorClass={panSliderColorMap[track.trackColor]} 
          />
      </div>

      {/* Fader & Meter Area */}
      <div
        ref={trackRef}
        className="relative flex-grow w-full flex flex-col items-center cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        {/* VU Meter Background */}
        <div className="absolute inset-0 w-full h-full bg-gray-900/50 rounded-lg overflow-hidden">
            <div
                className="absolute bottom-0 w-full rounded-t-md transition-all duration-75 ease-out"
                style={{
                    height: `${height}%`,
                    background: `linear-gradient(to top, ${selectedColor.low}, ${selectedColor.mid}, ${selectedColor.base})`,
                    boxShadow: `0 0 10px ${selectedColor.glow}, 0 0 20px ${selectedColor.glow}`
                }}
            />
        </div>
        {/* Transient Flash */}
        {analysis.transient && (
            <div
              key={Date.now()}
              className="absolute inset-0 w-full h-full rounded-lg pointer-events-none animate-transient-flash"
              style={{ background: selectedColor.base }}
            />
        )}

        {/* Fader Cap */}
        <div
            className={`absolute left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-gray-200 border-2 border-gray-300 shadow-lg pointer-events-none ${isPulsing ? 'fader-cap-pulse' : ''}`}
            style={{ bottom: `calc(${faderPosition}%)` }}
        />
      </div>

      {/* Controls Area */}
      <div className="flex-shrink-0 mt-2 h-24 w-full flex flex-col items-center justify-between">
          <div className="flex w-full justify-around">
              <button 
                onClick={(e) => { e.stopPropagation(); onMixerChange(track.id, 'isMuted', !settings.isMuted); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${settings.isMuted ? 'bg-red-600/80 text-white shadow-[0_0_8px_rgba(220,38,38,0.7)]' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}
              >
                <MuteIcon className="w-4 h-4"/>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSolo(track.id); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSoloed ? 'bg-yellow-500/80 text-black shadow-[0_0_8px_rgba(234,179,8,0.7)]' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}
              >
                <SoloIcon className="w-4 h-4"/>
              </button>
          </div>
          <button
              onClick={(e) => { e.stopPropagation(); onToggleArm(track.id); }}
              className={`w-full h-8 rounded-lg flex items-center justify-center text-sm font-bold uppercase transition-all ${isArmed ? 'bg-red-600 text-white animate-record-arm-pulse' : 'bg-gray-700/50 text-gray-400 hover:bg-red-600/50 hover:text-white'}`}
          >
              <RecordIcon className="w-3 h-3 mr-2" />
              REC
          </button>
          {/* Plugin Inserts for Mixer */}
          <div className="w-full flex-grow flex flex-col justify-end items-center space-y-1 mt-2">
            {inserts.map((fxId, index) => {
              const fxConfig = fxWindows.find(f => f.id === fxId);
              return fxConfig ? (
                <PluginBadge
                  key={fxId}
                  trackId={trackId}
                  fxId={fxId}
                  name={fxConfig.name}
                  trackColor={trackColor}
                  index={index}
                  onRemove={() => onRemovePlugin(index)}
                  onMove={(from, to) => onMovePlugin(from, to)}
                  onOpenPluginSettings={onOpenPluginSettings}
                />
              ) : null;
            })}
            <button
                onClick={(e) => { e.stopPropagation(); onOpenPluginBrowser(); }}
                className={`w-full h-8 rounded-lg flex items-center justify-center text-sm font-bold uppercase transition-all bg-gray-700/50 text-gray-400 hover:bg-${trackColor}-500/50 hover:text-white`}
            >
                <PlusCircleIcon className="w-4 h-4 mr-1" /> Add FX
            </button>
          </div>
      </div>
      
      {/* Name Area */}
      <div className="flex-shrink-0 pt-2 text-center h-10 w-full" onDoubleClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}>
        {isRenaming ? (
            <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                className="w-full bg-gray-900 text-white text-center text-sm font-bold uppercase tracking-wider rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                autoFocus
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.stopPropagation()}
            />
        ) : (
            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider truncate w-full block">{track.trackName}</span>
        )}
      </div>
    </div>
  );
};

export default MixerChannel;