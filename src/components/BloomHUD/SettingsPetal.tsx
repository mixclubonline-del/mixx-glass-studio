/**
 * Settings Petal for Bloom Menu
 * 
 * Provides DAW settings access through the Bloom system.
 * Flow: Settings appear only when needed, no clutter.
 */

import React, { useState, useCallback } from 'react';
import { useProjectManager } from '../../core/project/useProjectManager';
import type { DAWSettings } from '../../core/project/ProjectStateManager';
import { hexToRgba } from '../../utils/ALS';
import { SlidersIcon } from '../icons';

interface SettingsPetalProps {
  onClose?: () => void;
  accentColor?: string;
}

const FLOW_ACCENT = '#8aa7ff';
const FLOW_BASE = 'rgba(10, 20, 40, 0.85)';
const FLOW_EDGE_LIGHT = 'rgba(124, 164, 228, 0.4)';

export const SettingsPetal: React.FC<SettingsPetalProps> = ({
  onClose,
  accentColor = FLOW_ACCENT,
}) => {
  const { settings, updateSettings, autoSaveStatus } = useProjectManager();
  const [localSettings, setLocalSettings] = useState<DAWSettings>(settings);

  const handleSettingChange = useCallback((
    category: keyof DAWSettings,
    key: string,
    value: any
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(() => {
    updateSettings(localSettings);
    onClose?.();
  }, [localSettings, updateSettings, onClose]);

  const handleReset = useCallback(() => {
    setLocalSettings(settings);
  }, [settings]);

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const SettingSection: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-xs uppercase tracking-[0.32em] text-ink/80 mb-3 font-semibold">
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const ToggleSetting: React.FC<{
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    description?: string;
  }> = ({ label, value, onChange, description }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-glass-border bg-glass-surface-soft">
      <div className="flex-1">
        <div className="text-sm text-ink/90 font-medium">{label}</div>
        {description && (
          <div className="text-xs text-ink/60 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? 'bg-cyan-500' : 'bg-slate-600'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const NumberSetting: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    description?: string;
  }> = ({ label, value, onChange, min, max, step, unit, description }) => (
    <div className="py-2 px-3 rounded-lg border border-glass-border bg-glass-surface-soft">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="text-sm text-ink/90 font-medium">{label}</div>
          {description && (
            <div className="text-xs text-ink/60 mt-0.5">{description}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-20 px-2 py-1 rounded border border-glass-border bg-glass-surface text-ink text-sm text-right"
          />
          {unit && <span className="text-xs text-ink/60">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 rounded-full appearance-none bg-glass-surface-soft accent-cyan-500"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border backdrop-blur-2xl shadow-[0_28px_80px_rgba(148,163,209,0.38)] pointer-events-auto"
        style={{
          borderColor: FLOW_EDGE_LIGHT,
          background: `linear-gradient(150deg, ${hexToRgba(accentColor, 0.12)} 0%, ${FLOW_BASE} 55%, rgba(8, 18, 34, 0.95) 100%)`,
          boxShadow: `0 24px 65px ${hexToRgba(accentColor, 0.32)}, inset 0 0 22px ${hexToRgba(accentColor, 0.1)}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-glass-border bg-glass-surface/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${hexToRgba(accentColor, 0.35)} 0%, rgba(12,20,38,0.85) 70%)`,
                  boxShadow: `0 0 18px ${hexToRgba(accentColor, 0.3)}`,
                }}
              >
                <SlidersIcon className="w-5 h-5 text-ink" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink uppercase tracking-[0.24em]">
                  Studio Settings
                </h2>
                <p className="text-xs text-ink/60 mt-0.5">
                  Configure DAW preferences and behavior
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-glass-border bg-glass-surface-soft hover:bg-glass-surface text-ink/70 hover:text-ink transition-colors flex items-center justify-center"
              aria-label="Close settings"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Auto-Save Status */}
          <div className="mb-6 p-4 rounded-lg border border-glass-border bg-glass-surface-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink/90">Auto-Save Status</span>
              <span
                className="text-xs px-2 py-1 rounded-full uppercase tracking-[0.2em]"
                style={{
                  background: autoSaveStatus.status === 'saved'
                    ? hexToRgba('#22c55e', 0.2)
                    : autoSaveStatus.status === 'saving'
                    ? hexToRgba('#fbbf24', 0.2)
                    : autoSaveStatus.status === 'error'
                    ? hexToRgba('#ef4444', 0.2)
                    : hexToRgba('#94a3b8', 0.2),
                  color: autoSaveStatus.status === 'saved'
                    ? '#22c55e'
                    : autoSaveStatus.status === 'saving'
                    ? '#fbbf24'
                    : autoSaveStatus.status === 'error'
                    ? '#ef4444'
                    : '#94a3b8',
                }}
              >
                {autoSaveStatus.status}
              </span>
            </div>
            {autoSaveStatus.lastSaveTime && (
              <div className="text-xs text-ink/60">
                Last saved: {formatTime(autoSaveStatus.lastSaveTime)}
              </div>
            )}
          </div>

          {/* Auto-Save Settings */}
          <SettingSection title="Auto-Save">
            <ToggleSetting
              label="Enable Auto-Save"
              value={localSettings.autoSave.enabled}
              onChange={(value) => handleSettingChange('autoSave', 'enabled', value)}
              description="Automatically save project in the background"
            />
            <NumberSetting
              label="Auto-Save Interval"
              value={localSettings.autoSave.intervalSeconds}
              onChange={(value) => handleSettingChange('autoSave', 'intervalSeconds', value)}
              min={10}
              max={300}
              step={10}
              unit="seconds"
              description="How often to auto-save (10-300 seconds)"
            />
          </SettingSection>

          {/* Audio Settings */}
          <SettingSection title="Audio">
            <NumberSetting
              label="Sample Rate"
              value={localSettings.audio.sampleRate}
              onChange={(value) => handleSettingChange('audio', 'sampleRate', value)}
              min={44100}
              max={192000}
              step={44100}
              unit="Hz"
              description="Audio sample rate (requires restart)"
            />
            <NumberSetting
              label="Buffer Size"
              value={localSettings.audio.bufferSize}
              onChange={(value) => handleSettingChange('audio', 'bufferSize', value)}
              min={128}
              max={2048}
              step={128}
              unit="samples"
              description="Audio buffer size (lower = less latency, higher = more stability)"
            />
          </SettingSection>

          {/* Timeline Settings */}
          <SettingSection title="Timeline">
            <ToggleSetting
              label="Snap Enabled"
              value={localSettings.timeline.snapEnabled}
              onChange={(value) => handleSettingChange('timeline', 'snapEnabled', value)}
              description="Enable snapping to grid"
            />
            <NumberSetting
              label="Snap Value"
              value={localSettings.timeline.snapValue}
              onChange={(value) => handleSettingChange('timeline', 'snapValue', value)}
              min={0.25}
              max={4}
              step={0.25}
              unit="beats"
              description="Grid snap resolution"
            />
            <ToggleSetting
              label="Grid Visible"
              value={localSettings.timeline.gridVisible}
              onChange={(value) => handleSettingChange('timeline', 'gridVisible', value)}
              description="Show timeline grid"
            />
          </SettingSection>

          {/* Recording Settings */}
          <SettingSection title="Recording">
            <ToggleSetting
              label="Pre-Roll"
              value={localSettings.recording.preRoll}
              onChange={(value) => handleSettingChange('recording', 'preRoll', value)}
              description="Enable pre-roll before recording"
            />
            <ToggleSetting
              label="Count-In"
              value={localSettings.recording.countIn}
              onChange={(value) => handleSettingChange('recording', 'countIn', value)}
              description="Enable count-in metronome"
            />
            <ToggleSetting
              label="Input Monitor"
              value={localSettings.recording.inputMonitor}
              onChange={(value) => handleSettingChange('recording', 'inputMonitor', value)}
              description="Monitor input while recording"
            />
            <ToggleSetting
              label="Hush Gate"
              value={localSettings.recording.hushGate}
              onChange={(value) => handleSettingChange('recording', 'hushGate', value)}
              description="Mute other tracks while recording"
            />
          </SettingSection>

          {/* Display Settings */}
          <SettingSection title="Display">
            <ToggleSetting
              label="Waveform Visible"
              value={localSettings.display.waveformVisible}
              onChange={(value) => handleSettingChange('display', 'waveformVisible', value)}
              description="Show waveform visualization"
            />
            <ToggleSetting
              label="Meters Visible"
              value={localSettings.display.metersVisible}
              onChange={(value) => handleSettingChange('display', 'metersVisible', value)}
              description="Show audio level meters"
            />
            <ToggleSetting
              label="ALS Visible"
              value={localSettings.display.alsVisible}
              onChange={(value) => handleSettingChange('display', 'alsVisible', value)}
              description="Show Advanced Leveling System feedback"
            />
          </SettingSection>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-glass-border bg-glass-surface/80 backdrop-blur-xl">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-full border border-glass-border bg-glass-surface-soft text-ink/70 hover:text-ink hover:bg-glass-surface transition-colors text-sm uppercase tracking-[0.24em]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-full border text-white transition-colors text-sm uppercase tracking-[0.24em] font-semibold"
              style={{
                borderColor: hexToRgba(accentColor, 0.5),
                background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.4)} 0%, ${hexToRgba(accentColor, 0.6)} 100%)`,
                boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.4)}`,
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

