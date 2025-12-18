/**
 * Flow Pulse Bar Visualizer with Adapting Waveform
 * 
 * Part B of Full Flow Physiology Expansion Pack.
 * The "heartbeat of Flow" - visual pulse indicator above timeline.
 * 
 * Every beat, ambient change, or sample load sends a pulse through the UI.
 * Now includes adapting waveform visualization from master analyser.
 */

import React, { useEffect, useState, useRef } from 'react';
import './FlowPulseBar.css';

interface FlowPulseBarProps {
  pulse?: number; // Pulse % (0-100)
  className?: string;
}

// Window interface extensions moved to src/types/globals.d.ts

export function FlowPulseBar({ pulse, className }: FlowPulseBarProps) {
  const [currentPulse, setCurrentPulse] = useState(pulse || 0);
  const [waveform, setWaveform] = useState<Uint8Array>(new Uint8Array(128));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Sync with global ALS pulse if not provided
  useEffect(() => {
    if (pulse !== undefined) {
      setCurrentPulse(pulse);
      return;
    }
    
    // Read from global ALS
    const updatePulse = () => {
      const alsPulse = (window.__als as any)?.pulse || 0;
      setCurrentPulse(alsPulse);
    };
    
    // Initial update
    updatePulse();
    
    // Update every 30ms for smooth animation
    const interval = setInterval(updatePulse, 30);
    
    return () => clearInterval(interval);
  }, [pulse]);
  
  // Adapting waveform from master analyser
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match container
    const updateCanvasSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height || 6;
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    const drawWaveform = () => {
      const analyser = (window as any).__mixx_masterAnalyser;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!analyser) {
        // No analyser - draw flat line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
        return;
      }
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
      
      setWaveform(dataArray);
      
      // Draw waveform with thermal color
      ctx.lineWidth = 2;
      ctx.strokeStyle = getThermalColor();
      ctx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      const centerY = canvas.height / 2;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128.0;
        const y = centerY + (v * centerY * 0.8); // Scale to 80% of height
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
      
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    };
    
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Get thermal color for pulse bar and waveform
  const getThermalColor = () => {
    const temp = (window.__als as any)?.temperature || 'cold';
    switch (temp) {
      case 'cold':
        return '#78a0ff';
      case 'warming':
        return '#96b4ff';
      case 'warm':
        return '#ffb478';
      case 'hot':
        return '#ff785a';
      case 'blazing':
        return '#ff4646';
      default:
        return '#a280ff';
    }
  };
  
  const getThermalGradient = () => {
    const temp = (window.__als as any)?.temperature || 'cold';
    switch (temp) {
      case 'cold':
        return 'linear-gradient(90deg, #78a0ff, #96b4ff, #b4c8ff)';
      case 'warming':
        return 'linear-gradient(90deg, #96b4ff, #b4c8ff, #d2dcff)';
      case 'warm':
        return 'linear-gradient(90deg, #ffb478, #ffc896, #ffdcb4)';
      case 'hot':
        return 'linear-gradient(90deg, #ff785a, #ff9678, #ffb496)';
      case 'blazing':
        return 'linear-gradient(90deg, #ff4646, #ff6464, #ff8282)';
      default:
        return 'linear-gradient(90deg, #a280ff, #d478ff, #ff85c0)';
    }
  };
  
  return (
    <div className={`flow-pulse-bar ${className || ''}`}>
      {/* Adapting waveform background */}
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.7,
        }}
      />
      
      {/* Pulse fill overlay */}
      <div
        className="pulse-fill"
        style={{
          width: `${Math.min(100, Math.max(0, currentPulse))}%`,
          background: getThermalGradient(),
        }}
      />
    </div>
  );
}

