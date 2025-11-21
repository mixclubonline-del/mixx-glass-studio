import React, { useLayoutEffect, useMemo, useRef, useEffect, useState } from "react";
import clsx from "clsx";
import type { PrimeBrainStatus } from "../types/primeBrainStatus";
import { PrimeBrainIcon } from "./flowdock/glyphs/PrimeBrainIcon";
import AudioStatusIndicator from "./AudioStatusIndicator";
import { useFlowComponent } from "../core/flow/useFlowComponent";

interface HeaderProps {
  primeBrainStatus: PrimeBrainStatus;
  hushFeedback: { color: string; intensity: number; isEngaged: boolean; noiseCount?: number };
  isPlaying: boolean;
  audioContext: AudioContext | null;
  masterInput?: AudioNode | null;
  onHeightChange?: (height: number) => void;
  className?: string;
}

/**
 * Adaptive Waveform ALS Display - Flow Doctrine
 * 
 * Like a waveform: information only when necessary
 * Morphs from waveform → text when information needed
 * Energy-driven transitions
 * Dissolves back to waveform when not needed
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */
const Header: React.FC<HeaderProps> = ({
  primeBrainStatus,
  hushFeedback,
  isPlaying,
  audioContext,
  masterInput,
  onHeightChange,
  className,
}) => {
  const { mode, modeCaption, guidanceLine, bloomSummary, lastAction, health, alsChannels } = primeBrainStatus;
  const guidance = guidanceLine ?? bloomSummary ?? lastAction ?? "Flow is standing by.";
  const containerRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Initialize waveform points with default values
  const defaultWaveformPoints = useMemo(() => {
    const width = 800;
    const height = 60;
    const pointCount = 120;
    const points: number[] = [];
    
    for (let i = 0; i < pointCount; i++) {
      const x = (i / pointCount) * width;
      const y = height / 2 + Math.sin((i / pointCount) * Math.PI * 4) * 10;
      points.push(x, y);
    }
    
    return points;
  }, []);

  const [waveformPoints, setWaveformPoints] = useState<number[]>(defaultWaveformPoints);
  // FORCE waveform as initial state - text is hidden by default
  const [morphState, setMorphState] = useState<'waveform' | 'text' | 'transitioning'>('waveform');
  const [textOpacity, setTextOpacity] = useState(0); // HIDDEN by default
  const [waveformOpacity, setWaveformOpacity] = useState(1); // VISIBLE by default

  // Calculate overall energy from ALS channels
  const totalEnergy = useMemo(() => {
    return alsChannels.reduce((sum, channel) => sum + channel.value, 0) / alsChannels.length;
  }, [alsChannels]);

  // Prime Brain controls display decisions through Flow signals
  // We track the decision state from Prime Brain
  const [primeBrainDecision, setPrimeBrainDecision] = useState<{ showText: boolean; duration?: number } | null>(null);

  // Generate waveform points from ALS channels
  useEffect(() => {
    const width = 800; // Fixed viewBox width
    const height = 60;
    const pointCount = 120; // Smooth waveform
    const points: number[] = [];

    // Generate waveform based on ALS channel values
    for (let i = 0; i < pointCount; i++) {
      const x = (i / pointCount) * width;
      const channelIndex = Math.floor((i / pointCount) * Math.max(1, alsChannels.length));
      const channel = alsChannels[channelIndex] || alsChannels[0] || { value: 0.1 };
      const baseValue = channel.value || 0.1;
      
      // Add smooth variation based on energy
      const variation = Math.sin((i / pointCount) * Math.PI * 4) * 0.15;
      const energyMultiplier = totalEnergy > 0 ? totalEnergy : 0.1;
      const y = height / 2 + (baseValue * height * 0.25 * energyMultiplier) + (variation * height * 0.15);
      
      points.push(x);
      points.push(y);
    }

    setWaveformPoints(points);
  }, [alsChannels, totalEnergy]);

  // Morph between waveform and text based on Prime Brain's decision
  // Prime Brain controls this through Flow signals
  useEffect(() => {
    if (!primeBrainDecision) {
      // No decision yet - default to waveform
      if (morphState !== 'waveform') {
        setMorphState('transitioning');
        setTimeout(() => {
          setTextOpacity(0);
          setWaveformOpacity(1);
          setMorphState('waveform');
        }, 300);
      }
      return;
    }

    const { showText, duration } = primeBrainDecision;

    if (showText && morphState === 'waveform') {
      setMorphState('transitioning');
      setTimeout(() => {
        setWaveformOpacity(0);
        setTextOpacity(1);
        setMorphState('text');
      }, 300);

      // Auto-return to waveform after duration if specified
      if (duration) {
        setTimeout(() => {
          setPrimeBrainDecision({ showText: false });
        }, duration);
      }
    } else if (!showText && morphState === 'text') {
      setMorphState('transitioning');
      setTimeout(() => {
        setTextOpacity(0);
        setWaveformOpacity(1);
        setMorphState('waveform');
      }, 300);
    }
  }, [primeBrainDecision, morphState]);

  // Calculate header opacity based on activity
  const headerOpacity = useMemo(() => {
    if (primeBrainDecision?.showText || totalEnergy > 0.1) return 1;
    return 0.3; // Very subtle when idle
  }, [primeBrainDecision, totalEnergy]);

  useLayoutEffect(() => {
    if (!onHeightChange) return;
    const node = containerRef.current;
    if (!node) return;

    const notify = () => {
      onHeightChange(node.offsetHeight);
    };

    notify();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", notify);
      return () => window.removeEventListener("resize", notify);
    }

    const observer = new ResizeObserver(() => notify());
    observer.observe(node);
    return () => observer.disconnect();
  }, [onHeightChange, morphState]);

  // Get dominant ALS channel for waveform color
  const dominantChannel = useMemo(() => {
    if (alsChannels.length === 0) return null;
    return alsChannels.reduce((max, channel) => 
      channel.value > max.value ? channel : max
    );
  }, [alsChannels]);

  const waveformColor = dominantChannel?.accent || 'rgba(148, 163, 255, 0.8)';
  const waveformAura = dominantChannel?.aura || 'rgba(148, 163, 255, 0.4)';

  // Register Header/ALS Display with Flow system
  // Passive component - listens to Prime Brain, displays state
  const { broadcast } = useFlowComponent({
    id: 'als-header-display',
    type: 'als',
    name: 'ALS Adaptive Waveform Display',
    broadcasts: [
      'als_display_state', // Broadcast when morphing between waveform/text
      'als_visibility_change', // Broadcast visibility changes
    ],
    listens: [
      {
        signal: 'als_display_decision',
        callback: (payload: any) => {
          // Prime Brain tells us when to show text vs waveform
          // This is the decision from the decision engine
          const decision = payload as { showText: boolean; priority: string; reason: string; duration?: number };
          
          // Store decision
          setPrimeBrainDecision({ showText: decision.showText, duration: decision.duration });
        },
      },
      {
        signal: 'prime_brain_guidance',
        callback: (payload: any) => {
          // Prime Brain guidance updates
          // Already handled by primeBrainStatus prop
        },
      },
    ],
  });

  // Broadcast display state changes
  useEffect(() => {
    broadcast('als_display_state', {
      state: morphState,
      showingText: primeBrainDecision?.showText || false,
      waveformOpacity,
      textOpacity,
    });
  }, [morphState, primeBrainDecision, waveformOpacity, textOpacity, broadcast]);

  return (
    <header
      ref={containerRef}
      className={clsx(
        "fixed top-0 left-0 right-0 z-40 border-b border-white/10 backdrop-blur-2xl transition-all duration-700 ease-out",
        className
      )}
      style={{
        backgroundColor: `rgba(6,9,20,${headerOpacity * 0.78})`,
        opacity: Math.max(0.3, headerOpacity),
      }}
    >
      <div className="relative h-20 overflow-hidden">
        {/* Adaptive Waveform - Base layer (ALWAYS visible by default) */}
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{ 
            opacity: waveformOpacity,
            pointerEvents: waveformOpacity > 0.5 ? 'auto' : 'none',
          }}
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox="0 0 800 60"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={waveformColor} stopOpacity="0.8" />
                <stop offset="50%" stopColor={waveformAura} stopOpacity="0.6" />
                <stop offset="100%" stopColor={waveformColor} stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {waveformPoints.length >= 4 && (
              <>
                <path
                  d={(() => {
                    if (waveformPoints.length < 4) return '';
                    let path = `M ${waveformPoints[0]} ${waveformPoints[1]}`;
                    for (let i = 2; i < waveformPoints.length - 1; i += 2) {
                      const x = waveformPoints[i];
                      const y = waveformPoints[i + 1];
                      if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
                        path += ` L ${x} ${y}`;
                      }
                    }
                    return path;
                  })()}
                  fill="none"
                  stroke="url(#waveformGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  style={{
                    transition: 'all 0.3s ease-out',
                  }}
                />
                {/* Mirror waveform for stereo effect */}
                <path
                  d={(() => {
                    if (waveformPoints.length < 4) return '';
                    const centerY = 30;
                    let path = `M ${waveformPoints[0]} ${centerY - (waveformPoints[1] - centerY)}`;
                    for (let i = 2; i < waveformPoints.length - 1; i += 2) {
                      const x = waveformPoints[i];
                      const y = waveformPoints[i + 1];
                      if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
                        const mirroredY = centerY - (y - centerY);
                        path += ` L ${x} ${mirroredY}`;
                      }
                    }
                    return path;
                  })()}
                  fill="none"
                  stroke="url(#waveformGradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.5"
                  filter="url(#glow)"
                  style={{
                    transition: 'all 0.3s ease-out',
                  }}
                />
              </>
            )}
          </svg>
        </div>

        {/* Text Information - Morphs from waveform when needed (HIDDEN by default) */}
        {primeBrainDecision?.showText && (
          <div 
            className="absolute inset-0 flex items-center px-6 transition-opacity duration-500"
            style={{ 
              opacity: textOpacity,
              pointerEvents: textOpacity > 0.5 ? 'auto' : 'none',
            }}
          >
          <div className="flex w-full items-center justify-between">
            {/* Left: Prime Brain Status */}
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-[0_0_18px_rgba(148,163,255,0.55)]">
                <PrimeBrainIcon className="w-4 h-4 text-indigo-200" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.4em] text-white/50">Prime Brain · ALS</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold tracking-wide">{mode}</span>
                  {modeCaption && (
                    <span className="text-xs uppercase tracking-[0.3em] text-white/50">{modeCaption}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Guidance */}
            <div className="flex-1 px-8 text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-1">Guidance</div>
              <div className="text-sm text-white/80 line-clamp-1">{guidance}</div>
            </div>

            {/* Right: Contextual Indicators */}
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em]">
              {/* Health - Only when meaningful */}
              {((health.energy ?? 0) > 0.2 || (health.flow ?? 0) > 0.2) && (
                <div
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
                  style={{
                    boxShadow: `0 0 12px ${health.glowColor}`,
                    color: health.color,
                  }}
                >
                  <span className="text-[10px] text-white/50">Health</span>
                  <span className="text-xs">{health.caption}</span>
                </div>
              )}

              {/* Audio Status */}
              <AudioStatusIndicator 
                audioContext={audioContext} 
                masterInput={masterInput}
              />

              {/* Hush - Only when active */}
              {hushFeedback.isEngaged && (
                <div
                  className={clsx(
                    "flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5",
                    "text-emerald-200"
                  )}
                  style={{
                    background: `linear-gradient(90deg, ${hushFeedback.color}22, ${hushFeedback.color}55)`,
                  }}
                >
                  <span className="text-xs">HUSH</span>
                </div>
              )}

              {/* Playback - Only when playing */}
              {isPlaying && (
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 border bg-emerald-500/15 text-emerald-200 border-emerald-400/40">
                  <span className="text-xs">LIVE</span>
                  <span className="inline-flex h-2 w-2 rounded-full bg-current animate-pulse" />
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Energy Indicator - Subtle pulse when active */}
        {totalEnergy > 0.1 && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 transition-opacity duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${waveformColor}, transparent)`,
              opacity: totalEnergy * 0.6,
              boxShadow: `0 0 20px ${waveformAura}`,
            }}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
