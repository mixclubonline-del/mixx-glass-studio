/**
 * WaveformRenderer
 * Canvas-based waveform rendering tuned for the Mixx Club glass aesthetic.
 * - Handles direct AudioBuffer data or precomputed peaks.
 * - Respects viewport trimming via startTime / duration.
 * - Adapts detail to zoom level and supports RMS or peak display.
 * - Applies amplitude-aware ice ↔ fire gradients to reinforce ALS energy language.
 */

import React, { useEffect, useRef } from "react";

type WaveformDisplayMode = "peak" | "rms";

interface WaveformRendererProps {
  audioBuffer?: AudioBuffer | null;
  width: number;
  height: number;
  color?: string;
  peaks?: Float32Array;
  startTime?: number;
  duration?: number;
  displayMode?: WaveformDisplayMode;
  zoom?: number;
}

const FALLBACK_COLOR = "#4fd1c5"; // teal glow aligning with ALS cool palette

export const WaveformRenderer: React.FC<WaveformRendererProps> = ({
  audioBuffer,
  width,
  height,
  color = FALLBACK_COLOR,
  peaks,
  startTime = 0,
  duration,
  displayMode = "peak",
  zoom = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;
    if (!audioBuffer && !(peaks && peaks.length)) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const scaledWidth = Math.max(1, Math.floor(width));
    const scaledHeight = Math.max(1, Math.floor(height));

    canvas.width = scaledWidth * dpr;
    canvas.height = scaledHeight * dpr;
    canvas.style.width = `${scaledWidth}px`;
    canvas.style.height = `${scaledHeight}px`;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, scaledWidth, scaledHeight);

    const renderStart = performance.now();

    const centerY = scaledHeight / 2;

    const channelData =
      audioBuffer && audioBuffer.numberOfChannels > 0
        ? audioBuffer.getChannelData(0)
        : null;

    const sampleRate = audioBuffer?.sampleRate ?? 44100;
    const clippedStartSample = Math.max(0, Math.floor(startTime * sampleRate));
    const clippedEndSample = (() => {
      if (!audioBuffer) return channelData?.length ?? 0;
      if (duration === undefined) return channelData?.length ?? 0;
      return Math.min(
        Math.floor((startTime + duration) * sampleRate),
        channelData?.length ?? 0
      );
    })();
    const totalSamples = Math.max(1, clippedEndSample - clippedStartSample);

    const detailLevel =
      zoom > 320 ? 1 : zoom > 200 ? 2 : zoom > 110 ? 3 : zoom > 60 ? 4 : 6;
    const samplesPerPixel = peaks
      ? Math.max(1, Math.floor(peaks.length / scaledWidth))
      : Math.max(1, Math.floor(totalSamples / scaledWidth));

    let measuredMaxAmplitude = 0;
    if (peaks && peaks.length > 0) {
      for (let i = 0; i < peaks.length; i += Math.max(1, Math.floor(zoom / 40))) {
        measuredMaxAmplitude = Math.max(measuredMaxAmplitude, Math.abs(peaks[i] ?? 0));
      }
    } else if (channelData) {
      for (let i = clippedStartSample; i < clippedEndSample; i += Math.max(1, Math.floor(samplesPerPixel / 10))) {
        measuredMaxAmplitude = Math.max(measuredMaxAmplitude, Math.abs(channelData[i] ?? 0));
      }
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, scaledHeight);
    const applyGradientStops = (g: CanvasGradient, opacity = 1) => {
      if (measuredMaxAmplitude > 0.8) {
        g.addColorStop(0, `hsl(15 100% 68% / ${opacity})`);
        g.addColorStop(0.5, `hsl(32 100% 60% / ${opacity})`);
        g.addColorStop(1, `hsl(44 100% 52% / ${opacity})`);
      } else if (measuredMaxAmplitude > 0.5) {
        g.addColorStop(0, `hsl(275 88% 70% / ${opacity})`);
        g.addColorStop(1, `hsl(314 82% 67% / ${opacity})`);
      } else {
        const base = color ?? FALLBACK_COLOR;
        g.addColorStop(0, `${base}BF`);
        g.addColorStop(1, `hsl(205 90% 70% / ${opacity})`);
      }
    };

    applyGradientStops(gradient);
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;

    const sampleWindowForPixel = (pixelX: number) => {
      if (peaks && peaks.length) {
        const peakIndex = Math.min(peaks.length - 1, Math.floor(pixelX * samplesPerPixel));
        return { min: -(peaks[peakIndex] ?? 0), max: peaks[peakIndex] ?? 0 };
      }

      const pxStart = clippedStartSample + Math.floor(pixelX * samplesPerPixel);
      const pxEnd = Math.min(
        clippedStartSample + Math.floor((pixelX + 1) * samplesPerPixel),
        clippedEndSample
      );

      let min = 1;
      let max = -1;
      let rmsAccumulator = 0;
      let count = 0;

      for (let idx = pxStart; idx < pxEnd; idx += detailLevel) {
        const sample = channelData?.[idx] ?? 0;
        if (sample < min) min = sample;
        if (sample > max) max = sample;
        if (displayMode === "rms") {
          rmsAccumulator += sample * sample;
          count++;
        }
      }

      if (displayMode === "rms" && count > 0) {
        const rms = Math.sqrt(rmsAccumulator / count);
        max = rms;
        min = -rms;
      }

      return { min, max };
    };

    const drawUpper = () => {
      for (let x = 0; x < scaledWidth; x += detailLevel) {
        const { max } = sampleWindowForPixel(x);
        const y = centerY - max * centerY * 0.92;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    };

    const drawLower = () => {
      for (let x = scaledWidth; x >= 0; x -= detailLevel) {
        const { min } = sampleWindowForPixel(x);
        const y = centerY - min * centerY * 0.92;
        ctx.lineTo(x, y);
      }
    };

    drawUpper();
    drawLower();
    ctx.closePath();

    const fillGradient = ctx.createLinearGradient(0, 0, 0, scaledHeight);
    applyGradientStops(fillGradient, 0.22);
    ctx.fillStyle = fillGradient;
    ctx.fill();
    ctx.stroke();

    const renderTime = performance.now() - renderStart;
    if (renderTime > 16) {
      console.warn(`[WaveformRenderer] Render took ${renderTime.toFixed(2)}ms at zoom ${zoom}`);
    }

    ctx.restore();
  }, [
    audioBuffer,
    width,
    height,
    color,
    displayMode,
    zoom,
    startTime,
    duration,
    peaks,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none select-none"
      aria-hidden="true"
    />
  );
};



