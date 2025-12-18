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
  // Bus control props
  gain?: number; // 0-1.5 (allows +3dB)
  isMuted?: boolean;
  isSoloed?: boolean;
  onGainChange?: (busId: MixerBusId, gain: number) => void;
  onMuteToggle?: (busId: MixerBusId) => void;
  onSoloToggle?: (busId: MixerBusId) => void;
  sidechainActive?: boolean;
  parallelSmash?: number; // 0-1 blend
  onParallelSmashChange?: (busId: MixerBusId, value: number) => void;
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
    // Bus controls
    gain = 1.0,
    isMuted = false,
    isSoloed = false,
    onGainChange,
    onMuteToggle,
    onSoloToggle,
    sidechainActive = false,
    parallelSmash = 0,
    onParallelSmashChange,
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
    const busPulseOpacity = usePulseAnimation(0.6, 1, 1800);
    const busPulseScale = usePulseAnimation(1, 1 + alsPulse * 0.04, 1800);

    // Pulsing intensity bar
    const intensityBarPulseOpacity = usePulseAnimation(0.6, 1, 1800);

    // Member indicator component with pulse
    const MemberIndicator: React.FC<{ memberId: string }> = ({ memberId }) => {
      const memberPulseOpacity = usePulseAnimation(
        0.5,
        1,
        2000 + Math.random() * 1000
      );

      return (
        <span
          style={composeStyles(
            layout.width.full,
            layout.height.custom(5),
            layout.flex.container('row') as React.CSSProperties,
            layout.flex.align.center as React.CSSProperties,
            layout.flex.justify.center as React.CSSProperties,
            spacing.px(2),
            spacing.py(1),
            effects.border.radius.md,
            typography.transform('uppercase') as React.CSSProperties,
            typography.tracking.widest as React.CSSProperties,
            {
              border: '1px solid rgba(102, 140, 198, 0.45)',
              background: 'rgba(6,14,28,0.78)',
              fontSize: '0.6875rem', // 11px minimum
              color: '#e6f0ff',
              opacity: memberPulseOpacity,
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
          layout.flex.container('col') as React.CSSProperties,
          layout.flex.align.center as React.CSSProperties,
          effects.border.radius.xl,
          effects.backdrop.blur('strong'),
          layout.overflow.hidden,
          transitions.transition.standard('all', 200, 'ease-out') as React.CSSProperties,
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
          } as React.CSSProperties
        )}
        onClick={() => onSelectBus?.(busId)}
      >
        <div style={composeStyles(
          layout.width.full,
          spacing.px(3),
          spacing.pt(3),
          layout.flex.container('row') as React.CSSProperties,
          layout.flex.align.center,
          layout.flex.justify.between,
          typography.preset.label() as React.CSSProperties,
          {
            // Professional label styling
          }
        )}>
          <span className="flex items-center gap-2">
            {name}
            {sidechainActive && (
              <span 
                className="px-1 py-0.5 rounded-[2px] text-[7px] bg-magenta-500/20 text-magenta-400 border border-magenta-500/30 animate-pulse flex items-center gap-0.5"
                title="Sidechain Ducking Active"
                style={{
                  boxShadow: `0 0 8px ${hexToRgba('#e879f9', 0.45)}`,
                  textShadow: `0 0 4px ${hexToRgba('#e879f9', 0.85)}`
                }}
              >
                DYN SC
              </span>
            )}
          </span>
          <span style={{ 
            color: 'rgba(230, 240, 255, 0.65)',
            fontWeight: '500',
          }}>{members.length}</span>
        </div>

        {/* Bus Meter - Shows actual bus audio level */}
        <div style={composeStyles(
          layout.width.full,
          layout.flex.container('row') as React.CSSProperties,
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
            layout.flex.container('row') as React.CSSProperties,
            layout.flex.align.center,
            layout.flex.justify.center,
            effects.border.radius.full,
            spacing.mt(2),
            typography.preset.label() as React.CSSProperties,
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
              opacity: busPulseOpacity,
              transform: `scale(${busPulseScale})`,
            } as React.CSSProperties
          )}
        >
          BUS
        </div>

        {/* Solo / Mute Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '6px',
          marginTop: '8px',
          justifyContent: 'center',
        }}>
          {/* Solo Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSoloToggle?.(busId);
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: isSoloed 
                ? '1px solid rgba(253, 224, 71, 0.8)' 
                : '1px solid rgba(139, 92, 246, 0.3)',
              background: isSoloed 
                ? 'linear-gradient(180deg, rgba(253, 224, 71, 0.25), rgba(234, 179, 8, 0.15))'
                : 'rgba(15, 15, 26, 0.75)',
              color: isSoloed ? '#fde047' : 'rgba(241, 245, 249, 0.6)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isSoloed 
                ? '0 0 12px rgba(253, 224, 71, 0.4)' 
                : 'none',
            }}
            aria-pressed={isSoloed}
            aria-label="Solo Bus"
          >
            S
          </button>
          
          {/* Mute Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle?.(busId);
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: isMuted 
                ? '1px solid rgba(248, 113, 113, 0.8)' 
                : '1px solid rgba(139, 92, 246, 0.3)',
              background: isMuted 
                ? 'linear-gradient(180deg, rgba(248, 113, 113, 0.25), rgba(239, 68, 68, 0.15))'
                : 'rgba(15, 15, 26, 0.75)',
              color: isMuted ? '#f87171' : 'rgba(241, 245, 249, 0.6)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isMuted 
                ? '0 0 12px rgba(248, 113, 113, 0.4)' 
                : 'none',
            }}
            aria-pressed={isMuted}
            aria-label="Mute Bus"
          >
            M
          </button>
        </div>

        {/* Gain Fader */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
          padding: '0 8px',
        }}>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.01}
            value={gain}
            onChange={(e) => onGainChange?.(busId, parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '4px',
              cursor: 'pointer',
              accentColor: '#8B5CF6',
            }}
            aria-label="Bus Gain"
          />
          <span style={{
            fontSize: '9px',
            color: 'rgba(241, 245, 249, 0.5)',
            fontWeight: 500,
          }}>
            {gain >= 1 ? `+${((gain - 1) * 6).toFixed(1)}dB` : `${((gain - 1) * 6).toFixed(1)}dB`}
          </span>
        </div>

        {/* Parallel SMASH Control - Only for Drums */}
        {busId === 'velvet-floor' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(232, 121, 249, 0.05)',
            border: '1px solid rgba(232, 121, 249, 0.15)',
            borderRadius: '12px',
            width: '85%',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '2px',
            }}>
              <span style={composeStyles(
                typography.transform('uppercase') as React.CSSProperties,
                typography.tracking.widest as React.CSSProperties,
                { fontSize: '8px', color: '#e879f9', fontWeight: '700' }
              )}>Smash</span>
              <span style={{ fontSize: '8px', color: 'rgba(232, 121, 249, 0.6)' }}>
                {Math.round(parallelSmash * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={parallelSmash}
              onChange={(e) => onParallelSmashChange?.(busId, parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                height: '3px',
                cursor: 'pointer',
                accentColor: '#e879f9',
              }}
              aria-label="Parallel Smash Blend"
            />
          </div>
        )}

        <div style={composeStyles(
          { flex: 1 },
          layout.width.full,
          spacing.px(2),
          spacing.pt(3),
          layout.flex.container('col') as React.CSSProperties,
          layout.flex.justify.between,
          spacing.gap(2) as React.CSSProperties
        )}>
          {/* Intensity bar - shows bus level or send intensity */}
          <div style={composeStyles(
            layout.position.relative as React.CSSProperties,
            layout.overflow.hidden,
            effects.border.radius.full,
            {
              height: '4px',
              background: 'rgba(9,18,36,0.6)',
            }
          )}>
            <div
              style={composeStyles(
                layout.position.absolute as React.CSSProperties,
                { top: 0, bottom: 0, left: 0 } as React.CSSProperties,
                effects.border.radius.full,
                {
                  width: `${displayLevel * 100}%`,
                  background: `linear-gradient(90deg, ${hexToRgba(
                    alsColor,
                    Math.min(0.6 + displayLevel * 0.3, 1)
                  )}, ${hexToRgba(glowSource, glowAlpha)})`,
                  boxShadow: `0 0 12px ${hexToRgba(glowSource, glowAlpha)}`,
                  opacity: intensityBarPulseOpacity,
                } as React.CSSProperties
              )}
            />
          </div>

          <div
            style={composeStyles(
              layout.grid.container(2) as React.CSSProperties,
              {
                gap: `${MIXER_STRIP_GAP_PX}px`,
              } as React.CSSProperties
            )}
          >
            {members.slice(0, 4).map((memberId) => (
              <MemberIndicator key={memberId} memberId={memberId} />
            ))}
            {members.length > 4 && (
              <span style={composeStyles(
                layout.width.full,
                layout.height.custom(5),
                layout.flex.container('row') as React.CSSProperties,
                layout.flex.align.center,
                layout.flex.justify.center,
                spacing.px(2),
                spacing.py(1),
                effects.border.radius.md,
                typography.transform('uppercase') as React.CSSProperties,
                typography.tracking.widest as React.CSSProperties,
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
            layout.position.relative as React.CSSProperties,
            layout.overflow.hidden,
            effects.border.radius.full,
            {
              height: '4px',
              background: 'rgba(9,18,36,0.6)',
            }
          )}>
            <div
              style={composeStyles(
                layout.position.absolute as React.CSSProperties,
                { top: 0, bottom: 0, left: 0 } as React.CSSProperties,
                effects.border.radius.full,
                {
                  width: `${Math.min(1, alsIntensity * 1.25) * 100}%`,
                  background: `linear-gradient(90deg, ${hexToRgba(
                    alsColor,
                    Math.min(0.45 + alsIntensity * 0.4, 1)
                  )}, ${hexToRgba(glowSource, glowAlpha)})`,
                  boxShadow: `0 0 12px ${hexToRgba(glowSource, glowAlpha)}`,
                  opacity: intensityBarPulseOpacity,
                } as React.CSSProperties
              )}
            />
          </div>
          <div style={composeStyles(
            spacing.mt(1),
            layout.flex.container('row') as React.CSSProperties,
            layout.flex.align.center,
            layout.flex.justify.center,
            spacing.gap(1.5) as React.CSSProperties
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
                typography.transform('uppercase') as React.CSSProperties,
                typography.tracking.widest as React.CSSProperties,
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
