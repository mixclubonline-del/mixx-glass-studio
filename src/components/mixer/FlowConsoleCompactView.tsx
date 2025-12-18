/**
 * FLOW CONSOLE COMPACT VIEW
 * 
 * Condensed channel strips for overview and quick adjustments.
 * Flow Doctrine: Maximum information density, minimal pixels.
 */

import React from 'react';
import { usePulseAnimation } from '../mixxglass';
import type { TrackData, MixerSettings, TrackAnalysisData } from '../../App';
import type { TrackALSFeedback } from '../../utils/ALS';
import { hexToRgba } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';
import './FlowConsoleCompactView.css';

interface FlowConsoleCompactViewProps {
  tracks: TrackData[];
  mixerSettings: Record<string, MixerSettings>;
  trackAnalysis: Record<string, TrackAnalysisData>;
  trackFeedbackMap: Record<string, TrackALSFeedback>;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  onMixerChange: (
    trackId: string,
    setting: keyof MixerSettings,
    value: number | boolean
  ) => void;
  soloedTracks: Set<string>;
  onToggleSolo: (trackId: string) => void;
}

export const FlowConsoleCompactView: React.FC<FlowConsoleCompactViewProps> = ({
  tracks,
  mixerSettings,
  trackAnalysis,
  trackFeedbackMap,
  selectedTrackId,
  onSelectTrack,
  onMixerChange,
  soloedTracks,
  onToggleSolo,
}) => {
  return (
    <div className="flow-compact-container">
      {tracks.map((track) => {
        const analysis = trackAnalysis[track.id] ?? { level: 0, transient: false };
        const settings = mixerSettings[track.id] ?? { volume: 0.75, pan: 0, isMuted: false };
        const feedback = trackFeedbackMap[track.id];
        const { base, glow } = TRACK_COLOR_SWATCH[track.trackColor];
        const isSelected = selectedTrackId === track.id;
        const isSoloed = soloedTracks.has(track.id);

        const intensity = feedback?.intensity ?? 0;
        // const pulse = feedback?.pulse ?? 0; // Unused
        const temperature = feedback?.temperature ?? 'cold';

        return (
          <div
            key={track.id}
            onClick={() => onSelectTrack(track.id)}
            className={`flow-compact-track ${isSelected ? 'flow-compact-track--selected' : ''}`}
          >
            {/* Track Name */}
            <div className="flow-compact-header">
              <span className="flow-compact-name">
                {track.trackName}
              </span>
              {isSoloed && (
                <div className="flow-compact-solo-dot" />
              )}
            </div>

            {/* Meter */}
            <CompactMeter
              level={Math.min(1, analysis.level ?? intensity)}
              base={base}
              glow={glow}
              intensity={intensity}
              hasTransient={analysis.transient}
            />

            {/* Volume Fader (Mini) */}
            <div className="flow-compact-fader__container">
              <input
                type="range"
                aria-label={`Volume for track ${track.trackName}`}
                min={0}
                max={1}
                step={0.01}
                value={settings.volume}
                onChange={(e) => {
                  e.stopPropagation();
                  onMixerChange(track.id, 'volume', parseFloat(e.target.value));
                }}
                className="flow-compact-fader"
                style={{
                  background: `linear-gradient(to right, ${hexToRgba(base, 0.6)} 0%, ${hexToRgba(base, 0.6)} ${settings.volume * 100}%, rgba(255,255,255,0.1) ${settings.volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
            </div>

            {/* ALS Temperature Indicator */}
            <div className="flow-compact-stats">
              <div className="flow-compact-temp-wrapper">
                <div
                  className="flow-compact-temp-dot"
                  style={{
                    background: hexToRgba(glow, 0.8),
                    boxShadow: `0 0 6px ${hexToRgba(glow, 0.6)}`,
                    opacity: 0.5 + intensity * 0.5,
                  }}
                />
                <span className="flow-compact-temp-text">
                  {temperature}
                </span>
              </div>
              <span className="flow-compact-vol-text">
                {settings.volume >= 0.8 ? 'Loud' : settings.volume >= 0.5 ? 'Normal' : settings.volume >= 0.2 ? 'Quiet' : 'Silent'}
              </span>
            </div>

            {/* Selection Indicator */}
            {isSelected && <PulsingSelectionIndicator />}
          </div>
        );
      })}
    </div>
  );
};

// Component for compact meter
const CompactMeter: React.FC<{
  level: number;
  base: string;
  glow: string;
  intensity: number;
  hasTransient: boolean;
}> = ({ level, base, glow, intensity, hasTransient }) => {
  const pulseOpacity = usePulseAnimation(0.7, 1, 1500, 'ease-in-out');
  const transientScale = usePulseAnimation(1, 1.2, 300, 'ease-in-out');
  const transientOpacity = usePulseAnimation(0.6, 0.9, 300, 'ease-in-out');
  
  return (
    <div className="flow-compact-meter">
      <div
        className="flow-compact-meter-bar"
        style={{
          height: `${level * 100}%`,
          background: `linear-gradient(180deg, ${hexToRgba(base, 0.8)}, ${hexToRgba(glow, 0.6)})`,
          boxShadow: `0 0 12px ${hexToRgba(glow, 0.5 * intensity)}`,
          opacity: pulseOpacity,
        }}
      />
      {hasTransient && (
        <div
          className="flow-compact-transient"
          style={{
            background: `radial-gradient(circle at center, ${hexToRgba(glow, 0.6)}, transparent)`,
            transform: `scale(${transientScale})`,
            opacity: transientOpacity,
          }}
        />
      )}
    </div>
  );
};

// Component for pulsing selection indicator
const PulsingSelectionIndicator: React.FC = () => {
  const pulseGlow = usePulseAnimation(0.3, 0.5, 2000, 'ease-in-out');
  return (
    <div
      className="flow-compact-selection"
      style={{
        boxShadow: `0 0 ${8 + pulseGlow * 8}px rgba(125, 211, 252, ${0.3 + pulseGlow * 0.2})`,
      }}
    />
  );
};

export default FlowConsoleCompactView;










