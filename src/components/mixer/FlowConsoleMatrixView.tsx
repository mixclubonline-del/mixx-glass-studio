/**
 * FLOW CONSOLE MATRIX VIEW
 * 
 * Routing matrix visualization showing all tracks → buses.
 * Flow Doctrine: Visual routing, no numbers, color/energy communication.
 */

import React, { useMemo } from 'react';
import { useFlowMotion, usePulseAnimation } from '../mixxglass';
import type { TrackData, MixerBusId } from '../../App';
import { hexToRgba } from '../../utils/ALS';
import type { TrackALSFeedback } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';
import './FlowConsoleMatrixView.css';

// Component for pulsing level indicator
const PulsingLevelIndicator: React.FC<{
  busColor: string;
  busGlow: string;
  level: number;
}> = ({ busColor, busGlow, level }) => {
  const pulseOpacity = usePulseAnimation(
    0.4 + level * 0.4,
    0.5 + level * 0.5,
    2000,
    'ease-in-out'
  );
  return (
    <div
      className="flow-matrix-pulse-indicator"
      style={{
        background: `linear-gradient(135deg, ${hexToRgba(busColor, level * 0.5)}, ${hexToRgba(busGlow, level * 0.3)})`,
        opacity: pulseOpacity,
        boxShadow: `0 0 ${12 * level}px ${hexToRgba(busGlow, level * 0.5)}`,
      }}
    />
  );
};

