import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import FlowMeter from './FlowMeter';
import FlowFader from './FlowFader';
import PanSlider from './PanSlider';
import {
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_WIDTH,
} from './mixerConstants';
import { deriveTrackALSFeedback, hexToRgba } from '../../utils/ALS';

interface FlowMasterStripProps {
  volume: number;
  onVolumeChange: (value: number) => void;
  balance: number;
  onBalanceChange: (value: number) => void;
  analysis: { level: number; transient: boolean; waveform: Uint8Array };
  stageHeight: number;
  meterHeight: number;
  faderHeight: number;
}

const MASTER_PRIMARY = '#ede9fe';
const MASTER_GLOW = '#f5d0fe';

const FlowMasterStrip: React.FC<FlowMasterStripProps> = ({
  volume,
  onVolumeChange,
  balance,
  onBalanceChange,
  analysis,
  stageHeight,
  meterHeight,
  faderHeight,
}) => {
  const masterFeedback = useMemo(() => {
    return deriveTrackALSFeedback({
      level: analysis?.level ?? 0,
      transient: analysis?.transient ?? false,
      volume,
      color: 'purple',
    });
  }, [analysis?.level, analysis?.transient, volume]);

  return (
    <motion.div
      className="relative flex flex-col bg-glass-surface border border-glass-border rounded-2xl backdrop-blur-2xl shadow-[0_28px_80px_rgba(4,12,26,0.55)] overflow-hidden text-ink"
      style={{
        height: `${stageHeight}px`,
        width: `${MIXER_STRIP_WIDTH}px`,
        minWidth: `${MIXER_STRIP_MIN_WIDTH}px`,
        maxWidth: `${MIXER_STRIP_MAX_WIDTH}px`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="relative flex-shrink-0 h-18 border-b border-glass-border/70">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(
              masterFeedback.color,
              0.25 + masterFeedback.intensity * 0.3
            )} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 px-3 pt-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.55rem] uppercase tracking-[0.35em] text-ink">Master</span>
            <span className="text-[0.45rem] uppercase tracking-[0.4em] text-ink/60">Flow</span>
          </div>
          <div className="flex items-center gap-2">
            {[
              'Body',
              'Soul',
              'Air',
              'Silk',
            ].map((label) => (
              <motion.span
                key={label}
                className="px-2 py-1 rounded-full border border-glass-border text-[0.45rem] uppercase tracking-[0.3em] text-ink/70 bg-[rgba(14,32,62,0.65)]"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {label}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-3 py-4 gap-3">
        <div className="w-full flex items-end justify-center" style={{ height: `${meterHeight}px` }}>
          <FlowMeter
            level={Math.min(1, Math.max(0, analysis?.level ?? 0))}
            peak={Math.min(1, Math.max(analysis?.level ?? 0, masterFeedback.intensity))}
            transient={analysis?.transient ?? false}
            color={masterFeedback.color}
            glow={masterFeedback.glowColor}
          />
        </div>

        <div className="w-full" style={{ height: `${faderHeight}px` }}>
          <FlowFader
            value={volume}
            onChange={onVolumeChange}
            alsFeedback={masterFeedback}
            trackColor={MASTER_PRIMARY}
            glowColor={MASTER_GLOW}
            name="fader-master"
          />
        </div>

        <div className="flex flex-col gap-2">
          <PanSlider
            value={balance}
            onChange={onBalanceChange}
            label="Balance"
            colorClass="bg-[rgba(16,50,95,0.6)] border-cyan-300/50"
          />
          <div className="h-1 bg-[rgba(9,18,36,0.6)] rounded-full overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${masterFeedback.flow * 100}%`,
                background: `linear-gradient(90deg, ${hexToRgba(
                  MASTER_PRIMARY,
                  0.8
                )}, ${hexToRgba(MASTER_GLOW, 0.45)})`,
                boxShadow: `0 0 14px ${hexToRgba(MASTER_GLOW, 0.35)}`
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlowMasterStrip;
