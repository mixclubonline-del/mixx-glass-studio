/**
 * FLOW BUS STRIP - MixClub Routing Channel
 *
 * Compact bus strip showing ALS-driven energy,
 * member count, and quick solo controls.
 *
 * Doctrine: ALS is law, Flow-conscious, Reductionist
 */

import React, { memo } from "react";
import { useFlowMotion, usePulseAnimation } from "../mixxglass";
import { MixxGlassMeter } from "../mixxglass";
import type { MixerBusId } from "../../App";
import { hexToRgba } from "../../utils/ALS";
import {
  MIXER_STRIP_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_GAP_PX,
} from "./mixerConstants";
import { spacing, typography, layout, effects, transitions, composeStyles } from "../../design-system";

export interface FlowBusStripProps {
  busId: MixerBusId;
  name: string;
  members: string[];
  alsIntensity: number;
  alsPulse: number;
  alsColor: string;
  alsGlow: string;
  alsHaloColor?: string;
  alsGlowStrength?: number;
  busLevel?: number; // Actual bus audio level (0-1) from analyser
  busPeak?: number; // Peak level from analyser
  busTransient?: boolean; // Transient detection
  onSelectBus?: (busId: MixerBusId) => void;
  isActive?: boolean;
}

const FlowBusStrip: React.FC<FlowBusStripProps> = memo(
  ({
    busId,
    name,
    members,
    alsIntensity,
    alsPulse,
    alsColor,
    alsGlow,
    alsHaloColor,
    alsGlowStrength,
    busLevel,
    busPeak,
    busTransient,
    onSelectBus,
    isActive,
  }) => {
    const stripWidth = {
      width: `${MIXER_STRIP_WIDTH}px`,
      minWidth: `${MIXER_STRIP_MIN_WIDTH}px`,
      maxWidth: `${MIXER_STRIP_MAX_WIDTH}px`,
    };

    const glowSource = alsHaloColor ?? alsGlow;
    const glowAlpha = Math.min(Math.max(alsGlowStrength ?? (0.25 + alsIntensity * 0.35), 0), 1);
    
    // Use actual bus level if available, otherwise fall back to send-based intensity
    const displayLevel = busLevel !== undefined ? busLevel : alsIntensity;
    const displayPeak = busPeak !== undefined ? busPeak : alsIntensity;
    const displayTransient = busTransient ?? false;

    // Animated entrance and selection
    const entranceStyle = useFlowMotion(
      { opacity: 1, scale: isActive ? 1.03 : 1 },
      { duration: 250, easing: 'ease-out' }
    );

    // Pulsing BUS indicator
    const busPulse = usePulseAnimation({
      duration: 1800,
      minOpacity: 0.6,
      maxOpacity: 1,
      minScale: 1,
      maxScale: 1 + alsPulse * 0.04,
    });

    // Pulsing intensity bar
    const intensityBarPulse = usePulseAnimation({
      duration: 1800,
      minOpacity: 0.6,
      maxOpacity: 1,
    });

    // Member indicator component with pulse
    const MemberIndicator: React.FC<{ memberId: string }> = ({ memberId }) => {
      const memberPulse = usePulseAnimation({
        duration: 2000 + Math.random() * 1000,
        minOpacity: 0.5,
        maxOpacity: 1,
      });

      return (
        <span
          style={composeStyles(
            layout.width.full,
            layout.height(5),
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.center,
            spacing.px(2),
            spacing.py(1),
            effects.border.radius.md,
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              border: '1px solid rgba(102, 140, 198, 0.45)',
              background: 'rgba(6,14,28,0.78)',
              fontSize: '0.6875rem', // 11px minimum
              color: '#e6f0ff',
              opacity: memberPulse.opacity,
            }
          )}
        >
          {memberId.slice(0, 3)}
        </span>
      );
    };

    return (
      <div
        style={composeStyles(
          layout.flex.container('col'),
          layout.flex.align.center,
          effects.border.radius.xl,
          effects.backdrop.blur('2xl'),
          effects.overflow.hidden,
          transitions.transition.standard('all', 200, 'ease-out'),
          {
            background: 'rgba(9, 18, 36, 0.82)',
            border: isActive
              ? '1px solid rgba(103, 232, 249, 0.7)'
              : '1px solid rgba(102, 140, 198, 0.45)',
            boxShadow: isActive
              ? '0 0 34px rgba(56,189,248,0.45)'
              : '0 18px 60px rgba(4,12,26,0.48)',
            color: '#e6f0ff',
            cursor: 'pointer',
            opacity: entranceStyle.opacity,
            transform: `scale(${entranceStyle.scale})`,
            ...stripWidth,
          }
        )}
        onClick={() => onSelectBus?.(busId)}
      >
        <div style={composeStyles(
          layout.width.full,
          spacing.px(3),
          spacing.pt(3),
          layout.flex.container('row'),
          layout.flex.align.center,
          layout.flex.justify.between,
          typography.preset.label(),
          {
            // Professional label styling
          }
        )}>
          <span>{name}</span>
          <span style={{ 
            color: 'rgba(230, 240, 255, 0.65)',
            fontWeight: '500',
          }}>{members.length}</span>
        </div>

        {/* Bus Meter - Shows actual bus audio level */}
        <div style={composeStyles(
          layout.width.full,
          layout.flex.container('row'),
          layout.flex.align.end,
          layout.flex.justify.center,
          spacing.px(2),
          spacing.py(2),
          effects.border.radius.xl,
          {
            border: '1px solid rgba(102, 140, 198, 0.45)',
            background: 'rgba(8,18,34,0.72)',
            height: '64px',
          }
        )}>
          <MixxGlassMeter
            level={Math.min(1, Math.max(0, displayLevel))}
            peak={Math.min(1, Math.max(displayLevel, displayPeak))}
            transient={displayTransient}
            alsChannel="pressure"
            color={alsColor}
            glowColor={alsGlow}
            height={48}
            width={32}
          />
        </div>

        <div
          style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.center,
            effects.border.radius.full,
            spacing.mt(2),
            typography.preset.label(),
            {
              width: '36px',
              height: '36px',
              border: '1px solid rgba(102, 140, 198, 0.35)',
              fontSize: '0.6875rem', // 11px minimum
              color: 'rgba(230, 240, 255, 0.85)',
              boxShadow: `0 2px 8px ${hexToRgba(glowSource, glowAlpha * 0.4)}`,
              background: `radial-gradient(circle, ${hexToRgba(
                glowSource,
                glowAlpha * 0.6
              )} 0%, transparent 70%)`,
              opacity: busPulse.opacity,
              transform: `scale(${busPulse.scale})`,
            }
          )}
        >
          BUS
        </div>

        <div style={composeStyles(
          { flex: 1 },
          layout.width.full,
          spacing.px(2),
          spacing.pt(3),
          layout.flex.container('col'),
          layout.flex.justify.between,
          spacing.gap(2)
        )}>
          {/* Intensity bar - shows bus level or send intensity */}
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
                { top: 0, bottom: 0, left: 0 },
                effects.border.radius.full,
                {
                  width: `${displayLevel * 100}%`,
                  background: `linear-gradient(90deg, ${hexToRgba(
                    alsColor,
                    Math.min(0.6 + displayLevel * 0.3, 1)
                  )}, ${hexToRgba(glowSource, glowAlpha)})`,
                  boxShadow: `0 0 12px ${hexToRgba(glowSource, glowAlpha)}`,
                  opacity: intensityBarPulse.opacity,
                }
              )}
            />
          </div>

          <div
            style={composeStyles(
              layout.grid.container(2),
              {
                gap: `${MIXER_STRIP_GAP_PX}px`,
              }
            )}
          >
            {members.slice(0, 4).map((memberId) => (
              <MemberIndicator key={memberId} memberId={memberId} />
            ))}
            {members.length > 4 && (
              <span style={composeStyles(
                layout.width.full,
                layout.height(5),
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.center,
                spacing.px(2),
                spacing.py(1),
                effects.border.radius.md,
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  border: '1px solid rgba(102, 140, 198, 0.45)',
                  background: 'rgba(6,14,28,0.78)',
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(230, 240, 255, 0.7)',
                }
              )}>
                +{members.length - 4}
              </span>
            )}
          </div>
        </div>

        <div style={composeStyles(
          layout.width.full,
          spacing.px(2),
          spacing.pb(3)
        )}>
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
                { top: 0, bottom: 0, left: 0 },
                effects.border.radius.full,
                {
                  width: `${Math.min(1, alsIntensity * 1.25) * 100}%`,
                  background: `linear-gradient(90deg, ${hexToRgba(
                    alsColor,
                    Math.min(0.45 + alsIntensity * 0.4, 1)
                  )}, ${hexToRgba(glowSource, glowAlpha)})`,
                  boxShadow: `0 0 12px ${hexToRgba(glowSource, glowAlpha)}`,
                  opacity: intensityBarPulse.opacity,
                }
              )}
            />
          </div>
          <div style={composeStyles(
            spacing.mt(1),
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.center,
            spacing.gap(1.5)
          )}>
            {members.slice(0, 4).map((memberId, index) => (
              <span
                key={memberId}
                style={composeStyles(
                  effects.border.radius.full,
                  {
                    width: '6px',
                    height: '6px',
                    background: hexToRgba(alsColor, 0.55 + index * 0.1),
                    boxShadow: `0 0 6px ${hexToRgba(glowSource, glowAlpha * 0.8)}`,
                    opacity: 0.5 + alsIntensity * 0.5,
                  }
                )}
              />
            ))}
            {members.length > 4 && (
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(230, 240, 255, 0.55)',
                }
              )}>
                +{members.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FlowBusStrip.displayName = "FlowBusStrip";

export default FlowBusStrip;
