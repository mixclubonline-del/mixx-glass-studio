/**
 * FLOW CONSOLE COMPACT VIEW
 * 
 * Condensed channel strips for overview and quick adjustments.
 * Flow Doctrine: Maximum information density, minimal pixels.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { TrackData, MixerSettings, TrackAnalysisData } from '../../App';
import type { TrackALSFeedback } from '../../utils/ALS';
import { hexToRgba } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';

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
    <div className="flex h-full flex-wrap gap-2 overflow-auto px-4 py-4">
      {tracks.map((track) => {
        const analysis = trackAnalysis[track.id] ?? { level: 0, transient: false };
        const settings = mixerSettings[track.id] ?? { volume: 0.75, pan: 0, isMuted: false };
        const feedback = trackFeedbackMap[track.id];
        const { base, glow } = TRACK_COLOR_SWATCH[track.trackColor];
        const isSelected = selectedTrackId === track.id;
        const isSoloed = soloedTracks.has(track.id);

        const intensity = feedback?.intensity ?? 0;
        const pulse = feedback?.pulse ?? 0;
        const temperature = feedback?.temperature ?? 'cold';

        return (
          <motion.div
            key={track.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTrack(track.id)}
            className={`relative flex w-32 flex-col gap-1.5 rounded-xl border p-2 transition-all ${
              isSelected
                ? 'border-cyan-300/70 bg-[rgba(16,50,95,0.6)] shadow-[0_0_16px_rgba(56,189,248,0.4)]'
                : 'border-glass-border/60 bg-[rgba(6,14,28,0.5)] hover:border-glass-border'
            }`}
          >
            {/* Track Name */}
            <div className="flex items-center justify-between">
              <span className="truncate text-[0.45rem] uppercase tracking-[0.3em] text-ink/85">
                {track.trackName}
              </span>
              {isSoloed && (
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              )}
            </div>

            {/* Meter */}
            <div className="relative h-8 w-full overflow-hidden rounded border border-glass-border/40 bg-[rgba(4,8,18,0.8)]">
              <motion.div
                className="absolute bottom-0 left-0 w-full"
                style={{
                  height: `${Math.min(1, analysis.level ?? intensity) * 100}%`,
                  background: `linear-gradient(180deg, ${hexToRgba(base, 0.8)}, ${hexToRgba(glow, 0.6)})`,
                  boxShadow: `0 0 12px ${hexToRgba(glow, 0.5 * intensity)}`,
                }}
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {analysis.transient && (
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at center, ${hexToRgba(glow, 0.6)}, transparent)`,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.9, 0.6],
                  }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>

            {/* Volume Fader (Mini) */}
            <div className="relative">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.volume}
                onChange={(e) => {
                  e.stopPropagation();
                  onMixerChange(track.id, 'volume', parseFloat(e.target.value));
                }}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[rgba(4,8,18,0.6)]"
                style={{
                  background: `linear-gradient(to right, ${hexToRgba(base, 0.6)} 0%, ${hexToRgba(base, 0.6)} ${settings.volume * 100}%, rgba(255,255,255,0.1) ${settings.volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
            </div>

            {/* ALS Temperature Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: hexToRgba(glow, 0.8),
                    boxShadow: `0 0 6px ${hexToRgba(glow, 0.6)}`,
                    opacity: 0.5 + intensity * 0.5,
                  }}
                />
                <span className="text-[0.38rem] uppercase tracking-[0.25em] text-ink/55">
                  {temperature}
                </span>
              </div>
              <span className="text-[0.38rem] uppercase tracking-[0.25em] text-ink/45">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-cyan-300/60"
                animate={{
                  boxShadow: [
                    '0 0 8px rgba(125, 211, 252, 0.3)',
                    '0 0 16px rgba(125, 211, 252, 0.5)',
                    '0 0 8px rgba(125, 211, 252, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default FlowConsoleCompactView;



