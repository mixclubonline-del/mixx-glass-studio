
import React, { useRef, useEffect } from 'react';

interface NeuralGridBackgroundProps {
  glowColor?: string;
  glowOpacity?: number;
}

export const NeuralGridBackground: React.FC<NeuralGridBackgroundProps> = ({
  glowColor = 'rgba(0, 255, 255, 1)',
  glowOpacity = 0.3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -9999, y: -9999 });
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      const gridSize = 40;
      const pulse = Math.sin(Date.now() / 4000) * 0.005 + 0.05;
      ctx.strokeStyle = `rgba(0, 255, 255, ${pulse})`;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw mouse glow
      const { x: mouseX, y: mouseY } = mousePos.current;
      if (mouseX > -1000) {
        const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 300);
        const color = glowColor.startsWith('var') ? getComputedStyle(document.documentElement).getPropertyValue(glowColor.slice(4,-1)).trim() : glowColor;
        gradient.addColorStop(0, `${color.replace(')', `, ${glowOpacity})`).replace('rgb', 'rgba')}`);
        gradient.addColorStop(1, `${color.replace(')', ', 0)').replace('rgb', 'rgba')}`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
      
      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [glowColor, glowOpacity]);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
