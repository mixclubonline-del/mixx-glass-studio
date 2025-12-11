import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePulseAnimation } from "../mixxglass";
import type { TrackALSFeedback } from "../../utils/ALS";
import { hexToRgba } from "../../utils/ALS";
import { spacing, typography, layout, effects, transitions, composeStyles } from "../../design-system";

interface FlowFaderProps {
  value: number;
  onChange: (value: number) => void;
  alsFeedback: TrackALSFeedback | null;
  trackColor: string;
  glowColor: string;
  name: string;
  /** Show dB bubble on drag */
  showDB?: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const FlowFader: React.FC<FlowFaderProps> = ({
  value,
  onChange,
  alsFeedback,
  trackColor,
  glowColor,
  name,
  showDB = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDBBubble, setShowDBBubble] = useState(false);

  const handlePointerValue = useCallback(
    (clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relative = 1 - (clientY - rect.top) / rect.height;
      const scaled = clamp(relative * 1.2, 0, 1.2);
      onChange(Number(scaled.toFixed(3)));
    },
    [onChange]
  );

  const valueToDB = (v: number) =>
    v === 0 ? "-∞" : `${(20 * Math.log10(v)).toFixed(1)} dB`;

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      containerRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      if (showDB) setShowDBBubble(true);
      handlePointerValue(event.clientY);
    },
    [handlePointerValue, showDB]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      handlePointerValue(event.clientY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (showDB) {
        setTimeout(() => setShowDBBubble(false), 400);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerValue, isDragging]);

  const sliderRatio = clamp(value / 1.2, 0, 1);
  const intensity = alsFeedback?.intensity ?? 0;
  const pulse = alsFeedback?.pulse ?? 0;

  // Keyboard control
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let delta = 0;
      if (e.key === "ArrowUp") delta = 0.005;
      if (e.key === "ArrowDown") delta = -0.005;
      if (e.shiftKey) delta *= 0.25;
      if (e.altKey) delta *= 6;
      if (delta !== 0) {
        onChange(clamp(value + delta, 0, 1.2));
        if (showDB) {
          setShowDBBubble(true);
          setTimeout(() => setShowDBBubble(false), 600);
        }
      }
    },
    [value, onChange, showDB]
  );

  return (
    <div
      ref={containerRef}
      style={composeStyles(
        layout.position.relative,
        layout.width.full,
        { height: '100%' },
        { cursor: 'pointer', userSelect: 'none' }
      )}
      onPointerDown={handlePointerDown}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        effects.border.radius.xl,
        layout.overflow.hidden,
        {
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.6), rgba(0,0,0,0.8))',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
        }
      )}>
        <PulsingFaderBackground glowColor={glowColor} intensity={intensity} />
        <PulsingFaderCenterLine glowColor={glowColor} intensity={intensity} />

        <div style={composeStyles(
          layout.position.absolute,
          { inset: '8px' },
          effects.border.radius.lg,
          {
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)',
            pointerEvents: 'none',
          }
        )} />
      </div>

      <PulsingFaderThumb
        trackColor={trackColor}
        glowColor={glowColor}
        sliderRatio={sliderRatio}
        intensity={intensity}
        pulse={pulse}
        showDB={showDB}
        showDBBubble={showDBBubble}
        valueToDB={valueToDB}
        value={value}
      >
        {showDB && showDBBubble && (
          <div
            style={composeStyles(
              layout.position.absolute,
              { left: '50%', bottom: '16px' },
              transitions.transform.combine('translateX(-50%)'),
              spacing.px(2),
              spacing.py(1),
              effects.border.radius.md,
              {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.9)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                backdropFilter: 'blur(12px)',
                background: 'rgba(20, 20, 30, 0.85)',
                boxShadow: `0 0 8px ${hexToRgba(glowColor, 0.5)}, inset 0 0 4px rgba(255,255,255,0.15)`,
              }
            )}
          >
            {valueToDB(value)}
          </div>
        )}
      </PulsingFaderThumb>

      <div style={composeStyles(
        layout.position.absolute,
        { top: '12px', bottom: '12px', left: '8px' },
        layout.flex.container('col'),
        layout.flex.justify.between,
        { pointerEvents: 'none' }
      )}>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            style={composeStyles(
              effects.border.radius.full,
              {
                display: 'block',
                width: '4px',
                height: '4px',
                background: 'rgba(255,255,255,0.15)',
                opacity: 0.4 + intensity * 0.2,
              }
            )}
          />
        ))}
      </div>
    </div>
  );
};

