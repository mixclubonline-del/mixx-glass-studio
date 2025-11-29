/**
 * FLOW CONSOLE MATRIX VIEW
 * 
 * Routing matrix visualization showing all tracks → buses.
 * Flow Doctrine: Visual routing, no numbers, color/energy communication.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TrackData, MixerBusId } from '../../App';
import { hexToRgba } from '../../utils/ALS';
import type { TrackALSFeedback } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';

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
    <div className="flex h-full flex-col gap-4 overflow-auto px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-glass-border/60 pb-3">
        <div>
          <h3 className="text-[0.65rem] uppercase tracking-[0.4em] text-ink">
            Routing Matrix
          </h3>
          <p className="mt-1 text-[0.42rem] uppercase tracking-[0.3em] text-ink/50">
            Track → Bus routing visualization
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.42rem] uppercase tracking-[0.3em] text-ink/55">
          <span>Active</span>
          <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-emerald-300">
            {matrixData.filter((row) => row.sends.some((s) => s.level > 0.01)).length}
          </span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          {/* Column Headers (Buses) */}
          <div className="sticky top-0 z-10 mb-2 flex gap-2 border-b border-glass-border/40 pb-2">
            <div className="w-32 flex-shrink-0" /> {/* Track name column */}
            {buses.map((bus) => {
              const isSelected = selectedBusId === bus.id;
              return (
                <motion.button
                  key={bus.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectBus?.(bus.id)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-all ${
                    isSelected
                      ? 'border-cyan-300/70 bg-[rgba(16,50,95,0.7)] shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'border-glass-border/60 bg-[rgba(6,14,28,0.5)] hover:border-glass-border'
                  }`}
                >
                  <span
                    className="text-[0.5rem] uppercase tracking-[0.35em]"
                    style={{
                      color: isSelected ? 'rgba(125, 211, 252, 1)' : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {bus.name}
                  </span>
                  <div
                    className="h-1 w-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${hexToRgba(bus.color, 0.6)}, ${hexToRgba(bus.glow, 0.4)})`,
                      boxShadow: `0 0 8px ${hexToRgba(bus.glow, 0.3)}`,
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Rows (Tracks) */}
          <div className="flex flex-col gap-2">
            {matrixData.map((row, rowIndex) => (
              <motion.div
                key={row.trackId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.02 }}
                className="flex items-center gap-2"
              >
                {/* Track Name */}
                <div className="flex w-32 flex-shrink-0 items-center gap-2">
                  <div
                    className="h-8 w-1 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${hexToRgba(row.trackColor, 0.8)}, ${hexToRgba(row.trackGlow, 0.6)})`,
                      boxShadow: `0 0 12px ${hexToRgba(row.trackGlow, 0.4 * row.intensity)}`,
                      opacity: 0.6 + row.intensity * 0.4,
                    }}
                  />
                  <div className="flex flex-1 flex-col">
                    <span className="truncate text-[0.5rem] uppercase tracking-[0.3em] text-ink/85">
                      {row.trackName}
                    </span>
                    <span className="text-[0.42rem] uppercase tracking-[0.25em] text-ink/50">
                      {Math.round(row.intensity * 100)}%
                    </span>
                  </div>
                </div>

                {/* Send Cells */}
                {row.sends.map((send) => {
                  const isSelected = selectedBusId === send.busId;
                  const hasSignal = send.level > 0.01;

                  return (
                    <div
                      key={send.busId}
                      className="flex flex-1 items-center justify-center"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendLevelChange?.(row.trackId, send.busId, send.level > 0.5 ? 0 : 0.75);
                        }}
                        className={`relative flex h-10 w-full items-center justify-center rounded-lg border transition-all ${
                          isSelected
                            ? 'border-cyan-300/50'
                            : 'border-glass-border/40'
                        } ${
                          hasSignal
                            ? 'cursor-pointer bg-[rgba(6,14,28,0.6)] hover:bg-[rgba(8,18,34,0.8)]'
                            : 'cursor-pointer bg-[rgba(4,10,20,0.4)] hover:bg-[rgba(6,14,28,0.6)]'
                        }`}
                      >
                        {/* Level Indicator */}
                        {hasSignal && (
                          <motion.div
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${hexToRgba(send.busColor, send.level * 0.5)}, ${hexToRgba(send.busGlow, send.level * 0.3)})`,
                              opacity: 0.4 + send.level * 0.4,
                              boxShadow: `0 0 ${12 * send.level}px ${hexToRgba(send.busGlow, send.level * 0.5)}`,
                            }}
                            animate={{
                              opacity: [0.4 + send.level * 0.4, 0.5 + send.level * 0.5, 0.4 + send.level * 0.4],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}

                        {/* Level Bar */}
                        {hasSignal && (
                          <div className="relative h-1.5 w-3/4 overflow-hidden rounded-full bg-[rgba(0,0,0,0.4)]">
                            <motion.div
                              className="h-full rounded-full"
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
                          <motion.div
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background: `radial-gradient(circle at center, ${hexToRgba(send.busGlow, 0.3)}, transparent)`,
                            }}
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowConsoleMatrixView;



