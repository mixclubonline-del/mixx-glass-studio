/**
 * Waveform Header Settings Panel
 * 
 * Bloom menu panel for adjusting waveform header visual parameters
 * Flow-conscious: visual sliders with immediate feedback
 */

import React from 'react';
import type { WaveformHeaderSettings } from '../types/waveformHeaderSettings';
import { MixxGlassSlider } from './mixxglass';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../design-system';

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
  // Normalize value to 0-1 range for MixxGlassSlider
  const normalizedValue = (value - min) / (max - min);
  const handleChange = (normalized: number) => {
    const denormalized = min + normalized * (max - min);
    onChange(denormalized);
  };

  return (
    <div style={composeStyles(
      spacing.gap(2),
      {
        display: 'flex',
        flexDirection: 'column',
      }
    )}>
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.between,
        {
          fontSize: '0.75rem',
        }
      )}>
        <span style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.wide,
          {
            color: 'rgba(255,255,255,0.7)',
          }
        )}>{label}</span>
        <span style={{
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'monospace',
        }}>{formatValue(value)}</span>
      </div>
      <MixxGlassSlider
        value={normalizedValue}
        onChange={handleChange}
        min={0}
        max={1}
        step={step / (max - min)} // Normalize step
        alsChannel="momentum"
        size="sm"
        showValue={false}
        style={{ width: '100%' }}
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
    <div style={composeStyles(
      spacing.gap(3),
      {
        display: 'flex',
        flexDirection: 'column',
      }
    )}>
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.between,
        {
          fontSize: '0.75rem',
        }
      )}>
        <span style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.wide,
          {
            color: 'rgba(255,255,255,0.7)',
          }
        )}>{label}</span>
      </div>
      <div style={composeStyles(
        spacing.gap(2),
        {
          display: 'flex',
          flexDirection: 'column',
        }
      )}>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2)
        )}>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            width: '64px',
          }}>Ambient</span>
          <MixxGlassSlider
            value={(ambient - min) / (max - min)}
            onChange={(normalized) => onChange(min + normalized * (max - min), active)}
            min={0}
            max={1}
            step={step / (max - min)}
            alsChannel="momentum"
            size="sm"
            showValue={false}
            style={{ flex: 1 }}
          />
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'monospace',
            width: '48px',
            textAlign: 'right',
          }}>{formatValue(ambient)}</span>
        </div>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2)
        )}>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            width: '64px',
          }}>Active</span>
          <MixxGlassSlider
            value={(active - min) / (max - min)}
            onChange={(normalized) => onChange(ambient, min + normalized * (max - min))}
            min={0}
            max={1}
            step={step / (max - min)}
            alsChannel="momentum"
            size="sm"
            showValue={false}
            style={{ flex: 1 }}
          />
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'monospace',
            width: '48px',
            textAlign: 'right',
          }}>{formatValue(active)}</span>
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
    <div style={composeStyles(
      spacing.p(6),
      spacing.gap(6),
      layout.overflow.y.auto,
      {
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
      }
    )}>
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.between,
        effects.border.bottom(),
        spacing.pb(3),
        {
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }
      )}>
        <h3 style={composeStyles(
          typography.weight('semibold'),
          typography.transform('uppercase'),
          typography.tracking.wide,
          {
            fontSize: '0.875rem',
            color: 'white',
          }
        )}>
          Waveform Header
        </h3>
        <button
          onClick={onReset}
          style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.wide,
            transitions.transition.standard('color', 200, 'ease-out'),
            {
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
            }
          )}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(103, 232, 249, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          Reset
        </button>
      </div>

      {/* Amplitude Section */}
      <div style={composeStyles(
        spacing.gap(4),
        {
          display: 'flex',
          flexDirection: 'column',
        }
      )}>
        <h4 style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.wider,
          {
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
          }
        )}>Amplitude</h4>
        <div style={composeStyles(
          spacing.gap(3),
          spacing.pl(2),
          {
            display: 'flex',
            flexDirection: 'column',
          }
        )}>
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
      <div style={composeStyles(
        spacing.gap(4),
        {
          display: 'flex',
          flexDirection: 'column',
        }
      )}>
        <h4 style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.wider,
          {
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
          }
        )}>Thickness</h4>
        <div style={composeStyles(
          spacing.gap(3),
          spacing.pl(2),
          {
            display: 'flex',
            flexDirection: 'column',
          }
        )}>
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
      <div style={composeStyles(
        spacing.gap(4),
        {
          display: 'flex',
          flexDirection: 'column',
        }
      )}>
        <h4 style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.wider,
          {
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
          }
        )}>Visual Effects</h4>
        <div style={composeStyles(
          spacing.gap(3),
          spacing.pl(2),
          {
            display: 'flex',
            flexDirection: 'column',
          }
        )}>
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
      <div style={composeStyles(
        spacing.gap(4),
        {
          display: 'flex',
          flexDirection: 'column',
        }
      )}>
        <h4 style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.wider,
          {
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
          }
        )}>Animation</h4>
        <div style={composeStyles(
          spacing.gap(3),
          spacing.pl(2),
          {
            display: 'flex',
            flexDirection: 'column',
          }
        )}>
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
      <div style={composeStyles(
        spacing.gap(4),
        {
          display: 'flex',
          flexDirection: 'column',
        }
      )}>
        <h4 style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.wider,
          {
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
          }
        )}>Waveform Shape</h4>
        <div style={composeStyles(
          spacing.gap(3),
          spacing.pl(2),
          {
            display: 'flex',
            flexDirection: 'column',
          }
        )}>
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

