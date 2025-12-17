import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { PluginKnob } from "../PluginKnob";
import { VisualizerProps } from "../../App";

type MixxTuneParams = {
  retuneSpeed: number;
  formant: number;
  humanize: number;
  emotiveLock: boolean;
  mix: number;
  output: number;
};

const MixxTuneVisualizer: React.FC<VisualizerProps<MixxTuneParams>> = ({
  params,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrame = useRef<number | null>(null);
  const lastTime = useRef<number>(performance.now());
  const phase = useRef<number>(0);
  const waveformRef = useRef(new Float32Array(512));

  useEffect(() => {
    const array = waveformRef.current;
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Math.random();
    }
  }, []);

  const drawPitchField = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centreY = height * 0.5;
    const extent = height * 0.35;

    const mix = params.mix / 100;
    const humanize = params.humanize / 100;
    const retune = params.retuneSpeed / 100;

    // Note guides
    ctx.strokeStyle = "rgba(94, 234, 212, 0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([12, 18]);
    for (let i = -3; i <= 3; i++) {
      const y = centreY + (i * extent) / 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const now = performance.now();
    const delta = (now - lastTime.current) / 1000;
    lastTime.current = now;
    phase.current = (phase.current + delta * (0.5 + params.retuneSpeed / 60)) % 1;

    const waveform = waveformRef.current;
    for (let i = waveform.length - 1; i > 0; i -= 1) {
      waveform[i] = waveform[i - 1];
    }
    waveform[0] =
      0.5 +
      0.45 *
        Math.sin(phase.current * Math.PI * 2) *
        (1 - params.humanize / 120);

    const sample = (x: number) => {
      const index = Math.floor((x / width) * waveform.length);
      return waveform[index] ?? 0.5;
    };

    const inputPath = (x: number) =>
      centreY + sample(x) * extent * (0.8 + mix * 0.2);
    const correctedPath = (x: number) => {
      const raw = inputPath(x);
      const deviation = raw - centreY;
      const correction = deviation * (1 - retune);
      const humanizeOffset =
        Math.sin((x / width) * Math.PI * 4 + phase.current * Math.PI * 2) *
        humanize *
        extent *
        0.1;
      return centreY + correction + humanizeOffset;
    };

    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.moveTo(0, inputPath(0));
    for (let x = 1; x < width; x++) {
      ctx.lineTo(x, inputPath(x));
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 2.5;
    const correctedColor = params.emotiveLock
      ? "rgba(236, 72, 153, 0.85)"
      : "rgba(94, 234, 212, 0.85)";
    ctx.strokeStyle = correctedColor;
    ctx.shadowBlur = 16;
    ctx.shadowColor = correctedColor;
    ctx.moveTo(0, correctedPath(0));
    for (let x = 1; x < width; x++) {
      ctx.lineTo(x, correctedPath(x));
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = correctedColor;
    ctx.fillRect(width - 14, correctedPath(width - 1) - 6, 12, 12);

    animationFrame.current = requestAnimationFrame(drawPitchField);
  }, [params.emotiveLock, params.humanize, params.mix, params.retuneSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }
    animationFrame.current = requestAnimationFrame(drawPitchField);
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [drawPitchField]);

  const knobDefs = useMemo(
    () => [
      {
        label: "Retune",
        value: params.retuneSpeed / 100,
        onChange: (v: number) => onChange("retuneSpeed", Math.round(v * 100)),
      },
      {
        label: "Formant",
        value: params.formant / 100,
        onChange: (v: number) => onChange("formant", Math.round(v * 100)),
      },
      {
        label: "Humanize",
        value: params.humanize / 100,
        onChange: (v: number) => onChange("humanize", Math.round(v * 100)),
      },
      {
        label: "Mix",
        value: params.mix / 100,
        onChange: (v: number) => onChange("mix", Math.round(v * 100)),
      },
      {
        label: "Output",
        value: (params.output + 60) / 120,
        onChange: (v: number) => onChange("output", Math.round(v * 120 - 60)),
      },
    ],
    [onChange, params.formant, params.humanize, params.mix, params.output, params.retuneSpeed]
  );

  return (
    <div className="relative w-full h-full flex flex-col gap-8 p-6 bg-gradient-to-br from-[rgba(4,10,18,0.92)] via-[rgba(8,20,34,0.94)] to-[rgba(16,30,46,0.96)]">
      <div className="relative flex-1 rounded-2xl border border-cyan-300/25 bg-black/20 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-4 left-4 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-cyan-200/70">
          <span>Wave</span>
          <span className="h-3 w-3 rounded-full bg-cyan-400/60" />
        </div>
        <div className="absolute top-4 right-4 text-[0.65rem] uppercase tracking-[0.35em] text-cyan-200/70">
          {params.retuneSpeed >= 75 ? 'Robotic' : params.retuneSpeed >= 50 ? 'Snappy' : params.retuneSpeed >= 25 ? 'Natural' : 'Loose'}
        </div>
        <div className="absolute bottom-4 left-4 text-[0.65rem] uppercase tracking-[0.35em] text-cyan-200/70">
          {params.humanize >= 75 ? 'Organic' : params.humanize >= 50 ? 'Natural' : params.humanize >= 25 ? 'Subtle' : 'Precise'}
        </div>
        <div className="absolute bottom-4 right-4 text-[0.65rem] uppercase tracking-[0.35em]">
          <span className={params.emotiveLock ? "text-pink-300" : "text-cyan-200/70"}>
            {params.emotiveLock ? "Emotive Lock" : params.mix >= 75 ? 'Full' : params.mix >= 50 ? 'Blended' : params.mix >= 25 ? 'Touch' : 'Subtle'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 items-center justify-items-center">
        {knobDefs.map((knob) => (
          <PluginKnob
            key={knob.label}
            label={knob.label}
            value={knob.value}
            onChange={(val) => knob.onChange(Math.min(1, Math.max(0, val)))}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onChange("emotiveLock", !params.emotiveLock)}
          className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.4em] transition-all ${
            params.emotiveLock
              ? "bg-pink-500/30 text-pink-200 border border-pink-300/60 shadow-[0_0_18px_rgba(244,114,182,0.35)]"
              : "bg-white/5 text-cyan-100/70 border border-cyan-200/30 hover:bg-white/10"
          }`}
        >
          Emotive Lock
        </button>
      </div>
    </div>
  );
};

export default MixxTuneVisualizer;

