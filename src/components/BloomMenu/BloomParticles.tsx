/**
 * Bloom Particles - Canvas-based particle system
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  depth: number;
}

interface BloomParticlesProps {
  isOpen: boolean;
  count?: number;
}

export const BloomParticles: React.FC<BloomParticlesProps> = ({ isOpen, count = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    particlesRef.current = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 200;
      const depth = Math.random();
      
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1 + depth * 2,
        opacity: 0.2 + depth * 0.3,
        color: `hsl(${200 + Math.random() * 60}, 70%, ${50 + depth * 30}%)`,
        depth
      };
    });

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isOpen) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx * (1 - particle.depth * 0.5);
        particle.y += particle.vy * (1 - particle.depth * 0.5);

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * (isOpen ? 1 : 0);
        ctx.fill();
        
        // Add glow
        ctx.shadowBlur = 10 * particle.depth;
        ctx.shadowColor = particle.color;
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, count]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        opacity: isOpen ? 0.6 : 0,
        transition: 'opacity 0.8s ease-out'
      }}
    />
  );
};
