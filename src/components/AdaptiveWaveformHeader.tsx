/**
 * AdaptiveWaveformHeader
 * 
 * Flow-conscious header that communicates through waveform visualization.
 * - Shows information only when necessary (guidance, health alerts, active states)
 * - Fades into ambient waveform when idle
 * - Communicates through color, temperature, motion, and form (not raw numbers)
 * - Driven by ALS channel data for organic, responsive visualization
 * 
 * States:
 * - Ambient: Smooth, low-energy waveform when idle
 * - Active: Waveform responds to ALS channels, shows guidance when needed
 * - Alert: Heightened waveform with thermal colors for health/hush states
 */

import React, { useEffect, useLayoutEffect, useRef, useMemo, useState, useCallback } from "react";
import type { PrimeBrainStatus } from "../types/primeBrainStatus";
import { PrimeBrainIcon } from "./flowdock/glyphs/PrimeBrainIcon";
import { hexToRgba } from "../utils/ALS";
import type { WaveformHeaderSettings } from "../types/waveformHeaderSettings";
import { DEFAULT_WAVEFORM_HEADER_SETTINGS } from "../types/waveformHeaderSettings";
import { spacing, typography, layout, effects, transitions, composeStyles } from "../design-system";
import { ALSSpine } from "./transport/ALSSpine";

interface AdaptiveWaveformHeaderProps {
  primeBrainStatus: PrimeBrainStatus;
  hushFeedback: { color: string; intensity: number; isEngaged: boolean; noiseCount?: number };
  isPlaying: boolean;
  masterAnalysis?: { level: number; peak?: number; transient?: boolean };
  loudnessMetrics?: { momentaryLUFS?: number; shortTermLUFS?: number; integratedLUFS?: number };
  onHeightChange?: (height: number) => void;
  className?: string;
  settings?: WaveformHeaderSettings;
}

// Helper to extract RGB from rgba string
const extractRGB = (rgbaString: string): { r: number; g: number; b: number } => {
  const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }
  // Fallback for hex colors
  if (rgbaString.startsWith('#')) {
    const hex = rgbaString.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }
  return { r: 150, g: 120, b: 255 }; // Default fallback
};

