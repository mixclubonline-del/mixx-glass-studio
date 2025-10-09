/**
 * Phase Correlation Meter - Goniometer with correlation coefficient
 * Displays stereo phase relationship
 */

import React, { useRef, useEffect } from 'react';
import { useMeteringStore } from '@/store/meteringStore';

interface PhaseCorrelationMeterProps {
  size?: number;
}

export const PhaseCorrelationMeter: React.FC<PhaseCorrelationMeterProps> = ({
  size = 120
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { phaseCorrelation, updatePhaseCorrelation } = useMeteringStore();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;
    
    // Draw background circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw center lines (L+R and L-R axes)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
    
    // Draw diagonal lines (45° - stereo, -45° - mono)
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
    ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.7);
    ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.7);
    ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.7);
    ctx.stroke();
    
    // Mock Lissajous pattern (in real implementation, would use actual L/R samples)
    // For now, draw a pattern based on correlation value
    const computedPrimary = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary').trim();
    const primaryHsl = `hsl(${computedPrimary})`;
    
    ctx.strokeStyle = primaryHsl;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const points = 100;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius * 0.6 * (0.7 + Math.random() * 0.3);
      
      // Adjust pattern based on correlation
      // +1 (mono) = vertical line, 0 (uncorrelated) = circle, -1 (phase issue) = horizontal line
      const x = centerX + r * Math.cos(angle) * (1 - Math.abs(phaseCorrelation) * 0.5);
      const y = centerY + r * Math.sin(angle) * phaseCorrelation;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Add glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = primaryHsl;
    ctx.stroke();
    
  }, [size, phaseCorrelation]);
  
  // Color based on correlation value
  const getCorrelationColor = () => {
    if (phaseCorrelation < -0.3) return 'text-destructive'; // Phase issues
    if (phaseCorrelation < 0.3) return 'text-primary'; // Good stereo
    return 'text-foreground'; // Mono/narrow
  };
  
  const getCorrelationLabel = () => {
    if (phaseCorrelation < -0.3) return 'Phase Issue';
    if (phaseCorrelation < 0.3) return 'Good Stereo';
    if (phaseCorrelation < 0.7) return 'Narrow';
    return 'Mono';
  };
  
  return (
    <div className="glass-glow rounded-lg p-3 flex flex-col items-center">
      <h3 className="text-xs font-semibold text-foreground mb-2">Phase Correlation</h3>
      
      <canvas
        ref={canvasRef}
        className="rounded"
        style={{
          background: 'rgba(10, 10, 15, 0.4)'
        }}
      />
      
      <div className="mt-2 text-center">
        <div className={`text-2xl font-bold font-mono ${getCorrelationColor()}`}>
          {phaseCorrelation > 0 ? '+' : ''}{phaseCorrelation.toFixed(2)}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {getCorrelationLabel()}
        </div>
      </div>
      
      {phaseCorrelation < -0.3 && (
        <div className="mt-2 text-[10px] text-destructive text-center">
          ⚠ Mono compatibility issue
        </div>
      )}
    </div>
  );
};
