import React, { useMemo } from 'react';
import { MixxGlassSlider, MixxGlassFader, MixxGlassMeter, useFlowMotion, usePulseAnimation } from '../mixxglass';
import {
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_WIDTH,
} from './mixerConstants';
import { deriveTrackALSFeedback, hexToRgba } from '../../utils/ALS';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

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

// Component for pulsing labels
const PulsingLabels: React.FC<{ labels: string[] }> = ({ labels }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 2400, 'ease-in-out');
  return (
    <div style={composeStyles(
      layout.flex.container('row'),
      layout.flex.align.center,
      spacing.gap(2)
    )}>
      {labels.map((label) => (
        <span
          key={label}
          style={composeStyles(
            spacing.px(2),
            spacing.py(1),
            effects.border.radius.full,
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.6875rem', // 11px minimum
              border: '1px solid rgba(102, 140, 198, 0.35)',
              color: 'rgba(230, 240, 255, 0.85)',
              background: 'rgba(14,32,62,0.65)',
              opacity: pulseOpacity,
            }
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

// Component for pulsing background
const PulsingBackground: React.FC<{ color: string; intensity: number }> = ({ color, intensity }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 2800, 'ease-in-out');
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        {
          background: `linear-gradient(135deg, ${hexToRgba(
            color,
            0.25 + intensity * 0.3
          )} 0%, transparent 70%)`,
          opacity: pulseOpacity,
        }
      )}
    />
  );
};

// Component for pulsing flow indicator
const PulsingFlowIndicator: React.FC<{ flow: number }> = ({ flow }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 2200, 'ease-in-out');
  return (
    <div style={composeStyles(
      layout.position.relative,
      layout.overflow.hidden,
      effects.border.radius.full,
      {
        height: '4px',
        background: 'rgba(9,18,36,0.6)',
      }
    )}>
      <div
        style={composeStyles(
          layout.position.absolute,
          effects.border.radius.full,
          {
            inset: '0 0 0 0',
            left: 0,
            width: `${flow * 100}%`,
            background: `linear-gradient(90deg, ${hexToRgba(
              MASTER_PRIMARY,
              0.8
            )}, ${hexToRgba(MASTER_GLOW, 0.45)})`,
            boxShadow: `0 0 14px ${hexToRgba(MASTER_GLOW, 0.35)}`,
            opacity: pulseOpacity,
          }
        )}
      />
    </div>
  );
};

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

  // Animated entrance
  const entranceStyle = useFlowMotion(
    { opacity: 1, scale: 1 },
    { duration: 350, easing: 'ease-out' }
  );

  return (
    <div
      style={composeStyles(
        layout.position.relative,
        layout.flex.container('col'),
        layout.overflow.hidden,
        effects.shadow.glass('medium'),
        effects.border.radius['2xl'],
        {
          background: 'rgba(9, 18, 36, 0.82)',
          border: '1px solid rgba(102, 140, 198, 0.45)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          color: '#e6f0ff',
          height: `${stageHeight}px`,
          width: `${MIXER_STRIP_WIDTH}px`,
          minWidth: `${MIXER_STRIP_MIN_WIDTH}px`,
          maxWidth: `${MIXER_STRIP_MAX_WIDTH}px`,
          opacity: entranceStyle.opacity,
          transform: `scale(${entranceStyle.scale})`,
        }
      )}
    >
      <div style={composeStyles(
        layout.position.relative,
        { flexShrink: 0, height: '72px' },
        { borderBottom: '1px solid rgba(102, 140, 198, 0.7)' }
      )}>
        <PulsingBackground
          color={masterFeedback.color}
          intensity={masterFeedback.intensity}
        />
        <div style={composeStyles(
          layout.position.relative,
          layout.zIndex[10],
          spacing.px(3),
          spacing.pt(3),
          layout.flex.container('col'),
          spacing.gap(1)
        )}>
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.between
          )}>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.75rem', // 12px professional
                color: 'rgba(230, 240, 255, 0.95)',
              }
            )}>Master</span>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.6875rem', // 11px minimum
                color: 'rgba(230, 240, 255, 0.75)',
              }
            )}>Flow</span>
          </div>
          <PulsingLabels labels={['Body', 'Soul', 'Air', 'Silk']} />
        </div>
      </div>

      <div style={composeStyles(
        layout.flex.container('col'),
        { flex: 1 },
        spacing.px(3),
        spacing.py(4),
        spacing.gap(3)
      )}>
        <div style={composeStyles(
          layout.width.full,
          layout.flex.container('row'),
          layout.flex.align.end,
          layout.flex.justify.center,
          { height: `${meterHeight}px` }
        )}>
          <MixxGlassMeter
            level={Math.min(1, Math.max(0, analysis?.level ?? 0))}
            peak={Math.min(1, Math.max(analysis?.level ?? 0, masterFeedback.intensity))}
            transient={analysis?.transient ?? false}
            alsChannel="pressure"
            color={masterFeedback.color}
            glowColor={masterFeedback.glowColor}
            height={meterHeight}
            width={44}
          />
        </div>

        <div style={composeStyles(
          layout.width.full,
          { height: `${faderHeight}px` }
        )}>
          <MixxGlassFader
            value={volume}
            onChange={onVolumeChange}
            alsChannel="momentum"
            alsIntensity={masterFeedback.intensity}
            trackColor={MASTER_PRIMARY}
            glowColor={MASTER_GLOW}
            name="fader-master"
            height={faderHeight}
            showDB={true}
          />
        </div>

        <div style={composeStyles(
          layout.flex.container('col'),
          spacing.gap(2)
        )}>
          <div style={layout.position.relative}>
            <MixxGlassSlider
              value={(balance + 1) / 2} // Convert -1 to 1 range to 0 to 1
              onChange={(normalized) => onBalanceChange(normalized * 2 - 1)} // Convert back
              min={0}
              max={1}
              step={0.01}
              alsChannel="harmony"
              size="sm"
            />
            <span style={composeStyles(
              layout.position.absolute,
              transitions.transform.combine('translateX(-50%)'),
              {
                bottom: '-20px',
                left: '50%',
                fontSize: '10px',
                color: 'rgba(156, 163, 175, 0.8)',
                fontWeight: 600,
              }
            )}>Balance</span>
          </div>
          <PulsingFlowIndicator flow={masterFeedback.flow} />
        </div>
      </div>
    </div>
  );
};

export default FlowMasterStrip;