// Helper to create rgba string with new alpha
const rgbaWithAlpha = (color: string, alpha: number): string => {
  const rgb = extractRGB(color);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

// Thermal color mapping for waveform
const getThermalGradient = (temperature: string, intensity: number = 1): string[] => {
  const alpha = Math.min(1, intensity);
  switch (temperature) {
    case 'cold':
      return [`rgba(120, 160, 255, ${alpha * 0.4})`, `rgba(150, 180, 255, ${alpha * 0.6})`, `rgba(180, 200, 255, ${alpha * 0.8})`];
    case 'cool':
      return [`rgba(150, 180, 255, ${alpha * 0.5})`, `rgba(180, 200, 255, ${alpha * 0.7})`, `rgba(200, 220, 255, ${alpha * 0.9})`];
    case 'warm':
      return [`rgba(255, 200, 140, ${alpha * 0.5})`, `rgba(255, 180, 120, ${alpha * 0.7})`, `rgba(255, 160, 100, ${alpha * 0.9})`];
    case 'hot':
      return [`rgba(255, 150, 110, ${alpha * 0.6})`, `rgba(255, 120, 90, ${alpha * 0.8})`, `rgba(255, 90, 70, ${alpha * 1.0})`];
    default:
      return [`rgba(150, 120, 255, ${alpha * 0.4})`, `rgba(180, 150, 255, ${alpha * 0.6})`, `rgba(200, 180, 255, ${alpha * 0.8})`];
  }
};

// Determine if we should show information overlay
const shouldShowInfo = (
  primeBrainStatus: PrimeBrainStatus,
  hushFeedback: { isEngaged: boolean },
  isPlaying: boolean
): boolean => {
  // Show info if:
  // - There's active guidance
  // - Health is not excellent
  // - Hush is engaged
  // - Playback just started/stopped (briefly)
  const hasGuidance = !!(primeBrainStatus.guidanceLine || primeBrainStatus.bloomSummary);
  const healthAlert = primeBrainStatus.health.overall !== 'excellent' && primeBrainStatus.health.overall !== 'good';
  return hasGuidance || healthAlert || hushFeedback.isEngaged;
};

const AdaptiveWaveformHeader: React.FC<AdaptiveWaveformHeaderProps> = ({
  primeBrainStatus,
  hushFeedback,
  isPlaying,
  masterAnalysis,
  loudnessMetrics,
  onHeightChange,
  className,
  settings = DEFAULT_WAVEFORM_HEADER_SETTINGS,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const waveformDataRef = useRef<Float32Array>(new Float32Array(512));
  const phaseRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(performance.now());
  const [showInfo, setShowInfo] = useState(false);
  const [infoOpacity, setInfoOpacity] = useState(0);
  const [waveformHeight, setWaveformHeight] = useState(60);
  const infoOpacityRef = useRef(0);
  const waveformHeightRef = useRef(60);

  const { mode, modeCaption, guidanceLine, bloomSummary, lastAction, health, alsChannels } = primeBrainStatus;
  const guidance = guidanceLine ?? bloomSummary ?? lastAction ?? null;

  // Determine display mode
  const displayMode = useMemo(() => {
    return shouldShowInfo(primeBrainStatus, hushFeedback, isPlaying) ? 'active' : 'ambient';
  }, [primeBrainStatus, hushFeedback, isPlaying]);

  // Update info visibility and height with smooth transitions
  useEffect(() => {
    const shouldShow = shouldShowInfo(primeBrainStatus, hushFeedback, isPlaying);
    setShowInfo(shouldShow);
    
    const targetHeight = displayMode === 'ambient' ? 60 : 80;
    const targetOpacity = shouldShow ? 1 : 0;
    const duration = 800; // ms
    const startTime = performance.now();
    const startOpacity = infoOpacityRef.current;
    const startHeight = waveformHeightRef.current;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2; // ease-in-out
      
      const newOpacity = startOpacity + (targetOpacity - startOpacity) * eased;
      const newHeight = startHeight + (targetHeight - startHeight) * eased;
      
      infoOpacityRef.current = newOpacity;
      waveformHeightRef.current = newHeight;
      setInfoOpacity(newOpacity);
      setWaveformHeight(newHeight);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        infoOpacityRef.current = targetOpacity;
        waveformHeightRef.current = targetHeight;
        setInfoOpacity(targetOpacity);
        setWaveformHeight(targetHeight);
      }
    };
    
    requestAnimationFrame(animate);
  }, [displayMode, primeBrainStatus, hushFeedback, isPlaying]);

  // Generate waveform data from ALS channels
  const generateWaveformData = useCallback(() => {
    const data = waveformDataRef.current;
    const now = performance.now();
    const delta = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;

    // Base phase progression (from settings)
    const baseSpeed = displayMode === 'ambient' ? settings.phaseSpeed.ambient : settings.phaseSpeed.active;
    phaseRef.current = (phaseRef.current + delta * baseSpeed) % (Math.PI * 2);

    // Get ALS channel values
    const temperature = alsChannels.find(c => c.channel === 'temperature')?.value ?? 0;
    const momentum = alsChannels.find(c => c.channel === 'momentum')?.value ?? 0;
    const pressure = alsChannels.find(c => c.channel === 'pressure')?.value ?? 0;
    const harmony = alsChannels.find(c => c.channel === 'harmony')?.value ?? 0;

    // Combine channels for waveform shape
    const overallEnergy = (temperature + momentum + pressure + harmony) / 4;
    const healthPulse = health.pulse ?? 0.3;
    const hushIntensity = hushFeedback.isEngaged ? hushFeedback.intensity : 0;
    const playbackBoost = isPlaying ? 0.25 : 0;

    // Generate waveform points - controlled and smooth
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * Math.PI * 2;
      
      // Base waveform with controlled harmonics (from settings)
      let value = Math.sin(x + phaseRef.current) * settings.fundamentalStrength;
      value += Math.sin(x * 2 + phaseRef.current * 1.3) * settings.harmonyStrength * harmony;
      value += Math.sin(x * 3 + phaseRef.current * 0.7) * settings.pressureStrength * pressure;
      
      // Modulate by ALS channels (from settings)
      const temperatureWave = Math.sin(x * 1.5 + phaseRef.current * 1.1) * temperature * settings.temperatureModulation;
      const momentumWave = Math.sin(x * 0.8 + phaseRef.current * 1.5) * momentum * settings.momentumModulation;
      
      value = value + temperatureWave + momentumWave;
      
      // Apply health pulse (from settings)
      const pulseRange = settings.healthPulseRange.max - settings.healthPulseRange.min;
      value *= (settings.healthPulseRange.min + healthPulse * pulseRange);
      
      // Apply hush intensity (reduces waveform when active)
      if (hushFeedback.isEngaged) {
        value *= (1 - hushIntensity * 0.4);
      }
      
      // Apply playback boost (from settings)
      value *= (1 + settings.playbackBoost);
      
      // Apply overall energy (from settings)
      const energyRange = settings.energyRange.max - settings.energyRange.min;
      value *= (settings.energyRange.min + overallEnergy * energyRange);
      
      // Clamp and store
      data[i] = Math.max(-1, Math.min(1, value));
    }
  }, [alsChannels, health.pulse, hushFeedback, isPlaying, displayMode]);

  // Render waveform to canvas
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Use container width to ensure full coverage
    const containerRect = container.getBoundingClientRect();
    const width = Math.floor(containerRect.width);
    const height = Math.floor(waveformHeight);

    if (width <= 0 || height <= 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Generate waveform data
    generateWaveformData();

    const data = waveformDataRef.current;
    const centerY = height / 2;
    // Use settings for amplitude
    const baseAmplitude = height * settings.baseAmplitude;
    const avgEnergy = alsChannels.reduce((sum, c) => sum + c.value, 0) / Math.max(alsChannels.length, 1);
    const energyMultiplier = 1 + avgEnergy * settings.energyMultiplier;
    const amplitude = baseAmplitude * (displayMode === 'ambient' ? 1 : settings.activeModeBoost) * energyMultiplier;

    // Get thermal colors
    const thermalColors = getThermalGradient(health.temperature, health.energy ?? 0.7);
    
    // Apply hush color if engaged (convert hex to rgba array)
    const colors = hushFeedback.isEngaged 
      ? (() => {
          const intensity = Math.max(0.3, Math.min(1, hushFeedback.intensity || 0.6));
          const baseColor = hexToRgba(hushFeedback.color, intensity * 0.4);
          const midColor = hexToRgba(hushFeedback.color, intensity * 0.6);
          const peakColor = hexToRgba(hushFeedback.color, intensity * 0.8);
          return [baseColor, midColor, peakColor];
        })()
      : thermalColors;

    // Create smooth waveform path with bezier curves
    const createSmoothPath = () => {
      const path = new Path2D();
      path.moveTo(0, centerY);

      // Use fewer points for smoother curves, interpolate with bezier
      const pointCount = Math.min(data.length, 256);
      const step = (data.length - 1) / (pointCount - 1);
      
      for (let i = 0; i < pointCount; i++) {
        const index = Math.floor(i * step);
        const nextIndex = Math.min(Math.floor((i + 1) * step), data.length - 1);
        const x = (i / (pointCount - 1)) * width;
        const nextX = ((i + 1) / (pointCount - 1)) * width;
        const y = centerY - (data[index] * amplitude);
        const nextY = centerY - (data[nextIndex] * amplitude);
        
        if (i === 0) {
          path.moveTo(x, y);
        } else {
          // Use quadratic bezier for smooth curves
          const cpX = (x + nextX) / 2;
          const cpY = (y + nextY) / 2;
          path.quadraticCurveTo(cpX, cpY, nextX, nextY);
        }
      }
      
      path.lineTo(width, centerY);
      return path;
    };

    const waveformPath = createSmoothPath();

    // Draw glow layer (behind main waveform) - from settings
    const glowWidth = displayMode === 'ambient' ? settings.glowStrokeWidth.ambient : settings.glowStrokeWidth.active;
    const glowAlpha = displayMode === 'ambient' ? settings.glowIntensity.ambient : settings.glowIntensity.active;
    ctx.save();
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = glowWidth * 2;
    ctx.globalAlpha = glowAlpha;
    ctx.shadowBlur = displayMode === 'ambient' ? settings.shadowBlur.ambient : settings.shadowBlur.active;
    ctx.shadowColor = colors[1];
    ctx.stroke(waveformPath);
    ctx.restore();

    // Draw main waveform with gradient - from settings
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.3, colors[1]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = displayMode === 'ambient' ? settings.mainStrokeWidth.ambient : settings.mainStrokeWidth.active;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = displayMode === 'ambient' ? settings.shadowBlur.ambient : settings.shadowBlur.active;
    ctx.shadowColor = colors[1];
    ctx.globalAlpha = 0.9;
    ctx.stroke(waveformPath);
    ctx.restore();

    // Draw highlight layer (top edge) - from settings
    ctx.save();
    const highlightGradient = ctx.createLinearGradient(0, 0, width, 0);
    highlightGradient.addColorStop(0, rgbaWithAlpha(colors[0], settings.highlightIntensity));
    highlightGradient.addColorStop(0.5, rgbaWithAlpha(colors[1], settings.highlightIntensity * 1.2));
    highlightGradient.addColorStop(1, rgbaWithAlpha(colors[2], settings.highlightIntensity));
    
    ctx.strokeStyle = highlightGradient;
    ctx.lineWidth = displayMode === 'ambient' ? settings.highlightStrokeWidth.ambient : settings.highlightStrokeWidth.active;
    ctx.globalAlpha = 0.6;
    ctx.stroke(waveformPath);
    ctx.restore();

    // Draw fill for active mode with enhanced gradient
    if (displayMode === 'active') {
      // Create fill path by recreating the waveform and closing it
      const fillPath = createSmoothPath();
      fillPath.lineTo(width, centerY);
      fillPath.lineTo(0, centerY);
      fillPath.closePath();
      
      // Create vertical gradient with multiple stops for depth
      const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
      const centerAlpha = 0.3;
      fillGradient.addColorStop(0, rgbaWithAlpha(colors[0], 0.2));
      fillGradient.addColorStop(0.3, rgbaWithAlpha(colors[1], centerAlpha));
      fillGradient.addColorStop(0.5, rgbaWithAlpha(colors[1], centerAlpha * 1.1));
      fillGradient.addColorStop(0.7, rgbaWithAlpha(colors[1], centerAlpha));
      fillGradient.addColorStop(1, rgbaWithAlpha(colors[2], 0.12));
      
      ctx.save();
      ctx.fillStyle = fillGradient;
      ctx.globalAlpha = 0.8;
      ctx.fill(fillPath);
      ctx.restore();

      // Add subtle inner glow
      ctx.save();
      ctx.strokeStyle = rgbaWithAlpha(colors[1], 0.15);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke(waveformPath);
      ctx.restore();
    }

    ctx.restore();

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(renderWaveform);
  }, [generateWaveformData, displayMode, health, hushFeedback]);

  // Start animation loop
  useEffect(() => {
    renderWaveform();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderWaveform]);

  // Handle container resize to update canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger re-render on resize
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderWaveform();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [renderWaveform]);

  // Height tracking
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
  }, [onHeightChange]);

  return (
    <header
      ref={containerRef}
      style={composeStyles(
        layout.position.fixed,
        { top: 0, left: 0, right: 0, zIndex: 40 },
        effects.border.bottom(),
        layout.overflow.hidden,
        {
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(6,9,20,0.78)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 15px 35px rgba(2,6,23,0.6)',
          ...(className ? { className } : {}),
        }
      )}
    >
      {/* ALS Spine - Professional top-edge meter */}
      {masterAnalysis && (
        <div style={composeStyles(
          layout.position.absolute,
          { top: 0, left: 0, right: 0, zIndex: 50 },
          spacing.px(6),
          spacing.pt(2)
        )}>
          <ALSSpine
            level={masterAnalysis.level}
            peak={masterAnalysis.peak}
            lufs={loudnessMetrics?.momentaryLUFS}
            isClipping={masterAnalysis.level >= 0.95}
          />
        </div>
      )}

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        style={composeStyles(
          layout.position.absolute,
          { inset: 0 },
          transitions.transition.standard('all', 800, 'ease-in-out'),
          {
            pointerEvents: 'none',
            width: '100%',
            height: `${waveformHeight}px`,
            left: 0,
            right: 0,
            marginTop: masterAnalysis ? '12px' : '0',
          }
        )}
      />

      {/* Information Overlay (fades in/out) */}
      <div
        style={composeStyles(
          layout.position.relative,
          { zIndex: 10 },
          spacing.px(6),
          spacing.py(3),
          transitions.transition.standard('opacity', 800, 'ease-out'),
          {
            opacity: infoOpacity,
            minHeight: `${waveformHeight}px`,
          }
        )}
      >
        {showInfo && (
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.between,
            spacing.gap(4)
          )}>
            {/* Left: Prime Brain indicator */}
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              spacing.gap(3),
              { minWidth: '200px' }
            )}>
              <div 
                style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  layout.flex.justify.center,
                  effects.border.radius.full,
                  {
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255,255,255,0.1)',
                    boxShadow: `0 0 20px ${health.glowColor}`,
                  }
                )}
              >
                <PrimeBrainIcon style={{ width: '16px', height: '16px', color: health.color }} />
              </div>
              <div style={composeStyles(
                layout.flex.container('col')
              )}>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.4)',
                  }
                )}>
                  {mode}
                </span>
                {guidance && (
                  <span style={composeStyles(
                    spacing.mt(0.5),
                    {
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.7)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }
                  )}>
                    {guidance}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Status indicators (visual only) */}
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              spacing.gap(3)
            )}>
              {/* Health indicator (color dot) */}
              {health.overall !== 'excellent' && health.overall !== 'good' && (
                <div
                  style={composeStyles(
                    effects.border.radius.full,
                    {
                      width: '8px',
                      height: '8px',
                      backgroundColor: health.color,
                      boxShadow: `0 0 12px ${health.glowColor}`,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }
                  )}
                />
              )}

              {/* Hush indicator (subtle glow) */}
              {hushFeedback.isEngaged && (
                <div
                  style={composeStyles(
                    effects.border.radius.full,
                    {
                      width: '8px',
                      height: '8px',
                      backgroundColor: hushFeedback.color,
                      boxShadow: `0 0 10px ${hushFeedback.color}`,
                    }
                  )}
                />
              )}

              {/* Playback indicator (motion) */}
              {isPlaying && (
                <div style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  spacing.gap(1.5)
                )}>
                  <div 
                    style={composeStyles(
                      effects.border.radius.full,
                      {
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#86efac',
                        boxShadow: '0 0 8px #86efac',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdaptiveWaveformHeader;