// Component for pulsing fader background
const PulsingFaderBackground: React.FC<{
  glowColor: string;
  intensity: number;
}> = ({ glowColor, intensity }) => {
  const pulseOpacity = usePulseAnimation({
    duration: 2200,
    minOpacity: 0.6,
    maxOpacity: 1,
    easing: 'ease-in-out',
  });
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        {
          background: `radial-gradient(circle at 50% 20%, ${hexToRgba(
            glowColor,
            0.25 + intensity * 0.35
          )} 0%, transparent 100%)`,
          opacity: pulseOpacity.opacity,
        }
      )}
    />
  );
};

// Component for pulsing fader center line
const PulsingFaderCenterLine: React.FC<{
  glowColor: string;
  intensity: number;
}> = ({ glowColor, intensity }) => {
  const pulseOpacity = usePulseAnimation({
    duration: 3200,
    minOpacity: 0.3,
    maxOpacity: 0.7,
    easing: 'ease-in-out',
  });
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { left: '50%', top: 0, bottom: 0 },
        {
          width: '1px',
          background: `linear-gradient(180deg, transparent 0%, ${hexToRgba(
            glowColor,
            0.45 + intensity * 0.35
          )} 45%, transparent 100%)`,
          opacity: pulseOpacity.opacity,
        }
      )}
    />
  );
};

// Component for pulsing fader thumb
const PulsingFaderThumb: React.FC<{
  trackColor: string;
  glowColor: string;
  sliderRatio: number;
  intensity: number;
  pulse: number;
  showDB: boolean;
  showDBBubble: boolean;
  valueToDB: (v: number) => string;
  value: number;
  children?: React.ReactNode;
}> = ({ trackColor, glowColor, sliderRatio, intensity, pulse, showDB, showDBBubble, valueToDB, value, children }) => {
  const pulseOpacity = usePulseAnimation({
    duration: 1800,
    minOpacity: 0.95,
    maxOpacity: 1,
    easing: 'ease-in-out',
  });
  const pulseScale = usePulseAnimation({
    duration: 1800,
    minScale: 1,
    maxScale: 1 + pulse * 0.05,
    easing: 'ease-in-out',
  });
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { left: '50%' },
        transitions.transform.combine(`translateX(-50%) scale(${pulseScale.scale})`),
        effects.border.radius.full,
        {
          width: '40px',
          height: '12px',
          top: `${(1 - sliderRatio) * 100}%`,
          background: `linear-gradient(135deg, ${hexToRgba(
            trackColor,
            0.85
          )}, ${hexToRgba(glowColor, 0.75)})`,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: `0 0 18px ${hexToRgba(glowColor, 0.4 + intensity * 0.4)}`,
          opacity: pulseOpacity.opacity,
          backdropFilter: 'blur(4px)',
        }
      )}
    >
      {showDB && showDBBubble && (
        <div
          style={composeStyles(
            layout.position.absolute,
            { left: '50%', bottom: '16px' },
            transitions.transform.combine('translateX(-50%)'),
            spacing.px(2),
            spacing.py(1),
            effects.border.radius.md,
            {
              fontSize: '10px',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.9)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              backdropFilter: 'blur(12px)',
              background: 'rgba(20, 20, 30, 0.85)',
              boxShadow: `0 0 8px ${hexToRgba(glowColor, 0.5)}, inset 0 0 4px rgba(255,255,255,0.15)`,
            }
          )}
        >
          {valueToDB(value)}
        </div>
      )}
      {children}
    </div>
  );
};

export default FlowFader;

