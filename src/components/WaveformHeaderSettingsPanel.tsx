/**
 * Waveform Header Settings Panel
 * 
 * Bloom menu panel for adjusting waveform header visual parameters
 * Flow-conscious: visual sliders with immediate feedback
 */

import React from 'react';
import type { WaveformHeaderSettings } from '../types/waveformHeaderSettings';

interface WaveformHeaderSettingsPanelProps {
  settings: WaveformHeaderSettings;
  onSettingsChange: (settings: WaveformHeaderSettings) => void;
  onReset: () => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue = (v) => v.toFixed(2),
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70 uppercase tracking-wide">{label}</span>
        <span className="text-white/50 font-mono">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400/80"
        style={{
          background: `linear-gradient(to right, rgba(34, 211, 238, 0.3) 0%, rgba(34, 211, 238, 0.3) ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
        }}
      />
    </div>
  );
};

interface DualSliderProps {
  label: string;
  ambient: number;
  active: number;
  min: number;
  max: number;
  step?: number;
  onChange: (ambient: number, active: number) => void;
  formatValue?: (value: number) => string;
}

const DualSlider: React.FC<DualSliderProps> = ({
  label,
  ambient,
  active,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue = (v) => v.toFixed(2),
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70 uppercase tracking-wide">{label}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 w-16">Ambient</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={ambient}
            onChange={(e) => onChange(parseFloat(e.target.value), active)}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400/60"
          />
          <span className="text-[10px] text-white/40 font-mono w-12 text-right">{formatValue(ambient)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 w-16">Active</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={active}
            onChange={(e) => onChange(ambient, parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400/80"
          />
          <span className="text-[10px] text-white/40 font-mono w-12 text-right">{formatValue(active)}</span>
        </div>
      </div>
    </div>
  );
};

export const WaveformHeaderSettingsPanel: React.FC<WaveformHeaderSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onReset,
}) => {
  const updateSettings = (updates: Partial<WaveformHeaderSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  return (
    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
          Waveform Header
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-white/50 hover:text-cyan-300 transition-colors uppercase tracking-wide"
        >
          Reset
        </button>
      </div>

      {/* Amplitude Section */}
      <div className="space-y-4">
        <h4 className="text-xs text-white/50 uppercase tracking-wider">Amplitude</h4>
        <div className="space-y-3 pl-2">
          <Slider
            label="Base Height"
            value={settings.baseAmplitude}
            min={0.2}
            max={0.6}
            step={0.01}
            onChange={(value) => updateSettings({ baseAmplitude: value })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="Active Boost"
            value={settings.activeModeBoost}
            min={1.0}
            max={1.5}
            step={0.01}
            onChange={(value) => updateSettings({ activeModeBoost: value })}
            formatValue={(v) => `${Math.round((v - 1) * 100)}%`}
          />
          <Slider
            label="Energy Response"
            value={settings.energyMultiplier}
            min={0}
            max={0.3}
            step={0.01}
            onChange={(value) => updateSettings({ energyMultiplier: value })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </div>

      {/* Thickness Section */}
      <div className="space-y-4">
        <h4 className="text-xs text-white/50 uppercase tracking-wider">Thickness</h4>
        <div className="space-y-3 pl-2">
          <DualSlider
            label="Main Stroke"
            ambient={settings.mainStrokeWidth.ambient}
            active={settings.mainStrokeWidth.active}
            min={1}
            max={6}
            step={0.1}
            onChange={(ambient, active) => updateSettings({ mainStrokeWidth: { ambient, active } })}
            formatValue={(v) => `${v.toFixed(1)}px`}
          />
          <DualSlider
            label="Glow Width"
            ambient={settings.glowStrokeWidth.ambient}
            active={settings.glowStrokeWidth.active}
            min={2}
            max={8}
            step={0.1}
            onChange={(ambient, active) => updateSettings({ glowStrokeWidth: { ambient, active } })}
            formatValue={(v) => `${v.toFixed(1)}x`}
          />
          <DualSlider
            label="Highlight"
            ambient={settings.highlightStrokeWidth.ambient}
            active={settings.highlightStrokeWidth.active}
            min={0.5}
            max={3}
            step={0.1}
            onChange={(ambient, active) => updateSettings({ highlightStrokeWidth: { ambient, active } })}
            formatValue={(v) => `${v.toFixed(1)}px`}
          />
        </div>
      </div>

      {/* Visual Effects Section */}
      <div className="space-y-4">
        <h4 className="text-xs text-white/50 uppercase tracking-wider">Visual Effects</h4>
        <div className="space-y-3 pl-2">
          <DualSlider
            label="Glow Intensity"
            ambient={settings.glowIntensity.ambient}
            active={settings.glowIntensity.active}
            min={0}
            max={1}
            step={0.01}
            onChange={(ambient, active) => updateSettings({ glowIntensity: { ambient, active } })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <DualSlider
            label="Shadow Blur"
            ambient={settings.shadowBlur.ambient}
            active={settings.shadowBlur.active}
            min={5}
            max={40}
            step={1}
            onChange={(ambient, active) => updateSettings({ shadowBlur: { ambient, active } })}
            formatValue={(v) => `${Math.round(v)}px`}
          />
          <Slider
            label="Highlight Intensity"
            value={settings.highlightIntensity}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateSettings({ highlightIntensity: value })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </div>

      {/* Animation Section */}
      <div className="space-y-4">
        <h4 className="text-xs text-white/50 uppercase tracking-wider">Animation</h4>
        <div className="space-y-3 pl-2">
          <DualSlider
            label="Phase Speed"
            ambient={settings.phaseSpeed.ambient}
            active={settings.phaseSpeed.active}
            min={0.1}
            max={2}
            step={0.05}
            onChange={(ambient, active) => updateSettings({ phaseSpeed: { ambient, active } })}
          />
          <Slider
            label="Playback Boost"
            value={settings.playbackBoost}
            min={0}
            max={0.5}
            step={0.01}
            onChange={(value) => updateSettings({ playbackBoost: value })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </div>

      {/* Waveform Generation Section */}
      <div className="space-y-4">
        <h4 className="text-xs text-white/50 uppercase tracking-wider">Waveform Shape</h4>
        <div className="space-y-3 pl-2">
          <Slider
            label="Fundamental"
            value={settings.fundamentalStrength}
            min={0.2}
            max={0.5}
            step={0.01}
            onChange={(value) => updateSettings({ fundamentalStrength: value })}
          />
          <Slider
            label="Harmony"
            value={settings.harmonyStrength}
            min={0.1}
            max={0.4}
            step={0.01}
            onChange={(value) => updateSettings({ harmonyStrength: value })}
          />
          <Slider
            label="Pressure"
            value={settings.pressureStrength}
            min={0.05}
            max={0.25}
            step={0.01}
            onChange={(value) => updateSettings({ pressureStrength: value })}
          />
          <Slider
            label="Temperature Mod"
            value={settings.temperatureModulation}
            min={0.1}
            max={0.5}
            step={0.01}
            onChange={(value) => updateSettings({ temperatureModulation: value })}
          />
          <Slider
            label="Momentum Mod"
            value={settings.momentumModulation}
            min={0.1}
            max={0.5}
            step={0.01}
            onChange={(value) => updateSettings({ momentumModulation: value })}
          />
        </div>
      </div>
    </div>
  );
};

