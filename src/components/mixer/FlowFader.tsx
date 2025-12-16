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
  const dragStartRef = useRef<{ y: number; value: number } | null>(null);
  
  // Calculate position directly - NO animation during drag for instant response
  const sliderRatio = clamp(value / 1.2, 0, 1);

  // Professional fader interaction: click-to-jump (direct), drag with fine/coarse control
  const handlePointerValue = useCallback(
    (clientY: number, isInitialClick: boolean = false, isFineTuning: boolean = false, isCoarseTuning: boolean = false) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relative = 1 - (clientY - rect.top) / rect.height;
      const targetValue = clamp(relative * 1.2, 0, 1.2);
      
      if (isInitialClick) {
        // Click anywhere: jump directly to position (1:1, professional standard)
        onChange(Number(targetValue.toFixed(3)));
        dragStartRef.current = { y: clientY, value: targetValue };
      } else if (dragStartRef.current) {
        // Drag: move relative to start position with fine/coarse control
        const deltaY = dragStartRef.current.y - clientY;
        const pixelsPerUnit = rect.height / 1.2; // Full range in pixels
        
        // Professional sensitivity: 1:1 pixel mapping by default
        // Fine: 0.25x (Shift), Coarse: 4x (Cmd/Ctrl)
        let sensitivity = 1.0;
        if (isFineTuning) sensitivity = 0.25;
        if (isCoarseTuning) sensitivity = 4.0;
        
        const deltaValue = (deltaY / pixelsPerUnit) * sensitivity;
        const newValue = clamp(dragStartRef.current.value + deltaValue, 0, 1.2);
        onChange(Number(newValue.toFixed(3)));
      }
    },
    [onChange]
  );

  // Convert value to doctrine-compliant level (no raw dB!)
  // FLOW Doctrine: temperature/energy vocabulary
  const valueToLevel = (v: number): string => {
    if (v === 0) return "Silent";
    if (v < 0.1) return "Whisper";
    if (v < 0.25) return "Soft";
    if (v < 0.5) return "Moderate";
    if (v < 0.7) return "Present";
    if (v < 0.85) return "Warm";
    if (v < 0.95) return "Hot";
    if (v < 1.1) return "Peak";
    return "Limit";
  };

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      containerRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      if (showDB) setShowDBBubble(true);
      // Initial click: jump directly to position (professional standard)
      handlePointerValue(event.clientY, true, false, false);
    },
    [handlePointerValue, showDB]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const isFineTuning = event.shiftKey;
      const isCoarseTuning = event.metaKey || event.ctrlKey;
      // Drag: move relative to start with fine/coarse control
      handlePointerValue(event.clientY, false, isFineTuning, isCoarseTuning);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
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

  // Calculate position directly - NO animation during drag for instant response
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
          width: '24px', // Wider track for immersive 40px cap
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
      
      {/* Fader fill - instant during drag, fast snap after */}
      <div style={composeStyles(
        layout.position.absolute,
        { bottom: 0, left: 0, right: 0 },
        {
          height: `${sliderRatio * 100}%`,
          background: `linear-gradient(180deg, ${hexToRgba(trackColor, 0.6)}, ${hexToRgba(glowColor, 0.3)})`,
          boxShadow: `0 0 ${4 + intensity * 6}px ${hexToRgba(glowColor, 0.3)}`,
          borderRadius: '12px',
          // Instant during drag, fast snap after
          transition: isDragging ? 'none' : 'height 60ms ease-out, box-shadow 80ms ease-out',
          willChange: isDragging ? 'height' : 'auto',
        }
      )} />

      <PulsingFaderThumb
        trackColor={trackColor}
        glowColor={glowColor}
        sliderRatio={sliderRatio}
        intensity={intensity}
        pulse={pulse}
        showDB={showDB}
        showDBBubble={showDBBubble}
        valueToLevel={valueToLevel}
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
            {valueToLevel(value)}
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
  valueToLevel: (v: number) => string;
  value: number;
  children?: React.ReactNode;
}> = ({ trackColor, glowColor, sliderRatio, intensity, pulse, showDB, showDBBubble, valueToLevel, value, children }) => {
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
  // Professional fader cap: instant position, fast visual transitions
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { left: '50%' },
        {
          width: '40px',  // Wider immersive cap (Logic/Pro Tools/Ableton standard)
          height: '12px', // Taller professional cap
          top: `${(1 - sliderRatio) * 100}%`,
          borderRadius: '6px', // Subtle rounding
          // ALS-driven gradient: intensity affects color saturation
          background: `linear-gradient(180deg, 
            ${hexToRgba(trackColor, 0.8 + intensity * 0.15)}, 
            ${hexToRgba(glowColor, 0.6 + intensity * 0.15)}
          )`,
          // Temperature-driven border with ALS intensity
          border: `1px solid ${hexToRgba(glowColor, 0.25 + intensity * 0.3)}`,
          // ALS pulse-driven glow + professional depth
          boxShadow: `
            0 0 ${8 + pulse * 16}px ${hexToRgba(glowColor, 0.3 + pulse * 0.4)},
            0 2px 4px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
          opacity: pulseOpacity.opacity,
          // Instant position - NO transition on top/transform
          // Fast transitions for visual properties only
          transition: 'box-shadow 80ms ease-out, border-color 80ms ease-out, background 80ms ease-out, opacity 80ms ease-out',
          transform: 'translateX(-50%)',
          // Performance optimization
          willChange: 'top, box-shadow',
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
          {valueToLevel(value)}
        </div>
      )}
      {children}
    </div>
  );
};

export default FlowFader;

