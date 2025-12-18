import React, { useEffect, useState } from "react";
import { usePulseAnimation } from "../mixxglass";
import { hexToRgba } from "../../utils/ALS";
import { spacing, typography, layout, effects, transitions, composeStyles } from "../../design-system";

interface FlowMeterProps {
  level: number;
  peak: number;
  transient: boolean;
  color: string;
  glow: string;
  /** ALS Pulse Sync (0-1) - enhances glow based on Flow Pulse */
  pulse?: number;
  /** Flow-Follow Mode (0-1) - enhances glow based on transport state */
  flowFollow?: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const FlowMeter: React.FC<FlowMeterProps> = ({
  level,
  peak,
  transient,
  color,
  glow,
  pulse = 0,
  flowFollow = 0,
}) => {
  const [peakHold, setPeakHold] = useState(peak);

  useEffect(() => {
    if (peak > peakHold) {
      setPeakHold(peak);
      const timeout = setTimeout(() => {
        setPeakHold((prev) => prev * 0.92);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [peak, peakHold]);

  const mainHeight = clamp01(level);
  const peakPosition = clamp01(peakHold);

  const redThreshold = 0.85;
  const amberThreshold = 0.65;

  const gradient = mainHeight > redThreshold
    ? `linear-gradient(180deg, ${hexToRgba("#ef4444", 0.9)} 0%, ${hexToRgba(
        color,
        0.8
      )} 60%, ${hexToRgba(color, 0.3)} 100%)`
    : mainHeight > amberThreshold
    ? `linear-gradient(180deg, ${hexToRgba("#f59e0b", 0.9)} 0%, ${hexToRgba(
        color,
        0.75
      )} 60%, ${hexToRgba(color, 0.3)} 100%)`
    : `linear-gradient(180deg, ${hexToRgba(color, 0.85)} 0%, ${hexToRgba(
        color,
        0.45
      )} 60%, ${hexToRgba(color, 0.15)} 100%)`;

  return (
    <div style={composeStyles(
      layout.position.relative,
      layout.flex.container('col'),
      layout.flex.align.center,
      { width: '176px', height: '100%' }
    )}>
      <div style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        effects.border.radius.md,
        layout.overflow.hidden,
        {
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
        }
      )}>
        <div style={composeStyles(
          layout.position.absolute,
          { inset: '4px' },
          effects.border.radius.md,
          {
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)',
          }
        )} />
        <PulsingMeterBackground
          glow={glow}
          pulse={pulse}
          flowFollow={flowFollow}
        />
        <div style={composeStyles(
          layout.position.absolute,
          { bottom: '4px', left: '4px', right: '4px' },
          effects.border.radius.md,
          layout.overflow.hidden,
          {
            background: 'rgba(0,0,0,0.1)',
          }
        )}>
          <PulsingMeterBar
            height={mainHeight * 100}
            gradient={gradient}
            glow={glow}
            pulse={pulse}
            flowFollow={flowFollow}
          />
        </div>

        <PulsingPeakIndicator
          position={peakPosition * 100}
          glow={glow}
          transient={transient}
        />
      </div>

      <div style={composeStyles(
        layout.position.absolute,
        { right: '-6px', top: '4px' },
        layout.flex.container('col'),
        typography.transform('uppercase'),
        typography.tracking.widest,
        spacing.gap(4),
        {
          fontSize: '7px',
          color: 'rgba(255,255,255,0.3)',
        }
      )}>
        <span>+6</span>
        <span>0</span>
        <span>-6</span>
        <span>-12</span>
        <span>-24</span>
      </div>
    </div>
  );
};

// Component for pulsing meter background
const PulsingMeterBackground: React.FC<{
  glow: string;
  pulse: number;
  flowFollow: number;
}> = ({ glow, pulse, flowFollow }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 2500, 'ease-in-out');
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        { height: '100%' },
        {
          background: `radial-gradient(circle at 50% 20%, ${hexToRgba(
            glow,
            0.25 + pulse * 0.3 + flowFollow * 0.2
          )} 0%, transparent 100%)`,
          boxShadow: `inset 0 0 ${20 + pulse * 15 + flowFollow * 10}px ${hexToRgba(glow, 0.15 + pulse * 0.25)}`,
          opacity: pulseOpacity,
        }
      )}
    />
  );
};

// Component for pulsing meter bar
const PulsingMeterBar: React.FC<{
  height: number;
  gradient: string;
  glow: string;
  pulse: number;
  flowFollow: number;
}> = ({ height, gradient, glow, pulse, flowFollow }) => {
  const pulseOpacity = usePulseAnimation(0.85, 1, 1600, 'ease-in-out');
  return (
      <div style={composeStyles(
        layout.width.full,
        {
          height: `${height}%`,
          background: gradient,
          boxShadow: `0 0 ${12 + pulse * 8 + flowFollow * 6}px ${hexToRgba(glow, 0.45 + pulse * 0.3)}`,
          opacity: pulseOpacity,
          transformOrigin: 'bottom',
        }
      )} />
  );
};

// Component for pulsing peak indicator
const PulsingPeakIndicator: React.FC<{
  position: number;
  glow: string;
  transient: boolean;
}> = ({ position, glow, transient }) => {
  const pulseScale = usePulseAnimation(1, 1.4, 350, 'ease-in-out');
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { left: '4px', right: '4px' },
        effects.border.radius.full,
        {
          height: '6px',
          bottom: `${position}%`,
          background: hexToRgba(glow, transient ? 0.9 : 0.7),
          boxShadow: `0 0 10px ${hexToRgba(glow, 0.6)}`,
          transform: transient ? `scaleX(${pulseScale})` : 'scaleX(1)',
        }
      )}
    />
  );
};

export default FlowMeter;