// Matrix Row Component - uses hook at component level
const MatrixRow: React.FC<{
  row: {
    trackId: string;
    trackName: string;
    trackColor: string;
    trackGlow: string;
    intensity: number;
    pulse: number;
    sends: Array<{
      busId: string;
      level: number;
      busColor: string;
      busGlow: string;
    }>;
  };
  rowIndex: number;
  selectedBusId?: MixerBusId | null;
  onSendLevelChange?: (trackId: string, busId: string, value: number) => void;
}> = ({ row, rowIndex, selectedBusId, onSendLevelChange }) => {
  // Hook is now called at component level, not in callback
  const rowStyle = useFlowMotion(
    { opacity: 1, x: 0 },
    { duration: 300, delay: rowIndex * 20, easing: 'ease-out' }
  );

  return (
    <div
      className="flow-matrix-row"
      style={{
        opacity: rowStyle.opacity,
        transform: `translateX(${rowStyle.x}px)`,
      }}
    >
      {/* Track Name */}
      <div className="flow-matrix-track-cell">
        <div
          className="flow-matrix-track-meter"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(row.trackColor, 0.8)}, ${hexToRgba(row.trackGlow, 0.6)})`,
            boxShadow: `0 0 12px ${hexToRgba(row.trackGlow, 0.4 * row.intensity)}`,
            opacity: 0.6 + row.intensity * 0.4,
          }}
        />
        <div className="flow-matrix-track-info">
          <span className="flow-matrix-track-name">
            {row.trackName}
          </span>
          <span className="flow-matrix-track-status">
            {row.intensity >= 0.8 ? 'Hot' : row.intensity >= 0.5 ? 'Active' : row.intensity >= 0.2 ? 'Low' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Send Cells */}
      {row.sends.map((send) => {
        const isSelected = selectedBusId === send.busId;
        const hasSignal = send.level > 0.01;

        return (
          <div key={send.busId} className="flow-matrix-send-cell">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSendLevelChange?.(row.trackId, send.busId, send.level > 0.5 ? 0 : 0.75);
              }}
              className={`flow-matrix-send-knob ${isSelected ? 'flow-matrix-send-knob--selected' : ''} ${hasSignal ? 'flow-matrix-send-knob--active' : ''}`}
            >
              {/* Level Indicator */}
              {hasSignal && (
                <PulsingLevelIndicator
                  busColor={send.busColor}
                  busGlow={send.busGlow}
                  level={send.level}
                />
              )}

              {/* Level Bar */}
              {hasSignal && (
                <div className="flow-matrix-level-bar-container">
                  <div
                    className="flow-matrix-level-bar"
                    style={{
                      background: `linear-gradient(90deg, ${hexToRgba(send.busColor, 0.9)}, ${hexToRgba(send.busGlow, 0.6)})`,
                      width: `${send.level * 100}%`,
                      boxShadow: `0 0 8px ${hexToRgba(send.busGlow, 0.6)}`,
                    }}
                  />
                </div>
              )}

              {/* Energy Pulse */}
              {hasSignal && row.pulse > 0.3 && (
                <PulsingEnergyIndicator busGlow={send.busGlow} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Component for pulsing energy indicator
const PulsingEnergyIndicator: React.FC<{
  busGlow: string;
}> = ({ busGlow }) => {
  const pulseScale = usePulseAnimation(1, 1.1, 1000, 'ease-in-out');
  const pulseOpacity = usePulseAnimation(0.3, 0.6, 1000, 'ease-in-out');
  return (
    <div
      className="flow-matrix-energy-pulse"
      style={{
        background: `radial-gradient(circle at center, ${hexToRgba(busGlow, 0.3)}, transparent)`,
        transform: `scale(${pulseScale})`,
        opacity: pulseOpacity,
      }}
    />
  );
};

interface FlowConsoleMatrixViewProps {
  tracks: TrackData[];
  buses: Array<{
    id: MixerBusId;
    name: string;
    color: string;
    glow: string;
  }>;
  trackSendLevels: Record<string, Record<string, number>>;
  trackFeedbackMap: Record<string, TrackALSFeedback>;
  onMixerChange?: (
    trackId: string,
    setting: keyof any,
    value: number | boolean
  ) => void;
  onSendLevelChange?: (trackId: string, busId: string, value: number) => void;
  selectedBusId?: MixerBusId | null;
  onSelectBus?: (busId: MixerBusId) => void;
}

export const FlowConsoleMatrixView: React.FC<FlowConsoleMatrixViewProps> = ({
  tracks,
  buses,
  trackSendLevels,
  trackFeedbackMap,
  onSendLevelChange,
  selectedBusId,
  onSelectBus,
}) => {
  const matrixData = useMemo(() => {
    return tracks.map((track) => {
      const feedback = trackFeedbackMap[track.id];
      const { base, glow } = TRACK_COLOR_SWATCH[track.trackColor];
      const sends = buses.map((bus) => ({
        busId: bus.id,
        level: trackSendLevels[track.id]?.[bus.id] ?? 0,
        busColor: bus.color,
        busGlow: bus.glow,
      }));

      return {
        trackId: track.id,
        trackName: track.trackName,
        trackColor: base,
        trackGlow: glow,
        intensity: feedback?.intensity ?? 0,
        pulse: feedback?.pulse ?? 0,
        sends,
      };
    });
  }, [tracks, buses, trackSendLevels, trackFeedbackMap]);

  return (
    <div className="flow-matrix-container">
      {/* Header */}
      <div className="flow-matrix-header">
        <div>
          <h3 className="flow-matrix-title">
            Routing Matrix
          </h3>
          <p className="flow-matrix-subtitle">
            Track → Bus routing visualization
          </p>
        </div>
        <div className="flow-matrix-active-count">
          <span>Active</span>
          <span className="flow-matrix-count-badge">
            {matrixData.filter((row) => row.sends.some((s) => s.level > 0.01)).length}
          </span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flow-matrix-grid-wrapper">
        <div className="flow-matrix-grid-content">
          {/* Column Headers (Buses) */}
          <div className="flow-matrix-col-headers">
            <div className="flow-matrix-track-name-col" /> {/* Track name column */}
            {buses.map((bus) => {
              const isSelected = selectedBusId === bus.id;
              return (
                <button
                  key={bus.id}
                  onClick={() => onSelectBus?.(bus.id)}
                  className={`flow-matrix-bus-header ${isSelected ? 'flow-matrix-bus-header--selected' : ''}`}
                >
                  <span className="flow-matrix-bus-name">
                    {bus.name}
                  </span>
                  <div
                    className="flow-matrix-bus-indicator"
                    style={{
                      background: `linear-gradient(90deg, ${hexToRgba(bus.color, 0.6)}, ${hexToRgba(bus.glow, 0.4)})`,
                      boxShadow: `0 0 8px ${hexToRgba(bus.glow, 0.3)}`,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Rows (Tracks) */}
          <div className="flow-matrix-rows">
            {matrixData.map((row, rowIndex) => (
              <MatrixRow 
                key={row.trackId} 
                row={row} 
                rowIndex={rowIndex}
                selectedBusId={selectedBusId}
                onSendLevelChange={onSendLevelChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowConsoleMatrixView;




