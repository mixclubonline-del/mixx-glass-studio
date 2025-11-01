import React, { useEffect, useRef } from "react";

interface SlimPeakMeterProps {
  analysers?: { left: AnalyserNode; right: AnalyserNode } | null;
  height?: number;
  barWidth?: number; // width of each L/R bar in px
  gap?: number;      // gap between bars in px
  clipIndicator?: boolean;
}

// Fast, compact stereo peak meter using a single canvas
export const SlimPeakMeter: React.FC<SlimPeakMeterProps> = ({
  analysers,
  height = 140,
  barWidth = 6,
  gap = 2,
  clipIndicator = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdRef = useRef({ left: -Infinity, right: -Infinity });
  const lastTimeRef = useRef<number>(0);
  const clipRef = useRef({ left: false, right: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const totalWidth = barWidth * 2 + gap;
    canvas.width = Math.max(1, Math.floor(totalWidth * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let raf: number;
    const leftBuffer = analysers?.left ? new Float32Array(analysers.left.fftSize) : null;
    const rightBuffer = analysers?.right ? new Float32Array(analysers.right.fftSize) : null;

    const peakToY = (db: number) => {
      // db is negative downwards (0 dB top). Map to [0, height]
      const minDb = -60; // floor
      const clamped = Math.max(minDb, Math.min(0, db));
      const norm = (clamped - minDb) / -minDb; // 0 at minDb, 1 at 0dB
      return height - norm * height;
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = now;

      // Background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'hsl(var(--muted)/0.2)';
      ctx.fillRect(0, 0, totalWidth, height);

      const computeDb = (buffer: Float32Array | null, analyser?: AnalyserNode) => {
        if (!buffer || !analyser) return -Infinity;
        (analyser as any).getFloatTimeDomainData(buffer as any);
        let peak = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = Math.abs(buffer[i]);
          if (v > peak) peak = v;
        }
        if (peak <= 1e-8) return -Infinity;
        return 20 * Math.log10(peak);
      };

      const leftDb = computeDb(leftBuffer, analysers?.left);
      const rightDb = computeDb(rightBuffer, analysers?.right);

      // Peak hold with slow decay (~6 dB/sec)
      const decay = 6; // dB per second
      if (leftDb > holdRef.current.left) holdRef.current.left = leftDb; else holdRef.current.left -= decay * dt;
      if (rightDb > holdRef.current.right) holdRef.current.right = rightDb; else holdRef.current.right -= decay * dt;

      // Clip detection
      clipRef.current.left = leftDb > -1;
      clipRef.current.right = rightDb > -1;

      // Draw bars
      const barColors = (db: number) => {
        if (db > -3) return 'hsl(var(--destructive))';
        return 'hsl(var(--primary))';
      };
      const leftX = 0;
      const rightX = barWidth + gap;

      const drawBar = (x: number, db: number) => {
        const y = peakToY(db);
        ctx.fillStyle = barColors(db);
        ctx.fillRect(x, y, barWidth, height - y);
      };

      drawBar(leftX, leftDb);
      drawBar(rightX, rightDb);

      // Grid ticks (subtle)
      ctx.strokeStyle = 'hsl(var(--foreground)/0.1)';
      ctx.lineWidth = 1;
      [-12, -24, -36, -48].forEach((tick) => {
        const y = peakToY(tick);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(totalWidth, y);
        ctx.stroke();
      });

      // Peak hold lines
      ctx.strokeStyle = 'hsl(var(--foreground)/0.8)';
      ctx.beginPath();
      let yHold = peakToY(holdRef.current.left);
      ctx.moveTo(leftX, yHold);
      ctx.lineTo(leftX + barWidth, yHold);
      ctx.stroke();

      ctx.beginPath();
      yHold = peakToY(holdRef.current.right);
      ctx.moveTo(rightX, yHold);
      ctx.lineTo(rightX + barWidth, yHold);
      ctx.stroke();

      // Clip indicators
      if (clipIndicator) {
        if (clipRef.current.left) {
          ctx.fillStyle = 'hsl(var(--destructive))';
          ctx.fillRect(leftX, 0, barWidth, 3);
        }
        if (clipRef.current.right) {
          ctx.fillStyle = 'hsl(var(--destructive))';
          ctx.fillRect(rightX, 0, barWidth, 3);
        }
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analysers, height, barWidth, gap, clipIndicator]);

  const totalWidth = barWidth * 2 + gap;
  return (
    <div style={{ width: totalWidth }} className="inline-block">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default SlimPeakMeter;
